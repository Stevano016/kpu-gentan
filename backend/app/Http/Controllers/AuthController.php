<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Pembatasan percobaan masuk, dua lapis.
     *
     * Lapis pertama (akun + IP) menghentikan orang yang menebak-nebak dari satu
     * tempat. Lapis kedua (akun saja) ada karena lapis pertama sendirian mudah
     * dilewati: cukup ganti-ganti IP, dan setiap IP baru mendapat jatah penuh
     * lagi. Batas per akun membuat jumlah tebakan terhadap satu orang tetap
     * terbatas, dari berapa pun alamat serangannya datang.
     *
     * Yang dihitung hanya **kegagalan**. Kalau setiap permintaan dihitung,
     * petugas yang berulang kali masuk-keluar dengan password benar bisa
     * mengunci dirinya sendiri — hukuman untuk perilaku yang justru wajar.
     */
    private const BATAS_AKUN_IP = 5;
    private const JEDA_AKUN_IP_DETIK = 60;

    private const BATAS_AKUN = 20;
    private const JEDA_AKUN_DETIK = 900; // 15 menit

    public function login(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        if ($tunggu = $this->sisaPenguncian($request)) {
            return $this->tolakKarenaTerlaluSering($tunggu);
        }

        $user = User::where('username', $request->username)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            $this->catatKegagalan($request);

            throw ValidationException::withMessages([
                'username' => ['Username atau password salah.'],
            ]);
        }

        $this->bersihkanHitungan($request);

        // Sesi panel web berumur terbatas; layar pantau dan aplikasi lapangan
        // dikecualikan. Aturannya ada di `User::sesiKedaluwarsaPada()`.
        $kedaluwarsa = $user->sesiKedaluwarsaPada();
        $token = $user->createToken('auth_token', ['*'], $kedaluwarsa)->plainTextToken;

        return response()->json([
            'status' => 'success',
            'token' => $token,
            'sesi' => $this->keteranganSesi($user, $kedaluwarsa),
            'user' => $this->ringkasan($user),
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Berhasil logout.'
        ]);
    }

    public function me(Request $request)
    {
        $pengguna = $request->user();

        return response()->json([
            'status' => 'success',
            'sesi' => $this->keteranganSesi($pengguna, $pengguna->currentAccessToken()?->expires_at),
            'user' => $this->ringkasan($pengguna),
        ]);
    }

    private function ringkasan(User $user): array
    {
        return [
            'id' => $user->id,
            'username' => $user->username,
            'role' => $user->role,
            'kpps_role' => $user->kpps_role,
            'sekretariat_role' => $user->sekretariat_role,
            'tps_id' => $user->tps_id,
        ];
    }

    /**
     * Dikirim ke klien supaya panel web bisa memperingatkan sebelum sesinya
     * putus, alih-alih membiarkan petugas kehilangan isian yang sedang diketik
     * saat permintaan berikutnya tiba-tiba ditolak.
     */
    private function keteranganSesi(User $user, $kedaluwarsa): array
    {
        return [
            'tanpa_batas' => $user->sesiTanpaBatas(),
            'kedaluwarsa_pada' => $kedaluwarsa?->toIso8601String(),
            'idle_menit' => $user->sesiTanpaBatas() ? null : User::SESI_IDLE_MENIT,
        ];
    }

    /** Detik yang tersisa sebelum boleh mencoba lagi, atau 0 kalau tidak dikunci. */
    private function sisaPenguncian(Request $request): int
    {
        foreach ($this->batas($request) as [$kunci, $percobaan, $jeda]) {
            if (RateLimiter::tooManyAttempts($kunci, $percobaan)) {
                return RateLimiter::availableIn($kunci);
            }
        }

        return 0;
    }

    private function catatKegagalan(Request $request): void
    {
        foreach ($this->batas($request) as [$kunci, $percobaan, $jeda]) {
            RateLimiter::hit($kunci, $jeda);
        }
    }

    private function bersihkanHitungan(Request $request): void
    {
        foreach ($this->batas($request) as [$kunci, $percobaan, $jeda]) {
            RateLimiter::clear($kunci);
        }
    }

    /** @return array<int, array{0: string, 1: int, 2: int}> */
    private function batas(Request $request): array
    {
        // Username dinormalkan dan di-hash: kalau tidak, satu akun bisa punya
        // banyak hitungan terpisah ("Admin" vs "admin"), dan username asli ikut
        // tersimpan sebagai bagian dari kunci cache.
        $akun = hash('sha256', Str::lower(trim((string) $request->username)));

        return [
            ["masuk:$akun:" . $request->ip(), self::BATAS_AKUN_IP, self::JEDA_AKUN_IP_DETIK],
            ["masuk:$akun", self::BATAS_AKUN, self::JEDA_AKUN_DETIK],
        ];
    }

    private function tolakKarenaTerlaluSering(int $detik)
    {
        $menit = (int) ceil($detik / 60);

        return response()->json([
            'status' => 'error',
            'message' => "Terlalu banyak percobaan masuk yang gagal. Coba lagi dalam {$menit} menit.",
            'retry_after' => $detik,
        ], 429)->header('Retry-After', $detik);
    }
}
