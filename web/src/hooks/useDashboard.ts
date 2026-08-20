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

  const fetchDashboard = useCallback(async (silent = false) => {
    if (!token) return;
    if (!silent) setDashboardLoading(true);
    const data = await ambilData(() => ApiService.getDashboardSummary(token));
    if (data) setDashboardData(data);
    if (!silent) setDashboardLoading(false);
  }, [token]);

  // Pantarlih tidak punya akses ke ringkasan; memuatnya hanya memicu 403.
  useEffect(() => {
    if (!token || isPantarlih || !adalahRuteDashboard(path)) return;
    void fetchDashboard();
  }, [token, isPantarlih, path, fetchDashboard]);

  return { dashboardData, dashboardLoading, fetchDashboard };
}
