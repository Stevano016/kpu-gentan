<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Menandai pemilih yang NIK atau NKK-nya belum ada di data pembanding.
 *
 * Berkas DP4 memuat 7.494 orang, tetapi 627 di antaranya tidak punya NIK
 * maupun NKK — kolom `NIK` pada berkas itu tersamar (`317308**********`),
 * sehingga satu-satunya nomor asli ada di data pembanding dan mereka tidak
 * menemukan padanan. Selama `nik` menjadi primary key, 627 orang itu tidak
 * bisa masuk sama sekali dan sistem hanya berisi 6.856 nama.
 *
 * Solusinya: mereka tetap dimasukkan dengan nomor sementara buatan sistem
 * (berawalan 9999 untuk NIK dan 9998 untuk NKK — bukan kode provinsi yang sah,
 * jadi tidak mungkin bentrok dengan nomor asli), dan dua kolom di bawah ini
 * yang membedakannya. Tanpa penanda eksplisit, nomor sementara akan terbaca
 * seperti data resmi begitu ia muncul di daftar, ekspor, atau QR.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('dpt', function (Blueprint $table) {
            $table->boolean('nik_sintetis')->default(false)->after('nik');
            $table->boolean('nkk_sintetis')->default(false)->after('nkk');

            // Dipakai untuk menyaring "data yang masih perlu dilengkapi".
            $table->index('nik_sintetis');
        });

        // Data yang sudah terlanjur masuk sebelum migrasi ini semuanya berasal
        // dari NIK asli, kecuali yang nomornya memang berpola sementara.
        DB::table('dpt')->where('nik', 'like', '9999%')->update(['nik_sintetis' => true]);
        DB::table('dpt')->where('nkk', 'like', '9998%')->update(['nkk_sintetis' => true]);
    }

    public function down(): void
    {
        Schema::table('dpt', function (Blueprint $table) {
            $table->dropIndex(['nik_sintetis']);
            $table->dropColumn(['nik_sintetis', 'nkk_sintetis']);
        });
    }
};
