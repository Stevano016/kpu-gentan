<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * TMS menjadi penghapusan lunak.
 *
 * Sebelum ini, pemilih yang gugur hanya ditandai `tahapan = 'tms'`, dan setiap
 * kueri harus ingat mengecualikannya sendiri. Satu tempat yang lupa berarti
 * pemilih yang sudah dicoret ikut terhitung — dan itu tidak akan kelihatan
 * sampai ada yang mencocokkan angkanya dengan Berita Acara.
 *
 * `deleted_at` membalik bebannya: yang dikecualikan jadi bawaan, dan yang
 * benar-benar ingin melihat TMS harus memintanya lewat `withTrashed()`.
 * Kolom `tahapan` tetap berisi `'tms'` beserta `tms_alasan` dan
 * `tahapan_sebelum_tms`, jadi riwayat pencoretan tidak hilang dan pembatalan
 * TMS tetap tahu harus mengembalikannya ke mana.
 *
 * Nilai awalnya diisi dari data yang sudah ada: setiap baris yang kini `tms`
 * ditandai terhapus pada `diverifikasi_pada` — waktu penandaan TMS memang
 * dicatat di sana oleh `TahapanController::tandaiTms()` — dan jatuh ke waktu
 * migrasi untuk baris lama yang tidak punya catatan itu.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('dpt', function (Blueprint $table) {
            $table->softDeletes();
        });

        DB::table('dpt')
            ->where('tahapan', 'tms')
            ->whereNull('deleted_at')
            ->update(['deleted_at' => DB::raw('COALESCE(diverifikasi_pada, updated_at, CURRENT_TIMESTAMP)')]);
    }

    public function down(): void
    {
        Schema::table('dpt', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};
