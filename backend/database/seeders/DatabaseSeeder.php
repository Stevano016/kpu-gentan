<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Tps;
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
                'wilayah' => 'Rumah Ibu Murheni Sri Setiti , Ngemplak RT. 002 RW. 001',
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

        // 4. Daftar pemilih beserta penyegaran total_dpt tiap TPS.
        //    Isinya di DptSeeder supaya bisa dijalankan sendiri di server yang
        //    sudah berisi akun: `php artisan db:seed --class=DptSeeder`.
        $this->call(DptSeeder::class);

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
