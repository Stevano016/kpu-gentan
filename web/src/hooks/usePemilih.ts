import { useCallback, useEffect, useState } from 'react';
import { ApiService } from '../services/api';
import { ambilData, bacaJson, jalankanAksi, pesanGagal } from '../utils/request';
import { useFormState, type FormState } from './useFormState';
import { DPT_FORM_KOSONG, type DptForm, type Feedback } from '../types/app';

interface Argumen {
  token: string | null;
  path: string;
  feedback: Feedback;
}

/** Hasil pemeriksaan NIK saat formulir tambah pemilih diisi. */
export interface CekNik {
  memeriksa: boolean;
  terdaftar: boolean;
  /** Siap tampil di bawah kolom NIK; null bila tidak ada yang perlu dikatakan. */
  pesan: string | null;
}

export const CEK_NIK_KOSONG: CekNik = { memeriksa: false, terdaftar: false, pesan: null };

export interface PemilihController {
  dptData: any;
  dptLoading: boolean;
  filter: {
    search: string;
    setSearch: (val: string) => void;
    tpsId: string;
    setTpsId: (val: string) => void;
    /** '' = semua tahapan. */
    jenis: string;
    setJenis: (val: string) => void;
    keteranganFilter: string;
    setKeteranganFilter: (val: string) => void;
    page: number;
    setPage: (page: number) => void;
  };
  form: FormState<DptForm>;
  editingDpt: any;
  setEditingDpt: (voter: any) => void;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  /** Kartu QR pemilih baru; sekaligus jadi konfirmasi keberhasilan. */
  newVoterSuccess: any;
  clearNewVoterSuccess: () => void;
  /** Daftar RW untuk pilihan ekspor. */
  daftarRw: string[];
  /** NIK yang sedang diisi sudah dipakai orang lain atau belum. */
  cekNik: CekNik;
  fetchDpts: () => Promise<void>;
  handleSaveDpt: (e: React.FormEvent) => Promise<void>;
  handleDeleteDpt: (nik: string) => Promise<void>;
}

/** Menyusun payload simpan dari isian formulir; kosong dikirim sebagai null. */
const susunPayload = (f: DptForm, editingDpt: any) => {
  const payload: Record<string, unknown> = {
    nama: f.nama,
    nkk: f.nkk || null,
    tps_id: f.tps,
    jenis_pemilih: f.jenis,
    umur: f.umur ? parseInt(f.umur, 10) : null,
    status_kawin: f.statusKawin || null,
    jenis_kelamin: f.jenisKelamin || null,
    alamat: f.alamat || null,
    rt: f.rt || null,
    rw: f.rw || null,
    pekerjaan: f.pekerjaan || null,
    disabilitas: f.disabilitas || null,
    keterangan: f.keterangan || null,
  };

  // Saat menambah, NIK selalu ikut. Saat mengedit ia hanya boleh ikut kalau
  // nomornya masih sementara — server juga menolak perubahan NIK asli, ini
  // sekadar tidak mengirim yang percuma.
  if (!editingDpt || editingDpt.nik_sintetis) payload.nik = f.nik;

  return payload;
};

/** Data pemilih: tabel berhalaman, penyaring, dan formulir tambah/sunting. */
export function usePemilih({ token, path, feedback }: Argumen): PemilihController {
  const { showSuccess, showError, showConfirm } = feedback;

  const [dptData, setDptData] = useState<any>(null);
  const [dptLoading, setDptLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [tpsId, setTpsId] = useState('');
  const [jenis, setJenis] = useState('');
  const [keteranganFilter, setKeteranganFilter] = useState('');
  const [page, setPage] = useState(1);

  const [editingDpt, setEditingDpt] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newVoterSuccess, setNewVoterSuccess] = useState<any>(null);
  const [daftarRw, setDaftarRw] = useState<string[]>([]);
  const [cekNik, setCekNik] = useState<CekNik>(CEK_NIK_KOSONG);

  const form = useFormState(DPT_FORM_KOSONG);

  const handleSetJenis = useCallback((val: string) => {
    setJenis(val);
    setKeteranganFilter('');
  }, []);

  const fetchDpts = useCallback(async () => {
    if (!token) return;
    setDptLoading(true);
    const data = await ambilData(() => ApiService.getDpts(token, page, search, tpsId, jenis, keteranganFilter));
    if (data) setDptData(data);
    setDptLoading(false);
  }, [token, page, search, tpsId, jenis, keteranganFilter]);

  useEffect(() => {
    if (!token || path !== '/pemilih') return;
    void fetchDpts();
  }, [token, path, fetchDpts]);

  // Daftar RW hanya untuk kenyamanan pilihan ekspor; diamkan bila gagal.
  useEffect(() => {
    if (!token) return;
    let dibatalkan = false;
    void ambilData<string[]>(() => ApiService.daftarRw(token)).then((data) => {
      if (data && !dibatalkan) setDaftarRw(data);
    });
    return () => { dibatalkan = true; };
  }, [token]);

  /**
   * NIK diperiksa ke server begitu digit ke-16 masuk.
   *
   * `store()` di server sudah menolak NIK ganda, tapi penolakannya baru muncul
   * setelah seluruh formulir diisi dan Simpan ditekan — dan pesannya tidak
   * menyebut siapa pemegangnya. Padahal justru itu yang menentukan langkah
   * petugas: salah ketik satu digit, atau orang ini memang sudah terdaftar
   * (sering di tahapan lain, jadi tidak ketemu di tabel yang sedang disaring).
   *
   * Yang diperiksa hanya NIK baru: saat mengedit, NIK asli tidak bisa diubah,
   * dan nomor sementara buatan sistem tetap diperiksa karena penggantinya
   * boleh saja bentrok.
   */
  const nikDiisi = form.values.nik;

  useEffect(() => {
    const nikSendiri = editingDpt && !editingDpt.nik_sintetis;

    if (!token || !isModalOpen || nikSendiri || nikDiisi.length !== 16 || nikDiisi === editingDpt?.nik) {
      setCekNik(CEK_NIK_KOSONG);
      return;
    }

    let dibatalkan = false;
    setCekNik({ memeriksa: true, terdaftar: false, pesan: null });

    // Jeda: 16 digit sering masuk lewat tempel-salin, tapi juga sering lewat
    // ketikan yang masih berlanjut (digit ke-17 memotong yang pertama).
    const jeda = setTimeout(() => {
      void ambilData<any>(() => ApiService.cekNikTerdaftar(token, nikDiisi)).then((data) => {
        if (dibatalkan) return;

        if (!data) {
          // Server tidak menjawab. Diamkan — `store()` masih menjadi penjaga
          // terakhir, dan menakut-nakuti petugas dengan galat jaringan di
          // bawah kolom NIK tidak menolong siapa pun.
          setCekNik(CEK_NIK_KOSONG);
          return;
        }

        if (!data.terdaftar) {
          setCekNik({ memeriksa: false, terdaftar: false, pesan: null });
          return;
        }

        const wilayah = [data.rt ? `RT ${data.rt}` : '', data.rw ? `RW ${data.rw}` : '']
          .filter(Boolean)
          .join(' / ');
        const rincian = [data.tps, wilayah].filter(Boolean).join(' · ');

        setCekNik({
          memeriksa: false,
          terdaftar: true,
          pesan: `NIK ini sudah terdaftar atas nama ${data.nama}`
            + (data.tahapan ? ` (${String(data.tahapan).toUpperCase()})` : '')
            + (rincian ? ` — ${rincian}` : '')
            + '.',
        });
      });
    }, 400);

    return () => { dibatalkan = true; clearTimeout(jeda); };
  }, [token, isModalOpen, nikDiisi, editingDpt]);

  /**
   * Pemilih baru langsung disusulkan kartu QR-nya. Bila QR gagal dimuat,
   * penambahannya tetap berhasil — jadi yang tampil hanya pemberitahuan biasa.
   */
  const tampilkanKartuQr = useCallback(async (nik: string, nama: string, idPemilih: string) => {
    try {
      const res = await ApiService.getQrCode(token!, nik);
      const json = await bacaJson(res);
      if (res.ok) {
        setNewVoterSuccess({ nik, nama, id_pemilih: idPemilih, qrcode: json.qrcode });
        return;
      }
    } catch { /* jatuh ke pemberitahuan biasa di bawah */ }

    showSuccess(
      'Pemilih Ditambahkan',
      `${nama} berhasil didaftarkan. QR Code belum dapat dimuat — buka kembali lewat tombol QR pada tabel.`,
    );
  }, [token, showSuccess]);

  const handleSaveDpt = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    const isEditing = editingDpt !== null;
    const { nik, nama } = form.values;

    // Server tetap menolaknya, tapi menahannya di sini membuat pesannya
    // menyebut nama pemegang NIK-nya, bukan sekadar "NIK sudah digunakan".
    if (cekNik.terdaftar && cekNik.pesan) {
      showError(cekNik.pesan, 'NIK Sudah Terdaftar');
      return;
    }

    const hasil = await jalankanAksi(
      () => ApiService.saveDpt(token, susunPayload(form.values, editingDpt), editingDpt?.nik),
    );
    if (!hasil) {
      showError('Gagal menghubungi server.');
      return;
    }
    if (!hasil.ok) {
      showError(pesanGagal(hasil.json, 'Gagal menyimpan data.'));
      return;
    }

    setIsModalOpen(false);
    setEditingDpt(null);
    form.reset();
    void fetchDpts();

    if (isEditing) {
      showSuccess('Data Pemilih Diperbarui', `Perubahan data ${nama} berhasil disimpan.`);
    } else {
      await tampilkanKartuQr(nik, nama, hasil.json.data?.id_pemilih || '');
    }
  }, [token, editingDpt, form, cekNik, fetchDpts, showSuccess, showError, tampilkanKartuQr]);

  const handleDeleteDpt = useCallback(async (nik: string) => {
    showConfirm(
      'Hapus Pemilih?',
      'Apakah Anda yakin ingin menghapus pemilih ini dari database?',
      async () => {
        if (!token) return;
        const hasil = await jalankanAksi(() => ApiService.deleteDpt(token, nik));
        if (!hasil) {
          showError('Gagal menghubungi server.', 'Gagal Menghapus');
          return;
        }
        if (!hasil.ok) {
          showError(hasil.json.message || 'Gagal menghapus pemilih.', 'Gagal Menghapus');
          return;
        }
        void fetchDpts();
      },
      'Hapus',
      true,
    );
  }, [token, fetchDpts, showConfirm, showError]);

  const clearNewVoterSuccess = useCallback(() => setNewVoterSuccess(null), []);

  return {
    dptData,
    dptLoading,
    filter: {
      search,
      setSearch,
      tpsId,
      setTpsId,
      jenis,
      setJenis: handleSetJenis,
      keteranganFilter,
      setKeteranganFilter,
      page,
      setPage
    },
    form,
    editingDpt,
    setEditingDpt,
    isModalOpen,
    setIsModalOpen,
    newVoterSuccess,
    clearNewVoterSuccess,
    daftarRw,
    cekNik,
    fetchDpts,
    handleSaveDpt,
    handleDeleteDpt,
  };
}
