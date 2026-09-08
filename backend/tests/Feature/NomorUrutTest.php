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
                'rw' => '001',
                'rt' => '001',
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

        // Pemilih hasil pendataan manual di sini belum punya RW/RT maupun nomor
        // bawaan. Keduanya menaruhnya di belakang: data yang belum lengkap
        // mengekor, bukan memimpin daftar. Antar-mereka diurutkan `id_pemilih`.
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
     * Wilayah menentukan urutan, bukan `no_urut`.
     *
     * Inti perbaikannya. `no_urut` merekam urutan berkas DPS saat diimpor;
     * begitu RT/RW seseorang diperbaiki, nomornya tidak ikut berpindah. Di
     * produksi itu membuat warga RW 010 duduk di nomor 2 di antara warga
     * RW 001 — daftar yang tidak bisa dicocokkan dengan lembar per RW.
     */
    public function test_urutan_mengikuti_rw_lalu_rt_bukan_no_urut(): void
    {
        Tps::create(['id' => 1, 'nama' => 'TPS 01', 'wilayah' => 'Gentan']);

        // Sengaja dibuat bertentangan: yang ber-no_urut kecil justru berada di
        // RW besar, persis seperti data yang RT/RW-nya sudah diperbaiki.
        $orang = [
            ['no_urut' => 2, 'rw' => '010', 'rt' => '001'],
            ['no_urut' => 11, 'rw' => '008', 'rt' => '002'],
            ['no_urut' => 900, 'rw' => '001', 'rt' => '002'],
            ['no_urut' => 901, 'rw' => '001', 'rt' => '001'],
            ['no_urut' => 902, 'rw' => '008', 'rt' => '001'],
        ];

        foreach ($orang as $i => $d) {
            Dpt::create([
                'nik' => str_pad((string) ($i + 1), 16, '0', STR_PAD_LEFT),
                'nama' => 'PEMILIH ' . ($i + 1),
                'tps_id' => 1,
                'rw' => $d['rw'],
                'rt' => $d['rt'],
                'id_pemilih' => sprintf('USH-GTN-%07d', $i + 1),
                'no_urut' => $d['no_urut'],
                'tahapan' => 'dps',
                'jenis_kelamin' => 'LAKI-LAKI',
            ]);
        }

        $nomor = fn (int $noUrut) => Dpt::nomorUrut(Dpt::where('no_urut', $noUrut)->firstOrFail());

        // RW 001 lebih dulu, di dalamnya RT 001 sebelum RT 002.
        $this->assertSame(1, $nomor(901), 'RW 001 / RT 001 harus nomor 1.');
        $this->assertSame(2, $nomor(900), 'RW 001 / RT 002 menyusul.');
        // Lalu RW 008, RT 001 sebelum RT 002.
        $this->assertSame(3, $nomor(902));
        $this->assertSame(4, $nomor(11));
        // RW 010 terakhir, walau `no_urut`-nya paling kecil.
        $this->assertSame(5, $nomor(2), 'no_urut terkecil tidak lagi berarti nomor 1.');
    }

    public function test_rt_kosong_ditaruh_di_belakang_rt_bernomor_dalam_rw_nya(): void
    {
        Tps::create(['id' => 1, 'nama' => 'TPS 01', 'wilayah' => 'Gentan']);

        $orang = [
            ['no_urut' => 1, 'rw' => '003', 'rt' => ''],
            ['no_urut' => 2, 'rw' => '003', 'rt' => '002'],
            ['no_urut' => 3, 'rw' => '004', 'rt' => '001'],
        ];

        foreach ($orang as $i => $d) {
            Dpt::create([
                'nik' => str_pad((string) ($i + 1), 16, '0', STR_PAD_LEFT),
                'nama' => 'PEMILIH ' . ($i + 1),
                'tps_id' => 1,
                'rw' => $d['rw'],
                'rt' => $d['rt'],
                'id_pemilih' => sprintf('USH-GTN-%07d', $i + 1),
                'no_urut' => $d['no_urut'],
                'tahapan' => 'dps',
                'jenis_kelamin' => 'LAKI-LAKI',
            ]);
        }

        $nomor = fn (int $noUrut) => Dpt::nomorUrut(Dpt::where('no_urut', $noUrut)->firstOrFail());

        // RT bernomor lebih dulu; yang kosong menyusul, tapi tetap di RW-nya
        // sendiri — bukan terlempar ke akhir daftar desa.
        $this->assertSame(1, $nomor(2), 'RW 003 / RT 002 lebih dulu.');
        $this->assertSame(2, $nomor(1), 'RW 003 / RT kosong menyusul di belakangnya.');
        $this->assertSame(3, $nomor(3), 'RW 004 tetap sesudah seluruh RW 003.');
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
