<?php

namespace App\Http\Controllers;

use App\Models\Dpt;
use App\Models\Tps;
use App\Models\QuickCount;
use App\Models\SyncLog;
use Illuminate\Http\Request;

class DashboardController extends Controller
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

    public function getSummary(Request $request)
    {
        $this->checkSecretariat($request);

        // Core stats
        $totalTps = Tps::count();
        $totalDpt = Dpt::count();
        $totalHadir = Dpt::where('status_hadir', true)->count();
        
        // Quick Count status
        $totalSubmittedQc = QuickCount::where('status', 'final')->count();
        $totalDraftQc = QuickCount::where('status', 'draft')->count();

        // Quick Count votes aggregates
        $qcAggregates = QuickCount::where('status', 'final')
            ->selectRaw('SUM(kandidat_1) as kandidat_1, SUM(kandidat_2) as kandidat_2, SUM(kandidat_3) as kandidat_3, SUM(suara_tidak_sah) as suara_tidak_sah')
            ->first();

        // Sync statistics
        $pendingSyncLogs = SyncLog::count(); // Simple count of sync log history

        // List of all TPS with stats (pre-calculated with eager loading to prevent N+1 queries)
        $tpsList = Tps::with(['quickCount'])
            ->get()
            ->map(function ($tps) {
                // Since total DPT is cached in total_dpt column, let's load actual count & attendance count
                $totalVal = $tps->total_dpt;
                // Query counts
                $hadirVal = Dpt::where('tps_id', $tps->id)->where('status_hadir', true)->count();
                
                return [
                    'id' => $tps->id,
                    'nama' => $tps->nama,
                    'wilayah' => $tps->wilayah,
                    'total_dpt' => $totalVal,
                    'hadir' => $hadirVal,
                    'quick_count_status' => $tps->quickCount ? $tps->quickCount->status : 'belum_isi',
                    'quick_count' => $tps->quickCount ? [
                        'kandidat_1' => $tps->quickCount->kandidat_1,
                        'kandidat_2' => $tps->quickCount->kandidat_2,
                        'kandidat_3' => $tps->quickCount->kandidat_3,
                        'suara_tidak_sah' => $tps->quickCount->suara_tidak_sah,
                        'submitted_at' => $tps->quickCount->submitted_at,
                    ] : null
                ];
            });

        return response()->json([
            'status' => 'success',
            'data' => [
                'stats' => [
                    'total_tps' => $totalTps,
                    'total_dpt' => $totalDpt,
                    'total_hadir' => $totalHadir,
                    'persentase_kehadiran' => $totalDpt > 0 ? round(($totalHadir / $totalDpt) * 100, 2) : 0,
                    'tps_sudah_lapor_qc' => $totalSubmittedQc,
                    'tps_belum_lapor_qc' => $totalTps - $totalSubmittedQc,
                ],
                'quick_count_aggregates' => [
                    'kandidat_1' => (int)($qcAggregates->kandidat_1 ?? 0),
                    'kandidat_2' => (int)($qcAggregates->kandidat_2 ?? 0),
                    'kandidat_3' => (int)($qcAggregates->kandidat_3 ?? 0),
                    'suara_tidak_sah' => (int)($qcAggregates->suara_tidak_sah ?? 0),
                    'total_suara_masuk' => (int)($qcAggregates->kandidat_1 ?? 0) + (int)($qcAggregates->kandidat_2 ?? 0) + (int)($qcAggregates->kandidat_3 ?? 0) + (int)($qcAggregates->suara_tidak_sah ?? 0)
                ],
                'tps_list' => $tpsList
            ]
        ]);
    }

    public function getTpsDetails(Request $request, $id)
    {
        $this->checkSecretariat($request);

        $tps = Tps::with(['quickCount', 'users'])->findOrFail($id);

        $voters = Dpt::where('tps_id', $id)
            ->select('nik', 'nama', 'status_hadir', 'waktu_checkin')
            ->orderBy('nama')
            ->get();

        $recentSyncs = SyncLog::where('tps_id', $id)
            ->orderBy('waktu_sync', 'desc')
            ->limit(10)
            ->get();

        $totalVal = $voters->count();
        $hadirVal = $voters->where('status_hadir', true)->count();

        return response()->json([
            'status' => 'success',
            'data' => [
                'tps' => [
                    'id' => $tps->id,
                    'nama' => $tps->nama,
                    'wilayah' => $tps->wilayah,
                ],
                'stats' => [
                    'total_dpt' => $totalVal,
                    'hadir' => $hadirVal,
                    'tidak_hadir' => $totalVal - $hadirVal,
                    'persentase_kehadiran' => $totalVal > 0 ? round(($hadirVal / $totalVal) * 100, 2) : 0,
                ],
                'quick_count' => $tps->quickCount,
                'voters' => $voters,
                'recent_syncs' => $recentSyncs
            ]
        ]);
    }
}
