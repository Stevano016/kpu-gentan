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
        
        // Satu query untuk seluruh tahapan; sebelumnya tiap angka satu query.
        $perTahapan = Dpt::selectRaw('tahapan, COUNT(*) as jumlah, SUM(status_hadir = 1) as hadir')
            ->groupBy('tahapan')
            ->get()
            ->keyBy('tahapan');

        $jumlah = fn (string $t) => (int) ($perTahapan[$t]->jumlah ?? 0);
        $hadir = fn (string $t) => (int) ($perTahapan[$t]->hadir ?? 0);

        $totalDp4 = $jumlah('dp4');
        $totalDpsOnly = $jumlah('dps');
        $totalDptbOnly = $jumlah('dptb');
        $totalDptOnly = $jumlah('dpt');
        $totalDpkOnly = $jumlah('dpk');
        $totalTms = $jumlah('tms');

        // Hanya DPT dan DPK yang berhak memilih. DP4 dan DPS masih proses, TMS
        // sudah gugur — memasukkannya akan menggelembungkan angka kehadiran.
        $totalPemilih = $totalDptOnly + $totalDpkOnly;

        $totalHadirDpt = $hadir('dpt');
        $totalHadirDpk = $hadir('dpk');
        $totalHadirDps = $hadir('dps');
        $totalHadirDptb = $hadir('dptb');
        $totalHadirAll = $totalHadirDpt + $totalHadirDpk;
        
        // Quick Count status. TPS final sudah dikunci; TPS draft sedang aktif
        // menghitung dan angkanya ikut tampil realtime, tapi masih bisa berubah.
        $totalSubmittedQc = QuickCount::where('status', 'final')->count();
        $totalDraftQc = QuickCount::where('status', 'draft')->count();

        // Quick Count votes aggregates. Sengaja MENYERTAKAN draft supaya grafik
        // dashboard bergerak realtime tiap KPPS menekan +/- di lapangan, bukan
        // menunggu submit final. Angka yang berasal dari draft bersifat
        // sementara — web menandainya lewat jumlah `tps_draft_qc`.
        $selectCols = 'SUM(suara_tidak_sah) as suara_tidak_sah';
        for ($i = 1; $i <= 10; $i++) {
            $selectCols .= ", SUM(kandidat_$i) as kandidat_$i";
        }
        $qcAggregates = QuickCount::whereIn('status', ['draft', 'final'])
            ->selectRaw($selectCols)
            ->first();

        // List of all TPS with stats (optimized using withCount to prevent N+1 queries)
        $tpsList = Tps::with(['quickCount'])
            ->withCount([
                'dpt as total_dp4' => function ($query) {
                    $query->where('tahapan', 'dp4');
                },
                'dpt as total_dpt' => function ($query) {
                    $query->where('tahapan', 'dpt');
                },
                'dpt as total_dpk' => function ($query) {
                    $query->where('tahapan', 'dpk');
                },
                'dpt as total_dps' => function ($query) {
                    $query->where('tahapan', 'dps');
                },
                'dpt as total_dptb' => function ($query) {
                    $query->where('tahapan', 'dptb');
                },
                'dpt as hadir_dp4' => function ($query) {
                    $query->where('tahapan', 'dp4')->where('status_hadir', true);
                },
                'dpt as hadir_dpt' => function ($query) {
                    $query->where('tahapan', 'dpt')->where('status_hadir', true);
                },
                'dpt as hadir_dpk' => function ($query) {
                    $query->where('tahapan', 'dpk')->where('status_hadir', true);
                },
                'dpt as hadir_dps' => function ($query) {
                    $query->where('tahapan', 'dps')->where('status_hadir', true);
                },
                'dpt as hadir_dptb' => function ($query) {
                    $query->where('tahapan', 'dptb')->where('status_hadir', true);
                }
            ])
            ->get()
            ->map(function ($tps) {
                return [
                    'id' => $tps->id,
                    'nama' => $tps->nama,
                    'wilayah' => $tps->wilayah,
                    'total_dp4' => (int)$tps->total_dp4,
                    'total_dpt' => (int)$tps->total_dpt,
                    'total_dpk' => (int)$tps->total_dpk,
                    'total_dps' => (int)$tps->total_dps,
                    'total_dptb' => (int)$tps->total_dptb,
                    'hadir' => (int)($tps->hadir_dp4 + $tps->hadir_dpt + $tps->hadir_dpk + $tps->hadir_dps + $tps->hadir_dptb),
                    'hadir_dp4' => (int)$tps->hadir_dp4,
                    'hadir_dpt' => (int)$tps->hadir_dpt,
                    'hadir_dpk' => (int)$tps->hadir_dpk,
                    'hadir_dps' => (int)$tps->hadir_dps,
                    'hadir_dptb' => (int)$tps->hadir_dptb,
                    'quick_count_status' => $tps->quickCount ? $tps->quickCount->status : 'belum_isi',
                    'quick_count' => $tps->quickCount ? array_merge(
                        collect(range(1, 10))->mapWithKeys(fn($i) => ["kandidat_$i" => $tps->quickCount->{"kandidat_$i"}])->toArray(),
                        [
                            'suara_tidak_sah' => $tps->quickCount->suara_tidak_sah,
                            'submitted_at' => $tps->quickCount->submitted_at,
                        ]
                    ) : null
                ];
            });

        $paslons = \App\Models\Paslon::orderBy('nomor_urut')->get();

        return response()->json([
            'status' => 'success',
            'data' => [
                'stats' => [
                    'total_tps' => $totalTps,
                    'total_dp4' => $totalDp4,
                    'total_dpt' => $totalDptOnly,
                    'total_dpk' => $totalDpkOnly,
                    'total_dps' => $totalDpsOnly,
                    'total_dptb' => $totalDptbOnly,
                    'total_tms' => $totalTms,
                    // Hanya DPT + DPK; tahapan lain belum/tidak berhak memilih.
                    'total_pemilih' => $totalPemilih,
                    'belum_diverifikasi' => $totalDp4,
                    'siap_ditetapkan' => $totalDpsOnly + $totalDptbOnly,
                    'total_hadir_dpt' => $totalHadirDpt,
                    'total_hadir_dpk' => $totalHadirDpk,
                    'total_hadir_dps' => $totalHadirDps,
                    'total_hadir_dptb' => $totalHadirDptb,
                    'total_hadir' => $totalHadirAll,
                    'persentase_kehadiran' => $totalPemilih > 0 ? round(($totalHadirAll / $totalPemilih) * 100, 2) : 0,
                    'tps_sudah_lapor_qc' => $totalSubmittedQc,
                    'tps_draft_qc' => $totalDraftQc,
                    // "Belum" kini berarti benar-benar belum ada data sama
                    // sekali — TPS yang sedang menghitung (draft) tidak lagi
                    // dianggap belum lapor.
                    'tps_belum_lapor_qc' => $totalTps - $totalSubmittedQc - $totalDraftQc,
                ],
                'quick_count_aggregates' => array_merge(
                    collect(range(1, 10))->mapWithKeys(fn($i) => ["kandidat_$i" => (int)($qcAggregates->{"kandidat_$i"} ?? 0)])->toArray(),
                    [
                        'suara_tidak_sah' => (int)($qcAggregates->suara_tidak_sah ?? 0),
                        'total_suara_masuk' => collect(range(1, 10))->reduce(fn($carry, $i) => $carry + (int)($qcAggregates->{"kandidat_$i"} ?? 0), 0) + (int)($qcAggregates->suara_tidak_sah ?? 0)
                    ]
                ),
                'tps_list' => $tpsList,
                'paslons' => $paslons
            ]
        ]);
    }

    public function getTpsDetails(Request $request, $id)
    {
        $tps = Tps::with(['quickCount', 'users'])->findOrFail($id);

        $voters = Dpt::where('tps_id', $id)
            ->select('nik', 'nama', 'status_hadir', 'waktu_checkin', 'tahapan', 'asal', 'tms_alasan', 'dpk_alasan')
            ->orderBy('nama')
            ->get();

        $recentSyncs = SyncLog::where('tps_id', $id)
            ->orderBy('waktu_sync', 'desc')
            ->limit(10)
            ->get();

        $dp4Count = $voters->where('tahapan', 'dp4')->count();
        $dptCount = $voters->where('tahapan', 'dpt')->count();
        $dpkCount = $voters->where('tahapan', 'dpk')->count();
        $dpsCount = $voters->where('tahapan', 'dps')->count();
        $dptbCount = $voters->where('tahapan', 'dptb')->count();
        $hadirDp4 = $voters->where('tahapan', 'dp4')->where('status_hadir', true)->count();
        $hadirDpt = $voters->where('tahapan', 'dpt')->where('status_hadir', true)->count();
        $hadirDpk = $voters->where('tahapan', 'dpk')->where('status_hadir', true)->count();
        $hadirDps = $voters->where('tahapan', 'dps')->where('status_hadir', true)->count();
        $hadirDptb = $voters->where('tahapan', 'dptb')->where('status_hadir', true)->count();
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
                    'total_dp4' => $dp4Count,
                    'total_dpt' => $dptCount,
                    'total_dpk' => $dpkCount,
                    'total_dps' => $dpsCount,
                    'total_dptb' => $dptbCount,
                    'total_pemilih' => $totalVal,
                    'hadir' => $hadirVal,
                    'hadir_dp4' => $hadirDp4,
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
