<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;
use Laravel\Sanctum\Sanctum;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->batasiPermintaan();
        $this->putuskanSesiMenganggur();
    }

    private function batasiPermintaan(): void
    {
        // Penjaga kasar terhadap banjir permintaan dari satu alamat: menghitung
        // *semua* percobaan masuk, berhasil maupun gagal. Penguncian per akun
        // yang sebenarnya ada di `AuthController`, dan itu hanya menghitung
        // kegagalan. Angkanya dibuat longgar karena satu kantor sekretariat
        // tampil sebagai satu IP — sepuluh petugas yang masuk bersamaan tidak
        // boleh saling mengunci.
        RateLimiter::for('login', function (Request $request) {
            return Limit::perMinute(30)->by($request->ip());
        });

        // General API limit: 100 requests per minute per authenticated user or IP
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(100)->by($request->user()?->id ?: $request->ip());
        });
    }

    /**
     * Putuskan sesi panel yang dibiarkan menganggur.
     *
     * Umur maksimum sesi sudah ditangani Sanctum lewat `expires_at` pada
     * tokennya. Yang belum: tab yang ditinggalkan terbuka di komputer bersama.
     * Pemeriksaan ini dipasang lewat `authenticateAccessTokensUsing` karena
     * urutannya penting — callback tersebut dijalankan Sanctum **sebelum** ia
     * memperbarui `last_used_at`. Middleware biasa berjalan setelahnya, dan
     * akan selalu melihat "baru saja dipakai".
     *
     * Token tanpa `expires_at` sengaja dilewati. Itulah tanda peran yang
     * dikecualikan — sekretariat "Lihat Saja" dan KPPS — sehingga aturan
     * pengecualiannya hanya hidup di satu tempat, `User::sesiTanpaBatas()`,
     * dan tidak bisa berbeda antara dua berkas.
     */
    private function putuskanSesiMenganggur(): void
    {
        Sanctum::authenticateAccessTokensUsing(
            function (PersonalAccessToken $token, bool $sah) {
                if (! $sah || is_null($token->expires_at)) {
                    return $sah;
                }

                $batas = now()->subMinutes(User::SESI_IDLE_MENIT);

                if ($token->last_used_at && $token->last_used_at->lt($batas)) {
                    // Dihapus, bukan sekadar ditolak: token yang sudah mati
                    // tidak perlu menunggu umur maksimumnya habis untuk berhenti
                    // bisa dicoba lagi.
                    $token->delete();

                    return false;
                }

                return true;
            }
        );
    }
}
