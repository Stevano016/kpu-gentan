<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * `keterangan` berubah dari teks bebas menjadi pilihan tetap — hasil pemeriksaan
 * terhadap seorang pemilih: lolos (dps) atau alasan gugurnya.
 *
 * Isi lama kolom itu bukan kategori, melainkan catatan asal-usul impor
 * ("RT/RW diisi dari data pembanding, cocok nama: GENTAN — perlu verifikasi
 * manual"). Itu jejak audit yang masih dipakai untuk menelusuri data
 * meragukan, jadi dipindahkan ke `catatan_impor` alih-alih dibuang.
 *
 * Sekalian menambah `rw` pada users: pantarlih bertugas per RW dan hanya boleh
 * mendata di wilayahnya sendiri.
 */
return new class extends Migration
{
    public const PILIHAN = [
        'dps',
        'meninggal',
        'data ganda',
        'dibawah umur',
        'pindah',
        'tni',
        'polri',
    ];

    public function up(): void
    {
        Schema::table('dpt', function (Blueprint $table) {
            $table->text('catatan_impor')->nullable()->after('keterangan');
        });

        // Selamatkan jejak audit sebelum kolomnya diubah bentuk.
        DB::table('dpt')
            ->whereNotNull('keterangan')
            ->where('keterangan', '!=', '')
            ->update(['catatan_impor' => DB::raw('keterangan')]);

        Schema::table('dpt', function (Blueprint $table) {
            $table->dropColumn('keterangan');
        });

        Schema::table('dpt', function (Blueprint $table) {
            $table->enum('keterangan', self::PILIHAN)->nullable()->after('disabilitas');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->string('rw', 10)->nullable()->after('tps_id');
        });
    }

    public function down(): void
    {
        Schema::table('dpt', function (Blueprint $table) {
            $table->dropColumn('keterangan');
        });

        Schema::table('dpt', function (Blueprint $table) {
            $table->string('keterangan')->nullable()->after('disabilitas');
        });

        DB::table('dpt')
            ->whereNotNull('catatan_impor')
            ->update(['keterangan' => DB::raw('catatan_impor')]);

        Schema::table('dpt', function (Blueprint $table) {
            $table->dropColumn('catatan_impor');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('rw');
        });
    }
};
