<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Paslon extends Model
{
    protected $table = 'paslons';

    protected $fillable = [
        'nomor_urut',
        'nama_ketua',
        'foto',
    ];

    /** URL foto siap pakai untuk klien; kolomnya hanya menyimpan path. */
    protected $appends = ['foto_url'];

    public function getFotoUrlAttribute(): ?string
    {
        return $this->foto ? asset('storage/' . $this->foto) : null;
    }
}
