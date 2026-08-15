<?php

namespace App\Http\Controllers;

use App\Models\Dpt;
use App\Models\Tps;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use chillerlan\QRCode\QRCode;

class DptController extends Controller
{
    private function checkSecretariat(Request $request)
    {
        if ($request->user()->role !== 'sekretariat') {
            abort(response()->json([
                'status' => 'error',
                'message' => 'Akses ditolak. Hanya Sekretariat yang diizinkan.'
            ], 403));
        }
    }

    public function index(Request $request)
    {
        $this->checkSecretariat($request);

        $query = Dpt::with('tps');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('nik', 'like', "%{$search}%")
                  ->orWhere('nama', 'like', "%{$search}%");
            });
        }

        if ($request->has('tps_id')) {
            $query->where('tps_id', $request->tps_id);
        }

        $dpts = $query->paginate(20);

        return response()->json([
            'status' => 'success',
            'data' => $dpts
        ]);
    }

    public function store(Request $request)
    {
        $this->checkSecretariat($request);

        $validator = Validator::make($request->all(), [
            'nik' => 'required|string|size:16|unique:dpt,nik',
            'nama' => 'required|string|max:255',
            'tps_id' => 'required|exists:tps,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        $dpt = Dpt::create([
            'nik' => $request->nik,
            'nama' => $request->nama,
            'tps_id' => $request->tps_id,
            'status_hadir' => false,
            'waktu_checkin' => null,
            'qr_payload' => 'KPPSGENTAN-' . $request->nik,
        ]);

        // Increment total_dpt in TPS
        Tps::where('id', $request->tps_id)->increment('total_dpt');

        return response()->json([
            'status' => 'success',
            'message' => 'Pemilih berhasil ditambahkan.',
            'data' => $dpt
        ], 210); // Laravel expects 201 for Created, let's use 201
    }

    public function update(Request $request, $nik)
    {
        $this->checkSecretariat($request);

        $dpt = Dpt::where('nik', $nik)->firstOrFail();

        $validator = Validator::make($request->all(), [
            'nama' => 'required|string|max:255',
            'tps_id' => 'required|exists:tps,id',
            'status_hadir' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        $oldTpsId = $dpt->tps_id;
        $newTpsId = $request->tps_id;

        $dpt->update([
            'nama' => $request->nama,
            'tps_id' => $newTpsId,
            'status_hadir' => $request->status_hadir ?? $dpt->status_hadir,
            'waktu_checkin' => ($request->status_hadir && !$dpt->status_hadir) ? now() : ($request->status_hadir ? $dpt->waktu_checkin : null)
        ]);

        if ($oldTpsId !== $newTpsId) {
            Tps::where('id', $oldTpsId)->decrement('total_dpt');
            Tps::where('id', $newTpsId)->increment('total_dpt');
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Data pemilih berhasil diubah.',
            'data' => $dpt
        ]);
    }

    public function destroy(Request $request, $nik)
    {
        $this->checkSecretariat($request);

        $dpt = Dpt::where('nik', $nik)->firstOrFail();
        $tpsId = $dpt->tps_id;
        $dpt->delete();

        Tps::where('id', $tpsId)->decrement('total_dpt');

        return response()->json([
            'status' => 'success',
            'message' => 'Pemilih berhasil dihapus.'
        ]);
    }

    public function importCsv(Request $request)
    {
        $this->checkSecretariat($request);

        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:4096',
        ]);

        $file = $request->file('file');
        $path = $file->getRealPath();
        
        $csvData = array_map('str_getcsv', file($path));
        
        if (count($csvData) < 2) {
            return response()->json([
                'status' => 'error',
                'message' => 'File CSV kosong atau format salah.'
            ], 422);
        }

        $headers = array_map('trim', $csvData[0]);
        
        // Robust Column Headers Scanner (Case-Insensitive)
        $nikIdx = false;
        $namaIdx = false;
        $tpsIdx = false;

        foreach ($headers as $idx => $h) {
            $hUpper = strtoupper(trim($h));
            // Match NIK
            if ($nikIdx === false && in_array($hUpper, ['NIK', 'NOMOR NIK', 'NO_NIK', 'NO. NIK', 'NOMOR_INDUK'])) {
                $nikIdx = $idx;
            }
            // Match Name (Nama / NAMA_LGKP)
            if ($namaIdx === false && in_array($hUpper, ['NAMA_LGKP', 'NAMA', 'NAMA LENGKAP', 'NAMA_LENGKAP', 'NAMA_LGKP_KET'])) {
                $namaIdx = $idx;
            }
            // Match TPS
            if ($tpsIdx === false && (in_array($hUpper, ['NO_TPS', 'TPS', 'NOMOR_TPS', 'NO TPS', 'NOMOR TPS', 'TPS_ID']) || str_contains($hUpper, 'TPS'))) {
                $tpsIdx = $idx;
            }
        }

        // Fallbacks if not found by exact string names
        if ($nikIdx === false) {
            $nikIdx = 0; 
        }
        if ($namaIdx === false) {
            $namaIdx = 1;
        }

        // Fallback TPS Name from Filename
        $fallbackTpsName = null;
        if ($tpsIdx === false) {
            $fileName = $file->getClientOriginalName();
            if (preg_match('/\b\d+\b/', $fileName, $matches)) {
                $fallbackTpsName = "TPS " . str_pad($matches[0], 2, '0', STR_PAD_LEFT);
            } else {
                $fallbackTpsName = "TPS 01";
            }
        }

        $rows = array_slice($csvData, 1);
        
        // Optimizations: Eager load all TPS to avoid N+1 queries
        $tpsMap = Tps::all()->pluck('id', 'nama')->toArray();
        $tpsByIdMap = Tps::all()->pluck('id', 'id')->toArray();
        
        $successCount = 0;
        $errors = [];

        DB::beginTransaction();
        try {
            foreach ($rows as $index => $row) {
                // Skip empty or corrupted lines
                if (empty($row) || (count($row) === 1 && empty($row[0]))) {
                    continue;
                }

                if (!isset($row[$nikIdx]) || !isset($row[$namaIdx])) {
                    $errors[] = "Baris " . ($index + 2) . ": Kolom NIK atau Nama tidak ditemukan di baris data.";
                    continue;
                }

                $nik = trim($row[$nikIdx]);
                $nama = trim($row[$namaIdx]);
                
                // Get TPS value
                $tpsVal = '';
                if ($tpsIdx !== false && isset($row[$tpsIdx])) {
                    $tpsVal = trim($row[$tpsIdx]);
                }
                if (empty($tpsVal)) {
                    $tpsVal = $fallbackTpsName;
                }

                if (strlen($nik) !== 16 || !is_numeric($nik)) {
                    $errors[] = "Baris " . ($index + 2) . ": NIK harus 16 digit angka. NIK: {$nik}";
                    continue;
                }

                // Check existing in DB
                $exists = Dpt::where('nik', $nik)->exists();
                if ($exists) {
                    $errors[] = "Baris " . ($index + 2) . ": NIK {$nik} sudah terdaftar.";
                    continue;
                }

                // Find TPS ID
                $tpsId = null;
                // Check if tpsVal is numeric or string name
                if (is_numeric($tpsVal) && isset($tpsByIdMap[(int)$tpsVal])) {
                    $tpsId = (int)$tpsVal;
                } else {
                    // Try to match by TPS name
                    // e.g. "TPS 01" or similar
                    $formattedName = $tpsVal;
                    if (is_numeric($tpsVal)) {
                        $formattedName = "TPS " . str_pad($tpsVal, 2, '0', STR_PAD_LEFT);
                    }
                    
                    if (isset($tpsMap[$formattedName])) {
                        $tpsId = $tpsMap[$formattedName];
                    } else if (isset($tpsMap[$tpsVal])) {
                        $tpsId = $tpsMap[$tpsVal];
                    }
                }

                if (!$tpsId) {
                    // Auto-create TPS if not found
                    $newTpsName = is_numeric($tpsVal) ? "TPS " . str_pad($tpsVal, 2, '0', STR_PAD_LEFT) : $tpsVal;
                    $newTps = Tps::create([
                        'nama' => $newTpsName,
                        'wilayah' => 'Dibuat otomatis via Import',
                        'total_dpt' => 0
                    ]);
                    // Refresh maps
                    $tpsMap[$newTpsName] = $newTps->id;
                    $tpsByIdMap[$newTps->id] = $newTps->id;
                    $tpsId = $newTps->id;
                }

                Dpt::create([
                    'nik' => $nik,
                    'nama' => $nama,
                    'tps_id' => $tpsId,
                    'status_hadir' => false,
                    'waktu_checkin' => null,
                    'qr_payload' => 'KPPSGENTAN-' . $nik,
                ]);

                Tps::where('id', $tpsId)->increment('total_dpt');
                $successCount++;
            }
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengimpor data: ' . $e->getMessage()
            ], 500);
        }

        return response()->json([
            'status' => 'success',
            'message' => "Berhasil mengimpor {$successCount} data pemilih.",
            'errors' => $errors
        ]);
    }

    public function getQrCode(Request $request, $nik)
    {
        // Accept either kpps or sekretariat to view/generate QR code
        if ($request->user()->role !== 'sekretariat' && $request->user()->role !== 'kpps') {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized'
            ], 403);
        }

        $dpt = Dpt::where('nik', $nik)->firstOrFail();
        
        $qrCode = new QRCode();
        $base64 = $qrCode->render('KPPSGENTAN-' . $dpt->nik);

        return response()->json([
            'status' => 'success',
            'qrcode' => $base64
        ]);
    }
}
