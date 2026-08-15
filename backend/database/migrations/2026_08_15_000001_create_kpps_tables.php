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
        Schema::create('dpt', function (Blueprint $table) {
            $table->string('nik', 16)->primary();
            $table->string('nama', 255);
            $table->foreignId('tps_id')->constrained('tps')->onDelete('cascade');
            $table->boolean('status_hadir')->default(false);
            $table->timestamp('waktu_checkin')->nullable();
            $table->text('qr_payload')->nullable();
            $table->timestamps();
        });

        Schema::create('quick_counts', function (Blueprint $table) {
            $table->foreignId('tps_id')->primary()->constrained('tps')->onDelete('cascade');
            $table->integer('kandidat_1')->default(0);
            $table->integer('kandidat_2')->default(0);
            $table->integer('kandidat_3')->default(0);
            $table->integer('suara_tidak_sah')->default(0);
            $table->string('status', 20)->default('draft'); // draft, final
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();
        });

        Schema::create('sync_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tps_id')->constrained('tps')->onDelete('cascade');
            $table->string('device_id', 255);
            $table->string('action', 100);
            $table->text('payload')->nullable();
            $table->timestamp('waktu_sync')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sync_logs');
        Schema::dropIfExists('quick_counts');
        Schema::dropIfExists('dpt');
    }
};
