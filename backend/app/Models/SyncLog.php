<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SyncLog extends Model
{
    use HasFactory;

    protected $table = 'sync_logs';
    public $timestamps = false; // We use waktu_sync timestamp column natively

    protected $fillable = [
        'tps_id',
        'device_id',
        'action',
        'payload',
        'waktu_sync',
    ];

    protected $casts = [
        'waktu_sync' => 'datetime',
    ];

    public function tps(): BelongsTo
    {
        return $this->belongsTo(Tps::class, 'tps_id');
    }
}
