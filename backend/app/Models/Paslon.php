<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Paslon extends Model
{
    protected $table = 'paslons';

    protected $fillable = [
        'nomor_urut',
        'nama_ketua',
        'nama_wakil',
    ];
}
