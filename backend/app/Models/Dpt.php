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
        'nik_sintetis',
        'nkk_sintetis',
        'nama',
        'tps_id',
        'status_hadir',
        'waktu_checkin',
        'qr_payload',
        'asal',
        'tahapan',
        'tms_alasan',
        'dpk_alasan',
        'diverifikasi_pada',
        'id_pemilih',
        'no_urut',
        'umur',
        'status_kawin',
        'jenis_kelamin',
        'alamat',
        'rt',
        'rw',
        'pekerjaan',
        'disabilitas',
        'keterangan',
        'catatan_impor',
    ];

    protected $casts = [
        'status_hadir' => 'boolean',
        'nik_sintetis' => 'boolean',
        'nkk_sintetis' => 'boolean',
        'waktu_checkin' => 'datetime',
        'diverifikasi_pada' => 'datetime',
    ];

    /**
     * Older builds of the mobile app read `jenis_pemilih`, which is no longer a
     * column. Exposing the current stage under the old key keeps those installs
     * working until every device has been updated.
     */
    protected $appends = ['jenis_pemilih'];

    /**
     * Hasil pemeriksaan seorang pemilih: `dps` berarti lolos, sisanya alasan
     * gugur. Dipakai bersama oleh form pendataan dan aksi TMS supaya tidak ada
     * dua daftar alasan yang bisa berbeda isi.
     */
    public const KETERANGAN = [
        '1 : Terverifikasi/Valid',
        '2 : Belum memiliki KTP-el',
        '3 : Ubah Elemen Data',
        '4 : Meninggal',
        '5 : Ganda',
        '6 : Dibawah Umur',
        '7 : Tidak Ditemukan',
    ];

    /** Awalan nomor sementara buatan sistem, dipakai saat NIK/NKK seseorang
     * belum ada di data pembanding. 99 bukan kode provinsi yang sah, jadi nomor
     * ini mustahil bentrok dengan nomor asli dan langsung kelihatan palsu.
     */
    public const AWALAN_NIK_SINTETIS = '9999';
    public const AWALAN_NKK_SINTETIS = '9998';

    /** Keterangan yang berarti pemilih gugur. */
    public const KETERANGAN_TMS = [
        '4 : Meninggal',
        '5 : Ganda',
        '6 : Dibawah Umur',
        '7 : Tidak Ditemukan',
    ];

    /** Stages a voter is still counted as an active part of the roll. */
    public const TAHAPAN_AKTIF = ['dp4', 'dps', 'dptb', 'dpt', 'dpk'];

    /** Stages that may be reached from each stage. */
    public const TRANSISI = [
        'dp4' => ['dps', 'tms'],
        'dps' => ['dpt'],
        'dptb' => ['dpt'],
        'dpt' => ['dpk'],
        'dpk' => ['dpt'],
        'tms' => ['dp4'],
    ];

    public function getJenisPemilihAttribute(): ?string
    {
        return $this->tahapan;
    }

    public function scopeTahapan($query, string|array $tahapan)
    {
        return $query->whereIn('tahapan', (array) $tahapan);
    }

    public function tps(): BelongsTo
    {
        return $this->belongsTo(Tps::class, 'tps_id');
    }
}
