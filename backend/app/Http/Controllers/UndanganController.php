<?php

namespace App\Http\Controllers;

use App\Models\Dpt;
use App\Models\Tps;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Daftar pemilih siap-cetak untuk undangan C6.
 *
 * Panel bisa saja memanggil `/pemilih/cek` sekali per orang seperti tombol C6
 * satuan, tapi mencetak maraton berarti 20–75 permintaan berturut-turut ke
 * rute publik yang dibatasi `throttle:api` — pencetakan berhenti di tengah
 * segmen. Satu TPS diambil sekaligus di sini, lengkap dengan dua angka yang
 * tidak ada di tabel: nomor urut kedatangan dalam TPS dan jumlah pemilih TPS,
 * yang menentukan sesi jam pada undangan.
 *
 * NKK dikirim apa adanya, bukan disamarkan seperti di `/pemilih/cek`, karena
 * undangan mencetak 8 digit terakhirnya di bawah kode batang. Rutenya memang
 * hanya untuk sekretariat, bukan rute publik.
 */
class UndanganController extends Controller
{
    public function daftar(Request $request): JsonResponse
    {
        $request->validate([
            'tps_id' => 'required|integer|exists:tps,id',
        ]);

        $tps = Tps::find($request->tps_id);

        // Seluruh pemilih aktif TPS diperlukan — bukan hanya yang dicetak —
        // sebab jumlah dan urutan mereka itulah pembagi sesi jamnya.
        $aktif = Dpt::where('tps_id', $request->tps_id)
            ->whereIn('tahapan', Dpt::TAHAPAN_AKTIF)
            ->get(['nik', 'nkk', 'nama', 'jenis_kelamin', 'umur', 'alamat', 'rt', 'rw', 'tahapan', 'id_pemilih', 'no_urut']);

        $urutan = $this->urutanDalamTps($aktif);
        $total = $aktif->count();

        // Yang dicetak hanya DPT dan DPK, sama seperti tombol C6 di tabel.
        $baris = $aktif
            ->filter(fn ($p) => in_array($p->tahapan, ['dpt', 'dpk'], true))
            ->map(fn ($p) => [
                'nama' => strtoupper((string) $p->nama),
                'nik' => $p->nik,
                'nkk' => $p->nkk,
                'jenis_kelamin' => $p->jenis_kelamin,
                'umur' => $p->umur,
                'alamat' => $p->alamat,
                'rt' => $p->rt,
                'rw' => $p->rw,
                'tahapan' => $p->tahapan,
                'id_pemilih' => $p->id_pemilih,
                'no_urut' => $p->no_urut,
                'tps' => $tps->nama ?? '',
                'tps_total_dpt' => $total,
                'tps_voter_index' => $urutan[$p->nik] ?? 0,
            ])
            ->sortBy('tps_voter_index')
            ->values();

        return response()->json([
            'status' => 'success',
            'data' => [
                'tps' => ['id' => $tps->id, 'nama' => $tps->nama, 'wilayah' => $tps->wilayah],
                'jumlah_aktif' => $total,
                'jumlah' => $baris->count(),
                'baris' => $baris,
            ],
        ]);
    }

    /**
     * Nomor urut kedatangan tiap pemilih di dalam TPS-nya, 0-based.
     *
     * Rumusnya sengaja disamakan dengan `DptController::cekMandiri()`: yang
     * punya `no_urut` diurutkan menurutnya, yang belum punya menyusul menurut
     * `id_pemilih`. Kalau di sini dihitung dengan cara lain, satu orang bisa
     * mendapat jam berbeda antara unduhan satuan dan unduhan maraton.
     */
    private function urutanDalamTps($aktif): array
    {
        $bernomor = $aktif->filter(fn ($p) => $p->no_urut !== null)
            ->sortBy('no_urut')
            ->values();
        $tanpaNomor = $aktif->filter(fn ($p) => $p->no_urut === null)
            ->sortBy('id_pemilih', SORT_STRING)
            ->values();

        $idTanpaNomor = $tanpaNomor->pluck('id_pemilih')->all();

        $urutan = [];

        foreach ($bernomor as $posisi => $p) {
            $urutan[$p->nik] = $posisi + $this->jumlahLebihKecil($idTanpaNomor, (string) $p->id_pemilih);
        }

        foreach ($tanpaNomor as $posisi => $p) {
            $urutan[$p->nik] = $posisi;
        }

        return $urutan;
    }

    /** Berapa banyak id_pemilih pada daftar terurut yang lebih kecil dari $id. */
    private function jumlahLebihKecil(array $terurut, string $id): int
    {
        $kiri = 0;
        $kanan = count($terurut);

        while ($kiri < $kanan) {
            $tengah = intdiv($kiri + $kanan, 2);
            if (strcmp((string) $terurut[$tengah], $id) < 0) {
                $kiri = $tengah + 1;
            } else {
                $kanan = $tengah;
            }
        }

        return $kiri;
    }
}
