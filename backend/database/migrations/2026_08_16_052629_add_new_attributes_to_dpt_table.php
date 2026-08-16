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
            $table->integer('umur')->nullable();
            $table->string('status_kawin', 50)->nullable();
            $table->string('jenis_kelamin', 20)->nullable();
            $table->string('alamat', 255)->nullable();
            $table->string('rt', 10)->nullable();
            $table->string('rw', 10)->nullable();
            $table->string('pekerjaan', 100)->nullable();
            $table->string('disabilitas', 100)->nullable();
            $table->string('keterangan', 255)->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('dpt', function (Blueprint $table) {
            $table->dropColumn([
                'umur',
                'status_kawin',
                'jenis_kelamin',
                'alamat',
                'rt',
                'rw',
                'pekerjaan',
                'disabilitas',
                'keterangan'
            ]);
        });
    }
};
