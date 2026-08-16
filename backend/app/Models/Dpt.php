<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Dpt extends Model
{
    use HasFactory;

    protected $table = 'dpt';
    protected $primaryKey = 'nik';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'nik',
        'nkk',
        'nama',
        'tps_id',
        'status_hadir',
        'waktu_checkin',
        'qr_payload',
        'jenis_pemilih',
        'id_pemilih',
        'umur',
        'status_kawin',
        'jenis_kelamin',
        'alamat',
        'rt',
        'rw',
        'pekerjaan',
        'disabilitas',
        'keterangan',
    ];

    protected $casts = [
        'status_hadir' => 'boolean',
        'waktu_checkin' => 'datetime',
    ];

    public function tps(): BelongsTo
    {
        return $this->belongsTo(Tps::class, 'tps_id');
    }
}
