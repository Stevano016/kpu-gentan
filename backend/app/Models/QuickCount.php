<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuickCount extends Model
{
    use HasFactory;

    protected $table = 'quick_counts';
    protected $primaryKey = 'tps_id';
    public $incrementing = false;

    protected $fillable = [
        'tps_id',
        'kandidat_1',
        'kandidat_2',
        'kandidat_3',
        'suara_tidak_sah',
        'status',
        'submitted_at',
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
    ];

    public function tps(): BelongsTo
    {
        return $this->belongsTo(Tps::class, 'tps_id');
    }
}
