import { useCallback, useEffect, useState } from 'react';
import { ApiService } from '../services/api';
import { ambilData, jalankanAksi } from '../utils/request';
import { useFormState, type FormState } from './useFormState';
import { KPPS_FORM_KOSONG, type Feedback, type KppsForm } from '../types/app';

interface Argumen {
  token: string | null;
  path: string;
  isPantarlih: boolean;
  feedback: Feedback;
}

export interface KppsController {
  kppsUsers: any;
  kppsLoading: boolean;
  kppsPage: number;
  setKppsPage: React.Dispatch<React.SetStateAction<number>>;
  form: FormState<KppsForm>;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  handleCreateKpps: (e: React.FormEvent) => Promise<void>;

  // Reset kata sandi akun lain
  resetUser: any;
  setResetUser: (user: any) => void;
  resetPasswordVal: string;
  setResetPasswordVal: (val: string) => void;
  isResetModalOpen: boolean;
  setIsResetModalOpen: (open: boolean) => void;
  handleResetKppsPassword: (e: React.FormEvent) => Promise<void>;

  handleDeleteUser: (id: number) => Promise<void>;
}

/** Payload pembuatan akun; bentuknya berbeda per jenis akun. */
const susunPayload = (f: KppsForm) => {
  const dasar = { username: f.username, password: f.password };
  if (f.accountType === 'kpps') {
    return { ...dasar, role: 'kpps', tps_id: f.tps, kpps_role: f.role };
  }
  // Pantarlih tidak punya sub-peran, tapi tetap terikat TPS pendataannya.
  if (f.accountType === 'pantarlih') {
    return { ...dasar, role: 'pantarlih', tps_id: f.tps };
  }
  return { ...dasar, role: 'sekretariat', sekretariat_role: f.sekretariatRole };
};

/** Pesan sukses per jenis akun — masing-masing punya konsekuensi berbeda. */
const pesanSukses = (f: KppsForm): [string, string] => {
  if (f.accountType === 'kpps') {
    return [
      'Akun KPPS Dibuat',
      `Akun "${f.username}" berhasil disimpan dan siap digunakan di aplikasi mobile.`,
    ];
  }
  if (f.accountType === 'pantarlih') {
    return [
      'Akun Pantarlih Dibuat',
      `Akun "${f.username}" berhasil disimpan. Ia hanya bisa mendata di TPS yang dipilih, dan hasilnya otomatis tercatat sebagai DPTb.`,
    ];
  }
  return [
    'Akun Sekretariat Dibuat',
    f.sekretariatRole === 'admin'
      ? `Akun "${f.username}" berhasil disimpan dengan hak akses penuh di panel web.`
      : `Akun "${f.username}" berhasil disimpan dengan hak lihat saja di panel web.`,
  ];
};

/** Akun petugas: KPPS, pantarlih, dan sekretariat. */
export function useKpps({ token, path, isPantarlih, feedback }: Argumen): KppsController {
  const { showSuccess, showError, showConfirm } = feedback;

  const [kppsUsers, setKppsUsers] = useState<any>(null);
  const [kppsLoading, setKppsLoading] = useState(false);
  const [kppsPage, setKppsPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [resetUser, setResetUser] = useState<any>(null);
  const [resetPasswordVal, setResetPasswordVal] = useState('');
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const form = useFormState(KPPS_FORM_KOSONG);

  const fetchKppsUsers = useCallback(async () => {
    if (!token) return;
    setKppsLoading(true);
    const data = await ambilData(() => ApiService.getKppsUsers(token, kppsPage));
    if (data) setKppsUsers(data);
    setKppsLoading(false);
  }, [token, kppsPage]);

  useEffect(() => {
    if (!token || isPantarlih || path !== '/kpps') return;
    void fetchKppsUsers();
  }, [token, isPantarlih, path, fetchKppsUsers]);

  const handleCreateKpps = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    const isian = form.values;
    const hasil = await jalankanAksi(() => ApiService.createKpps(token, susunPayload(isian)));
    if (!hasil) {
      showError('Gagal menghubungi server.');
      return;
    }
    if (!hasil.ok) {
      const galatPertama = hasil.json.errors
        ? (Object.values(hasil.json.errors)[0] as string[])?.[0]
        : null;
      showError(galatPertama || hasil.json.message || 'Gagal membuat akun.');
      return;
    }

    setIsModalOpen(false);
    form.reset();
    void fetchKppsUsers();
    showSuccess(...pesanSukses(isian));
  }, [token, form, fetchKppsUsers, showSuccess, showError]);

  const handleResetKppsPassword = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUser || !token) return;

    const targetUsername = resetUser.username;
    const hasil = await jalankanAksi(
      () => ApiService.resetKppsPassword(token, resetUser.id, resetPasswordVal),
    );
    if (!hasil) {
      showError('Gagal menghubungi server.');
      return;
    }
    if (!hasil.ok) {
      showError(hasil.json.message || 'Gagal reset password.');
      return;
    }

    setIsResetModalOpen(false);
    setResetUser(null);
    setResetPasswordVal('');
    showSuccess('Password Direset', `Password baru untuk akun "${targetUsername}" berhasil disimpan.`);
  }, [token, resetUser, resetPasswordVal, showSuccess, showError]);

  const handleDeleteUser = useCallback(async (id: number) => {
    showConfirm(
      'Hapus Akun KPPS?',
      'Apakah Anda yakin ingin menghapus akun KPPS ini?',
      async () => {
        if (!token) return;
        const hasil = await jalankanAksi(() => ApiService.deleteKpps(token, id));
        if (!hasil) {
          showError('Gagal menghubungi server.', 'Gagal Menghapus');
          return;
        }
        if (!hasil.ok) {
          showError(hasil.json.message || 'Gagal menghapus akun KPPS.', 'Gagal Menghapus');
          return;
        }
        void fetchKppsUsers();
      },
      'Hapus',
      true,
    );
  }, [token, fetchKppsUsers, showConfirm, showError]);

  return {
    kppsUsers,
    kppsLoading,
    kppsPage,
    setKppsPage,
    form,
    isModalOpen,
    setIsModalOpen,
    handleCreateKpps,
    resetUser,
    setResetUser,
    resetPasswordVal,
    setResetPasswordVal,
    isResetModalOpen,
    setIsResetModalOpen,
    handleResetKppsPassword,
    handleDeleteUser,
  };
}
