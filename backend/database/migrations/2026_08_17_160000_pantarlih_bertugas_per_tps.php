<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wilayah tugas pantarlih pindah dari RW ke TPS.
 *
 * Kolom `tps_id` sudah ada di tabel users (dipakai akun KPPS), jadi pantarlih
 * memakai kolom yang sama dan `rw` yang sempat ditambahkan tidak lagi berguna.
 * Menyisakannya hanya akan memancing pertanyaan "yang dipakai yang mana".
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('rw');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('rw', 10)->nullable()->after('tps_id');
        });
    }
};
