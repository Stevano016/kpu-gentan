<?php

namespace App\Http\Controllers;

use App\Models\Dpt;
use App\Utils\Broadcaster;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Moves voters through the pendataan flow:
 *
 *   DP4 --verifikasi--> DPS  --+
 *                              +--penetapan--> DPT --pilah--> DPK
 *   DPTb ---------------------+
 *
 *   DP4 --tidak lolos--> TMS (kept, with a reason, and reversible)
 *
 * Every transition is validated against Dpt::TRANSISI rather than trusting the
 * caller, so a voter cannot skip a step or move backwards by accident.
 */
class TahapanController extends Controller
{
    /**
     * Verifikasi DP4 → DPS.
     *
     * Scoped to one TPS or to an explicit list of NIKs; without either it
     * verifies everything still sitting in DP4.
     */
    public function verifikasi(Request $request)
    {
        $request->validate([
            'tps_id' => 'nullable|integer|exists:tps,id',
            'nik' => 'nullable|array',
            'nik.*' => 'string',
        ]);

        $query = Dpt::where('tahapan', 'dp4');
        $this->terapkanLingkup($query, $request);

        $jumlah = (clone $query)->count();
        if ($jumlah === 0) {
            return response()->json([
                'status' => 'error',
                'message' => 'Tidak ada data DP4 yang bisa diverifikasi pada lingkup ini.',
            ], 422);
        }

        $query->update([
            'tahapan' => 'dps',
            'diverifikasi_pada' => now(),
            'tms_alasan' => null,
            // Lolos verifikasi: keterangan pemeriksaannya adalah `dps`.
            'keterangan' => 'dps',
        ]);

        Broadcaster::trigger('update', ['tps_id' => $request->tps_id ?? 'all']);

        return response()->json([
            'status' => 'success',
            'message' => "$jumlah data DP4 diverifikasi menjadi DPS.",
            'jumlah' => $jumlah,
        ]);
    }

    /** Tandai satu data DP4 sebagai Tidak Memenuhi Syarat. */
    public function tandaiTms(Request $request, $nik)
    {
        // Alasan gugur memakai daftar yang sama dengan kolom keterangan, supaya
        // tidak ada dua daftar alasan yang bisa berbeda isi.
        $request->validate([
            'alasan' => 'required|string|in:' . implode(',', Dpt::KETERANGAN_TMS),
        ]);

        $dpt = Dpt::where('nik', $nik)->firstOrFail();
        $this->pastikanBisaPindah($dpt->tahapan, 'tms');

        $dpt->update([
            'tahapan' => 'tms',
            'tms_alasan' => $request->alasan,
            'keterangan' => $request->alasan,
            'diverifikasi_pada' => now(),
        ]);

        Broadcaster::trigger('update', ['tps_id' => $dpt->tps_id]);

        return response()->json([
            'status' => 'success',
            'message' => 'Data ditandai Tidak Memenuhi Syarat.',
            'data' => $dpt->fresh(),
        ]);
    }

    /** Batalkan penandaan TMS; data kembali menunggu verifikasi. */
    public function batalkanTms($nik)
    {
        $dpt = Dpt::where('nik', $nik)->firstOrFail();
        $this->pastikanBisaPindah($dpt->tahapan, 'dp4');

        $dpt->update([
            'tahapan' => 'dp4',
            'tms_alasan' => null,
            'keterangan' => null,
            'diverifikasi_pada' => null,
        ]);

        Broadcaster::trigger('update', ['tps_id' => $dpt->tps_id]);

        return response()->json([
            'status' => 'success',
            'message' => 'Penandaan TMS dibatalkan, data kembali ke DP4.',
            'data' => $dpt->fresh(),
        ]);
    }

    /**
     * Penetapan: DPS + DPTb → DPT.
     *
     * Refuses to run while DP4 is still outstanding in the same scope —
     * finalising the roll before every imported row has been looked at would
     * quietly drop those people.
     */
    public function tetapkan(Request $request)
    {
        $request->validate([
            'tps_id' => 'nullable|integer|exists:tps,id',
            'paksa' => 'nullable|boolean',
        ]);

        $sisaDp4 = Dpt::where('tahapan', 'dp4')
            ->when($request->filled('tps_id'), fn ($q) => $q->where('tps_id', $request->tps_id))
            ->count();

        if ($sisaDp4 > 0 && !$request->boolean('paksa')) {
            return response()->json([
                'status' => 'error',
                'message' => "Masih ada $sisaDp4 data DP4 yang belum diverifikasi. Selesaikan verifikasi dulu, atau kirim paksa=true bila memang ingin menetapkan tanpa data tersebut.",
                'sisa_dp4' => $sisaDp4,
            ], 422);
        }

        $query = Dpt::whereIn('tahapan', ['dps', 'dptb'])
            ->when($request->filled('tps_id'), fn ($q) => $q->where('tps_id', $request->tps_id));

        $jumlah = (clone $query)->count();
        if ($jumlah === 0) {
            return response()->json([
                'status' => 'error',
                'message' => 'Tidak ada DPS atau DPTb yang bisa ditetapkan.',
            ], 422);
        }

        $dariDps = (clone $query)->where('tahapan', 'dps')->count();
        $dariDptb = (clone $query)->where('tahapan', 'dptb')->count();

        $query->update(['tahapan' => 'dpt']);

        Broadcaster::trigger('update', ['tps_id' => $request->tps_id ?? 'all']);

        return response()->json([
            'status' => 'success',
            'message' => "$jumlah pemilih ditetapkan sebagai DPT ($dariDps dari DPS, $dariDptb dari DPTb).",
            'jumlah' => $jumlah,
            'dari_dps' => $dariDps,
            'dari_dptb' => $dariDptb,
        ]);
    }

    /** Pilah kasus khusus keluar dari DPT menjadi DPK. */
    public function tandaiDpk(Request $request, $nik)
    {
        $request->validate(['alasan' => 'required|string|max:255']);

        $dpt = Dpt::where('nik', $nik)->firstOrFail();
        $this->pastikanBisaPindah($dpt->tahapan, 'dpk');

        $dpt->update([
            'tahapan' => 'dpk',
            'dpk_alasan' => $request->alasan,
        ]);

        Broadcaster::trigger('update', ['tps_id' => $dpt->tps_id]);

        return response()->json([
            'status' => 'success',
            'message' => 'Pemilih dipindahkan ke DPK.',
            'data' => $dpt->fresh(),
        ]);
    }

    /** Kembalikan DPK ke DPT. */
    public function batalkanDpk($nik)
    {
        $dpt = Dpt::where('nik', $nik)->firstOrFail();
        $this->pastikanBisaPindah($dpt->tahapan, 'dpt');

        $dpt->update(['tahapan' => 'dpt', 'dpk_alasan' => null]);

        Broadcaster::trigger('update', ['tps_id' => $dpt->tps_id]);

        return response()->json([
            'status' => 'success',
            'message' => 'Pemilih dikembalikan ke DPT.',
            'data' => $dpt->fresh(),
        ]);
    }

    /**
     * Kalkulasi seluruh tahapan, termasuk DPT dan DPK.
     *
     * `total_pemilih` counts DPT + DPK only: those are the people who may
     * actually vote. DP4 and DPS are work in progress, and TMS are excluded by
     * definition, so folding them in would inflate the figure.
     */
    public function ringkasan(Request $request)
    {
        $request->validate(['tps_id' => 'nullable|integer|exists:tps,id']);

        $dasar = fn () => Dpt::query()
            ->when($request->filled('tps_id'), fn ($q) => $q->where('tps_id', $request->tps_id));

        $perTahapan = $dasar()
            ->select('tahapan', DB::raw('COUNT(*) as jumlah'))
            ->groupBy('tahapan')
            ->pluck('jumlah', 'tahapan');

        $hitung = fn (string $t) => (int) ($perTahapan[$t] ?? 0);

        $dpt = $hitung('dpt');
        $dpk = $hitung('dpk');

        return response()->json([
            'status' => 'success',
            'data' => [
                'dp4' => $hitung('dp4'),
                'dps' => $hitung('dps'),
                'dptb' => $hitung('dptb'),
                'dpt' => $dpt,
                'dpk' => $dpk,
                'tms' => $hitung('tms'),

                // DPT sudah merupakan gabungan DPS + DPTb; asal dipertahankan
                // supaya kontribusi masing-masing tetap bisa dilaporkan.
                'dpt_dari_dp4' => (int) $dasar()->where('tahapan', 'dpt')->where('asal', 'dp4')->count(),
                'dpt_dari_dptb' => (int) $dasar()->where('tahapan', 'dpt')->where('asal', 'dptb')->count(),

                'total_pemilih' => $dpt + $dpk,
                'belum_diverifikasi' => $hitung('dp4'),
                'siap_ditetapkan' => $hitung('dps') + $hitung('dptb'),
            ],
        ]);
    }

    private function terapkanLingkup($query, Request $request): void
    {
        if ($request->filled('tps_id')) {
            $query->where('tps_id', $request->tps_id);
        }
        if ($request->filled('nik')) {
            $query->whereIn('nik', $request->nik);
        }
    }

    private function pastikanBisaPindah(string $dari, string $ke): void
    {
        if (!in_array($ke, Dpt::TRANSISI[$dari] ?? [], true)) {
            abort(422, "Tidak bisa memindahkan data dari tahapan '$dari' ke '$ke'.");
        }
    }
}
