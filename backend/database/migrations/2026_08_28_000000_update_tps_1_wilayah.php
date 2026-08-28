<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::table('tps')
            ->where('id', 1)
            ->update([
                'wilayah' => 'Rumah Ibu Murheni Sri Setiti , Ngemplak RT. 002 RW. 001'
            ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('tps')
            ->where('id', 1)
            ->update([
                'wilayah' => 'RW 01, 02, 10 (RT 06, 07)'
            ]);
    }
};
