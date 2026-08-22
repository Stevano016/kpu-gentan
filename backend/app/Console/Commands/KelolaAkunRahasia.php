<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

/**
 * Membuat atau memperbarui satu akun admin sekretariat yang tersembunyi.
 *
 * Akun ini tidak muncul di Manajemen Akun dan tidak bisa direset atau dihapus
 * lewat panel, jadi satu-satunya cara mengelolanya adalah perintah ini di
 * server. Password diketik secara tersembunyi dan tidak pernah ikut tercatat
 * di argumen perintah maupun riwayat shell.
 */
class KelolaAkunRahasia extends Command
{
    protected $signature = 'akun:rahasia';

    protected $description = 'Buat atau perbarui akun admin sekretariat tersembunyi (rahasia)';

    public function handle(): int
    {
        $terkini = User::where('tersembunyi', true)->first();

        if ($terkini) {
            $this->info("Akun tersembunyi yang ada: {$terkini->username}");
        } else {
            $this->info('Belum ada akun tersembunyi. Perintah ini akan membuatnya.');
        }

        $username = $this->ask('Username akun rahasia', $terkini?->username);

        // Username hanya boleh bentrok dengan akun tersembunyi itu sendiri.
        $bentrok = User::where('username', $username)
            ->where('tersembunyi', false)
            ->exists();
        if ($bentrok) {
            $this->error("Username \"{$username}\" sudah dipakai akun lain yang terlihat di panel. Pilih yang lain.");
            return self::FAILURE;
        }

        $password = $this->secret('Password baru (kosongkan untuk tidak mengubah)');

        if (blank($password) && ! $terkini) {
            $this->error('Akun baru wajib punya password.');
            return self::FAILURE;
        }

        if (filled($password)) {
            if (strlen($password) < 6) {
                $this->error('Password minimal 6 karakter.');
                return self::FAILURE;
            }
            $konfirmasi = $this->secret('Ulangi password');
            if ($password !== $konfirmasi) {
                $this->error('Konfirmasi password tidak cocok.');
                return self::FAILURE;
            }
        }

        $data = [
            'username' => $username,
            'role' => 'sekretariat',
            'sekretariat_role' => 'admin',
            'kpps_role' => null,
            'tps_id' => null,
            'rw' => null,
            'tersembunyi' => true,
        ];
        if (filled($password)) {
            $data['password'] = Hash::make($password);
        }

        if ($terkini) {
            $terkini->update($data);
            $this->info("Akun tersembunyi \"{$username}\" diperbarui.");
        } else {
            User::create($data);
            $this->info("Akun tersembunyi \"{$username}\" dibuat.");
        }

        $this->warn('Simpan kredensial ini baik-baik. Akun tidak muncul di panel dan hanya bisa dikelola lewat perintah ini.');
        return self::SUCCESS;
    }
}
