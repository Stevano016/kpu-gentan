<?php

namespace Tests\Feature;

use App\Models\Dpt;
use App\Models\Tps;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Penomoran ulang DPT.
 *
 * Yang diuji di sini satu janji saja, tapi janji itulah alasan seluruh
 * fiturnya ada: nomor DPT yang ditampilkan panel publik tidak boleh berlubang.
 * Pemilih yang gugur membawa `no_urut` bawaannya keluar dari daftar, dan kalau
 * nomor itu dipakai apa adanya, DPT dengan 4 orang bisa berakhir bernomor
 * terakhir 6 — angka yang tidak cocok dengan apa pun yang dicetak.
 */
class NomorUrutDptTest extends TestCase
{
    use RefreshDatabase;

    /** Satu TPS beserta pemilihnya; `no_urut` sengaja dibuat berlubang. */
    private function siapkanPemilih(): void
    {
        Tps::create(['id' => 1, 'nama' => 'TPS 01', 'wilayah' => 'Gentan']);

        // no_urut 2 dan 4 gugur, jadi DPT-nya berisi 1, 3, 5, 6.
        $orang = [
            ['no_urut' => 1, 'tahapan' => 'dpt'],
            ['no_urut' => 2, 'tahapan' => 'tms'],
            ['no_urut' => 3, 'tahapan' => 'dpt'],
            ['no_urut' => 4, 'tahapan' => 'dps'],
            ['no_urut' => 5, 'tahapan' => 'dpk'],
            ['no_urut' => 6, 'tahapan' => 'dpt'],
        ];

        foreach ($orang as $i => $data) {
            Dpt::create([
                'nik' => str_pad((string) ($i + 1), 16, '0', STR_PAD_LEFT),
                'nama' => 'PEMILIH ' . ($i + 1),
                'tps_id' => 1,
                'id_pemilih' => sprintf('USH-GTN-%07d', $i + 1),
                'no_urut' => $data['no_urut'],
                'tahapan' => $data['tahapan'],
                'jenis_kelamin' => $i % 2 === 0 ? 'LAKI-LAKI' : 'PEREMPUAN',
            ]);
        }
    }

    private function nomor(int $noUrut): ?int
    {
        return Dpt::nomorUrutDpt(Dpt::where('no_urut', $noUrut)->firstOrFail());
    }

    public function test_dpt_dinomori_ulang_tanpa_lubang(): void
    {
        $this->siapkanPemilih();

        $this->assertSame(1, $this->nomor(1));
        $this->assertSame(2, $this->nomor(3));
        // DPK tetap ikut dihitung: ia bagian dari daftar tetap.
        $this->assertSame(3, $this->nomor(5));
        // Nomor terakhir sama dengan jumlah DPT — inilah bukti tak ada lubang.
        $this->assertSame(4, $this->nomor(6));
        $this->assertSame(4, Dpt::whereIn('tahapan', Dpt::TAHAPAN_BERHAK)->count());
    }

    public function test_pemilih_di_luar_dpt_tidak_bernomor_dpt(): void
    {
        $this->siapkanPemilih();

        // Selama masih DPS, nomor DPT-nya belum ada — dan itulah yang membuat
        // kartu publik menampilkan nomor DPS-nya, bukan nomor DPT.
        $this->assertNull($this->nomor(4));
        $this->assertNull($this->nomor(2));
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
                'tahapan' => 'dpt',
                'jenis_kelamin' => 'PEREMPUAN',
            ]);
        }

        $manual = fn (string $id) => Dpt::nomorUrutDpt(Dpt::where('id_pemilih', $id)->firstOrFail());

        $this->assertSame(5, $manual('USH-GTN-0000008'));
        $this->assertSame(6, $manual('USH-GTN-0000009'));
        // Yang bernomor bawaan tidak tergeser oleh kedatangan mereka.
        $this->assertSame(4, $this->nomor(6));
    }

    public function test_endpoint_publik_mengirim_kedua_nomor(): void
    {
        $this->siapkanPemilih();

        // Pemilih DPT: nomor DPS-nya 6, nomor DPT-nya 4.
        $this->getJson('/api/pemilih/cek?nik=' . str_pad('6', 16, '0', STR_PAD_LEFT))
            ->assertOk()
            ->assertJsonPath('data.0.no_urut_dps', 6)
            ->assertJsonPath('data.0.no_urut_dpt', 4)
            // `no_urut` tetap apa adanya: undangan C6 mencetak angka ini.
            ->assertJsonPath('data.0.no_urut', 6);

        // Pemilih DPS: hanya nomor DPS-nya yang ada.
        $this->getJson('/api/pemilih/cek?nik=' . str_pad('4', 16, '0', STR_PAD_LEFT))
            ->assertOk()
            ->assertJsonPath('data.0.no_urut_dps', 4)
            ->assertJsonPath('data.0.no_urut_dpt', null);
    }
}
