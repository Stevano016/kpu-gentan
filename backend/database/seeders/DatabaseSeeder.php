<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Tps;
use App\Models\Dpt;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Create Secretariat Admin
        User::create([
            'username' => 'admin',
            'password' => Hash::make('password123'),
            'role' => 'sekretariat',
            'tps_id' => null,
        ]);

        // 2. Create TPS entries
        $tpsList = [
            [
                'id' => 1,
                'nama' => 'TPS 01',
                'wilayah' => 'Gentan RT 01 / RW 01',
                'total_dpt' => 5,
            ],
            [
                'id' => 2,
                'nama' => 'TPS 02',
                'wilayah' => 'Gentan RT 02 / RW 01',
                'total_dpt' => 5,
            ],
            [
                'id' => 3,
                'nama' => 'TPS 03',
                'wilayah' => 'Gentan RT 03 / RW 01',
                'total_dpt' => 5,
            ],
        ];

        foreach ($tpsList as $tData) {
            Tps::create($tData);
        }

        // 3. Create KPPS Users
        User::create([
            'username' => 'kpps01',
            'password' => Hash::make('password123'),
            'role' => 'kpps',
            'kpps_role' => 'full',
            'tps_id' => 1,
        ]);

        User::create([
            'username' => 'kpps01_val',
            'password' => Hash::make('password123'),
            'role' => 'kpps',
            'kpps_role' => 'validasi',
            'tps_id' => 1,
        ]);

        User::create([
            'username' => 'kpps02',
            'password' => Hash::make('password123'),
            'role' => 'kpps',
            'kpps_role' => 'validasi',
            'tps_id' => 2,
        ]);

        User::create([
            'username' => 'kpps03',
            'password' => Hash::make('password123'),
            'role' => 'kpps',
            'kpps_role' => 'full',
            'tps_id' => 3,
        ]);

        // 4. Create DPT voters
        $dpts = [
            // TPS 01
            ['nik' => '3311010101010001', 'nama' => 'Budi Santoso', 'tps_id' => 1],
            ['nik' => '3311010101010002', 'nama' => 'Siti Aminah', 'tps_id' => 1],
            ['nik' => '3311010101010003', 'nama' => 'Eko Prasetyo', 'tps_id' => 1],
            ['nik' => '3311010101010004', 'nama' => 'Dewi Lestari', 'tps_id' => 1],
            ['nik' => '3311010101010005', 'nama' => 'Ahmad Fauzi', 'tps_id' => 1],
            
            // TPS 02
            ['nik' => '3311020202020001', 'nama' => 'Rian Hidayat', 'tps_id' => 2],
            ['nik' => '3311020202020002', 'nama' => 'Santi Wijaya', 'tps_id' => 2],
            ['nik' => '3311020202020003', 'nama' => 'Gita Gutawa', 'tps_id' => 2],
            ['nik' => '3311020202020004', 'nama' => 'Andi Hermawan', 'tps_id' => 2],
            ['nik' => '3311020202020005', 'nama' => 'Sri Wahyuni', 'tps_id' => 2],
            
            // TPS 03
            ['nik' => '3311030303030001', 'nama' => 'Joko Widodo', 'tps_id' => 3],
            ['nik' => '3311030303030002', 'nama' => 'Megawati Sukarno', 'tps_id' => 3],
            ['nik' => '3311030303030003', 'nama' => 'Prabowo Subianto', 'tps_id' => 3],
            ['nik' => '3311030303030004', 'nama' => 'Anies Baswedan', 'tps_id' => 3],
            ['nik' => '3311030303030005', 'nama' => 'Ganjar Pranowo', 'tps_id' => 3],
        ];

        $index = 1;
        foreach ($dpts as $d) {
            $suffix = str_pad($index, 4, '0', STR_PAD_LEFT);
            $idPemilih = 'USH-GTN-026' . $suffix;
            Dpt::create([
                'nik' => $d['nik'],
                'nama' => $d['nama'],
                'tps_id' => $d['tps_id'],
                'status_hadir' => false,
                'waktu_checkin' => null,
                'id_pemilih' => $idPemilih,
                'qr_payload' => $idPemilih,
            ]);
            $index++;
        }
    }
}
