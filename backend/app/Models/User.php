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

    public function isSekretariat(): bool
    {
        return $this->role === 'sekretariat';
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
