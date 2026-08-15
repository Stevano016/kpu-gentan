<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Tps extends Model
{
    use HasFactory;

    protected $table = 'tps';

    protected $fillable = [
        'nama',
        'wilayah',
        'total_dpt',
    ];

    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'tps_id');
    }

    public function dpt(): HasMany
    {
        return $this->hasMany(Dpt::class, 'tps_id');
    }

    public function quickCount(): HasOne
    {
        return $this->hasOne(QuickCount::class, 'tps_id');
    }

    public function syncLogs(): HasMany
    {
        return $this->hasMany(SyncLog::class, 'tps_id');
    }
}
