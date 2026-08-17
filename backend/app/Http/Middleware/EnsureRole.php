<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    /**
     * Accepts several roles (`role:sekretariat,pantarlih`) so a shared endpoint
     * can be declared once. Declaring the same route twice under two separate
     * role groups would silently leave only the last one registered.
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        if ($request->user() && in_array($request->user()->role, $roles, true)) {
            return $next($request);
        }

        $daftar = implode(' atau ', array_map('ucfirst', $roles));

        return response()->json([
            'status' => 'error',
            'message' => 'Akses ditolak. Hanya peran ' . $daftar . ' yang diizinkan.'
        ], 403);
    }
}
