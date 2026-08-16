<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DptController;
use App\Http\Controllers\TpsController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\SyncController;

// Public routes
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login');

// Protected routes (Sanctum)
Route::middleware(['auth:sanctum', 'throttle:api'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Secretariat-only routes
    Route::middleware('role:sekretariat')->group(function () {
        Route::get('/dashboard/summary', [DashboardController::class, 'getSummary']);
        Route::get('/dashboard/tps/{id}', [DashboardController::class, 'getTpsDetails']);
        Route::post('/tps', [TpsController::class, 'store']);
        Route::get('/tps/{id}', [TpsController::class, 'show']);
        
        Route::get('/dpt', [DptController::class, 'index']);
        Route::post('/dpt', [DptController::class, 'store']);
        Route::put('/dpt/{nik}', [DptController::class, 'update']);
        Route::delete('/dpt/{nik}', [DptController::class, 'destroy']);
        Route::post('/dpt/import', [DptController::class, 'importCsv']);
        Route::get('/dpt/{nik}/qrcode', [DptController::class, 'getQrCode']);

        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::post('/users/{id}/reset-password', [UserController::class, 'resetPassword']);
        Route::delete('/users/{id}', [UserController::class, 'destroy']);
    });

    // Shared / KPPS routes
    Route::get('/tps', [TpsController::class, 'index']);
    Route::get('/kpps/dpt', [SyncController::class, 'getDpt']);
    Route::post('/kpps/sync/checkin', [SyncController::class, 'syncCheckins']);
    Route::post('/kpps/sync/quick-count', [SyncController::class, 'submitQuickCount']);
});
