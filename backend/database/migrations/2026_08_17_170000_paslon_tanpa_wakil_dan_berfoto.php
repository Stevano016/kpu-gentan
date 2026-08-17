<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Calon di pemilihan ini maju sendiri, tidak berpasangan, jadi `nama_wakil`
 * dibuang. Sekaligus menambah `foto` untuk ditampilkan di dashboard dan
 * aplikasi lapangan — isinya path relatif pada disk `public`, bukan berkasnya.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('paslons', function (Blueprint $table) {
            $table->dropColumn('nama_wakil');
            $table->string('foto')->nullable()->after('nama_ketua');
        });
    }

    public function down(): void
    {
        Schema::table('paslons', function (Blueprint $table) {
            $table->dropColumn('foto');
            $table->string('nama_wakil', 255)->default('');
        });
    }
};
