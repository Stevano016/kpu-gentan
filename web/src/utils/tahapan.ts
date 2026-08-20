/**
 * The pendataan flow, in order:
 *
 *   DP4 --verifikasi--> DPS  --+
 *                              +--penetapan--> DPT --pilah--> DPK
 *   DPTb ---------------------+
 *
 *   DP4 --tidak lolos--> TMS
 *
 * One definition for every screen, so a stage cannot end up labelled or
 * coloured differently depending on where it is shown.
 */
export interface TahapanMeta {
  singkat: string;
  label: string;
  badge: string;
  keterangan: string;
}

export const TAHAPAN: Record<string, TahapanMeta> = {
  dp4: {
    singkat: 'DP4',
    label: 'DP4 — Belum Diverifikasi',
    badge: 'badge-info',
    keterangan: 'Data mentah hasil impor, menunggu verifikasi.',
  },
  dps: {
    singkat: 'DPS',
    label: 'DPS — Pemilih Sementara',
    badge: 'badge-info',
    keterangan: 'Lolos verifikasi DP4, menunggu penetapan.',
  },
  dptb: {
    singkat: 'DPTb',
    label: 'DPTb — Pemilih Tambahan',
    badge: 'badge-info',
    keterangan: 'Didaftarkan setelah verifikasi selesai.',
  },
  dpt: {
    singkat: 'DPT',
    label: 'DPT — Pemilih Tetap',
    badge: 'badge-success',
    keterangan: 'Gabungan DPS dan DPTb yang sudah ditetapkan.',
  },
  dpk: {
    singkat: 'DPK',
    label: 'DPK — Pemilih Khusus',
    badge: 'badge-warning',
    keterangan: 'Kasus khusus yang dipilah keluar dari DPT.',
  },
  tms: {
    singkat: 'TMS',
    label: 'TMS — Tidak Memenuhi Syarat',
    badge: 'badge-danger',
    keterangan: 'Gugur saat verifikasi; data tetap disimpan.',
  },
};

export const URUTAN_TAHAPAN = ['dp4', 'dps', 'dptb', 'dpt', 'dpk', 'tms'] as const;

export const metaTahapan = (tahapan?: string | null): TahapanMeta =>
  TAHAPAN[tahapan ?? ''] ?? {
    singkat: (tahapan ?? '-').toUpperCase(),
    label: tahapan ?? '-',
    badge: 'badge-info',
    keterangan: '',
  };

/** Only these two may actually vote; the rest are still in process or excluded. */
export const BERHAK_MEMILIH = ['dpt', 'dpk'];

/**
 * Keterangan hasil pemeriksaan pemilih. Harus sama persis dengan
 * `Dpt::KETERANGAN` di backend.
 */
export const KETERANGAN = [
  '1 : Terverifikasi/Valid',
  '2 : Belum memiliki KTP-el',
  '3 : Ubah Elemen Data',
  '4 : Meninggal',
  '5 : Ganda',
  '6 : Dibawah Umur',
  '7 : Tidak Ditemukan',
];

/** Keterangan yang berarti pemilih gugur. */
export const KETERANGAN_TMS = [
  '4 : Meninggal',
  '5 : Ganda',
  '6 : Dibawah Umur',
  '7 : Tidak Ditemukan',
];
