<?php

namespace Database\Seeders;

use App\Models\Dpt;
use App\Models\Tps;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Mengisi tabel `dpt` dari `database/seeders/dpt_seed.csv`.
 *
 * Dipisahkan dari `DatabaseSeeder` supaya daftar pemilih bisa dimuat ulang
 * **tanpa** menyentuh akun, TPS, dan paslon:
 *
 *     php artisan db:seed --class=DptSeeder --force
 *
 * Itu yang dibutuhkan di server yang sudah berjalan. `migrate:fresh --seed`
 * ikut menghapus tabel `users`, jadi seluruh akun sekretariat, pantarlih, dan
 * KPPS yang sudah dibagikan ke petugas — beserta kata sandinya — hilang hanya
 * karena daftar pemilihnya diperbarui.
 *
 * Barisnya dihapus lebih dulu, bukan di-*upsert*: pemilih yang tidak lagi ada
 * di berkas sumber harus benar-benar hilang, dan `nik` adalah primary key
 * sehingga tanpa penghapusan sisa data lama akan bercampur dengan yang baru.
 */
class DptSeeder extends Seeder
{
    /** Sekali insert menampung 500 baris; 7.400 baris sekaligus melewati batas placeholder. */
    private const UKURAN_BONGKAH = 500;

    public function run(): void
    {
        $csv = database_path('seeders/dpt_seed.csv');

        if (!file_exists($csv)) {
            $this->command?->error("Berkas $csv tidak ditemukan; tabel dpt dibiarkan apa adanya.");
            return;
        }

        $sebelum = Dpt::count();

        // `delete()`, bukan `truncate()`: MariaDB menolak TRUNCATE pada tabel
        // yang terikat foreign key, dan hasilnya sama untuk keperluan ini.
        DB::table('dpt')->delete();

        $handle = fopen($csv, 'r');
        $kolom = array_flip(fgetcsv($handle));

        $bongkah = [];
        $urut = 0;
        $waktu = now();

        while (($baris = fgetcsv($handle)) !== false) {
            $urut++;
            $idPemilih = 'USH-GTN-026' . sprintf('%04d', $urut);

            $bongkah[] = [
                'nik' => $baris[$kolom['nik']],
                'nkk' => $baris[$kolom['nkk']] ?: null,
                'nama' => $baris[$kolom['nama']],
                'tps_id' => intval($baris[$kolom['tps_id']]),
                'status_hadir' => false,
                'waktu_checkin' => null,
                'qr_payload' => $idPemilih,
                // Berkas Excel adalah DP4; verifikasi dijalankan terpisah.
                'asal' => 'dp4',
                'tahapan' => 'dp4',
                'id_pemilih' => $idPemilih,
                'no_urut' => isset($kolom['no_urut']) && $baris[$kolom['no_urut']] !== ''
                    ? intval($baris[$kolom['no_urut']])
                    : null,
                'umur' => $baris[$kolom['umur']] !== '' ? intval($baris[$kolom['umur']]) : null,
                'status_kawin' => $baris[$kolom['status_kawin']],
                'jenis_kelamin' => $baris[$kolom['jenis_kelamin']],
                'alamat' => $baris[$kolom['alamat']],
                'rt' => $baris[$kolom['rt']],
                'rw' => $baris[$kolom['rw']],
                'pekerjaan' => $baris[$kolom['pekerjaan']],
                'disabilitas' => $baris[$kolom['disabilitas']],
                // Kolom keterangan pada CSV berisi catatan asal-usul impor, bukan
                // kategori hasil pemeriksaan. Sejak keterangan menjadi enum,
                // isinya dipindah ke catatan_impor dan hasil pemeriksaan baru
                // diisi saat verifikasi.
                'keterangan' => null,
                'catatan_impor' => $baris[$kolom['catatan_impor']] ?: null,
                // Penanda nomor sementara: lihat migrasi
                // `tandai_nik_nkk_sintetis_pada_dpt`.
                'nik_sintetis' => $baris[$kolom['nik_sintetis']] === '1',
                'nkk_sintetis' => $baris[$kolom['nkk_sintetis']] === '1',
                'created_at' => $waktu,
                'updated_at' => $waktu,
            ];

            if (count($bongkah) >= self::UKURAN_BONGKAH) {
                Dpt::insert($bongkah);
                $bongkah = [];
            }
        }

        if (count($bongkah) > 0) {
            Dpt::insert($bongkah);
        }

        fclose($handle);

        // Angka pada kartu TPS di dashboard dibaca dari kolom ini, bukan
        // dihitung ulang, jadi ia harus ikut disegarkan.
        foreach (Tps::pluck('id') as $id) {
            Tps::where('id', $id)->update(['total_dpt' => Dpt::where('tps_id', $id)->count()]);
        }

        $this->command?->info("Daftar pemilih dimuat ulang: $sebelum baris dihapus, " . Dpt::count() . ' baris dimasukkan.');
    }
}
