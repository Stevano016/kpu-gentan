<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Mengizinkan pendaftaran pemilih baru untuk dua peran sekaligus: sekretariat
 * admin, dan pantarlih yang memang tugasnya hanya itu.
 *
 * Aturannya ditulis sebagai satu middleware, bukan dua grup rute terpisah,
 * karena mendaftarkan rute yang sama dua kali membuat Laravel hanya menyimpan
 * pendaftaran terakhir — peran yang satunya diam-diam kehilangan akses.
 */
class EnsureBisaInputPemilih
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && ($user->role === 'pantarlih' || $user->isSekretariatAdmin())) {
            return $next($request);
        }

        return response()->json([
            'status' => 'error',
            'message' => 'Akses ditolak. Akun Anda tidak berhak menambah data pemilih.'
        ], 403);
    }
}
