<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tahapan asal sebelum seseorang ditandai TMS.
 *
 * TMS kini bisa ditandai dari DPS, bukan hanya DP4 — data yang kececer memang
 * baru ketahuan setelah verifikasi. Akibatnya "Batal TMS" tidak lagi punya satu
 * tujuan yang pasti: mengembalikan bekas-DPS ke DP4 berarti verifikasinya
 * terhapus tanpa diminta, dan kalau TPS-nya sudah ditetapkan jadi DPT, orang itu
 * tertinggal di DP4 tanpa ada yang menyadarinya.
 *
 * Kolom ini menyimpan asalnya supaya pembatalan mengembalikannya ke tempat ia
 * diambil. Kosong berarti data lama, dan itu diperlakukan sebagai DP4 seperti
 * perilaku sebelumnya.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('dpt', function (Blueprint $table) {
            $table->string('tahapan_sebelum_tms', 10)->nullable()->after('tms_alasan');
        });
    }

    public function down(): void
    {
        Schema::table('dpt', function (Blueprint $table) {
            $table->dropColumn('tahapan_sebelum_tms');
        });
    }
};
