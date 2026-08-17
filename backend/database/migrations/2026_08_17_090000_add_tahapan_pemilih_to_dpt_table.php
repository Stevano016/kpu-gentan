<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Replaces the flat `jenis_pemilih` category with the two facts the pendataan
 * flow actually needs: where a voter came from, and how far along they are.
 *
 *   asal    : dp4  — imported from the DP4 spreadsheet
 *             dptb — registered after DP4 verification had already closed
 *
 *   tahapan : dp4  — imported, not yet verified
 *             dps  — passed verification
 *             dptb — added late, waiting to be included
 *             dpt  — finalised (dps + dptb are merged into this)
 *             dpk  — special case split back out of dpt
 *             tms  — failed verification, kept for the record
 *
 * Keeping the two apart is what makes "DPS + DPTb = DPT" an actual sum: once a
 * voter reaches dpt, `asal` still says whether they came from the spreadsheet
 * or were a late addition, which a single column would have thrown away.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('dpt', function (Blueprint $table) {
            $table->string('asal', 10)->default('dp4')->after('nama');
            $table->string('tahapan', 10)->default('dp4')->after('asal');
            $table->string('tms_alasan')->nullable()->after('tahapan');
            $table->string('dpk_alasan')->nullable()->after('tms_alasan');
            $table->timestamp('diverifikasi_pada')->nullable()->after('dpk_alasan');

            $table->index(['tahapan', 'tps_id']);
            $table->index('asal');
        });

        // Everything already imported goes back to the start of the flow: the
        // spreadsheet rows were seeded straight to dps without ever having been
        // verified, which is exactly the step this change introduces.
        DB::table('dpt')->update([
            'asal' => 'dp4',
            'tahapan' => 'dp4',
        ]);

        // Rows that were deliberately marked as late additions keep that origin.
        DB::table('dpt')->where('jenis_pemilih', 'dptb')->update([
            'asal' => 'dptb',
            'tahapan' => 'dptb',
        ]);

        Schema::table('dpt', function (Blueprint $table) {
            $table->dropColumn('jenis_pemilih');
        });
    }

    public function down(): void
    {
        Schema::table('dpt', function (Blueprint $table) {
            $table->string('jenis_pemilih', 10)->default('dpt');
        });

        DB::table('dpt')->update(['jenis_pemilih' => DB::raw('tahapan')]);

        Schema::table('dpt', function (Blueprint $table) {
            $table->dropIndex(['tahapan', 'tps_id']);
            $table->dropIndex(['asal']);
            $table->dropColumn([
                'asal',
                'tahapan',
                'tms_alasan',
                'dpk_alasan',
                'diverifikasi_pada',
            ]);
        });
    }
};
