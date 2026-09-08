<?php

namespace Tests\Feature;

use App\Models\Dpt;
use App\Models\Tps;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * TMS sebagai penghapusan lunak.
 *
 * Mencoret seseorang kini benar-benar mengeluarkannya dari tabel, bukan sekadar
 * memberinya label. Yang diuji di sini adalah sisi-sisi yang justru gampang
 * rusak karena perubahan itu: NIK yang tetap tertahan, impor yang berjalan
 * dalam satu transaksi, dan generator `id_pemilih` yang mengisi QR undangan.
 * Ketiganya gagal tanpa suara — tidak ada galat, hanya angka yang salah.
 */
class TmsSoftDeleteTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): void
    {
        Sanctum::actingAs(User::create([
            'username' => 'admin-uji',
            'password' => bcrypt('rahasia-uji'),
            'role' => 'sekretariat',
            'is_admin' => true,
        ]));
    }

    private function buatPemilih(int $i, string $tahapan = 'dps', array $tambahan = []): Dpt
    {
        return Dpt::create(array_merge([
            'nik' => str_pad((string) $i, 16, '0', STR_PAD_LEFT),
            'nama' => 'PEMILIH ' . $i,
            'tps_id' => 1,
            'id_pemilih' => sprintf('USH-GTN-026%04d', $i),
            'no_urut' => $i,
            'tahapan' => $tahapan,
            'umur' => 30,
            'jenis_kelamin' => 'LAKI-LAKI',
        ], $tambahan));
    }

    protected function setUp(): void
    {
        parent::setUp();
        Tps::create(['id' => 1, 'nama' => 'TPS 01', 'wilayah' => 'Gentan']);
    }

    public function test_menandai_tms_menghapus_lunak_dan_membatalkannya_memulihkan(): void
    {
        $this->admin();
        $this->buatPemilih(1);

        $nik = str_pad('1', 16, '0', STR_PAD_LEFT);

        $this->postJson("/api/tahapan/{$nik}/tms", ['alasan' => '4 : Meninggal'])
            ->assertOk();

        // Hilang dari kueri biasa, tapi barisnya masih ada beserta alasannya.
        $this->assertNull(Dpt::find($nik));
        $tercoret = Dpt::withTrashed()->find($nik);
        $this->assertNotNull($tercoret->deleted_at);
        $this->assertSame('tms', $tercoret->tahapan);
        $this->assertSame('4 : Meninggal', $tercoret->tms_alasan);
        // Tahapan asalnya dicatat supaya pembatalan tahu tujuannya.
        $this->assertSame('dps', $tercoret->tahapan_sebelum_tms);

        $this->deleteJson("/api/tahapan/{$nik}/tms")->assertOk();

        $pulih = Dpt::find($nik);
        $this->assertNotNull($pulih, 'Pembatalan TMS harus mengembalikan barisnya ke daftar.');
        $this->assertNull($pulih->deleted_at);
        $this->assertSame('dps', $pulih->tahapan);
    }

    public function test_cek_nik_tetap_menemukan_nik_yang_sudah_dicoret(): void
    {
        $this->admin();
        $this->buatPemilih(1)->delete();

        $nik = str_pad('1', 16, '0', STR_PAD_LEFT);

        // NIK adalah kunci primer: baris tercoret tetap menahannya. Kalau
        // pemeriksa ini menjawab "belum terdaftar", petugas mengisi formulir
        // sampai selesai lalu ditolak `unique` saat menyimpan.
        $this->getJson("/api/dpt/cek-nik?nik={$nik}")
            ->assertOk()
            ->assertJsonPath('data.terdaftar', true)
            ->assertJsonPath('data.dicoret', true);
    }

    public function test_impor_tidak_batal_total_karena_nik_yang_sudah_dicoret(): void
    {
        $this->admin();
        $this->buatPemilih(1)->delete();

        // Satu NIK bentrok dengan baris tercoret, satu lagi sah. Sebelum
        // diperbaiki, yang bentrok lolos pemeriksaan lalu melempar duplikat
        // kunci primer — dan karena impor satu transaksi, baris kedua ikut
        // hilang tanpa ada yang menyadarinya.
        $csv = "nik,nama,tps,rw,rt\n"
            . str_pad('1', 16, '0', STR_PAD_LEFT) . ",PEMILIH BENTROK,TPS 01,001,001\n"
            . str_pad('2', 16, '0', STR_PAD_LEFT) . ",PEMILIH BARU,TPS 01,001,001\n";

        $berkas = \Illuminate\Http\Testing\File::createWithContent('impor.csv', $csv);

        $res = $this->post('/api/dpt/import', ['file' => $berkas], ['Accept' => 'application/json']);
        $res->assertOk();

        // Yang sah tetap masuk; yang bentrok dilaporkan sebagai galat baris.
        $this->assertNotNull(
            Dpt::find(str_pad('2', 16, '0', STR_PAD_LEFT)),
            'Baris yang sah harus tetap terimpor walau ada baris lain yang bentrok.'
        );
        $this->assertNotEmpty($res->json('errors'));
    }

    public function test_id_pemilih_tidak_diulang_setelah_pemegang_nomor_tertinggi_dicoret(): void
    {
        $this->admin();
        // Nomor tertinggi dipegang baris yang kemudian dicoret.
        $this->buatPemilih(7)->delete();

        $this->postJson('/api/dpt', [
            'nik' => str_pad('9', 16, '0', STR_PAD_LEFT),
            'nama' => 'PEMILIH BARU',
            'tps_id' => 1,
            'rt' => '001',
            'rw' => '001',
            'umur' => 30,
            'jenis_kelamin' => 'LAKI-LAKI',
        ])->assertCreated();

        $baru = Dpt::find(str_pad('9', 16, '0', STR_PAD_LEFT));

        // Generator harus melewati USH-GTN-0260007 yang masih dipegang baris
        // tercoret. `id_pemilih` inilah isi QR pada undangan; mengulanginya
        // membuat dua orang berbagi satu kode.
        $this->assertSame('USH-GTN-0260008', $baru->id_pemilih);
        $this->assertNotSame(
            Dpt::withTrashed()->where('no_urut', 7)->first()->id_pemilih,
            $baru->id_pemilih
        );
    }

    /**
     * Ringkasan tahapan memakai `withTrashed()`, dan itu hanya benar selama
     * satu aturan dipegang: baris terhapus lunak selalu bertahapan `tms`.
     * `tandaiTms()` menetapkan keduanya sekaligus, dan tombol Hapus memakai
     * `forceDelete()` supaya tidak pernah membuat keadaan di antaranya. Yang
     * diuji di sini lewat jalur sungguhannya, bukan dengan `delete()` langsung.
     */
    public function test_pemilih_tercoret_tidak_ikut_terhitung_di_ringkasan_tahapan(): void
    {
        $this->admin();
        $this->buatPemilih(1, 'dps');
        $this->buatPemilih(2, 'dps');

        $nik = str_pad('2', 16, '0', STR_PAD_LEFT);
        $this->postJson("/api/tahapan/{$nik}/tms", ['alasan' => '4 : Meninggal'])->assertOk();

        $data = $this->getJson('/api/tahapan/ringkasan')->assertOk()->json('data');

        $this->assertSame(1, $data['dps'], 'Yang dicoret tidak boleh terhitung sebagai DPS.');
        $this->assertSame(1, $data['tms'], 'Tapi ia harus tetap terhitung sebagai TMS.');
    }

    /** Aturan yang menopang seluruh hitungan di atas, ditulis sebagai uji. */
    public function test_baris_terhapus_selalu_bertahapan_tms(): void
    {
        $this->admin();
        $this->buatPemilih(1, 'dps');
        $nik = str_pad('1', 16, '0', STR_PAD_LEFT);

        $this->postJson("/api/tahapan/{$nik}/tms", ['alasan' => '4 : Meninggal'])->assertOk();

        $this->assertSame(
            0,
            Dpt::onlyTrashed()->where('tahapan', '!=', 'tms')->count(),
            'Tidak boleh ada baris terhapus yang tahapannya bukan tms.'
        );

        // Tombol Hapus menghapus permanen, bukan mencoret: kalau ia memakai
        // penghapusan lunak, barisnya akan muncul di tab TMS tanpa alasan.
        $this->buatPemilih(2, 'dps');
        $nik2 = str_pad('2', 16, '0', STR_PAD_LEFT);
        $this->deleteJson("/api/dpt/{$nik2}")->assertOk();

        $this->assertNull(Dpt::withTrashed()->find($nik2), 'Hapus harus permanen.');
    }
}
