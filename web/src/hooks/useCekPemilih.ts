import { useCallback, useState } from 'react';
import { ApiService } from '../services/api';
import { bacaJson } from '../utils/request';
import type { PemilihPublik } from '../types/app';

export type ModePencarian = 'nik' | 'nama';

export interface FormPencarian {
  nik: string;
  nama: string;
  rt: string;
  rw: string;
}

const FORM_KOSONG: FormPencarian = { nik: '', nama: '', rt: '', rw: '' };

/** NIK boleh sebagian: warga sering hanya ingat empat digit terakhir. */
const NIK_MINIMAL = 4;
const NAMA_MINIMAL = 3;

/**
 * Validasi sebelum permintaan dikirim; `null` berarti form sudah layak.
 *
 * Dipisahkan dari `cari` supaya urutan pesannya (nama → RT → RW) bisa dibaca
 * sekaligus, bukan terselip di antara pemanggilan `setState`.
 */
function galatForm(mode: ModePencarian, form: FormPencarian): string | null {
  if (mode === 'nik') {
    if (form.nik.length < NIK_MINIMAL) {
      return `Harap masukkan NIK dengan benar (minimal ${NIK_MINIMAL} karakter).`;
    }
    return null;
  }
  if (form.nama.trim().length < NAMA_MINIMAL) {
    return `Harap masukkan nama lengkap (minimal ${NAMA_MINIMAL} karakter).`;
  }
  if (!form.rt) return 'Harap pilih RT Anda.';
  if (!form.rw) return 'Harap pilih RW Anda.';
  return null;
}

export interface CekPemilihController {
  mode: ModePencarian;
  /** Berganti mode mengosongkan form dan hasil: kriterianya sudah tidak sama. */
  gantiMode: (mode: ModePencarian) => void;
  form: FormPencarian;
  ubahField: (field: keyof FormPencarian, nilai: string) => void;
  loading: boolean;
  errorMsg: string;
  hasil: PemilihPublik[] | null;
  /** Benar hanya setelah server menjawab, jadi panel hasil tidak muncul lebih awal. */
  sudahCek: boolean;
  cari: () => Promise<void>;
}

/** Pencarian pemilih pada halaman publik, lewat NIK atau nama + RT/RW. */
export function useCekPemilih(): CekPemilihController {
  const [mode, setMode] = useState<ModePencarian>('nik');
  const [form, setForm] = useState<FormPencarian>(FORM_KOSONG);
  const [loading, setLoading] = useState(false);
  const [hasil, setHasil] = useState<PemilihPublik[] | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [sudahCek, setSudahCek] = useState(false);

  const bersihkan = useCallback(() => {
    setForm(FORM_KOSONG);
    setHasil(null);
    setErrorMsg('');
    setSudahCek(false);
  }, []);

  const gantiMode = useCallback((berikutnya: ModePencarian) => {
    setMode(berikutnya);
    bersihkan();
  }, [bersihkan]);

  // NIK disaring di sini, bukan di input, supaya aturannya menempel pada datanya.
  const ubahField = useCallback((field: keyof FormPencarian, nilai: string) => {
    setForm(prev => ({ ...prev, [field]: field === 'nik' ? nilai.replace(/\D/g, '') : nilai }));
  }, []);

  const cari = useCallback(async () => {
    const galat = galatForm(mode, form);
    if (galat) {
      setErrorMsg(galat);
      setHasil(null);
      setSudahCek(false);
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setHasil(null);
    setSudahCek(false);

    try {
      const res = mode === 'nik'
        ? await ApiService.cekPemilih(form.nik)
        : await ApiService.cekPemilih(undefined, form.nama, form.rt, form.rw);
      const json = await bacaJson(res);
      if (res.ok && json.status === 'success') {
        setHasil(json.data);
        setSudahCek(true);
      } else {
        setErrorMsg(json.message || 'Gagal mencari data. Silakan coba lagi.');
      }
    } catch {
      setErrorMsg('Gagal menghubungi server. Harap periksa koneksi internet Anda.');
    } finally {
      setLoading(false);
    }
  }, [mode, form]);

  return { mode, gantiMode, form, ubahField, loading, errorMsg, hasil, sudahCek, cari };
}
