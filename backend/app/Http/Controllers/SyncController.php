<?php

namespace App\Http\Controllers;

use App\Models\Dpt;
use App\Models\QuickCount;
use App\Models\SyncLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class SyncController extends Controller
{
    private function checkKpps(Request $request)
    {
        if ($request->user()->role !== 'kpps' && $request->user()->role !== 'sekretariat') {
            abort(response()->json([
                'status' => 'error',
                'message' => 'Akses ditolak. Hanya KPPS atau Sekretariat yang diizinkan.'
            ], 403));
        }

        if ($request->user()->role === 'kpps' && !$request->user()->tps_id) {
            abort(response()->json([
                'status' => 'error',
                'message' => 'Akun KPPS tidak terasosiasi dengan TPS mana pun.'
            ], 400));
        }
    }

    public function getDpt(Request $request)
    {
        $this->checkKpps($request);

        $tpsId = $request->user()->role === 'kpps' ? $request->user()->tps_id : $request->query('tps_id');

        if (!$tpsId) {
            return response()->json([
                'status' => 'error',
                'message' => 'Parameter tps_id diperlukan.'
            ], 400);
        }

        // Hanya DPT dan DPK yang berhak memilih. Mengirim DP4/DPS/TMS ke
        // perangkat lapangan akan membuat petugas bisa men-check-in orang yang
        // belum diverifikasi atau sudah dinyatakan tidak memenuhi syarat.
        $dpts = Dpt::where('tps_id', $tpsId)
            ->whereIn('tahapan', ['dpt', 'dpk'])
            ->get();

        return response()->json([
            'status' => 'success',
            'tps_id' => $tpsId,
            'data' => $dpts
        ]);
    }

    public function syncCheckins(Request $request)
    {
        $this->checkKpps($request);
        
        $tpsId = $request->user()->role === 'kpps' 
            ? $request->user()->tps_id 
            : $request->input('tps_id');

        if (!$tpsId) {
            return response()->json([
                'status' => 'error',
                'message' => 'Parameter tps_id diperlukan untuk sinkronisasi.'
            ], 400);
        }

        $validator = Validator::make($request->all(), [
            'checkins' => 'required|array',
            'checkins.*.nik' => 'required|string|size:16',
            'checkins.*.waktu_checkin' => 'required|string',
            'device_id' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        $checkins = $request->checkins;
        $deviceId = $request->device_id;
        $niks = collect($checkins)->pluck('nik')->toArray();

        // Get DPTs for this TPS that are in the sync payload
        $voters = Dpt::where('tps_id', $tpsId)
            ->whereIn('nik', $niks)
            ->get()
            ->keyBy('nik');

        $updatedCount = 0;
        $warnings = [];

        DB::beginTransaction();
        try {
            foreach ($checkins as $c) {
                $nik = $c['nik'];
                $waktuCheckin = date('Y-m-d H:i:s', strtotime($c['waktu_checkin']));

                if (!isset($voters[$nik])) {
                    $warnings[] = "NIK {$nik} tidak ditemukan di TPS ini.";
                    continue;
                }

                $voter = $voters[$nik];

                if ($voter->status_hadir) {
                    // Already checked in, skip or keep existing
                    continue;
                }

                $voter->update([
                    'status_hadir' => true,
                    'waktu_checkin' => $waktuCheckin
                ]);

                $updatedCount++;
            }

            // Create Sync Log
            SyncLog::create([
                'tps_id' => $tpsId,
                'device_id' => $deviceId,
                'action' => 'voter_checkin',
                'payload' => json_encode($checkins),
                'waktu_sync' => now()
            ]);

            DB::commit();
            \App\Utils\Broadcaster::trigger('checkin', ['tps_id' => $tpsId]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal sinkronisasi data check-in: ' . $e->getMessage()
            ], 500);
        }

        return response()->json([
            'status' => 'success',
            'message' => "Berhasil sinkronisasi {$updatedCount} data kehadiran.",
            'warnings' => $warnings
        ]);
    }

    public function submitQuickCount(Request $request)
    {
        $this->checkKpps($request);
        
        $tpsId = $request->user()->role === 'kpps' 
            ? $request->user()->tps_id 
            : $request->input('tps_id');

        if (!$tpsId) {
            return response()->json([
                'status' => 'error',
                'message' => 'Parameter tps_id diperlukan untuk menyimpan hasil suara.'
            ], 400);
        }

        $validator = Validator::make($request->all(), [
            'kandidat_1' => 'required|integer|min:0',
            'kandidat_2' => 'required|integer|min:0',
            'kandidat_3' => 'required|integer|min:0',
            'suara_tidak_sah' => 'required|integer|min:0',
            'status' => 'required|string|in:draft,final',
            'device_id' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        // Server-side validation: total votes cannot exceed total registered voters and check-in counts
        $tps = \App\Models\Tps::findOrFail($tpsId);
        // Dihitung dari tahapan, bukan dari penghitung tps.total_dpt yang kini
        // tidak lagi mencerminkan siapa saja yang berhak memilih.
        $totalDpt = \App\Models\Dpt::where('tps_id', $tpsId)->where('tahapan', 'dpt')->count();
        $totalDpk = \App\Models\Dpt::where('tps_id', $tpsId)->where('tahapan', 'dpk')->count();
        $totalPemilih = $totalDpt + $totalDpk;

        $totalHadir = \App\Models\Dpt::where('tps_id', $tpsId)->where('status_hadir', true)->count();

        $inputTotalSuara = intval($request->kandidat_1) + intval($request->kandidat_2) + intval($request->kandidat_3) + intval($request->suara_tidak_sah);

        if ($inputTotalSuara > $totalPemilih) {
            return response()->json([
                'status' => 'error',
                'message' => "Jumlah total suara ({$inputTotalSuara}) tidak boleh melebihi Total Pemilih ({$totalPemilih}) di TPS ini."
            ], 422);
        }

        if ($inputTotalSuara > $totalHadir) {
            return response()->json([
                'status' => 'error',
                'message' => "Jumlah total suara ({$inputTotalSuara}) tidak boleh melebihi Kehadiran / Check-In ({$totalHadir}) di TPS ini."
            ], 422);
        }

        $qc = QuickCount::find($tpsId);

        if ($qc && $qc->status === 'final') {
            return response()->json([
                'status' => 'error',
                'message' => 'Data Quick Count sudah terkunci (FINAL). Hubungi Sekretariat untuk melakukan perubahan.'
            ], 403);
        }

        DB::beginTransaction();
        try {
            $data = [
                'kandidat_1' => $request->kandidat_1,
                'kandidat_2' => $request->kandidat_2,
                'kandidat_3' => $request->kandidat_3,
                'suara_tidak_sah' => $request->suara_tidak_sah,
                'status' => $request->status,
                'submitted_at' => $request->status === 'final' ? now() : null,
            ];

            if ($qc) {
                $qc->update($data);
            } else {
                $data['tps_id'] = $tpsId;
                QuickCount::create($data);
            }

            // Log sync
            SyncLog::create([
                'tps_id' => $tpsId,
                'device_id' => $request->device_id,
                'action' => 'quick_count_submit',
                'payload' => json_encode($data),
                'waktu_sync' => now()
            ]);

            DB::commit();
            \App\Utils\Broadcaster::trigger('quick-count', ['tps_id' => $tpsId]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menyimpan data quick count: ' . $e->getMessage()
            ], 500);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Data Quick Count berhasil disimpan.'
        ]);
    }
}
