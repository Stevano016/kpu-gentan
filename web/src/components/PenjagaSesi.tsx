import React from 'react';

export interface InfoSesi {
  tanpa_batas: boolean;
  kedaluwarsa_pada: string | null;
  idle_menit: number | null;
}

interface PenjagaSesiProps {
  sesi: InfoSesi | null;
  /** Memanggil endpoint ringan supaya server mencatat sesi ini masih dipakai. */
  perpanjang: () => Promise<void>;
  akhiri: (alasan: 'menganggur' | 'kedaluwarsa') => void;
}

/** Sisa waktu (detik) saat peringatan mulai ditampilkan. */
const AMBANG_PERINGATAN_DETIK = 5 * 60;

/** Seberapa sering sisa waktu dihitung ulang. */
const DENYUT_MS = 5000;

/**
 * Menjaga umur sesi panel web.
 *
 * Pembagian tugasnya dengan server disengaja:
 *
 *   - **Menganggur** diukur di sini, karena hanya peramban yang tahu apakah
 *     ada manusia di depan layar. Server hanya melihat permintaan — dan
 *     dashboard menyegarkan dirinya sendiri tiap 10 detik, sehingga tab yang
 *     ditinggalkan terbuka akan tampak "aktif" selamanya kalau server yang
 *     memutuskan. Sisi server tetap punya pemeriksaan menganggur sebagai
 *     jaring pengaman untuk tab yang ditutup begitu saja.
 *   - **Umur maksimum** dipegang server lewat `expires_at` pada token, karena
 *     batas itu tidak boleh bisa ditawar dari sisi klien.
 *
 * Peringatan lima menit sebelum putus ada karena panel ini penuh formulir.
 * Diputus tanpa aba-aba berarti isian yang sedang diketik hilang begitu saja,
 * dan petugas tidak punya cara tahu apa yang salah.
 */
export const PenjagaSesi: React.FC<PenjagaSesiProps> = ({ sesi, perpanjang, akhiri }) => {
  const [sisaDetik, setSisaDetik] = React.useState<number | null>(null);
  const [alasan, setAlasan] = React.useState<'menganggur' | 'kedaluwarsa'>('menganggur');
  const [memperpanjang, setMemperpanjang] = React.useState(false);

  const aktivitasTerakhir = React.useRef(Date.now());
  const berjalan = !!sesi && !sesi.tanpa_batas && !!sesi.idle_menit;

  // Catat aktivitas nyata pengguna. Peristiwanya dipasang pasif dan hanya
  // menulis ke ref — menyimpannya di state akan me-render ulang seluruh panel
  // setiap kali tetikus bergerak.
  React.useEffect(() => {
    if (!berjalan) return;

    const tandai = () => { aktivitasTerakhir.current = Date.now(); };
    const peristiwa: (keyof WindowEventMap)[] = [
      'mousedown', 'keydown', 'wheel', 'touchstart', 'focus',
    ];

    peristiwa.forEach((p) => window.addEventListener(p, tandai, { passive: true }));
    return () => peristiwa.forEach((p) => window.removeEventListener(p, tandai));
  }, [berjalan]);

  React.useEffect(() => {
    if (!berjalan || !sesi) {
      setSisaDetik(null);
      return;
    }

    // Sesi baru: mulai hitung dari sekarang, bukan dari aktivitas sesi lama.
    aktivitasTerakhir.current = Date.now();

    const periksa = () => {
      const sekarang = Date.now();

      const sisaIdle = sesi.idle_menit! * 60 - Math.floor((sekarang - aktivitasTerakhir.current) / 1000);

      const sisaUmur = sesi.kedaluwarsa_pada
        ? Math.floor((new Date(sesi.kedaluwarsa_pada).getTime() - sekarang) / 1000)
        : Number.POSITIVE_INFINITY;

      // Yang lebih dulu habis itulah yang menentukan.
      const [sisa, sebab] = sisaUmur < sisaIdle
        ? [sisaUmur, 'kedaluwarsa' as const]
        : [sisaIdle, 'menganggur' as const];

      if (sisa <= 0) {
        akhiri(sebab);
        return;
      }

      setAlasan(sebab);
      setSisaDetik(sisa <= AMBANG_PERINGATAN_DETIK ? sisa : null);
    };

    periksa();
    const denyut = window.setInterval(periksa, DENYUT_MS);
    return () => window.clearInterval(denyut);
  }, [berjalan, sesi, akhiri]);

  if (sisaDetik === null) return null;

  const menit = Math.floor(sisaDetik / 60);
  const detik = sisaDetik % 60;
  const hitungMundur = `${menit}:${String(detik).padStart(2, '0')}`;

  const lanjutkan = async () => {
    setMemperpanjang(true);
    try {
      await perpanjang();
      aktivitasTerakhir.current = Date.now();
      setSisaDetik(null);
    } finally {
      setMemperpanjang(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ width: '440px', maxWidth: '92%' }}>
        <div style={{ padding: '28px 28px 24px', textAlign: 'center' }}>
          <div className="sesi-lonceng" aria-hidden="true">⏳</div>

          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '8px' }}>
            {alasan === 'menganggur' ? 'Sesi Akan Berakhir' : 'Batas Waktu Sesi Hampir Habis'}
          </h2>

          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '4px' }}>
            {alasan === 'menganggur'
              ? 'Panel ini tidak disentuh beberapa saat. Demi keamanan data pemilih, sesi akan ditutup otomatis.'
              : 'Sesi Anda sudah mencapai batas waktu maksimal dan akan ditutup. Simpan dulu isian yang belum tersimpan, lalu masuk kembali.'}
          </p>

          <div className="sesi-hitung" aria-live="polite">{hitungMundur}</div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
            {alasan === 'menganggur' && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={lanjutkan}
                disabled={memperpanjang}
              >
                {memperpanjang ? 'Menyambungkan...' : 'Tetap Masuk'}
              </button>
            )}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => akhiri(alasan)}
            >
              Keluar Sekarang
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PenjagaSesi;
