<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Dpt extends Model
{
    use HasFactory;

    /**
     * Pemilih yang gugur (TMS) dihapus lunak, bukan sekadar ditandai.
     *
     * Selama TMS hanya berupa nilai `tahapan`, tiap kueri harus ingat
     * mengecualikannya sendiri, dan satu yang lupa membuat pemilih tercoret
     * ikut terhitung tanpa ada yang menyadarinya. Dengan `deleted_at`, yang
     * dikecualikan menjadi bawaan dan yang memang ingin melihat TMS harus
     * memintanya lewat `withTrashed()`.
     *
     * Kolom `tahapan` tetap berisi `'tms'`, jadi alasan pencoretan dan tahapan
     * asalnya tidak hilang dan pembatalan TMS tetap tahu tujuannya.
     */
    use SoftDeletes;

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
        'tahapan_sebelum_tms',
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

    public function getIsGandaAttribute()
    {
        if (array_key_exists('is_ganda', $this->attributes)) {
            return (bool) $this->attributes['is_ganda'];
        }
        return Dpt::where('nama', $this->nama)
            ->where('nik', '!=', $this->nik)
            ->exists();
    }

    /** Stages a voter is still counted as an active part of the roll. */
    public const TAHAPAN_AKTIF = ['dp4', 'dps', 'dptb', 'dpt', 'dpk'];

    /** Seluruh tahapan yang dikenal, dalam urutan alur pendataan. */
    public const TAHAPAN_SEMUA = ['dp4', 'dps', 'dptb', 'dpt', 'dpk', 'tms'];

    /**
     * Tahapan yang sudah masuk daftar tetap. Hanya keduanya yang berhak
     * memilih, dan hanya keduanya yang ikut dihitung saat DPT dinomori ulang.
     */
    public const TAHAPAN_BERHAK = ['dpt', 'dpk'];

    /**
     * Stages that may be reached from each stage.
     *
     * DPS boleh ke TMS, bukan hanya DP4: data yang tidak memenuhi syarat sering
     * baru ketahuan setelah verifikasi — pemilih meninggal, ganda, atau pindah
     * — dan menutup jalan itu memaksa petugas memundurkan orangnya ke DP4 dulu.
     * Karena itu TMS punya dua jalan pulang, sesuai `tahapan_sebelum_tms`.
     */
    public const TRANSISI = [
        'dp4' => ['dps', 'tms'],
        'dps' => ['dpt', 'tms'],
        'dptb' => ['dpt'],
        'dpt' => ['dpk'],
        'dpk' => ['dpt'],
        'tms' => ['dp4', 'dps'],
    ];

    /** Simpanan peringkat sepanjang satu permintaan; lihat `petaNomorUrut()`. */
    protected static ?array $petaNomorUrut = null;

    protected static function booted(): void
    {
        // Setiap perubahan baris menggeser penomoran seluruh orang di
        // belakangnya, jadi simpanannya dibuang begitu ada yang berubah.
        // Tanpa ini, satu permintaan yang mencoret lalu membaca nomor akan
        // memakai peringkat sebelum pencoretan.
        foreach (['saved', 'deleted', 'restored', 'forceDeleted'] as $peristiwa) {
            static::registerModelEvent($peristiwa, function () {
                static::$petaNomorUrut = null;
            });
        }
    }

    /**
     * Satu-satunya aturan urutan daftar pemilih.
     *
     * Dipakai penomoran, ekspor Excel, dan pembagian sesi jam pada undangan,
     * supaya ketiganya tidak mungkin berbeda. Urutannya:
     *
     *   1. RW, lalu RT — pengelompokan inilah yang dipakai lembar fisik.
     *   2. `no_urut` bawaan berkas DPS, sebagai urutan asal di dalam satu RT.
     *   3. `id_pemilih`, pemecah seri terakhir supaya hasilnya pasti.
     *
     * **Kenapa RW/RT lebih dulu, bukan `no_urut` saja.** `no_urut` merekam
     * urutan berkas DPS saat diimpor. Begitu RT/RW seseorang diperbaiki —
     * dan itu memang salah satu tujuan pendataan — nomornya tidak ikut
     * berpindah, sehingga orang RW 010 bisa duduk di nomor 2 di antara
     * warga RW 001. Mengurutkan wilayahnya lebih dulu mengembalikan daftar
     * itu ke bentuk yang bisa dicocokkan dengan lembar per RW.
     *
     * RW/RT yang kosong ditaruh di belakang yang bernomor, bukan di depan:
     * NULL dan string kosong secara alami mengurut paling awal, dan itu akan
     * menaruh data yang belum lengkap di puncak daftar — tempat paling
     * mencolok untuk baris yang justru paling belum siap.
     */
    public function scopeUrutDaftar($query)
    {
        return $query
            ->orderByRaw("CASE WHEN rw IS NULL OR rw = '' THEN 1 ELSE 0 END ASC")
            ->orderBy('rw')
            ->orderByRaw("CASE WHEN rt IS NULL OR rt = '' THEN 1 ELSE 0 END ASC")
            ->orderBy('rt')
            // Yang belum bernomor menyusul di belakang seluruh yang bernomor.
            ->orderByRaw('CASE WHEN no_urut IS NULL THEN 1 ELSE 0 END ASC')
            ->orderBy('no_urut')
            ->orderBy('id_pemilih');
    }

    /**
     * Nomor urut seluruh pemilih sekaligus, `nik => nomor`.
     *
     * Inilah satu-satunya tempat nomor urut dihitung. Sempat ada versi satuan
     * yang menghitung "berapa orang di depan saya" dengan COUNT, tapi begitu
     * urutannya memakai empat kunci, perbandingan leksikografisnya jadi rumit
     * dan gampang meleset satu angka dari versi borongan ini — perbedaan yang
     * baru ketahuan saat undangan tercetak tidak cocok dengan layar.
     *
     * Hasilnya disimpan sepanjang permintaan: satu pencarian publik menomori
     * lima orang, dan tanpa simpanan itu berarti lima kali membaca tabel.
     */
    public static function petaNomorUrut(): array
    {
        if (static::$petaNomorUrut !== null) {
            return static::$petaNomorUrut;
        }

        $peta = [];
        foreach (self::query()->urutDaftar()->pluck('nik') as $posisi => $nik) {
            $peta[$nik] = $posisi + 1;
        }

        return static::$petaNomorUrut = $peta;
    }

    /**
     * Nomor urut seorang pemilih di dalam daftar sedesa, mulai dari 1.
     *
     * Nomornya dihitung saat diminta, bukan disimpan, dan itulah yang membuatnya
     * ikut bergerak: begitu seseorang di depan dicoret jadi TMS, barisnya keluar
     * dari daftar dan semua yang di belakangnya naik satu. Tidak ada penomoran
     * ulang yang harus dijalankan siapa pun.
     *
     * Yang menutup lubang itu adalah penghapusan lunaknya sendiri — daftar di
     * `petaNomorUrut()` tidak menyebut TMS sama sekali, karena baris terhapus
     * memang sudah tidak ikut dihitung.
     *
     * Mengembalikan `null` untuk pemilih yang sudah dicoret: ia tidak ada di
     * daftar, jadi ia tidak punya nomor urut di daftar itu.
     */
    public static function nomorUrut(self $pemilih): ?int
    {
        if ($pemilih->trashed()) {
            return null;
        }

        return self::petaNomorUrut()[$pemilih->nik] ?? null;
    }

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
