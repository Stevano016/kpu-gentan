import { useCallback, useEffect, useState } from 'react';
import { ApiService } from '../services/api';
import { ambilData, jalankanAksi } from '../utils/request';
import { useFormState, type FormState } from './useFormState';
import { TPS_FORM_KOSONG, type Feedback, type TpsForm } from '../types/app';

interface Argumen {
  token: string | null;
  path: string;
  isPantarlih: boolean;
  feedback: Feedback;
}

export interface TpsController {
  /** Daftar ringkas seluruh TPS; dipakai penyaring dan pilihan di formulir. */
  tpsList: any[];
  tpsPageData: any;
  tpsPageLoading: boolean;
  tpsPage: number;
  setTpsPage: React.Dispatch<React.SetStateAction<number>>;
  tpsDetailData: any;
  fetchTpsDetail: (id: number) => Promise<void>;
  form: FormState<TpsForm>;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  handleCreateTps: (e: React.FormEvent) => Promise<void>;
}

/** Rute yang butuh daftar TPS untuk penyaring atau pilihan formulirnya. */
const RUTE_BUTUH_DAFTAR = ['/pemilih', '/keluarga', '/kpps'];

/** Data TPS: daftar ringkas, tabel berhalaman, detail satu TPS, dan penambahan. */
export function useTps({ token, path, isPantarlih, feedback }: Argumen): TpsController {
  const { showSuccess, showError } = feedback;

  const [tpsList, setTpsList] = useState<any[]>([]);
  const [tpsPage, setTpsPage] = useState(1);
  const [tpsPageData, setTpsPageData] = useState<any>(null);
  const [tpsPageLoading, setTpsPageLoading] = useState(false);
  const [tpsDetailData, setTpsDetailData] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const form = useFormState(TPS_FORM_KOSONG);

  const fetchTpsList = useCallback(async () => {
    if (!token) return;
    const data = await ambilData<any[]>(() => ApiService.getTpsList(token));
    if (data) setTpsList(data);
  }, [token]);

  const fetchTpsPageData = useCallback(async () => {
    if (!token) return;
    setTpsPageLoading(true);
    const data = await ambilData(() => ApiService.getTpsPage(token, tpsPage));
    if (data) setTpsPageData(data);
    setTpsPageLoading(false);
  }, [token, tpsPage]);

  const fetchTpsDetail = useCallback(async (id: number) => {
    if (!token) return;
    const data = await ambilData(() => ApiService.getTpsDetail(token, id));
    if (data) setTpsDetailData(data);
  }, [token]);

  useEffect(() => {
    if (!token || !RUTE_BUTUH_DAFTAR.includes(path)) return;
    // Pantarlih tidak boleh membuka halaman akun; endpointnya pun menolaknya.
    if (isPantarlih && path === '/kpps') return;
    void fetchTpsList();
  }, [token, path, isPantarlih, fetchTpsList]);

  useEffect(() => {
    if (!token || isPantarlih || path !== '/tps') return;
    void fetchTpsPageData();
  }, [token, isPantarlih, path, fetchTpsPageData]);

  const handleCreateTps = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    const { nama, wilayah } = form.values;
    const hasil = await jalankanAksi(() => ApiService.createTps(token, nama, wilayah));
    if (!hasil) {
      showError('Gagal menghubungi server.');
      return;
    }
    if (!hasil.ok) {
      showError(hasil.json.errors?.nama?.[0] || hasil.json.message || 'Gagal membuat TPS.');
      return;
    }

    setIsModalOpen(false);
    form.reset();
    void fetchTpsPageData();
    showSuccess('TPS Ditambahkan', `${nama} berhasil disimpan ke daftar TPS.`);
  }, [token, form, fetchTpsPageData, showSuccess, showError]);

  return {
    tpsList,
    tpsPageData,
    tpsPageLoading,
    tpsPage,
    setTpsPage,
    tpsDetailData,
    fetchTpsDetail,
    form,
    isModalOpen,
    setIsModalOpen,
    handleCreateTps,
  };
}
