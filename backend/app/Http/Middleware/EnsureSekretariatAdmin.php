<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Membatasi aksi tulis (create/update/delete) hanya untuk sekretariat admin.
 * Sekretariat dengan sekretariat_role = viewer hanya boleh membaca data.
 */
class EnsureSekretariatAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->isSekretariatAdmin()) {
            return $next($request);
        }

        return response()->json([
            'status' => 'error',
            'message' => 'Akses ditolak. Akun Anda hanya memiliki hak lihat (view-only).'
        ], 403);
    }
}
