<?php

namespace App\Http\Controllers;

use App\Models\Dpt;
use App\Models\Tps;
use Illuminate\Http\Request;

/**
 * Pengelompokan pemilih berdasarkan nomor Kartu Keluarga.
 *
 * Daftar pemilih biasa menjawab "siapa saja yang terdaftar"; pantarlih di
 * lapangan mendatangi *rumah*, bukan orang per orang, jadi yang mereka
 * butuhkan adalah "siapa saja yang tinggal di satu KK". Halaman ini menyusun
 * data yang sama menurut `nkk`.
 *
 * Satu hal yang sengaja tidak disembunyikan: 627 orang belum punya NKK asli
 * dan memakai nomor sementara (lihat `Dpt::AWALAN_NKK_SINTETIS`). Mereka
 * muncul sebagai keluarga beranggota satu orang dan diberi tanda, bukan
 * disatukan menjadi satu keluarga raksasa atau dibuang dari daftar — keduanya
 * akan membuat jumlah anggota keluarga berbohong.
 */
class KeluargaController extends Controller
{
    /** Kolom anggota yang dikirim ke klien. */
    private const KOLOM_ANGGOTA = [
        'nik', 'nkk', 'nik_sintetis', 'nkk_sintetis', 'nama', 'id_pemilih',
        'jenis_kelamin', 'umur', 'status_kawin', 'pekerjaan', 'disabilitas',
        'alamat', 'rt', 'rw', 'tps_id', 'tahapan', 'asal', 'keterangan',
        'status_hadir',
    ];

    public function index(Request $request)
    {
        $request->validate([
            'tps_id' => 'nullable|integer|exists:tps,id',
            'rw' => 'nullable|string|max:10',
            'rt' => 'nullable|string|max:10',
            'search' => 'nullable|string|max:100',
            'per_page' => 'nullable|integer|min:5|max:100',
        ]);

        $dasar = $this->dasar($request);

        $halaman = (clone $dasar)
            ->selectRaw('nkk, COUNT(*) as jumlah_anggota, MIN(rw) as rw, MIN(rt) as rt, MIN(tps_id) as tps_id, MIN(alamat) as alamat, MAX(nkk_sintetis) as nkk_sintetis, MAX(nik_sintetis) as ada_nik_sintetis')
            ->groupBy('nkk')
            ->orderBy('rw')
            ->orderBy('rt')
            ->orderBy('nkk')
            ->paginate((int) ($request->per_page ?? 20));

        $anggota = Dpt::query()
            ->whereIn('nkk', collect($halaman->items())->pluck('nkk'))
            ->orderByDesc('umur')
            ->orderBy('nama')
            ->get(self::KOLOM_ANGGOTA)
            ->groupBy('nkk');

        $keluarga = collect($halaman->items())->map(fn ($k) => [
            'nkk' => $k->nkk,
            'nkk_sintetis' => (bool) $k->nkk_sintetis,
            'ada_nik_sintetis' => (bool) $k->ada_nik_sintetis,
            'jumlah_anggota' => (int) $k->jumlah_anggota,
            'rt' => $k->rt,
            'rw' => $k->rw,
            'tps_id' => (int) $k->tps_id,
            'alamat' => $k->alamat,
            'anggota' => $anggota->get($k->nkk, collect())->values(),
        ]);

        return response()->json([
            'status' => 'success',
            'data' => [
                'data' => $keluarga,
                'current_page' => $halaman->currentPage(),
                'last_page' => $halaman->lastPage(),
                'per_page' => $halaman->perPage(),
                'total' => $halaman->total(),
            ],
            'ringkasan' => $this->ringkasan($request),
        ]);
    }

    /**
     * Seluruh keluarga dalam satu lingkup, tanpa halaman — dipakai panel web
     * untuk menyusun berkas Excel. Sengaja tidak dibatasi paginasi: berkas
     * cetak harus utuh, dan satu TPS hanya sekitar 1.600 orang.
     */
    public function ekspor(Request $request)
    {
        $request->validate([
            'tps_id' => 'nullable|integer|exists:tps,id',
            'rw' => 'nullable|string|max:10',
            'rt' => 'nullable|string|max:10',
        ]);

        $baris = $this->dasar($request)
            ->orderBy('rw')
            ->orderBy('rt')
            ->orderBy('nkk')
            ->orderByDesc('umur')
            ->orderBy('nama')
            ->get(self::KOLOM_ANGGOTA);

        $keluarga = $baris->groupBy('nkk')->map(function ($anggota, $nkk) {
            $pertama = $anggota->first();

            return [
                'nkk' => (string) $nkk,
                'nkk_sintetis' => (bool) $pertama->nkk_sintetis,
                'jumlah_anggota' => $anggota->count(),
                'rt' => $pertama->rt,
                'rw' => $pertama->rw,
                'tps_id' => $pertama->tps_id,
                'alamat' => $pertama->alamat,
                'anggota' => $anggota->values(),
            ];
        })->values()->sortBy(fn ($k) => [$k['rw'], $k['rt'], $k['nkk']])->values();

        $tpsId = $this->lingkupTps($request);

        return response()->json([
            'status' => 'success',
            'data' => [
                'tps' => $tpsId ? Tps::find($tpsId)?->only(['id', 'nama', 'wilayah']) : null,
                'rw' => $request->rw,
                'rt' => $request->rt,
                'jumlah_keluarga' => $keluarga->count(),
                'jumlah_pemilih' => $baris->count(),
                'keluarga' => $keluarga,
            ],
        ]);
    }

    /** Daftar RW/RT yang tersedia untuk pengguna ini — pengisi pilihan filter. */
    public function wilayah(Request $request)
    {
        $request->validate(['tps_id' => 'nullable|integer|exists:tps,id']);

        $tpsId = $this->lingkupTps($request);

        $query = fn () => Dpt::query()
            ->tahapan(Dpt::TAHAPAN_AKTIF)
            ->when($tpsId, fn ($q) => $q->where('tps_id', $tpsId));

        $rw = $query()->whereNotNull('rw')->where('rw', '!=', '')
            ->distinct()->orderBy('rw')->pluck('rw');

        $rt = $query()->whereNotNull('rt')->where('rt', '!=', '')
            ->select('rw', 'rt')->distinct()->orderBy('rw')->orderBy('rt')->get();

        return response()->json([
            'status' => 'success',
            'data' => [
                'rw' => $rw,
                'rt_per_rw' => $rt->groupBy('rw')->map(fn ($g) => $g->pluck('rt')->values()),
            ],
        ]);
    }

    /**
     * Query dasar dengan penguncian wilayah. Pantarlih hanya boleh melihat
     * TPS-nya sendiri; pembatasan dipasang di server, bukan disembunyikan di
     * antarmuka, karena parameter permintaan bisa diubah siapa saja.
     */
    private function dasar(Request $request)
    {
        $query = Dpt::query()->tahapan(Dpt::TAHAPAN_AKTIF);

        $tpsId = $this->lingkupTps($request);
        if ($tpsId) {
            $query->where('tps_id', $tpsId);
        }

        if ($request->filled('rw')) {
            $query->where('rw', $request->rw);
        }

        if ($request->filled('rt')) {
            $query->where('rt', $request->rt);
        }

        if ($request->filled('search')) {
            $cari = $request->search;

            // Pencarian mengenai orang, tetapi yang ditampilkan keluarga: satu
            // nama yang cocok harus memunculkan seisi rumahnya.
            $query->whereIn('nkk', Dpt::query()
                ->when($tpsId, fn ($q) => $q->where('tps_id', $tpsId))
                ->where(function ($q) use ($cari) {
                    $q->where('nama', 'like', "%{$cari}%")
                        ->orWhere('nik', 'like', "%{$cari}%")
                        ->orWhere('nkk', 'like', "%{$cari}%")
                        ->orWhere('alamat', 'like', "%{$cari}%");
                })
                ->select('nkk'));
        }

        return $query;
    }

    private function lingkupTps(Request $request): ?int
    {
        $pengguna = $request->user();

        if ($pengguna?->role === 'pantarlih') {
            return $pengguna->tps_id;
        }

        return $request->filled('tps_id') ? (int) $request->tps_id : null;
    }

    private function ringkasan(Request $request): array
    {
        $dasar = $this->dasar($request);

        return [
            'jumlah_pemilih' => (clone $dasar)->count(),
            'jumlah_keluarga' => (clone $dasar)->distinct()->count('nkk'),
            'nkk_sintetis' => (clone $dasar)->where('nkk_sintetis', true)->count(),
            'nik_sintetis' => (clone $dasar)->where('nik_sintetis', true)->count(),
        ];
    }
}
