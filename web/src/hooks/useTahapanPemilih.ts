import { useCallback, useMemo } from 'react';
import { ApiService } from '../services/api';
import { jalankanAksi } from '../utils/request';
import { KETERANGAN_TMS } from '../utils/tahapan';
import type { Feedback } from '../types/app';

interface Argumen {
  token: string | null;
  /** TPS yang sedang disaring; menentukan lingkup aksi massal. */
  tpsFilter: string;
  feedback: Feedback;
  /** Dipanggil setelah tahapan berubah, supaya tabel dan angkanya menyusul. */
  onSelesai: () => void;
}

export interface TahapanController {
  handleVerifikasiDp4: () => void;
  handleTetapkanDpt: () => void;
  handleTandaiTms: (voter: any) => void;
  handleBatalkanTms: (nik: string) => void;
  handleTandaiDpk: (nik: string, nama: string) => void;
  handleBatalkanDpk: (nik: string) => void;
}

const ALASAN_DPK = [
  'Menikah di bawah usia 17 tahun',
  'Sudah menikah',
  'Purnawirawan TNI/Polri',
];

/**
 * Perpindahan tahapan pendataan: DP4 → DPS → DPT, plus penandaan TMS dan DPK.
 *
 * Semuanya memakai alur yang sama — konfirmasi atau minta alasan, kirim, lalu
 * segarkan tabel dan ringkasannya.
 */
export function useTahapanPemilih({ token, tpsFilter, feedback, onSelesai }: Argumen): TahapanController {
  const { showSuccess, showError, showConfirm, mintaAlasan } = feedback;

  const jalankan = useCallback(async (aksi: () => Promise<Response>, judulGagal: string) => {
    if (!token) return;
    const hasil = await jalankanAksi(aksi);
    if (!hasil) {
      showError('Gagal menghubungi server.', judulGagal);
      return;
    }
    if (!hasil.ok) {
      showError(hasil.json.message || 'Perubahan tahapan ditolak.', judulGagal);
      return;
    }
    showSuccess('Berhasil', hasil.json.message || 'Perubahan tahapan tersimpan.');
    onSelesai();
  }, [token, showSuccess, showError, onSelesai]);

  /** Aksi massal berlaku pada TPS yang sedang disaring, atau seluruhnya. */
  const lingkupTps = useMemo(() => (tpsFilter ? { tps_id: tpsFilter } : {}), [tpsFilter]);
  const namaLingkup = tpsFilter ? 'TPS yang sedang dipilih' : 'SELURUH TPS';

  const handleVerifikasiDp4 = useCallback(() => {
    showConfirm(
      'Verifikasi DP4 jadi DPS?',
      `Semua data DP4 pada ${namaLingkup} akan dinyatakan lolos verifikasi dan menjadi DPS. Data yang tidak memenuhi syarat sebaiknya ditandai TMS lebih dulu.`,
      () => jalankan(() => ApiService.verifikasiDp4(token!, lingkupTps), 'Gagal Verifikasi'),
      'Verifikasi',
    );
  }, [showConfirm, namaLingkup, jalankan, token, lingkupTps]);

  const handleTetapkanDpt = useCallback(() => {
    showConfirm(
      'Tetapkan sebagai DPT?',
      `DPS dan DPTb pada ${namaLingkup} akan digabung menjadi DPT. Penetapan ditolak bila masih ada DP4 yang belum diverifikasi.`,
      () => jalankan(() => ApiService.tetapkanDpt(token!, lingkupTps), 'Gagal Menetapkan'),
      'Tetapkan',
    );
  }, [showConfirm, namaLingkup, jalankan, token, lingkupTps]);

  const handleTandaiTms = useCallback((voter: any) => {
    const options = KETERANGAN_TMS.map(val => {
      let disabled = false;
      if (val.includes('Ganda') && !voter.is_ganda) {
        disabled = true;
      }
      if (val.includes('Dibawah Umur') && voter.umur >= 17) {
        disabled = true;
      }
      return { value: val, disabled };
    });

    mintaAlasan(
      'Tandai Tidak Memenuhi Syarat',
      `Mengapa ${voter.nama} tidak memenuhi syarat? Alasan ini tersimpan bersama datanya dan bisa dibatalkan.`,
      [],
      (alasan) => jalankan(() => ApiService.tandaiTms(token!, voter.nik, alasan), 'Gagal Menandai TMS'),
      options,
    );
  }, [mintaAlasan, jalankan, token]);

  const handleBatalkanTms = useCallback((nik: string) => {
    showConfirm(
      'Batalkan penandaan TMS?',
      'Data akan dikembalikan ke DP4 dan ikut diverifikasi lagi.',
      () => jalankan(() => ApiService.batalkanTms(token!, nik), 'Gagal Membatalkan'),
      'Kembalikan',
    );
  }, [showConfirm, jalankan, token]);

  const handleTandaiDpk = useCallback((nik: string, nama: string) => {
    mintaAlasan(
      'Pindahkan ke DPK',
      `Kasus khusus apa yang membuat ${nama} masuk DPK? Setelah dipindahkan, ia tidak lagi dihitung sebagai DPT.`,
      ALASAN_DPK,
      (alasan) => jalankan(() => ApiService.tandaiDpk(token!, nik, alasan), 'Gagal Memindahkan'),
    );
  }, [mintaAlasan, jalankan, token]);

  const handleBatalkanDpk = useCallback((nik: string) => {
    showConfirm(
      'Kembalikan ke DPT?',
      'Pemilih akan dihitung kembali sebagai DPT biasa.',
      () => jalankan(() => ApiService.batalkanDpk(token!, nik), 'Gagal Mengembalikan'),
      'Kembalikan',
    );
  }, [showConfirm, jalankan, token]);

  return {
    handleVerifikasiDp4,
    handleTetapkanDpt,
    handleTandaiTms,
    handleBatalkanTms,
    handleTandaiDpk,
    handleBatalkanDpk,
  };
}
