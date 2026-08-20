import type { AlertVariant } from '../components/CustomAlertModal';

/**
 * Profil pengguna panel. Respons server masih longgar, jadi bidang tambahan
 * dibiarkan lewat — yang dipakai panel disebutkan eksplisit di sini.
 */
export interface PanelUser {
  id: number;
  username: string;
  role: string;
  sekretariat_role?: string | null;
  tps_id?: number | null;
  [key: string]: unknown;
}

/** Alasan sebuah sesi diakhiri; menentukan pesan di layar masuk. */
export type AlasanSesiBerakhir = 'menganggur' | 'kedaluwarsa' | 'ditolak';

/**
 * Pemberitahuan ke operator. Dikumpulkan dalam satu tipe supaya hook yang
 * butuh memberi kabar cukup menerima satu argumen.
 */
export interface Feedback {
  showAlert: (variant: AlertVariant, title: string, message: string) => void;
  showSuccess: (title: string, message: string) => void;
  showError: (message: string, title?: string) => void;
  showConfirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    btnText?: string,
    danger?: boolean,
  ) => void;
  mintaAlasan: (
    title: string,
    message: string,
    saran: string[],
    onSubmit: (alasan: string) => void,
    pilihan?: string[],
  ) => void;
}

/** Hak akses turunan dari profil, dipakai untuk menyembunyikan menu dan aksi. */
export interface HakAkses {
  /** Pantarlih hanya mendata pemilih susulan; menu lain disembunyikan. */
  isPantarlih: boolean;
  /** Sekretariat "Lihat Saja" tidak boleh melakukan aksi tulis apa pun. */
  isAdmin: boolean;
}

export interface TpsForm {
  nama: string;
  wilayah: string;
}

export const TPS_FORM_KOSONG: TpsForm = { nama: '', wilayah: '' };

export interface DptForm {
  nik: string;
  nkk: string;
  nama: string;
  tps: string;
  jenis: string;
  umur: string;
  statusKawin: string;
  jenisKelamin: string;
  alamat: string;
  rt: string;
  rw: string;
  pekerjaan: string;
  disabilitas: string;
  keterangan: string;
}

export const DPT_FORM_KOSONG: DptForm = {
  nik: '',
  nkk: '',
  nama: '',
  tps: '',
  jenis: 'dpt',
  umur: '',
  statusKawin: '',
  jenisKelamin: '',
  alamat: '',
  rt: '',
  rw: '',
  pekerjaan: '',
  disabilitas: '',
  keterangan: '',
};

export interface KppsForm {
  username: string;
  password: string;
  tps: string;
  rw: string;
  /** full | validasi */
  role: string;
  /** kpps | sekretariat | pantarlih */
  accountType: string;
  sekretariatRole: string;
}

export const KPPS_FORM_KOSONG: KppsForm = {
  username: '',
  password: '',
  tps: '',
  rw: '',
  role: 'full',
  accountType: 'kpps',
  sekretariatRole: 'admin',
};

export interface PaslonForm {
  nomorUrut: string;
  namaKetua: string;
  foto: File | null;
}

export const PASLON_FORM_KOSONG: PaslonForm = {
  nomorUrut: '',
  namaKetua: '',
  foto: null,
};

/** Hasil impor CSV: pesan sukses dan/atau daftar baris yang ditolak. */
export interface ImportStatus {
  success?: string;
  errors?: string[];
}
