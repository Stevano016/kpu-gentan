import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiService } from '../services/api';
import { bacaJson } from '../utils/request';
import { unduhUndanganGabungan, type PemilihUndangan } from '../utils/undanganC6';
import type { Feedback } from '../types/app';

/**
 * Cetak undangan maraton: satu TPS dipecah menjadi segmen 20/50/75 orang,
 * diunduh berurutan, dan segmen yang sudah selesai diberi markah.
 *
 * Markahnya yang membuat ini berguna. Mencetak 1.600 undangan satu TPS butuh
 * berjam-jam dan beberapa kali pindah shift petugas; tanpa catatan segmen mana
 * yang sudah keluar, satu-satunya cara mengetahuinya adalah membuka berkas
 * unduhan satu per satu — dan kekeliruannya berujung pada orang yang menerima
 * dua undangan sementara tetangganya tidak menerima apa pun.
 *
 * Markah disimpan di localStorage peramban, bukan di server: yang perlu tahu
 * sudah sampai mana hanyalah komputer yang dipakai mencetak, dan menyimpannya
 * di server berarti satu petugas menandai selesai untuk petugas lain yang
 * berkasnya belum pernah ia terima.
 */

/** Pilihan besar segmen. Angkanya dari cara sekretariat mencetak: satu rim
 *  kertas, satu sesi antrean, atau satu hari kerja. */
export const UKURAN_SEGMEN = [20, 50, 75] as const;

export interface Segmen {
  indeks: number;
  awal: number;
  akhir: number;
  jumlah: number;
  selesai: boolean;
}

interface Argumen {
  token: string | null;
  feedback: Feedback;
}

export interface MaratonController {
  terbuka: boolean;
  tps: { id: string; nama: string } | null;
  buka: (tpsId: string, namaTps: string) => void;
  tutup: () => void;
  memuat: boolean;
  daftar: PemilihUndangan[];
  jumlahAktif: number;
  ukuran: number;
  setUkuran: (n: number) => void;
  denganTemplate: boolean;
  setDenganTemplate: (v: boolean) => void;
  segmen: Segmen[];
  segmenBerikutnya: Segmen | null;
  sedangUnduh: number | null;
  kemajuan: { selesai: number; total: number } | null;
  unduhSegmen: (indeks: number) => Promise<void>;
  lupakanTanda: () => void;
}

const kunciTanda = (tpsId: string, ukuran: number) => `gentara:undangan-maraton:${tpsId}:${ukuran}`;

const bacaTanda = (tpsId: string, ukuran: number): number[] => {
  try {
    const isi = localStorage.getItem(kunciTanda(tpsId, ukuran));
    const data = isi ? JSON.parse(isi) : [];
    return Array.isArray(data) ? data.filter((n) => Number.isInteger(n)) : [];
  } catch {
    // Peramban dengan penyimpanan diblokir tetap boleh mencetak; yang hilang
    // hanya markahnya.
    return [];
  }
};

const tulisTanda = (tpsId: string, ukuran: number, nilai: number[]): void => {
  try {
    localStorage.setItem(kunciTanda(tpsId, ukuran), JSON.stringify(nilai));
  } catch { /* biarkan; markah bukan syarat mencetak */ }
};

export function useUndanganMaraton({ token, feedback }: Argumen): MaratonController {
  const { showSuccess, showError, showConfirm } = feedback;

  const [terbuka, setTerbuka] = useState(false);
  const [tps, setTps] = useState<{ id: string; nama: string } | null>(null);
  const [memuat, setMemuat] = useState(false);
  const [daftar, setDaftar] = useState<PemilihUndangan[]>([]);
  const [jumlahAktif, setJumlahAktif] = useState(0);
  const [ukuran, setUkuran] = useState<number>(UKURAN_SEGMEN[0]);
  const [denganTemplate, setDenganTemplate] = useState(true);
  const [sudah, setSudah] = useState<number[]>([]);
  const [sedangUnduh, setSedangUnduh] = useState<number | null>(null);
  const [kemajuan, setKemajuan] = useState<{ selesai: number; total: number } | null>(null);

  const buka = useCallback((tpsId: string, namaTps: string) => {
    setTps({ id: tpsId, nama: namaTps });
    setTerbuka(true);
  }, []);

  const tutup = useCallback(() => {
    // Ditutup saat masih menyusun berkas berarti berkasnya tidak pernah
    // tersimpan tapi segmennya bisa ikut tertandai; jadi tidak boleh.
    if (sedangUnduh !== null) return;
    setTerbuka(false);
    setTps(null);
    setDaftar([]);
    setJumlahAktif(0);
  }, [sedangUnduh]);

  // Daftar satu TPS diambil sekali per pembukaan, bukan per segmen: isinya
  // tidak berubah selama pencetakan, dan segmen berikutnya harus bisa langsung
  // dimulai tanpa menunggu jaringan lagi.
  useEffect(() => {
    if (!terbuka || !token || !tps) return;
    let dibatalkan = false;
    setMemuat(true);

    ApiService.daftarUndangan(token, tps.id)
      .then(async (res) => {
        const json = await bacaJson(res);
        if (dibatalkan) return;

        if (!res.ok || json?.status !== 'success') {
          showError(json?.message || 'Gagal memuat daftar undangan.', 'Gagal Memuat');
          setDaftar([]);
          return;
        }

        setDaftar(json.data.baris ?? []);
        setJumlahAktif(json.data.jumlah_aktif ?? 0);
      })
      .catch(() => { if (!dibatalkan) showError('Gagal menghubungi server.', 'Gagal Memuat'); })
      .finally(() => { if (!dibatalkan) setMemuat(false); });

    return () => { dibatalkan = true; };
  }, [terbuka, token, tps, showError]);

  // Markah dibaca ulang tiap kali TPS atau besar segmennya berganti — segmen
  // ke-3 dari 20 orang bukan segmen ke-3 dari 75 orang.
  useEffect(() => {
    setSudah(tps ? bacaTanda(tps.id, ukuran) : []);
  }, [tps, ukuran]);

  const segmen = useMemo<Segmen[]>(() => {
    const hasil: Segmen[] = [];

    for (let awal = 0; awal < daftar.length; awal += ukuran) {
      const akhir = Math.min(awal + ukuran, daftar.length);
      const indeks = hasil.length;
      hasil.push({
        indeks,
        awal: awal + 1,
        akhir,
        jumlah: akhir - awal,
        selesai: sudah.includes(indeks),
      });
    }

    return hasil;
  }, [daftar.length, ukuran, sudah]);

  const segmenBerikutnya = useMemo(
    () => segmen.find((s) => !s.selesai) ?? null,
    [segmen],
  );

  const unduhSegmen = useCallback(async (indeks: number) => {
    if (sedangUnduh !== null || !tps) return;

    const potongan = daftar.slice(indeks * ukuran, (indeks + 1) * ukuran);
    if (!potongan.length) return;

    const jalankan = async () => {
      setSedangUnduh(indeks);
      setKemajuan({ selesai: 0, total: potongan.length });

      try {
        const label = tps.nama.replace(/\s+/g, '-');
        const awal = String(indeks * ukuran + 1).padStart(4, '0');
        const akhir = String(indeks * ukuran + potongan.length).padStart(4, '0');
        const akhiran = denganTemplate ? '' : '_Hanya_Data';

        const berkas = await unduhUndanganGabungan(
          potongan,
          denganTemplate,
          `Undangan_${label}_${awal}-${akhir}${akhiran}.pdf`,
          (selesai, total) => setKemajuan({ selesai, total }),
        );

        // Ditandai hanya setelah berkasnya benar-benar tersusun dan diunduh.
        const baru = sudah.includes(indeks) ? sudah : [...sudah, indeks].sort((a, b) => a - b);
        setSudah(baru);
        tulisTanda(tps.id, ukuran, baru);

        showSuccess(
          'Segmen Selesai Diunduh',
          `${berkas} — ${potongan.length} undangan (nomor ${indeks * ukuran + 1}–${indeks * ukuran + potongan.length} di ${tps.nama}).`,
        );
      } catch {
        showError('Gagal menyusun berkas undangan. Segmen ini belum ditandai selesai.', 'Gagal Mengunduh');
      } finally {
        setSedangUnduh(null);
        setKemajuan(null);
      }
    };

    // Mengunduh ulang segmen yang sudah ditandai biasanya tidak disengaja —
    // dan hasilnya undangan ganda di tangan pemilih.
    if (sudah.includes(indeks)) {
      showConfirm(
        'Unduh Ulang Segmen Ini?',
        `Segmen ${indeks + 1} sudah pernah diunduh. Unduh ulang hanya bila berkasnya hilang atau gagal dicetak.`,
        () => { void jalankan(); },
        'Unduh Ulang',
      );
      return;
    }

    await jalankan();
  }, [sedangUnduh, tps, daftar, ukuran, denganTemplate, sudah, showSuccess, showError, showConfirm]);

  const lupakanTanda = useCallback(() => {
    if (!tps || sedangUnduh !== null) return;

    showConfirm(
      'Hapus Semua Markah?',
      `Seluruh catatan segmen yang sudah diunduh untuk ${tps.nama} (segmen ${ukuran} orang) akan dikosongkan. Berkas yang sudah diunduh tidak terpengaruh.`,
      () => {
        setSudah([]);
        tulisTanda(tps.id, ukuran, []);
      },
      'Hapus Markah',
      true,
    );
  }, [tps, ukuran, sedangUnduh, showConfirm]);

  return {
    terbuka,
    tps,
    buka,
    tutup,
    memuat,
    daftar,
    jumlahAktif,
    ukuran,
    setUkuran,
    denganTemplate,
    setDenganTemplate,
    segmen,
    segmenBerikutnya,
    sedangUnduh,
    kemajuan,
    unduhSegmen,
    lupakanTanda,
  };
}
