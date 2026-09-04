import type { ModeNomor } from '../utils/excelDasar';

/**
 * Tetapan tingkat aplikasi.
 *
 * Nilai-nilai ini dipakai oleh beberapa hook sekaligus, jadi tempatnya di sini
 * dan bukan di dalam salah satu pemakainya.
 */

/**
 * Live updates reach the origin directly on a forwarded port: the proxy chain in
 * front of it drops the headers a WebSocket handshake needs, so the usual
 * same-origin path cannot carry one. Set per environment via
 * VITE_LIVE_SOCKET_URL — leaving it empty disables the socket and leaves the
 * dashboard on polling, which is what a deployment without its own socket
 * server needs. It must never be pointed at another environment's server, or
 * that environment's activity would drive this one's dashboard.
 */
export const LIVE_SOCKET_URL = import.meta.env.VITE_LIVE_SOCKET_URL ?? '';

/**
 * Used only while the socket is down, so the dashboard keeps moving instead of
 * going stale unnoticed.
 */
export const LIVE_POLL_INTERVAL_MS = 10000;

export const LIVE_SOCKET_RETRY_MS = 15000;

/** Peristiwa socket yang membuat ringkasan dashboard perlu ditarik ulang. */
export const LIVE_EVENTS = ['checkin', 'quick-count', 'update', 'paslon_updated'];

/** Peran yang boleh masuk ke panel web sama sekali. */
export const PERAN_PANEL = ['sekretariat', 'pantarlih', 'monitor'];

/** Rute yang datanya berasal dari ringkasan dashboard. */
const RUTE_DASHBOARD = ['/', '/dashboard', '/quick-count'];

export const adalahRuteDashboard = (path: string) => RUTE_DASHBOARD.includes(path);

/**
 * Tiga tingkat keterbukaan nomor identitas pada berkas ekspor Excel.
 *
 * Sebelumnya hanya ada dua ujungnya: nomor utuh, atau kolomnya dibuang sama
 * sekali. Yang kedua aman dibagikan tapi berkasnya tidak bisa lagi dicocokkan
 * dengan data sumber, jadi orang memilih yang pertama — dan berkas berisi
 * ribuan NIK utuh beredar di grup pesan. Pilihan tengah inilah yang
 * sebenarnya dibutuhkan sehari-hari.
 *
 * Daftarnya di sini, bukan di salah satu layar, karena ekspor Daftar Pemilih
 * dan ekspor per Kartu Keluarga harus menawarkan pilihan yang sama persis.
 */
export const PILIHAN_SENSOR: { mode: ModeNomor; judul: string; keterangan: string }[] = [
  {
    mode: 'sensor',
    judul: 'Disensor — 8 digit terakhir',
    keterangan: 'NIK dan No. KK ditulis ********04010001. Cukup untuk mencocokkan baris, aman dibagikan.',
  },
  {
    mode: 'penuh',
    judul: 'Tanpa sensor — nomor utuh',
    keterangan: 'NIK dan No. KK 16 digit apa adanya. Untuk kerja coklit dan perbaikan data di sekretariat.',
  },
  {
    mode: 'sembunyi',
    judul: 'Disembunyikan — tanpa kolom NIK & No. KK',
    keterangan: 'Kedua kolom tidak ikut sama sekali. Untuk rekap yang tidak perlu menyebut nomor identitas.',
  },
];
