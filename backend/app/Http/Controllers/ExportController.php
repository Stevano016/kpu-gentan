<?php

namespace App\Http\Controllers;

use App\Models\Dpt;
use App\Models\Tps;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Ekspor data pemilih.
 *
 * Dua bentuk keluaran dari satu penyaringan yang sama:
 *
 *   - `format=json` — dipakai panel web, yang menyusun sendiri berkas .xlsx
 *     bergaya di peramban. Ini jalur utama sejak nomor 16 digit terbukti tidak
 *     selamat lewat CSV (lihat catatan di bawah).
 *   - CSV yang di-stream per 500 baris — dipertahankan untuk siapa pun yang
 *     memanggil API ini langsung, dan supaya berkas sebesar apa pun tidak
 *     perlu ditahan di memori sekaligus.
 *
 * **Kenapa NIK/NKK ditulis dengan awalan `=`**: NIK 16 digit melampaui presisi
 * angka Excel (2^53). Begitu Excel menebaknya sebagai angka, kolomnya tampil
 * sebagai `3,31E+15` *dan* digit terakhirnya benar-benar hilang —
 * `3318104608900001` tersimpan menjadi `3318104608900000`. Menulisnya sebagai
 * `="3318104608900001"` memaksa Excel memperlakukannya sebagai teks sejak
 * awal. Baris `sep=,` dan BOM UTF-8 menjaga pemisah kolom dan huruf non-ASCII.
 */
class ExportController extends Controller
{
    private const KOLOM = [
        'ID Pemilih' => 'id_pemilih',
        'NIK' => 'nik',
        'NKK' => 'nkk',
        'Nama' => 'nama',
        'RT' => 'rt',
        'RW' => 'rw',
        'Alamat' => 'alamat',
        'Jenis Kelamin' => 'jenis_kelamin',
        'Umur' => 'umur',
        'Status Kawin' => 'status_kawin',
        'Pekerjaan' => 'pekerjaan',
        'Disabilitas' => 'disabilitas',
        'Tahapan' => 'tahapan',
        'Asal' => 'asal',
        'Keterangan' => 'keterangan',
    ];

    /** Kolom yang harus sampai ke Excel sebagai teks, bukan angka. */
    private const KOLOM_NOMOR_IDENTITAS = ['nik', 'nkk'];

    public function pemilih(Request $request): StreamedResponse|\Illuminate\Http\JsonResponse
    {
        $request->validate([
            'lingkup' => 'nullable|string|in:all,tps,rw',
            'tps_id' => 'required_if:lingkup,tps|nullable|integer|exists:tps,id',
            'rw' => 'required_if:lingkup,rw|nullable|string|max:10',
            'tahapan' => 'nullable|string|in:dp4,dps,dptb,dpt,dpk,tms',
            'format' => 'nullable|string|in:csv,json',
        ]);

        [$query, $label, $judul] = $this->saring($request);

        if ($request->format === 'json') {
            return $this->sebagaiJson($query, $label, $judul);
        }

        return $this->sebagaiCsv($query, $label);
    }

    /** Menyusun query beserta label berkas dan judul yang terbaca manusia. */
    private function saring(Request $request): array
    {
        $pengguna = $request->user();
        $lingkup = $request->lingkup ?? 'all';

        $query = Dpt::with('tps:id,nama')->orderBy('rw')->orderBy('rt')->orderBy('nama');
        $label = 'semua';
        $judul = 'Seluruh Pemilih Kelurahan Gentan';

        // Pantarlih hanya boleh mengunduh TPS-nya sendiri, apa pun yang diminta
        // di parameter.
        if ($pengguna?->role === 'pantarlih') {
            $query->where('tps_id', $pengguna->tps_id);
            $namaTpsnya = Tps::find($pengguna->tps_id)?->nama ?? ('tps-' . $pengguna->tps_id);
            $label = $this->amankan($namaTpsnya);
            $judul = 'Pemilih ' . $namaTpsnya;
        } elseif ($lingkup === 'tps') {
            $query->where('tps_id', $request->tps_id);
            $namaTps = Tps::find($request->tps_id)?->nama ?? ('tps-' . $request->tps_id);
            $label = $this->amankan($namaTps);
            $judul = 'Pemilih ' . $namaTps;
        } elseif ($lingkup === 'rw') {
            $query->where('rw', $request->rw);
            $label = 'rw-' . $this->amankan($request->rw);
            $judul = 'Pemilih RW ' . $request->rw;
        }

        if ($request->filled('tahapan')) {
            $query->where('tahapan', $request->tahapan);
            $label .= '-' . $request->tahapan;
            $judul .= ' — tahapan ' . strtoupper($request->tahapan);
        }

        return [$query, $label, $judul];
    }

    private function sebagaiJson($query, string $label, string $judul): \Illuminate\Http\JsonResponse
    {
        $baris = [];

        $query->chunk(1000, function ($kumpulan) use (&$baris) {
            foreach ($kumpulan as $p) {
                $data = [];
                foreach (self::KOLOM as $atribut) {
                    $data[$atribut] = $p->{$atribut};
                }
                $data['tps'] = $p->tps->nama ?? '';
                $data['status_hadir'] = (bool) $p->status_hadir;
                $data['waktu_checkin'] = $p->waktu_checkin?->format('Y-m-d H:i:s');
                $data['nik_sintetis'] = (bool) $p->nik_sintetis;
                $data['nkk_sintetis'] = (bool) $p->nkk_sintetis;
                $baris[] = $data;
            }
        });

        return response()->json([
            'status' => 'success',
            'data' => [
                'label' => $label,
                'judul' => $judul,
                'jumlah' => count($baris),
                'baris' => $baris,
            ],
        ]);
    }

    private function sebagaiCsv($query, string $label): StreamedResponse
    {
        $namaBerkas = 'pemilih-' . $label . '-' . now()->format('Ymd-His') . '.csv';

        return response()->stream(function () use ($query) {
            $keluaran = fopen('php://output', 'w');

            fwrite($keluaran, "\xEF\xBB\xBF");
            fwrite($keluaran, "sep=,\n");

            fputcsv($keluaran, array_merge(
                array_keys(self::KOLOM),
                ['TPS', 'Kehadiran', 'Waktu Check-in', 'Nomor Sementara'],
            ));

            // chunk supaya ekspor sebesar apa pun tidak menumpuk di memori.
            $query->chunk(500, function ($baris) use ($keluaran) {
                foreach ($baris as $p) {
                    $data = [];
                    foreach (self::KOLOM as $atribut) {
                        $nilai = $p->{$atribut};
                        $data[] = in_array($atribut, self::KOLOM_NOMOR_IDENTITAS, true)
                            ? $this->sebagaiTeksExcel($nilai)
                            : $nilai;
                    }
                    $data[] = $p->tps->nama ?? '';
                    $data[] = $p->status_hadir ? 'Hadir' : 'Belum Hadir';
                    $data[] = $p->waktu_checkin?->format('Y-m-d H:i:s') ?? '';
                    $data[] = $this->tandaNomorSementara($p);
                    fputcsv($keluaran, $data);
                }
                flush();
            });

            fclose($keluaran);
        }, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="' . $namaBerkas . '"',
            'Cache-Control' => 'no-store',
        ]);
    }

    /**
     * `="0123"` — satu-satunya bentuk yang dipatuhi Excel tanpa dialog impor.
     * Tanpa ini, nomor identitas 16 digit tampil sebagai 3,31E+15 dan digit
     * terakhirnya hilang secara permanen.
     */
    private function sebagaiTeksExcel(?string $nilai): string
    {
        if (blank($nilai)) {
            return '';
        }

        return '="' . str_replace('"', '', $nilai) . '"';
    }

    private function tandaNomorSementara(Dpt $p): string
    {
        $tanda = [];
        if ($p->nik_sintetis) $tanda[] = 'NIK sementara';
        if ($p->nkk_sintetis) $tanda[] = 'NKK sementara';

        return implode(' + ', $tanda);
    }

    /** Daftar RW yang ada, untuk mengisi pilihan ekspor. */
    public function daftarRw(Request $request)
    {
        $pengguna = $request->user();

        $daftar = Dpt::query()
            ->when($pengguna?->role === 'pantarlih', fn ($q) => $q->where('tps_id', $pengguna->tps_id))
            ->whereNotNull('rw')
            ->where('rw', '!=', '')
            ->distinct()
            ->orderBy('rw')
            ->pluck('rw');

        return response()->json(['status' => 'success', 'data' => $daftar]);
    }

    private function amankan(?string $teks): string
    {
        return strtolower(preg_replace('/[^A-Za-z0-9]+/', '-', trim((string) $teks))) ?: 'data';
    }
}
