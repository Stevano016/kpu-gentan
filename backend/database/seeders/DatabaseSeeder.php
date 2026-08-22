<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Tps;
use App\Models\Dpt;
use App\Models\Paslon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Create Secretariat Admin (akses penuh)
        User::create([
            'username' => 'admin',
            'password' => Hash::make('password123'),
            'role' => 'sekretariat',
            'sekretariat_role' => 'admin',
            'tps_id' => null,
        ]);

        // 1b. Create Secretariat Viewer (hanya lihat, tanpa CRUD)
        User::create([
            'username' => 'pengawas',
            'password' => Hash::make('password123'),
            'role' => 'sekretariat',
            'sekretariat_role' => 'viewer',
            'tps_id' => null,
        ]);

        // 1c. Create Monitor (hanya lihat dashboard dan quick count saja)
        User::create([
            'username' => 'monitor',
            'password' => Hash::make('password123'),
            'role' => 'monitor',
            'tps_id' => null,
        ]);

        // 2. Create TPS entries (5 TPS based on image copy 2.png)
        $tpsList = [
            [
                'id' => 1,
                'nama' => 'TPS 01',
                'wilayah' => 'RW 01, 02, 10 (RT 06, 07)',
                'total_dpt' => 0,
            ],
            [
                'id' => 2,
                'nama' => 'TPS 02',
                'wilayah' => 'RW 03, 04, 14, 06 (RT 02, 04, 06, 08)',
                'total_dpt' => 0,
            ],
            [
                'id' => 3,
                'nama' => 'TPS 03',
                'wilayah' => 'RW 07, 13, 06 (RT 01, 03, 05, 07), 09 (RT 01)',
                'total_dpt' => 0,
            ],
            [
                'id' => 4,
                'nama' => 'TPS 04',
                'wilayah' => 'RW 08, 12',
                'total_dpt' => 0,
            ],
            [
                'id' => 5,
                'nama' => 'TPS 05',
                'wilayah' => 'RW 05, 11, 09 (RT 02-05), 10 (RT 01-05)',
                'total_dpt' => 0,
            ],
        ];

        foreach ($tpsList as $tData) {
            Tps::create($tData);
        }

        // 3. Create KPPS Users for all 5 TPS
        for ($i = 1; $i <= 5; $i++) {
            $numStr = sprintf('%02d', $i);
            User::create([
                'username' => 'kpps' . $numStr,
                'password' => Hash::make('password123'),
                'role' => 'kpps',
                'kpps_role' => 'full',
                'tps_id' => $i,
            ]);

            User::create([
                'username' => 'kpps' . $numStr . '_val',
                'password' => Hash::make('password123'),
                'role' => 'kpps',
                'kpps_role' => 'validasi',
                'tps_id' => $i,
            ]);
        }

        // 4. Create voters (DPT) from CSV
        $csvFile = database_path('seeders/dpt_seed.csv');
        if (file_exists($csvFile)) {
            $handle = fopen($csvFile, 'r');
            $header = fgetcsv($handle);
            $colMap = array_flip($header);
            
            $chunk = [];
            $voterIndex = 1;
            while (($row = fgetcsv($handle)) !== false) {
                $nik = $row[$colMap['nik']];
                $idPemilih = 'USH-GTN-026' . sprintf('%04d', $voterIndex);
                
                $chunk[] = [
                    'nik' => $nik,
                    'nkk' => $row[$colMap['nkk']] ?: null,
                    'nama' => $row[$colMap['nama']],
                    'tps_id' => intval($row[$colMap['tps_id']]),
                    'status_hadir' => false,
                    'waktu_checkin' => null,
                    'qr_payload' => $idPemilih,
                    // Berkas Excel adalah DP4; verifikasi dijalankan terpisah.
                    'asal' => 'dp4',
                    'tahapan' => 'dp4',
                    'id_pemilih' => $idPemilih,
                    'no_urut' => isset($colMap['no_urut']) && $row[$colMap['no_urut']] !== '' ? intval($row[$colMap['no_urut']]) : null,
                    'umur' => $row[$colMap['umur']] !== '' ? intval($row[$colMap['umur']]) : null,
                    'status_kawin' => $row[$colMap['status_kawin']],
                    'jenis_kelamin' => $row[$colMap['jenis_kelamin']],
                    'alamat' => $row[$colMap['alamat']],
                    'rt' => $row[$colMap['rt']],
                    'rw' => $row[$colMap['rw']],
                    'pekerjaan' => $row[$colMap['pekerjaan']],
                    'disabilitas' => $row[$colMap['disabilitas']],
                    // Kolom keterangan pada CSV berisi catatan asal-usul impor,
                    // bukan kategori hasil pemeriksaan. Sejak keterangan menjadi
                    // enum, isinya dipindah ke catatan_impor dan hasil
                    // pemeriksaan baru diisi saat verifikasi.
                    'keterangan' => null,
                    'catatan_impor' => $row[$colMap['catatan_impor']] ?: null,
                    // Penanda nomor sementara: lihat migrasi
                    // `tandai_nik_nkk_sintetis_pada_dpt`.
                    'nik_sintetis' => $row[$colMap['nik_sintetis']] === '1',
                    'nkk_sintetis' => $row[$colMap['nkk_sintetis']] === '1',
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
                
                $voterIndex++;
                if (count($chunk) >= 500) {
                    Dpt::insert($chunk);
                    $chunk = [];
                }
            }
            if (count($chunk) > 0) {
                Dpt::insert($chunk);
            }
            fclose($handle);
        }

        // 4b. Update total_dpt in Tps table based on seeded count
        for ($i = 1; $i <= 5; $i++) {
            $count = Dpt::where('tps_id', $i)->count();
            Tps::where('id', $i)->update(['total_dpt' => $count]);
        }

        // 5. Seed default candidate pairs (Paslons)
        Paslon::create([
            'nomor_urut' => 1,
            'nama_ketua' => 'Prabowo Subianto',
        ]);
        Paslon::create([
            'nomor_urut' => 2,
            'nama_ketua' => 'Anies Baswedan',
        ]);
        Paslon::create([
            'nomor_urut' => 3,
            'nama_ketua' => 'Ganjar Pranowo',
        ]);
    }
}
