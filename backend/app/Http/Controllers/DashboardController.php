<?php

namespace App\Http\Controllers;

use App\Models\Dpt;
use App\Models\Tps;
use App\Models\QuickCount;
use App\Models\SyncLog;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function getSummary(Request $request)
    {
        // Core stats
        $totalTps = Tps::count();
        
        $totalDptOnly = Dpt::where('jenis_pemilih', 'dpt')->count();
        $totalDpkOnly = Dpt::where('jenis_pemilih', 'dpk')->count();
        $totalPemilih = $totalDptOnly + $totalDpkOnly;

        $totalHadirDpt = Dpt::where('jenis_pemilih', 'dpt')->where('status_hadir', true)->count();
        $totalHadirDpk = Dpt::where('jenis_pemilih', 'dpk')->where('status_hadir', true)->count();
        $totalHadirAll = $totalHadirDpt + $totalHadirDpk;
        
        // Quick Count status
        $totalSubmittedQc = QuickCount::where('status', 'final')->count();

        // Quick Count votes aggregates
        $qcAggregates = QuickCount::where('status', 'final')
            ->selectRaw('SUM(kandidat_1) as kandidat_1, SUM(kandidat_2) as kandidat_2, SUM(kandidat_3) as kandidat_3, SUM(suara_tidak_sah) as suara_tidak_sah')
            ->first();

        // List of all TPS with stats (optimized using withCount to prevent N+1 queries)
        $tpsList = Tps::with(['quickCount'])
            ->withCount([
                'dpt as total_dpt' => function ($query) {
                    $query->where('jenis_pemilih', 'dpt');
                },
                'dpt as total_dpk' => function ($query) {
                    $query->where('jenis_pemilih', 'dpk');
                },
                'dpt as hadir_dpt' => function ($query) {
                    $query->where('jenis_pemilih', 'dpt')->where('status_hadir', true);
                },
                'dpt as hadir_dpk' => function ($query) {
                    $query->where('jenis_pemilih', 'dpk')->where('status_hadir', true);
                }
            ])
            ->get()
            ->map(function ($tps) {
                return [
                    'id' => $tps->id,
                    'nama' => $tps->nama,
                    'wilayah' => $tps->wilayah,
                    'total_dpt' => (int)$tps->total_dpt,
                    'total_dpk' => (int)$tps->total_dpk,
                    'hadir' => (int)($tps->hadir_dpt + $tps->hadir_dpk),
                    'hadir_dpt' => (int)$tps->hadir_dpt,
                    'hadir_dpk' => (int)$tps->hadir_dpk,
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

        $paslons = \App\Models\Paslon::orderBy('nomor_urut')->get();

        return response()->json([
            'status' => 'success',
            'data' => [
                'stats' => [
                    'total_tps' => $totalTps,
                    'total_dpt' => $totalDptOnly,
                    'total_dpk' => $totalDpkOnly,
                    'total_pemilih' => $totalPemilih,
                    'total_hadir_dpt' => $totalHadirDpt,
                    'total_hadir_dpk' => $totalHadirDpk,
                    'total_hadir' => $totalHadirAll,
                    'persentase_kehadiran' => $totalPemilih > 0 ? round(($totalHadirAll / $totalPemilih) * 100, 2) : 0,
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
                'tps_list' => $tpsList,
                'paslons' => $paslons
            ]
        ]);
    }

    public function getTpsDetails(Request $request, $id)
    {
        $tps = Tps::with(['quickCount', 'users'])->findOrFail($id);

        $voters = Dpt::where('tps_id', $id)
            ->select('nik', 'nama', 'status_hadir', 'waktu_checkin', 'jenis_pemilih')
            ->orderBy('nama')
            ->get();

        $recentSyncs = SyncLog::where('tps_id', $id)
            ->orderBy('waktu_sync', 'desc')
            ->limit(10)
            ->get();

        $dptCount = $voters->where('jenis_pemilih', 'dpt')->count();
        $dpkCount = $voters->where('jenis_pemilih', 'dpk')->count();
        $hadirDpt = $voters->where('jenis_pemilih', 'dpt')->where('status_hadir', true)->count();
        $hadirDpk = $voters->where('jenis_pemilih', 'dpk')->where('status_hadir', true)->count();
        $totalVal = $voters->count();
        $hadirVal = $voters->where('status_hadir', true)->count();

        $paslons = \App\Models\Paslon::orderBy('nomor_urut')->get();

        return response()->json([
            'status' => 'success',
            'data' => [
                'tps' => [
                    'id' => $tps->id,
                    'nama' => $tps->nama,
                    'wilayah' => $tps->wilayah,
                ],
                'stats' => [
                    'total_dpt' => $dptCount,
                    'total_dpk' => $dpkCount,
                    'total_pemilih' => $totalVal,
                    'hadir' => $hadirVal,
                    'hadir_dpt' => $hadirDpt,
                    'hadir_dpk' => $hadirDpk,
                    'tidak_hadir' => $totalVal - $hadirVal,
                    'persentase_kehadiran' => $totalVal > 0 ? round(($hadirVal / $totalVal) * 100, 2) : 0,
                ],
                'quick_count' => $tps->quickCount,
                'voters' => $voters,
                'recent_syncs' => $recentSyncs,
                'paslons' => $paslons
            ]
        ]);
    }
}
