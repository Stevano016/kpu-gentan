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
        $totalDpsOnly = Dpt::where('jenis_pemilih', 'dps')->count();
        $totalDptbOnly = Dpt::where('jenis_pemilih', 'dptb')->count();
        $totalPemilih = $totalDptOnly + $totalDpkOnly + $totalDpsOnly + $totalDptbOnly;

        $totalHadirDpt = Dpt::where('jenis_pemilih', 'dpt')->where('status_hadir', true)->count();
        $totalHadirDpk = Dpt::where('jenis_pemilih', 'dpk')->where('status_hadir', true)->count();
        $totalHadirDps = Dpt::where('jenis_pemilih', 'dps')->where('status_hadir', true)->count();
        $totalHadirDptb = Dpt::where('jenis_pemilih', 'dptb')->where('status_hadir', true)->count();
        $totalHadirAll = $totalHadirDpt + $totalHadirDpk + $totalHadirDps + $totalHadirDptb;
        
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
                'dpt as total_dps' => function ($query) {
                    $query->where('jenis_pemilih', 'dps');
                },
                'dpt as total_dptb' => function ($query) {
                    $query->where('jenis_pemilih', 'dptb');
                },
                'dpt as hadir_dpt' => function ($query) {
                    $query->where('jenis_pemilih', 'dpt')->where('status_hadir', true);
                },
                'dpt as hadir_dpk' => function ($query) {
                    $query->where('jenis_pemilih', 'dpk')->where('status_hadir', true);
                },
                'dpt as hadir_dps' => function ($query) {
                    $query->where('jenis_pemilih', 'dps')->where('status_hadir', true);
                },
                'dpt as hadir_dptb' => function ($query) {
                    $query->where('jenis_pemilih', 'dptb')->where('status_hadir', true);
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
                    'total_dps' => (int)$tps->total_dps,
                    'total_dptb' => (int)$tps->total_dptb,
                    'hadir' => (int)($tps->hadir_dpt + $tps->hadir_dpk + $tps->hadir_dps + $tps->hadir_dptb),
                    'hadir_dpt' => (int)$tps->hadir_dpt,
                    'hadir_dpk' => (int)$tps->hadir_dpk,
                    'hadir_dps' => (int)$tps->hadir_dps,
                    'hadir_dptb' => (int)$tps->hadir_dptb,
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
                    'total_dps' => $totalDpsOnly,
                    'total_dptb' => $totalDptbOnly,
                    'total_pemilih' => $totalPemilih,
                    'total_hadir_dpt' => $totalHadirDpt,
                    'total_hadir_dpk' => $totalHadirDpk,
                    'total_hadir_dps' => $totalHadirDps,
                    'total_hadir_dptb' => $totalHadirDptb,
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
        $dpsCount = $voters->where('jenis_pemilih', 'dps')->count();
        $dptbCount = $voters->where('jenis_pemilih', 'dptb')->count();
        $hadirDpt = $voters->where('jenis_pemilih', 'dpt')->where('status_hadir', true)->count();
        $hadirDpk = $voters->where('jenis_pemilih', 'dpk')->where('status_hadir', true)->count();
        $hadirDps = $voters->where('jenis_pemilih', 'dps')->where('status_hadir', true)->count();
        $hadirDptb = $voters->where('jenis_pemilih', 'dptb')->where('status_hadir', true)->count();
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
                    'total_dps' => $dpsCount,
                    'total_dptb' => $dptbCount,
                    'total_pemilih' => $totalVal,
                    'hadir' => $hadirVal,
                    'hadir_dpt' => $hadirDpt,
                    'hadir_dpk' => $hadirDpk,
                    'hadir_dps' => $hadirDps,
                    'hadir_dptb' => $hadirDptb,
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
