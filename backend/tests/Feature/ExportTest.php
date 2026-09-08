<?php

namespace Tests\Feature;

use App\Models\Dpt;
use App\Models\Tps;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ExportTest extends TestCase
{
    use RefreshDatabase;

    private function siapkanData(): void
    {
        Tps::create(['id' => 1, 'nama' => 'TPS 01', 'wilayah' => 'Gentan']);
        Tps::create(['id' => 2, 'nama' => 'TPS 02', 'wilayah' => 'Gentan']);

        $pemilih = [
            ['tps_id' => 1, 'rw' => '001', 'tahapan' => 'dp4', 'nama' => 'PEMILIH DP4', 'keterangan' => null],
            ['tps_id' => 1, 'rw' => '001', 'tahapan' => 'dps', 'nama' => 'PEMILIH DPS', 'keterangan' => '1 : Terverifikasi/Valid'],
            ['tps_id' => 1, 'rw' => '002', 'tahapan' => 'dptb', 'nama' => 'PEMILIH DPTB', 'keterangan' => null],
            ['tps_id' => 2, 'rw' => '002', 'tahapan' => 'dpt', 'nama' => 'PEMILIH DPT', 'keterangan' => null],
            ['tps_id' => 2, 'rw' => '003', 'tahapan' => 'dpk', 'nama' => 'PEMILIH DPK', 'keterangan' => null],
            ['tps_id' => 2, 'rw' => '003', 'tahapan' => 'tms', 'nama' => 'PEMILIH TMS 1', 'keterangan' => '4 : Meninggal'],
            ['tps_id' => 2, 'rw' => '003', 'tahapan' => 'tms', 'nama' => 'PEMILIH TMS 2', 'keterangan' => '5 : Ganda'],
        ];

        foreach ($pemilih as $i => $data) {
            $baris = Dpt::create([
                'nik' => str_pad((string) ($i + 1), 16, '0', STR_PAD_LEFT),
                'nama' => $data['nama'],
                'tps_id' => $data['tps_id'],
                'rw' => $data['rw'],
                'rt' => '001',
                'id_pemilih' => sprintf('USH-GTN-%07d', $i + 1),
                'no_urut' => $i + 1,
                'tahapan' => $data['tahapan'],
                'keterangan' => $data['keterangan'],
                'jenis_kelamin' => 'LAKI-LAKI',
            ]);

            // TMS berarti terhapus lunak — itulah keadaan yang dibuat
            // `TahapanController::tandaiTms()`. Tanpa ini, ekspornya tidak
            // benar-benar menguji bahwa baris tercoret tetap bisa diambil.
            if ($data['tahapan'] === 'tms') {
                $baris->delete();
            }
        }
    }

    public function test_ekspor_semua_tanpa_tahapan(): void
    {
        $this->siapkanData();
        Sanctum::actingAs(User::create([
            'username' => 'sekre',
            'password' => bcrypt('rahasia'),
            'role' => 'sekretariat',
        ]));

        $res = $this->getJson('/api/export/pemilih?format=json&lingkup=all');
        $res->assertOk()
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.jumlah', 7);
    }

    public function test_ekspor_per_tahapan(): void
    {
        $this->siapkanData();
        Sanctum::actingAs(User::create([
            'username' => 'sekre',
            'password' => bcrypt('rahasia'),
            'role' => 'sekretariat',
        ]));

        $tahapanList = ['dp4' => 1, 'dps' => 1, 'dptb' => 1, 'dpt' => 1, 'dpk' => 1, 'tms' => 2];

        foreach ($tahapanList as $tahapan => $expectedCount) {
            $res = $this->getJson("/api/export/pemilih?format=json&lingkup=all&tahapan={$tahapan}");
            $res->assertOk()
                ->assertJsonPath('status', 'success')
                ->assertJsonPath('data.jumlah', $expectedCount);

            $baris = $res->json('data.baris');
            foreach ($baris as $b) {
                $this->assertSame($tahapan, $b['tahapan']);
            }
        }
    }

    public function test_ekspor_tms_dengan_keterangan_alasan(): void
    {
        $this->siapkanData();
        Sanctum::actingAs(User::create([
            'username' => 'sekre',
            'password' => bcrypt('rahasia'),
            'role' => 'sekretariat',
        ]));

        $res = $this->getJson('/api/export/pemilih?format=json&lingkup=all&tahapan=tms&keterangan=' . urlencode('4 : Meninggal'));
        $res->assertOk()
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.jumlah', 1);

        $this->assertSame('PEMILIH TMS 1', $res->json('data.baris.0.nama'));
    }

    public function test_ekspor_per_tps_dan_tahapan(): void
    {
        $this->siapkanData();
        Sanctum::actingAs(User::create([
            'username' => 'sekre',
            'password' => bcrypt('rahasia'),
            'role' => 'sekretariat',
        ]));

        // TPS 1 memiliki DP4, DPS, DPTb. Tidak punya DPT.
        $res = $this->getJson('/api/export/pemilih?format=json&lingkup=tps&tps_id=1&tahapan=dps');
        $res->assertOk()
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.jumlah', 1);

        $resEmpty = $this->getJson('/api/export/pemilih?format=json&lingkup=tps&tps_id=1&tahapan=dpt');
        $resEmpty->assertOk()
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.jumlah', 0);
    }

    public function test_ekspor_pantarlih_terkunci_ke_rw_dan_tahapan(): void
    {
        $this->siapkanData();
        Sanctum::actingAs(User::create([
            'username' => 'pantarlih_rw1',
            'password' => bcrypt('rahasia'),
            'role' => 'pantarlih',
            'rw' => '001',
        ]));

        // RW 001 punya 1 DP4 dan 1 DPS. Jika minta DPS:
        $res = $this->getJson('/api/export/pemilih?format=json&tahapan=dps');
        $res->assertOk()
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.jumlah', 1);
        $this->assertSame('PEMILIH DPS', $res->json('data.baris.0.nama'));

        // Jika minta DPT (tidak ada di RW 001):
        $resDpt = $this->getJson('/api/export/pemilih?format=json&tahapan=dpt');
        $resDpt->assertOk()
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.jumlah', 0);
    }
}
