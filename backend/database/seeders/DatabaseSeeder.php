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

        // 4. Create voters (DPT & DPK)
        $voters = [
            // TPS 01 (DPT)
            ['nik' => '3311010101010001', 'nama' => 'Budi Santoso', 'tps_id' => 1, 'jenis_pemilih' => 'dpt'],
            ['nik' => '3311010101010002', 'nama' => 'Siti Aminah', 'tps_id' => 1, 'jenis_pemilih' => 'dpt'],
            ['nik' => '3311010101010003', 'nama' => 'Eko Prasetyo', 'tps_id' => 1, 'jenis_pemilih' => 'dpt'],
            ['nik' => '3311010101010004', 'nama' => 'Dewi Lestari', 'tps_id' => 1, 'jenis_pemilih' => 'dpt'],
            ['nik' => '3311010101010005', 'nama' => 'Ahmad Fauzi', 'tps_id' => 1, 'jenis_pemilih' => 'dpt'],
            // TPS 01 (DPK)
            ['nik' => '3311010101019001', 'nama' => 'Rudi Salim (DPK)', 'tps_id' => 1, 'jenis_pemilih' => 'dpk'],
            ['nik' => '3311010101019002', 'nama' => 'Lani Marlina (DPK)', 'tps_id' => 1, 'jenis_pemilih' => 'dpk'],

            // TPS 02 (DPT)
            ['nik' => '3311020202020001', 'nama' => 'Rian Hidayat', 'tps_id' => 2, 'jenis_pemilih' => 'dpt'],
            ['nik' => '3311020202020002', 'nama' => 'Santi Wijaya', 'tps_id' => 2, 'jenis_pemilih' => 'dpt'],
            ['nik' => '3311020202020003', 'nama' => 'Gita Gutawa', 'tps_id' => 2, 'jenis_pemilih' => 'dpt'],
            ['nik' => '3311020202020004', 'nama' => 'Andi Hermawan', 'tps_id' => 2, 'jenis_pemilih' => 'dpt'],
            ['nik' => '3311020202020005', 'nama' => 'Sri Wahyuni', 'tps_id' => 2, 'jenis_pemilih' => 'dpt'],
            // TPS 02 (DPK)
            ['nik' => '3311020202029001', 'nama' => 'Ferry Sunarto (DPK)', 'tps_id' => 2, 'jenis_pemilih' => 'dpk'],
            ['nik' => '3311020202029002', 'nama' => 'Yuni Shara (DPK)', 'tps_id' => 2, 'jenis_pemilih' => 'dpk'],

            // TPS 03 (DPT)
            ['nik' => '3311030303030001', 'nama' => 'Joko Widodo', 'tps_id' => 3, 'jenis_pemilih' => 'dpt'],
            ['nik' => '3311030303030002', 'nama' => 'Megawati Sukarno', 'tps_id' => 3, 'jenis_pemilih' => 'dpt'],
            ['nik' => '3311030303030003', 'nama' => 'Prabowo Subianto', 'tps_id' => 3, 'jenis_pemilih' => 'dpt'],
            ['nik' => '3311030303030004', 'nama' => 'Anies Baswedan', 'tps_id' => 3, 'jenis_pemilih' => 'dpt'],
            ['nik' => '3311030303030005', 'nama' => 'Ganjar Pranowo', 'tps_id' => 3, 'jenis_pemilih' => 'dpt'],
            // TPS 03 (DPK)
            ['nik' => '3311030303039001', 'nama' => 'Muhaimin Iskandar (DPK)', 'tps_id' => 3, 'jenis_pemilih' => 'dpk'],
            ['nik' => '3311030303039002', 'nama' => 'Mahfud MD (DPK)', 'tps_id' => 3, 'jenis_pemilih' => 'dpk'],
        ];

        $index = 1;
        foreach ($voters as $v) {
            $suffix = str_pad($index, 4, '0', STR_PAD_LEFT);
            $idPemilih = 'USH-GTN-026' . $suffix;
            Dpt::create([
                'nik' => $v['nik'],
                'nama' => $v['nama'],
                'tps_id' => $v['tps_id'],
                'status_hadir' => false,
                'waktu_checkin' => null,
                'jenis_pemilih' => $v['jenis_pemilih'],
                'id_pemilih' => $idPemilih,
                'qr_payload' => $idPemilih,
            ]);
            $index++;
        }
    }
}
