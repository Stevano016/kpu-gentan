import { useEffect, useRef, useState } from 'react';
import {
  LIVE_EVENTS,
  LIVE_KEEPALIVE_MS,
  LIVE_POLL_INTERVAL_MS,
  LIVE_SAFETY_MAX_AGE_MS,
  LIVE_SOCKET_RETRY_MS,
  LIVE_SOCKET_URL,
  LIVE_TICK_MS,
  adalahRuteDashboard,
} from '../constants/app';

interface Argumen {
  token: string | null;
  path: string;
  isPantarlih: boolean;
  /** Penyegaran senyap; dipanggil tiap kali ada kabar perubahan. */
  refresh: () => void;
}

/**
 * Bagaimana angka di layar sampai ke sana.
 *
 * - `menyambung` — socket sedang dibuka; keadaan sepersekian detik pertama.
 * - `langsung`   — socket tersambung; perubahan didorong server begitu terjadi.
 * - `berkala`    — socket tidak bisa dipakai; angkanya ditarik tiap beberapa
 *                  detik, jadi bisa tertinggal sebentar tapi tidak pernah diam.
 * - `mati`       — halaman ini memang tidak menyalakan pembaruan otomatis.
 *
 * `menyambung` ada supaya indikatornya tidak sempat berbohong: menampilkan
 * "langsung" sebelum socket-nya benar-benar terbuka membuat halaman tampak
 * hidup padahal belum, dan itu justru keadaan yang perlu terlihat.
 */
export type ModeLangsung = 'menyambung' | 'langsung' | 'berkala' | 'mati';

/** Alamat socket: lokal selalu ke port terusan di mesin yang sama. */
const alamatSocket = () => {
  const host = window.location.hostname || 'localhost';
  const isLocalHost = host === 'localhost' || host === '127.0.0.1';
  if (isLocalHost) {
    return `ws://${host}:8080`;
  }
  if (LIVE_SOCKET_URL) {
    return LIVE_SOCKET_URL;
  }
  // Dinamis: Ikuti protokol (ws/wss) dan domain/port aktif yang diakses browser
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws`;
};

/**
 * Pembaruan mandiri untuk dashboard dan quick count.
 *
 * Socket dihubungi langsung di port terusan karena rantai proxy di depan
 * origin membuang header Connection/Upgrade yang dibutuhkan handshake. Kalau
 * socket tidak bisa dibangun, angkanya ditarik berkala — supaya ia tidak pernah
 * berhenti bergerak di tengah penghitungan.
 *
 * **Layar quick count dibiarkan menyala berjam-jam**, dan itu mengubah cara
 * hook ini harus dibangun. Selain socket, ada tiga hal yang menjaganya:
 *
 *   1. **Jaring pengaman.** Data yang lebih tua dari `LIVE_SAFETY_MAX_AGE_MS`
 *      ditarik ulang walaupun socket mengaku tersambung. Socket yang diputus
 *      diam-diam oleh proxy tidak selalu mengirim frame penutup, jadi
 *      `onclose` bisa tidak pernah terpanggil — dan tanpa jaring ini layarnya
 *      membeku tanpa satu pun tanda.
 *   2. **Denyut.** Pesan teks pendek tiap `LIVE_KEEPALIVE_MS` supaya proxy
 *      tidak menganggap sambungannya menganggur, sekaligus memaksa sambungan
 *      setengah mati gagal dan tersambung ulang.
 *   3. **Tarik ulang saat tersambung.** Setiap kali socket terbuka, angkanya
 *      langsung ditarik — perubahan yang terjadi selama terputus tidak akan
 *      disiarkan ulang oleh siapa pun.
 *
 * Socket tidak dibangun ulang saat pindah antar halaman dashboard: penonton
 * yang berpindah dari Dashboard ke Quick Count tidak perlu kehilangan
 * sambungan yang sudah hidup.
 *
 * Hanya dashboard yang menyegarkan diri. Memuat ulang daftar saat seseorang
 * sedang menyisirnya membuat dia kehilangan posisi bacanya, jadi layar lain
 * dibiarkan tenang.
 */
export function useLiveDashboard({ token, path, isPantarlih, refresh }: Argumen): ModeLangsung {
  const [mode, setMode] = useState<ModeLangsung>('mati');

  // Disimpan di ref supaya perubahan identitas `refresh` tidak membangun ulang
  // socket. Sambungan yang menyala berjam-jam tidak boleh tergantung pada
  // kapan komponen di atasnya menggambar ulang.
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  const aktif = !!token && !isPantarlih && adalahRuteDashboard(path);

  useEffect(() => {
    if (!aktif) {
      setMode('mati');
      return;
    }

    const socketUrl = alamatSocket();

    let socket: WebSocket | null = null;
    let tickId: number | undefined;
    let denyutId: number | undefined;
    let retryId: number | undefined;
    let disposed = false;
    /** Kapan penyegaran terakhir diminta; dasar perhitungan umur data. */
    let terakhirDiminta = 0;

    const segarkan = () => {
      if (document.hidden) return;
      terakhirDiminta = Date.now();
      refreshRef.current();
    };

    /** Umur data yang masih ditoleransi, tergantung apakah socket hidup. */
    const batasUmur = () =>
      socket && socket.readyState === WebSocket.OPEN
        ? LIVE_SAFETY_MAX_AGE_MS
        : LIVE_POLL_INTERVAL_MS;

    const periksa = () => {
      if (disposed || document.hidden) return;
      if (Date.now() - terakhirDiminta >= batasUmur()) segarkan();
    };

    const denyut = () => {
      if (!socket || socket.readyState !== WebSocket.OPEN) return;
      try {
        socket.send('ping');
      } catch {
        // Socket yang sudah tidak bisa ditulisi akan menutup sendiri lewat
        // onclose; tidak ada yang perlu dilakukan di sini.
      }
    };

    const connect = () => {
      if (disposed) return;

      // Tidak ada socket untuk pemasangan ini — penarikan berkala jadi
      // satu-satunya jalan, dan pengawas di bawah yang menjalankannya.
      if (!socketUrl) {
        setMode('berkala');
        return;
      }

      setMode('menyambung');
      socket = new WebSocket(socketUrl);

      socket.onopen = () => {
        if (disposed) return;
        setMode('langsung');
        // Susul perubahan yang terjadi selama sambungannya terputus.
        segarkan();
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (LIVE_EVENTS.includes(payload.event)) segarkan();
        } catch {
          // A malformed frame is not worth interrupting the operator over.
        }
      };

      socket.onclose = () => {
        socket = null;
        if (disposed) return;
        setMode('berkala');
        retryId = window.setTimeout(connect, LIVE_SOCKET_RETRY_MS);
      };
    };

    // Pengawas dan denyut berjalan terus, apa pun keadaan socket-nya.
    tickId = window.setInterval(periksa, LIVE_TICK_MS);
    denyutId = window.setInterval(denyut, LIVE_KEEPALIVE_MS);
    connect();

    // Langsung susul begitu petugas kembali ke tab ini.
    document.addEventListener('visibilitychange', segarkan);

    return () => {
      disposed = true;
      document.removeEventListener('visibilitychange', segarkan);
      window.clearInterval(tickId);
      window.clearInterval(denyutId);
      if (retryId !== undefined) window.clearTimeout(retryId);
      if (socket) {
        // Lepas penanganan sebelum menutup: `onclose` di atas akan menjadwalkan
        // penyambungan ulang, dan hook yang sudah dibongkar tidak boleh
        // meninggalkan timer hidup.
        socket.onclose = null;
        socket.close();
      }
    };
  }, [aktif]);

  return mode;
}
