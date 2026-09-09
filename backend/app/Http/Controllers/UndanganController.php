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

        // Nomor urut sedesa untuk seluruh pemilih sekaligus. `Dpt::nomorUrut()`
        // per baris berarti dua COUNT dikali jumlah pemilih TPS — ribuan kueri
        // untuk satu kali cetak maraton.
        $nomorUrut = Dpt::petaNomorUrut();

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
                // Angka yang tercetak di undangan. Bukan `no_urut` bawaan
                // berkas DPS: begitu ada pemilih dicoret, nomor itu berlubang
                // dan tidak lagi cocok dengan daftar mana pun. Sama persis
                // dengan yang ditampilkan halaman Cek Pemilih.
                'no_urut_tampil' => $nomorUrut[$p->nik] ?? null,
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
     * Angka inilah pembagi sesi jam pada undangan, jadi urutannya memakai
     * aturan yang sama dengan penomoran daftar (`Dpt::scopeUrutDaftar()`):
     * RW, RT, NKK, lalu urutan asal. Dengan begitu satu keluarga mendapat sesi
     * jam yang sama — mereka memang datang bersama — dan dua orang yang
     * bersebelahan di daftar tidak lagi bisa kebagian jam berbeda tanpa alasan
     * yang kelihatan.
     */
    private function urutanDalamTps($aktif): array
    {
        $terurut = $aktif->sort(function ($a, $b) {
            $kunci = fn ($p) => [
                $p->rw === null || $p->rw === '' ? 1 : 0, (string) $p->rw,
                $p->rt === null || $p->rt === '' ? 1 : 0, (string) $p->rt,
                $p->nkk === null || $p->nkk === '' ? 1 : 0, (string) $p->nkk,
                $p->no_urut === null ? 1 : 0, (int) $p->no_urut,
                (string) $p->id_pemilih,
            ];

            return $kunci($a) <=> $kunci($b);
        })->values();

        $urutan = [];
        foreach ($terurut as $posisi => $p) {
            $urutan[$p->nik] = $posisi;
        }

        return $urutan;
    }
}
