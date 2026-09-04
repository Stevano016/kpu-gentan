import React from 'react';
import { LIVE_POLL_INTERVAL_MS } from '../constants/app';
import type { ModeLangsung } from '../hooks/useLiveDashboard';

interface Props {
  mode: ModeLangsung;
  /** Epoch ms saat angka terakhir sampai dari server. */
  terakhir: number | null;
}

/**
 * Penanda bahwa angka di halaman ini bergerak sendiri — dan sejak kapan.
 *
 * Dashboard sudah menyegarkan dirinya sejak lama, tapi tidak ada satu pun
 * tanda di layar yang mengatakannya. Angka yang baru diperbarui sedetik lalu
 * dan angka yang diam setengah jam karena sambungannya mati **tampak sama
 * persis**, dan satu-satunya cara memastikan adalah menekan Segarkan lalu
 * memperhatikan apakah ada yang berubah. Itu sebabnya orang bertanya apakah
 * dashboardnya sudah realtime: bukan karena tidak realtime, tapi karena tidak
 * kelihatan.
 *
 * Karena itu yang ditampilkan adalah keadaan sambungan sekaligus umur
 * datanya. Umur itu yang paling berguna: kalau ia berhenti bertambah, ada
 * yang salah, dan itu terbaca tanpa perlu menekan apa pun.
 */
export const IndikatorLangsung: React.FC<Props> = ({ mode, terakhir }) => {
  // Umur data harus bertambah sendiri di layar, jadi komponennya berdenyut
  // tiap detik. Hanya saat halamannya benar-benar hidup.
  const [, paksaGambar] = React.useState(0);

  React.useEffect(() => {
    if (mode === 'mati') return;
    const jam = window.setInterval(() => paksaGambar((n) => n + 1), 1000);
    return () => window.clearInterval(jam);
  }, [mode]);

  if (mode === 'mati') return null;

  const detik = terakhir ? Math.max(0, Math.round((Date.now() - terakhir) / 1000)) : null;

  const umur = detik === null
    ? 'belum ada data'
    : detik < 5
      ? 'baru saja'
      : detik < 60
        ? `${detik} detik lalu`
        : detik < 3600
          ? `${Math.floor(detik / 60)} menit lalu`
          : `${Math.floor(detik / 3600)} jam lalu`;

  const jeda = Math.round(LIVE_POLL_INTERVAL_MS / 1000);

  const rupa = {
    langsung: {
      label: 'Langsung',
      judul: 'Tersambung ke server. Setiap perubahan — check-in, quick count, tahapan pemilih — langsung terkirim ke halaman ini.',
    },
    menyambung: {
      label: 'Menyambung...',
      judul: 'Sedang membuka sambungan langsung ke server.',
    },
    berkala: {
      label: `Berkala ${jeda} detik`,
      judul: `Sambungan langsung tidak tersedia, jadi angkanya ditarik ulang tiap ${jeda} detik. Tetap bergerak, hanya bisa tertinggal sebentar.`,
    },
  }[mode];

  return (
    <span
      className={`indikator-langsung mode-${mode}`}
      title={`${rupa.judul} Angka terakhir diperbarui ${umur}.`}
    >
      <span className="titik" aria-hidden="true" />
      <span>{rupa.label}</span>
      <span className="pemisah" aria-hidden="true">·</span>
      <span className="umur">diperbarui {umur}</span>
    </span>
  );
};
