<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\Dpt;

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

        // Auto-generate unique id_pemilih for existing records
        $voters = Dpt::all();
        $index = 1;
        foreach ($voters as $v) {
            $suffix = str_pad($index, 4, '0', STR_PAD_LEFT);
            $idPemilih = 'USH-GTN-026' . $suffix;
            $v->update([
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
