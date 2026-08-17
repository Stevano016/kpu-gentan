<?php

namespace App\Http\Controllers;

use App\Models\Dpt;
use App\Models\Tps;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Ekspor data pemilih untuk dibuka di Excel.
 *
 * Berkasnya CSV yang di-stream baris demi baris, bukan xlsx: seluruh 6.856
 * baris tidak perlu ditahan di memori sekaligus, dan tidak menambah dependensi
 * berat pada hosting. Dua hal membuatnya tetap rapi saat dibuka di Excel —
 * BOM UTF-8 supaya nama berhuruf non-ASCII tidak rusak, dan baris `sep=,`
 * supaya Excel memakai koma sebagai pemisah apa pun bahasa sistemnya.
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

    public function pemilih(Request $request): StreamedResponse
    {
        $request->validate([
            'lingkup' => 'nullable|string|in:all,tps,rw',
            'tps_id' => 'required_if:lingkup,tps|nullable|integer|exists:tps,id',
            'rw' => 'required_if:lingkup,rw|nullable|string|max:10',
            'tahapan' => 'nullable|string|in:dp4,dps,dptb,dpt,dpk,tms',
        ]);

        $pengguna = $request->user();
        $lingkup = $request->lingkup ?? 'all';

        $query = Dpt::with('tps:id,nama')->orderBy('rw')->orderBy('rt')->orderBy('nama');
        $label = 'semua';

        // Pantarlih hanya boleh mengunduh TPS-nya sendiri, apa pun yang diminta
        // di parameter.
        if ($pengguna?->role === 'pantarlih') {
            $query->where('tps_id', $pengguna->tps_id);
            $namaTpsnya = Tps::find($pengguna->tps_id)?->nama ?? ('tps-' . $pengguna->tps_id);
            $label = $this->amankan($namaTpsnya);
        } elseif ($lingkup === 'tps') {
            $query->where('tps_id', $request->tps_id);
            $namaTps = Tps::find($request->tps_id)?->nama ?? ('tps-' . $request->tps_id);
            $label = $this->amankan($namaTps);
        } elseif ($lingkup === 'rw') {
            $query->where('rw', $request->rw);
            $label = 'rw-' . $this->amankan($request->rw);
        }

        if ($request->filled('tahapan')) {
            $query->where('tahapan', $request->tahapan);
            $label .= '-' . $request->tahapan;
        }

        $namaBerkas = 'pemilih-' . $label . '-' . now()->format('Ymd-His') . '.csv';

        return response()->stream(function () use ($query) {
            $keluaran = fopen('php://output', 'w');

            fwrite($keluaran, "\xEF\xBB\xBF");
            fwrite($keluaran, "sep=,\n");

            fputcsv($keluaran, array_merge(array_keys(self::KOLOM), ['TPS', 'Kehadiran', 'Waktu Check-in']));

            // chunk supaya ekspor sebesar apa pun tidak menumpuk di memori.
            $query->chunk(500, function ($baris) use ($keluaran) {
                foreach ($baris as $p) {
                    $data = [];
                    foreach (self::KOLOM as $atribut) {
                        $data[] = $p->{$atribut};
                    }
                    $data[] = $p->tps->nama ?? '';
                    $data[] = $p->status_hadir ? 'Hadir' : 'Belum Hadir';
                    $data[] = $p->waktu_checkin?->format('Y-m-d H:i:s') ?? '';
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
