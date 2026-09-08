<?php

namespace Tests\Feature;

use App\Models\Dpt;
use App\Models\Tps;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Nomor urut yang bergerak sendiri.
 *
 * Satu janji yang diuji di sini: nomor urut adalah posisi seseorang di daftar
 * hari ini, bukan angka yang menempel padanya. Mencoret satu orang membuat
 * semua yang di belakangnya naik satu, membatalkan pencoretan mengembalikannya,
 * dan tidak ada penomoran ulang yang harus dijalankan siapa pun.
 *
 * Ini penting karena angka itu tercetak di undangan. Kalau perhitungannya bisa
 * berbeda antara panel dan pencetakan, warga memegang kertas yang tidak cocok
 * dengan daftar mana pun.
 */
class NomorUrutTest extends TestCase
{
    use RefreshDatabase;

    private function siapkanPemilih(): void
    {
        Tps::create(['id' => 1, 'nama' => 'TPS 01', 'wilayah' => 'Gentan']);

        foreach (range(1, 6) as $i) {
            Dpt::create([
                'nik' => str_pad((string) $i, 16, '0', STR_PAD_LEFT),
                'nama' => 'PEMILIH ' . $i,
                'tps_id' => 1,
                'id_pemilih' => sprintf('USH-GTN-%07d', $i),
                'no_urut' => $i,
                'tahapan' => 'dpt',
                'jenis_kelamin' => $i % 2 === 0 ? 'PEREMPUAN' : 'LAKI-LAKI',
            ]);
        }
    }

    private function nomor(int $noUrut): ?int
    {
        return Dpt::nomorUrut(Dpt::withTrashed()->where('no_urut', $noUrut)->firstOrFail());
    }

    /** Seluruh nomor yang sedang berlaku, terurut. */
    private function semuaNomor(): array
    {
        $nomor = array_values(Dpt::petaNomorUrut());
        sort($nomor);

        return $nomor;
    }

    public function test_tanpa_pencoretan_nomor_sama_dengan_no_urut(): void
    {
        $this->siapkanPemilih();

        $this->assertSame([1, 2, 3, 4, 5, 6], $this->semuaNomor());
        $this->assertSame(3, $this->nomor(3));
        $this->assertSame(6, $this->nomor(6));
    }

    public function test_mencoret_satu_orang_menaikkan_yang_di_belakangnya(): void
    {
        $this->siapkanPemilih();

        Dpt::where('no_urut', 3)->firstOrFail()->delete();

        // Yang di depan tidak bergerak.
        $this->assertSame(1, $this->nomor(1));
        $this->assertSame(2, $this->nomor(2));
        // Yang di belakang naik satu — tanpa ada yang dijalankan.
        $this->assertSame(3, $this->nomor(4));
        $this->assertSame(4, $this->nomor(5));
        $this->assertSame(5, $this->nomor(6));

        // Tidak ada lubang, dan nomor terakhir sama dengan jumlah pemilih.
        $this->assertSame([1, 2, 3, 4, 5], $this->semuaNomor());
        $this->assertSame(5, Dpt::count());
    }

    public function test_pemilih_tercoret_tidak_punya_nomor(): void
    {
        $this->siapkanPemilih();

        $dicoret = Dpt::where('no_urut', 3)->firstOrFail();
        $dicoret->delete();

        $this->assertNull(Dpt::nomorUrut($dicoret->fresh()));
    }

    public function test_membatalkan_pencoretan_mengembalikan_nomor_semula(): void
    {
        $this->siapkanPemilih();

        $dicoret = Dpt::where('no_urut', 3)->firstOrFail();
        $dicoret->delete();
        $this->assertSame(3, $this->nomor(4));

        Dpt::withTrashed()->where('no_urut', 3)->firstOrFail()->restore();

        $this->assertSame(3, $this->nomor(3));
        $this->assertSame(4, $this->nomor(4));
        $this->assertSame([1, 2, 3, 4, 5, 6], $this->semuaNomor());
    }

    public function test_pemilih_tanpa_no_urut_menyusul_di_belakang(): void
    {
        $this->siapkanPemilih();

        // Pemilih hasil pendataan manual belum punya nomor bawaan; ia berada di
        // belakang seluruh yang bernomor, diurutkan menurut `id_pemilih`.
        foreach (['USH-GTN-0000009', 'USH-GTN-0000008'] as $i => $id) {
            Dpt::create([
                'nik' => str_pad((string) (100 + $i), 16, '0', STR_PAD_LEFT),
                'nama' => 'TAMBAHAN ' . $i,
                'tps_id' => 1,
                'id_pemilih' => $id,
                'no_urut' => null,
                'tahapan' => 'dptb',
                'jenis_kelamin' => 'PEREMPUAN',
            ]);
        }

        $manual = fn (string $id) => Dpt::nomorUrut(Dpt::where('id_pemilih', $id)->firstOrFail());

        $this->assertSame(7, $manual('USH-GTN-0000008'));
        $this->assertSame(8, $manual('USH-GTN-0000009'));
        // Yang bernomor bawaan tidak tergeser oleh kedatangan mereka.
        $this->assertSame(6, $this->nomor(6));
    }

    /**
     * Dua jalur perhitungan harus sepakat, baris demi baris.
     *
     * `nomorUrut()` dipakai halaman Cek Pemilih (paling banyak lima orang),
     * `petaNomorUrut()` dipakai pencetakan undangan satu TPS sekaligus. Kalau
     * keduanya berbeda satu angka saja, layar dan kertas tidak lagi cocok — dan
     * itu justru tidak akan kelihatan sampai ada warga yang mengeluh.
     */
    public function test_kedua_jalur_perhitungan_sepakat(): void
    {
        $this->siapkanPemilih();
        Dpt::where('no_urut', 2)->firstOrFail()->delete();
        Dpt::create([
            'nik' => str_pad('200', 16, '0', STR_PAD_LEFT),
            'nama' => 'TANPA NOMOR',
            'tps_id' => 1,
            'id_pemilih' => 'USH-GTN-0000099',
            'no_urut' => null,
            'tahapan' => 'dptb',
            'jenis_kelamin' => 'LAKI-LAKI',
        ]);

        $peta = Dpt::petaNomorUrut();
        $this->assertCount(6, $peta);

        foreach (Dpt::all() as $pemilih) {
            $this->assertSame(
                $peta[$pemilih->nik],
                Dpt::nomorUrut($pemilih),
                "Nomor {$pemilih->nama} berbeda antara peta dan hitungan satuan."
            );
        }
    }

    public function test_endpoint_publik_dan_undangan_memakai_nomor_yang_sama(): void
    {
        $this->siapkanPemilih();
        Dpt::where('no_urut', 2)->firstOrFail()->delete();

        // no_urut 4 kini menempati posisi ketiga.
        $this->getJson('/api/pemilih/cek?nik=' . str_pad('4', 16, '0', STR_PAD_LEFT))
            ->assertOk()
            ->assertJsonPath('data.0.no_urut_tampil', 3)
            // `no_urut` bawaan tetap dikirim apa adanya untuk penelusuran.
            ->assertJsonPath('data.0.no_urut', 4);

        // Pemilih tercoret tidak boleh muncul di pencarian publik sama sekali.
        $this->getJson('/api/pemilih/cek?nik=' . str_pad('2', 16, '0', STR_PAD_LEFT))
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }
}
