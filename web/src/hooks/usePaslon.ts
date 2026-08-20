import { useCallback, useEffect, useState } from 'react';
import { ApiService } from '../services/api';
import { ambilData, jalankanAksi } from '../utils/request';
import { useFormState, type FormState } from './useFormState';
import { PASLON_FORM_KOSONG, type Feedback, type PaslonForm } from '../types/app';

interface Argumen {
  token: string | null;
  path: string;
  isPantarlih: boolean;
  feedback: Feedback;
}

export interface PaslonController {
  paslons: any[];
  loading: boolean;
  form: FormState<PaslonForm>;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  isEditing: boolean;
  setIsEditing: (val: boolean) => void;
  editingPaslon: any;
  setEditingPaslon: (paslon: any) => void;
  handleSavePaslon: (e: React.FormEvent) => Promise<void>;
  handleDeletePaslon: (id: number) => Promise<void>;
}

/** Pasangan calon: daftar, tambah/sunting beserta fotonya, dan penghapusan. */
export function usePaslon({ token, path, isPantarlih, feedback }: Argumen): PaslonController {
  const { showSuccess, showError, showConfirm } = feedback;

  const [paslons, setPaslons] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPaslon, setEditingPaslon] = useState<any>(null);

  const form = useFormState(PASLON_FORM_KOSONG);

  const fetchPaslons = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const data = await ambilData<any[]>(() => ApiService.getPaslons(token));
    if (data) setPaslons(data);
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (!token || isPantarlih || path !== '/paslon') return;
    void fetchPaslons();
  }, [token, isPantarlih, path, fetchPaslons]);

  const handleSavePaslon = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    const { nomorUrut, namaKetua, foto } = form.values;
    const body = new FormData();
    body.append('nomor_urut', String(parseInt(nomorUrut, 10)));
    body.append('nama_ketua', namaKetua);
    // Hanya dikirim bila operator benar-benar memilih berkas; tanpa ini,
    // menyunting nama saja akan menghapus foto yang sudah ada.
    if (foto) body.append('foto', foto);

    const menyunting = isEditing && editingPaslon;
    const hasil = await jalankanAksi(() => (
      menyunting
        ? ApiService.updatePaslon(token, editingPaslon.id, body)
        : ApiService.createPaslon(token, body)
    ));
    if (!hasil) {
      showError('Gagal menghubungi server.');
      return;
    }
    if (!hasil.ok) {
      showError(hasil.json.message || 'Gagal menyimpan pasangan calon.');
      return;
    }

    setIsModalOpen(false);
    void fetchPaslons();
    showSuccess(
      menyunting ? 'Paslon Diperbarui' : 'Paslon Ditambahkan',
      `Calon nomor urut ${nomorUrut} (${namaKetua}) berhasil disimpan.`,
    );
  }, [token, form, isEditing, editingPaslon, fetchPaslons, showSuccess, showError]);

  const handleDeletePaslon = useCallback(async (id: number) => {
    showConfirm(
      'Hapus Pasangan Calon',
      'Apakah Anda yakin ingin menghapus pasangan calon ini?',
      async () => {
        if (!token) return;
        const hasil = await jalankanAksi(() => ApiService.deletePaslon(token, id));
        if (!hasil) {
          showError('Gagal menghubungi server.', 'Gagal Menghapus');
          return;
        }
        if (!hasil.ok) {
          showError(hasil.json.message || 'Gagal menghapus pasangan calon.', 'Gagal Menghapus');
          return;
        }
        void fetchPaslons();
      },
      'Hapus',
      true,
    );
  }, [token, fetchPaslons, showConfirm, showError]);

  return {
    paslons,
    loading,
    form,
    isModalOpen,
    setIsModalOpen,
    isEditing,
    setIsEditing,
    editingPaslon,
    setEditingPaslon,
    handleSavePaslon,
    handleDeletePaslon,
  };
}
