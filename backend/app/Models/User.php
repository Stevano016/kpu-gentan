<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'username',
        'password',
        'role',
        'kpps_role',
        'sekretariat_role',
        'tps_id',
        'rw',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
        ];
    }

    public function tps(): BelongsTo
    {
        return $this->belongsTo(Tps::class, 'tps_id');
    }

    /**
     * Berapa lama sesi panel web berlaku sejak masuk, dan berapa lama boleh
     * menganggur sebelum diputus.
     *
     * Panel web memegang data pemilih satu kelurahan lengkap dengan NIK dan
     * alamatnya. Komputer sekretariat dipakai bergantian dan sering ditinggal
     * tanpa dikunci, jadi tab yang dibiarkan terbuka semalaman adalah pintu
     * masuk yang tidak perlu ada.
     */
    public const SESI_JAM = 12;
    public const SESI_IDLE_MENIT = 60;

    /**
     * Kapan token pengguna ini kedaluwarsa — `null` berarti tidak pernah.
     *
     * Dua peran sengaja dikecualikan, dan keduanya punya alasan yang berbeda:
     *
     *   - **Sekretariat "Lihat Saja" (pengawas)** memang ditujukan untuk layar
     *     pantau yang menyala terus-menerus. Akun ini tidak bisa mengubah apa
     *     pun, jadi sesi panjangnya tidak menambah risiko perubahan data.
     *   - **KPPS** memakai aplikasi lapangan yang offline-first. Diputus di
     *     tengah hari pemungutan suara — mungkin tanpa sinyal untuk masuk lagi —
     *     jauh lebih berbahaya daripada sesi yang kepanjangan.
     */
    public function sesiKedaluwarsaPada(): ?\Illuminate\Support\Carbon
    {
        return $this->sesiTanpaBatas() ? null : now()->addHours(self::SESI_JAM);
    }

    public function sesiTanpaBatas(): bool
    {
        return $this->role === 'kpps' || $this->isSekretariatViewer();
    }

    public function isSekretariat(): bool
    {
        return $this->role === 'sekretariat';
    }

    /** Sekretariat yang hanya boleh melihat, tidak mengubah apa pun. */
    public function isSekretariatViewer(): bool
    {
        return $this->isSekretariat() && $this->sekretariat_role === 'viewer';
    }

    /**
     * Sekretariat dengan hak penuh (CRUD + kelola akun).
     * Nilai null dianggap admin agar akun lama tetap berfungsi.
     */
    public function isSekretariatAdmin(): bool
    {
        return $this->isSekretariat() && $this->sekretariat_role !== 'viewer';
    }
}
