<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('dpt', function (Blueprint $table) {
            $table->string('id_pemilih', 30)->nullable()->unique();
        });

        // Auto-generate unique id_pemilih for existing records.
        //
        // Sengaja `DB::table`, bukan model `Dpt`. Migrasi berjalan pada skema
        // saat itu, sedangkan model selalu versi terbaru: begitu `Dpt` memakai
        // SoftDeletes, `Dpt::all()` di sini menuntut kolom `deleted_at` yang
        // baru ditambahkan empat migrasi kemudian, dan seluruh rangkaian
        // migrasi gagal pada basis data yang masih kosong.
        $index = 1;
        foreach (DB::table('dpt')->orderBy('nik')->get(['nik']) as $v) {
            $idPemilih = 'USH-GTN-026' . str_pad($index, 4, '0', STR_PAD_LEFT);
            DB::table('dpt')->where('nik', $v->nik)->update([
                'id_pemilih' => $idPemilih,
                'qr_payload' => $idPemilih,
            ]);
            $index++;
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('dpt', function (Blueprint $table) {
            $table->dropColumn('id_pemilih');
        });
    }
};
