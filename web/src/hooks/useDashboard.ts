import { useCallback, useEffect, useState } from 'react';
import { ApiService } from '../services/api';
import { ambilData } from '../utils/request';
import { adalahRuteDashboard } from '../constants/app';

interface Argumen {
  token: string | null;
  path: string;
  isPantarlih: boolean;
}

export interface DashboardController {
  dashboardData: any;
  dashboardLoading: boolean;
  /**
   * Waktu (epoch ms) angka terakhir benar-benar sampai dari server.
   *
   * Dipakai indikator di kepala dashboard. Tanpa ini tidak ada cara
   * membedakan angka yang baru saja diperbarui dari angka yang sudah diam
   * setengah jam karena sambungannya mati — keduanya tampak sama persis.
   */
  terakhirDiperbarui: number | null;
  /**
   * `silent` mematikan indikator memuat untuk penyegaran latar, supaya angkanya
   * bertukar di tempat alih-alih berkedip "Memuat data..." dan menggeser tata
   * letak tiap beberapa detik.
   */
  fetchDashboard: (silent?: boolean) => Promise<void>;
}

/** Ringkasan dashboard: satu sumber angka untuk halaman Dashboard dan Quick Count. */
export function useDashboard({ token, path, isPantarlih }: Argumen): DashboardController {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [terakhirDiperbarui, setTerakhirDiperbarui] = useState<number | null>(null);

  const fetchDashboard = useCallback(async (silent = false) => {
    if (!token) return;
    if (!silent) setDashboardLoading(true);
    const data = await ambilData(() => ApiService.getDashboardSummary(token));
    if (data) {
      setDashboardData(data);
      // Hanya dicatat saat data benar-benar datang. Penarikan yang gagal
      // membiarkan angka lama di layar, jadi menandainya "baru diperbarui"
      // justru menyembunyikan bahwa servernya sedang tidak menjawab.
      setTerakhirDiperbarui(Date.now());
    }
    if (!silent) setDashboardLoading(false);
  }, [token]);

  // Pantarlih tidak punya akses ke ringkasan; memuatnya hanya memicu 403.
  useEffect(() => {
    if (!token || isPantarlih || !adalahRuteDashboard(path)) return;
    void fetchDashboard();
  }, [token, isPantarlih, path, fetchDashboard]);

  return { dashboardData, dashboardLoading, terakhirDiperbarui, fetchDashboard };
}
