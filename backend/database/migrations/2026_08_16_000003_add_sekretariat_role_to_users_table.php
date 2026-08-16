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
        Schema::table('users', function (Blueprint $table) {
            // admin = akses penuh (CRUD), viewer = hanya melihat data di web
            $table->string('sekretariat_role', 20)->nullable()->after('kpps_role');
        });

        // Akun sekretariat yang sudah ada tetap berhak penuh
        DB::table('users')
            ->where('role', 'sekretariat')
            ->update(['sekretariat_role' => 'admin']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('sekretariat_role');
        });
    }
};
