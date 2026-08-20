<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('dpt', function (Blueprint $table) {
            $table->string('keterangan', 255)->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('dpt', function (Blueprint $table) {
            $table->enum('keterangan', [
                '1 : Terverifikasi/Valid',
                '2 : Belum memiliki KTP-el',
                '3 : Ubah Elemen Data',
                '4 : Meninggal',
                '5 : Ganda',
                '6 : Dibawah Umur',
                '7 : Tidak Ditemukan',
            ])->nullable()->change();
        });
    }
};
