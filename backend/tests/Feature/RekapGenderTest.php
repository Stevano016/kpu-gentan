<?php

namespace Tests\Feature;

use App\Models\Dpt;
use App\Models\Tps;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Rekap L/P pada dashboard.
 *
 * Angkanya dipakai menyusun Berita Acara Penetapan, jadi yang diuji bukan
 * hanya "ada kuncinya", tapi bahwa jumlahnya benar per TPS maupun sedesa —
 * termasuk bahwa `n` tetap melaporkan seluruh baris walau ada pemilih yang
 * jenis kelaminnya belum tercatat, supaya panel bisa mengatakannya.
 */
class RekapGenderTest extends TestCase
{
    use RefreshDatabase;

    private function siapkanData(): void
    {
        Tps::create(['id' => 1, 'nama' => 'TPS 01', 'wilayah' => 'Gentan']);
        Tps::create(['id' => 2, 'nama' => 'TPS 02', 'wilayah' => 'Gentan']);

        // TPS 1: 2 L + 1 P sudah DPT, yang hadir 1 L + 1 P. TPS 2: 1 L + 2 P
        // masih DPS dengan 1 P hadir, ditambah satu pemilih DPS tanpa jenis
        // kelamin sama sekali yang juga hadir — dialah yang membuat `nh` lebih
        // besar dari `lh + ph`.
        $orang = [
            [1, 'dpt', 'LAKI-LAKI', true],
            [1, 'dpt', 'LAKI-LAKI', false],
            [1, 'dpt', 'PEREMPUAN', true],
            [2, 'dps', 'LAKI-LAKI', false],
            [2, 'dps', 'PEREMPUAN', true],
            [2, 'dps', 'PEREMPUAN', false],
            [2, 'dps', null, true],
        ];

        foreach ($orang as $i => [$tpsId, $tahapan, $jk, $hadir]) {
            Dpt::create([
                'nik' => str_pad((string) ($i + 1), 16, '0', STR_PAD_LEFT),
                'nama' => 'PEMILIH ' . ($i + 1),
                'tps_id' => $tpsId,
                'id_pemilih' => sprintf('USH-GTN-%07d', $i + 1),
                'no_urut' => $i + 1,
                'tahapan' => $tahapan,
                'jenis_kelamin' => $jk,
                'status_hadir' => $hadir,
            ]);
        }

        Sanctum::actingAs(User::create([
            'username' => 'sekre',
            'password' => bcrypt('rahasia-uji'),
            'role' => 'sekretariat',
        ]));
    }

    public function test_ringkasan_membawa_rekap_sedesa_dan_per_tps(): void
    {
        $this->siapkanData();

        $data = $this->getJson('/api/dashboard/summary')->assertOk()->json('data');

        $this->assertSame(
            ['l' => 2, 'p' => 1, 'n' => 3, 'lh' => 1, 'ph' => 1, 'nh' => 2],
            $data['stats']['gender']['dpt']
        );
        // Empat baris DPS, tapi hanya tiga yang punya jenis kelamin. Yang hadir
        // dua orang, satu di antaranya tanpa jenis kelamin: `nh` 2, `lh + ph` 1.
        $this->assertSame(
            ['l' => 1, 'p' => 2, 'n' => 4, 'lh' => 0, 'ph' => 1, 'nh' => 2],
            $data['stats']['gender']['dps']
        );
        // Tahapan yang tidak berpenghuni tetap ada, dengan nol.
        $this->assertSame(
            ['l' => 0, 'p' => 0, 'n' => 0, 'lh' => 0, 'ph' => 0, 'nh' => 0],
            $data['stats']['gender']['dpk']
        );

        $perTps = collect($data['tps_list'])->keyBy('nama');
        $this->assertSame(
            ['l' => 2, 'p' => 1, 'n' => 3, 'lh' => 1, 'ph' => 1, 'nh' => 2],
            $perTps['TPS 01']['gender']['dpt']
        );
        $this->assertSame(
            ['l' => 0, 'p' => 0, 'n' => 0, 'lh' => 0, 'ph' => 0, 'nh' => 0],
            $perTps['TPS 01']['gender']['dps']
        );
        $this->assertSame(
            ['l' => 1, 'p' => 2, 'n' => 4, 'lh' => 0, 'ph' => 1, 'nh' => 2],
            $perTps['TPS 02']['gender']['dps']
        );
    }

    public function test_detail_tps_membawa_rekap_tps_itu_saja(): void
    {
        $this->siapkanData();

        $gender = $this->getJson('/api/dashboard/tps/2')->assertOk()->json('data.stats.gender');

        // Jalur ini menghitung dari koleksi pemilih di memori, bukan GROUP BY,
        // jadi angkanya harus sama persis dengan jalur ringkasan di atas.
        $this->assertSame(
            ['l' => 1, 'p' => 2, 'n' => 4, 'lh' => 0, 'ph' => 1, 'nh' => 2],
            $gender['dps']
        );
        // Pemilih TPS 1 tidak boleh ikut terhitung di sini.
        $this->assertSame(
            ['l' => 0, 'p' => 0, 'n' => 0, 'lh' => 0, 'ph' => 0, 'nh' => 0],
            $gender['dpt']
        );
    }
}
