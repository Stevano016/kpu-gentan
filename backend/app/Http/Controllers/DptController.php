<?php

namespace App\Http\Controllers;

use App\Models\Dpt;
use App\Models\Tps;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use chillerlan\QRCode\QRCode;

class DptController extends Controller
{
    public function index(Request $request)
    {
        $query = Dpt::with('tps')
            ->select('dpt.*')
            ->selectSub(function ($q) {
                $q->selectRaw('count(*) > 1')
                  ->from('dpt as d2')
                  ->whereColumn('d2.nama', 'dpt.nama');
            }, 'is_ganda');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('nik', 'like', "%{$search}%")
                  ->orWhere('nama', 'like', "%{$search}%");
            });
        }

        if ($request->filled('tps_id')) {
            $query->where('tps_id', $request->tps_id);
        }

        // `jenis_pemilih` masih diterima demi klien lama yang belum diperbarui.
        $tahapan = $request->tahapan ?? $request->jenis_pemilih;
        if (filled($tahapan)) {
            $query->where('tahapan', $tahapan);
        }

        if ($request->filled('asal')) {
            $query->where('asal', $request->asal);
        }

        // Pantarlih bertugas di satu RW; daftarnya dibatasi di server, bukan
        // sekadar disaring di antarmuka.
        $pengguna = $request->user();
        if ($pengguna?->role === 'pantarlih') {
            $query->where('rw', $pengguna->rw);
        } elseif ($request->filled('rw')) {
            $query->where('rw', $request->rw);
        }

        $dpts = $query->paginate(20);
        $dpts->getCollection()->each->append('is_ganda');

        return response()->json([
            'status' => 'success',
            'data' => $dpts
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nik' => 'required|string|size:16|unique:dpt,nik',
            'nkk' => 'nullable|string|size:16',
            'nama' => 'required|string|max:255',
            'tps_id' => 'nullable|exists:tps,id',
            'tahapan' => 'nullable|string|in:dp4,dps,dptb,dpt,dpk',
            'umur' => 'nullable|integer|min:0',
            'status_kawin' => 'nullable|string|max:50',
            'jenis_kelamin' => 'nullable|string|max:20',
            'alamat' => 'nullable|string|max:255',
            'rt' => 'nullable|string|max:10',
            'rw' => 'nullable|string|max:10',
            'pekerjaan' => 'nullable|string|max:100',
            'disabilitas' => 'nullable|string|max:100',
            'keterangan' => 'nullable|string|in:' . implode(',', Dpt::KETERANGAN),
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        // Pantarlih hanya mendata pemilih susulan, jadi hasil inputnya selalu
        // DPTb. Dipaksa di sini, bukan diserahkan ke form: form bisa diakali.
        $pengguna = $request->user();
        $tpsId = $request->tps_id;

        if ($pengguna?->role === 'pantarlih') {
            $tahapan = 'dptb';

            if (blank($pengguna->rw)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Akun pantarlih ini belum ditetapkan RW tugasnya. Hubungi sekretariat.',
                ], 422);
            }

            if (blank($request->rt)) {
                return response()->json([
                    'status' => 'error',
                    'errors' => ['rt' => ['Kolom RT wajib diisi.']]
                ], 422);
            }

            // Dipaksa dari akun pantarlih
            $rw = $pengguna->rw;
            $rt = $request->rt;
            $tpsId = $this->cariTpsIdDariRtRw($rt, $rw);

            if (blank($tpsId)) {
                return response()->json([
                    'status' => 'error',
                    'message' => "RT {$rt} / RW {$rw} tidak terdaftar dalam wilayah TPS Kelurahan Gentan.",
                ], 422);
            }
        } else {
            if (blank($tpsId)) {
                return response()->json([
                    'status' => 'error',
                    'errors' => ['tps_id' => ['Kolom alokasi TPS wajib diisi.']]
                ], 422);
            }

            // Penambahan manual setelah verifikasi DP4 berjalan juga terhitung
            // susulan — kecuali admin sengaja memilih tahapan lain.
            $verifikasiSudahJalan = Dpt::whereIn('tahapan', ['dps', 'dpt', 'dpk'])->exists();
            $tahapan = $request->tahapan ?? ($verifikasiSudahJalan ? 'dptb' : 'dp4');
        }
        $asal = $tahapan === 'dp4' ? 'dp4' : 'dptb';

        if ($request->filled('keterangan')) {
            if (str_contains($request->keterangan, 'Dibawah Umur')) {
                if ($request->filled('umur') && $request->umur >= 17) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Keterangan "Dibawah Umur" tidak sesuai dengan data umur pemilih (>= 17).'
                    ], 422);
                }
            }
            if (str_contains($request->keterangan, 'Ganda')) {
                $queryGanda = Dpt::where('nama', $request->nama);
                if (!$queryGanda->exists()) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Keterangan "Ganda" tidak sesuai karena tidak ditemukan nama ganda di database.'
                    ], 422);
                }
            }
        }

        // Auto-generate the next id_pemilih (format USH-GTN-026xxxx)
        $latestVoter = Dpt::where('id_pemilih', 'like', 'USH-GTN-026%')
            ->orderBy('id_pemilih', 'desc')
            ->first();
            
        $nextIndex = 1;
        if ($latestVoter) {
            $latestId = $latestVoter->id_pemilih;
            $suffixStr = substr($latestId, 11);
            $nextIndex = intval($suffixStr) + 1;
        }
        
        $nextSuffix = str_pad($nextIndex, 4, '0', STR_PAD_LEFT);
        $idPemilih = 'USH-GTN-026' . $nextSuffix;

        $dpt = Dpt::create([
            'nik' => $request->nik,
            'nkk' => $request->nkk,
            'nama' => $request->nama,
            'tps_id' => $tpsId,
            'status_hadir' => false,
            'waktu_checkin' => null,
            'id_pemilih' => $idPemilih,
            'qr_payload' => $idPemilih,
            'tahapan' => $tahapan,
            'asal' => $asal,
            'umur' => $request->umur,
            'status_kawin' => $request->status_kawin,
            'jenis_kelamin' => $request->jenis_kelamin,
            'alamat' => $request->alamat,
            'rt' => $request->rt,
            'rw' => $pengguna?->role === 'pantarlih' ? $pengguna->rw : $request->rw,
            'pekerjaan' => $request->pekerjaan,
            'disabilitas' => $request->disabilitas,
            'keterangan' => $request->keterangan,
        ]);

        // Increment total_dpt in TPS only if voter is DPT/DPS/DPTb
        if (in_array($tahapan, ['dp4', 'dps', 'dptb', 'dpt'])) {
            Tps::where('id', $tpsId)->increment('total_dpt');
        }

        \App\Utils\Broadcaster::trigger('update', ['tps_id' => $tpsId]);

        $dpt->append('is_ganda');

        return response()->json([
            'status' => 'success',
            'message' => 'Pemilih berhasil ditambahkan.',
            'data' => $dpt
        ], 201);
    }

    public function update(Request $request, $nik)
    {
        $dpt = Dpt::where('nik', $nik)->firstOrFail();

        $validator = Validator::make($request->all(), [
            // NIK hanya boleh diganti selama masih nomor sementara buatan
            // sistem — itulah satu-satunya cara pantarlih melengkapi 638 orang
            // yang NIK aslinya belum ketemu. Nomor asli tidak boleh diubah:
            // ia primary key, dan mengganti-gantinya memutus jejak data.
            'nik' => [
                'nullable', 'string', 'size:16',
                Rule::unique('dpt', 'nik')->ignore($dpt->nik, 'nik'),
            ],
            'nkk' => 'nullable|string|size:16',
            'nama' => 'required|string|max:255',
            'tps_id' => 'required|exists:tps,id',
            'status_hadir' => 'boolean',
            'tahapan' => 'nullable|string|in:dp4,dps,dptb,dpt,dpk',
            'umur' => 'nullable|integer|min:0',
            'status_kawin' => 'nullable|string|max:50',
            'jenis_kelamin' => 'nullable|string|max:20',
            'alamat' => 'nullable|string|max:255',
            'rt' => 'nullable|string|max:10',
            'rw' => 'nullable|string|max:10',
            'pekerjaan' => 'nullable|string|max:100',
            'disabilitas' => 'nullable|string|max:100',
            'keterangan' => 'nullable|string|in:' . implode(',', Dpt::KETERANGAN),
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        $nikBaru = $request->input('nik');
        if (filled($nikBaru) && $nikBaru !== $dpt->nik && ! $dpt->nik_sintetis) {
            return response()->json([
                'status' => 'error',
                'message' => 'NIK asli tidak bisa diubah. Hanya nomor sementara buatan sistem yang boleh dilengkapi.',
            ], 422);
        }

        $oldTpsId = $dpt->tps_id;
        $newTpsId = $request->tps_id;
        $oldTahapan = $dpt->tahapan;
        // Perpindahan tahapan sengaja tidak dilayani di sini: alurnya punya
        // aturan dan alasan sendiri, semuanya lewat TahapanController.
        $newTahapan = $request->tahapan ?? $dpt->tahapan;
        if ($newTahapan !== $oldTahapan) {
            return response()->json([
                'status' => 'error',
                'message' => 'Tahapan tidak bisa diubah dari form ini. Gunakan aksi verifikasi, penetapan, TMS, atau DPK.',
            ], 422);
        }

        if ($request->filled('keterangan')) {
            if (str_contains($request->keterangan, 'Dibawah Umur')) {
                $age = $request->has('umur') ? $request->umur : $dpt->umur;
                if ($age >= 17) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Keterangan "Dibawah Umur" tidak sesuai dengan data umur pemilih (>= 17).'
                    ], 422);
                }
            }
            if (str_contains($request->keterangan, 'Ganda')) {
                $name = $request->nama ?? $dpt->nama;
                $queryGanda = Dpt::where('nama', $name)->where('nik', '!=', $dpt->nik);
                if (!$queryGanda->exists()) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Keterangan "Ganda" tidak sesuai karena tidak ditemukan nama ganda di database.'
                    ], 422);
                }
            }
        }

        $updateData = [
            'nama' => $request->nama,
            'tps_id' => $newTpsId,
            'status_hadir' => $request->status_hadir ?? $dpt->status_hadir,
            'waktu_checkin' => ($request->status_hadir && !$dpt->status_hadir) ? now() : ($request->status_hadir ? $dpt->waktu_checkin : null),
        ];

        foreach (['nkk', 'umur', 'status_kawin', 'jenis_kelamin', 'alamat', 'rt', 'rw', 'pekerjaan', 'disabilitas', 'keterangan'] as $field) {
            if ($request->has($field)) {
                $updateData[$field] = $request->input($field);
            }
        }

        // Penanda "nomor sementara" ikut isinya, bukan disetel terpisah:
        // kalau ia perlu dimatikan manual, cepat atau lambat akan ada nomor
        // asli yang masih berlencana sementara, atau sebaliknya.
        if (filled($nikBaru) && $nikBaru !== $dpt->nik) {
            $updateData['nik'] = $nikBaru;
            $updateData['nik_sintetis'] = str_starts_with($nikBaru, Dpt::AWALAN_NIK_SINTETIS);
        }

        if ($request->has('nkk')) {
            $updateData['nkk_sintetis'] = filled($request->nkk)
                && str_starts_with($request->nkk, Dpt::AWALAN_NKK_SINTETIS);
        }

        $dpt->update($updateData);

        // Tahapan tidak bisa berubah lewat form ini, jadi penghitung TPS hanya
        // perlu disesuaikan ketika pemilihnya benar-benar pindah TPS.
        if ($oldTpsId !== $newTpsId && in_array($oldTahapan, ['dp4', 'dps', 'dptb', 'dpt'])) {
            Tps::where('id', $oldTpsId)->decrement('total_dpt');
            Tps::where('id', $newTpsId)->increment('total_dpt');
        }

        \App\Utils\Broadcaster::trigger('update', ['tps_id' => $newTpsId]);
        if ($oldTpsId !== $newTpsId) {
            \App\Utils\Broadcaster::trigger('update', ['tps_id' => $oldTpsId]);
        }

        $dpt->append('is_ganda');

        return response()->json([
            'status' => 'success',
            'message' => 'Data pemilih berhasil diubah.',
            'data' => $dpt
        ]);
    }

    public function destroy(Request $request, $nik)
    {
        $dpt = Dpt::where('nik', $nik)->firstOrFail();
        $tpsId = $dpt->tps_id;
        $oldTahapan = $dpt->tahapan;
        $dpt->delete();

        if (in_array($oldTahapan, ['dp4', 'dps', 'dptb', 'dpt'])) {
            Tps::where('id', $tpsId)->decrement('total_dpt');
        }

        \App\Utils\Broadcaster::trigger('update', ['tps_id' => $tpsId]);

        return response()->json([
            'status' => 'success',
            'message' => 'Pemilih berhasil dihapus.'
        ]);
    }

    public function importCsv(Request $request)
    {
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
        
        // Get initial starting index for id_pemilih generation (Anti-N+1)
        $latestVoter = Dpt::where('id_pemilih', 'like', 'USH-GTN-026%')
            ->orderBy('id_pemilih', 'desc')
            ->first();
            
        $nextIndex = 1;
        if ($latestVoter) {
            $latestId = $latestVoter->id_pemilih;
            $suffixStr = substr($latestId, 11);
            $nextIndex = intval($suffixStr) + 1;
        }

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
                if (is_numeric($tpsVal) && isset($tpsByIdMap[(int)$tpsVal])) {
                    $tpsId = (int)$tpsVal;
                } else {
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
                    $tpsMap[$newTpsName] = $newTps->id;
                    $tpsByIdMap[$newTps->id] = $newTps->id;
                    $tpsId = $newTps->id;
                }

                // Generate incremental id_pemilih safely without querying inside the loop (Anti-N+1)
                $nextSuffix = str_pad($nextIndex, 4, '0', STR_PAD_LEFT);
                $idPemilih = 'USH-GTN-026' . $nextSuffix;
                $nextIndex++;

                Dpt::create([
                    'nik' => $nik,
                    'nama' => $nama,
                    'tps_id' => $tpsId,
                    'status_hadir' => false,
                    'waktu_checkin' => null,
                    'id_pemilih' => $idPemilih,
                    'qr_payload' => $idPemilih,
                    // Impor massal adalah berkas DP4; verifikasi menyusul.
                    'asal' => 'dp4',
                    'tahapan' => 'dp4',
                ]);

                Tps::where('id', $tpsId)->increment('total_dpt');
                $successCount++;
            }
            DB::commit();
            \App\Utils\Broadcaster::trigger('update', ['tps_id' => 'all']);
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
        $dpt = Dpt::where('nik', $nik)->firstOrFail();
        
        $options = new \chillerlan\QRCode\QROptions([
            'outputInterface' => \chillerlan\QRCode\Output\QRGdImagePNG::class,
            'quality' => 90,
        ]);
        $qrCode = new \chillerlan\QRCode\QRCode($options);
        $base64 = $qrCode->render($dpt->qr_payload ?? $dpt->id_pemilih);

        return response()->json([
            'status' => 'success',
            'qrcode' => $base64
        ]);
    }

    public function cekMandiri(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nik' => 'nullable|string|min:4',
            'nama' => 'required_without:nik|nullable|string|min:3',
            'rt' => 'required_with:nama|nullable|string',
            'rw' => 'required_with:nama|nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Input tidak valid. Harap masukkan NIK atau Nama Lengkap (minimal 3 karakter) beserta RT dan RW.',
                'errors' => $validator->errors()
            ], 422);
        }

        $query = Dpt::with('tps:id,nama');

        if ($request->filled('nik')) {
            $nik = $request->nik;
            $query->where('nik', $nik);
        } else {
            $nama = strtoupper(trim($request->nama));
            $rt = str_pad(ltrim($request->rt, '0'), 3, '0', STR_PAD_LEFT);
            $rw = str_pad(ltrim($request->rw, '0'), 3, '0', STR_PAD_LEFT);

            $query->where('nama', 'like', "%{$nama}%")
                  ->where('rt', $rt)
                  ->where('rw', $rw);
        }

        // Hanya tampilkan pemilih dengan tahapan aktif (non-TMS)
        $query->whereIn('tahapan', Dpt::TAHAPAN_AKTIF);

        // Batasi hasil maksimal 5 baris demi keamanan (mencegah scraping massal)
        $voters = $query->limit(5)->get();

        if ($voters->isEmpty()) {
            return response()->json([
                'status' => 'success',
                'data' => []
            ]);
        }

        $formatted = $voters->map(function ($v) {
            // Masking NIK: 331110**********0001
            $nikMasked = $v->nik;
            if (strlen($nikMasked) === 16) {
                $nikMasked = substr($nikMasked, 0, 6) . '**********' . substr($nikMasked, -4);
            } else {
                $nikMasked = substr($nikMasked, 0, 4) . '********' . substr($nikMasked, -2);
            }

            // Masking NKK: 331110**********0001
            $nkkMasked = $v->nkk;
            if ($nkkMasked) {
                if (strlen($nkkMasked) === 16) {
                    $nkkMasked = substr($nkkMasked, 0, 6) . '**********' . substr($nkkMasked, -4);
                } else {
                    $nkkMasked = substr($nkkMasked, 0, 4) . '********' . substr($nkkMasked, -2);
                }
            }

            return [
                'nama' => strtoupper($v->nama),
                'nik' => $nikMasked,
                'nkk' => $nkkMasked,
                'jenis_kelamin' => $v->jenis_kelamin,
                'tps' => $v->tps->nama ?? 'TPS Belum Ditentukan',
                'rt' => $v->rt,
                'rw' => $v->rw,
                'alamat' => $v->alamat,
                'tahapan' => $v->tahapan,
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => $formatted
        ]);
    }

    private function cariTpsIdDariRtRw(string $rt, string $rw): ?int
    {
        $cleanRt = str_pad(preg_replace('/\D/', '', $rt), 3, '0', STR_PAD_LEFT);
        $cleanRw = str_pad(preg_replace('/\D/', '', $rw), 3, '0', STR_PAD_LEFT);

        // Pemetaan wilayah TPS Kelurahan Gentan
        if ($cleanRw === '001' || $cleanRw === '002') {
            return 1;
        } elseif ($cleanRw === '010' && ($cleanRt === '006' || $cleanRt === '007')) {
            return 1;
        } elseif ($cleanRw === '003' || $cleanRw === '004' || $cleanRw === '014') {
            return 2;
        } elseif ($cleanRw === '006' && in_array($cleanRt, ['002', '004', '006', '008'])) {
            return 2;
        } elseif ($cleanRw === '007' || $cleanRw === '013') {
            return 3;
        } elseif ($cleanRw === '006' && in_array($cleanRt, ['001', '003', '005', '007'])) {
            return 3;
        } elseif ($cleanRw === '009' && $cleanRt === '001') {
            return 3;
        } elseif ($cleanRw === '008' || $cleanRw === '012') {
            return 4;
        } elseif ($cleanRw === '005' || $cleanRw === '011') {
            return 5;
        } elseif ($cleanRw === '009' && in_array($cleanRt, ['002', '003', '004', '005'])) {
            return 5;
        } elseif ($cleanRw === '010' && in_array($cleanRt, ['001', '002', '003', '004', '005'])) {
            return 5;
        }

        return null;
    }
}
