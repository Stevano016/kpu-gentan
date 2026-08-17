<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DptController;
use App\Http\Controllers\TpsController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\SyncController;
use App\Http\Controllers\PaslonController;
use App\Http\Controllers\TahapanController;
use App\Http\Controllers\ExportController;

// Public routes
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login');

// Protected routes (Sanctum)
Route::middleware(['auth:sanctum', 'throttle:api'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Secretariat routes (admin + viewer)
    Route::middleware('role:sekretariat')->group(function () {
        // --- Baca saja: boleh diakses semua sekretariat termasuk viewer ---
        Route::get('/dashboard/summary', [DashboardController::class, 'getSummary']);
        Route::get('/dashboard/tps/{id}', [DashboardController::class, 'getTpsDetails']);
        Route::get('/tps/{id}', [TpsController::class, 'show']);
        Route::get('/users', [UserController::class, 'index']);
        Route::get('/tahapan/ringkasan', [TahapanController::class, 'ringkasan']);

        // --- Tulis: khusus sekretariat admin ---
        Route::middleware('sekretariat.admin')->group(function () {
            Route::post('/tps', [TpsController::class, 'store']);

            Route::put('/dpt/{nik}', [DptController::class, 'update']);
            Route::delete('/dpt/{nik}', [DptController::class, 'destroy']);
            Route::post('/dpt/import', [DptController::class, 'importCsv']);

            // Perpindahan tahapan pendataan pemilih
            Route::post('/tahapan/verifikasi', [TahapanController::class, 'verifikasi']);
            Route::post('/tahapan/tetapkan', [TahapanController::class, 'tetapkan']);
            Route::post('/tahapan/{nik}/tms', [TahapanController::class, 'tandaiTms']);
            Route::delete('/tahapan/{nik}/tms', [TahapanController::class, 'batalkanTms']);
            Route::post('/tahapan/{nik}/dpk', [TahapanController::class, 'tandaiDpk']);
            Route::delete('/tahapan/{nik}/dpk', [TahapanController::class, 'batalkanDpk']);

            Route::post('/users', [UserController::class, 'store']);
            Route::post('/users/{id}/reset-password', [UserController::class, 'resetPassword']);
            Route::delete('/users/{id}', [UserController::class, 'destroy']);

            Route::post('/paslon', [PaslonController::class, 'store']);
            Route::put('/paslon/{id}', [PaslonController::class, 'update']);
            Route::delete('/paslon/{id}', [PaslonController::class, 'destroy']);
        });
    });

    // KPPS-only routes (aplikasi mobile)
    Route::middleware('role:kpps')->group(function () {
        Route::get('/kpps/dpt', [SyncController::class, 'getDpt']);
        Route::post('/kpps/sync/checkin', [SyncController::class, 'syncCheckins']);
        Route::post('/kpps/sync/quick-count', [SyncController::class, 'submitQuickCount']);
    });

    // Dipakai bersama sekretariat dan pantarlih — didaftarkan sekali saja.
    Route::middleware('role:sekretariat,pantarlih')->group(function () {
        Route::get('/dpt', [DptController::class, 'index']);
        Route::get('/dpt/{nik}/qrcode', [DptController::class, 'getQrCode']);
        Route::post('/dpt', [DptController::class, 'store'])->middleware('input.pemilih');

        // Ekspor: sekretariat bebas memilih lingkup, pantarlih dikunci ke RW-nya
        // di dalam controller.
        Route::get('/export/pemilih', [ExportController::class, 'pemilih']);
        Route::get('/export/rw', [ExportController::class, 'daftarRw']);
    });

    // Shared read-only routes
    Route::get('/tps', [TpsController::class, 'index']);
    Route::get('/paslon', [PaslonController::class, 'index']);
});
