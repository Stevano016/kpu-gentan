import { useCallback } from 'react';
import { BrowserRouter, useLocation, useNavigate } from 'react-router-dom';

import { AppRoutes } from './components/AppRoutes';
import { GlobalModals } from './components/GlobalModals';
import { PublicRoutes } from './components/routes/PublicRoutes';
import { MobileTopbar } from './components/layout/MobileTopbar';
import { Sidebar } from './components/Sidebar';
import { PenjagaSesi } from './components/PenjagaSesi';

import { useAuth } from './hooks/useAuth';
import { useDashboard } from './hooks/useDashboard';
import { useEksporPemilih } from './hooks/useEksporPemilih';
import { useFeedback } from './hooks/useFeedback';
import { useImportCsv } from './hooks/useImportCsv';
import { useKpps } from './hooks/useKpps';
import { useLayout } from './hooks/useLayout';
import { useLiveDashboard } from './hooks/useLiveDashboard';
import { usePaslon } from './hooks/usePaslon';
import { usePemilih } from './hooks/usePemilih';
import { useQrCode } from './hooks/useQrCode';
import { useTahapanPemilih } from './hooks/useTahapanPemilih';
import { useTps } from './hooks/useTps';
import { useUndanganMaraton } from './hooks/useUndanganMaraton';

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

/**
 * Kerangka panel Gentara.
 *
 * Berkas ini hanya menyusun: setiap urusan — sesi, tata letak, dan tiap domain
 * data — tinggal di hook-nya sendiri di `src/hooks`, sementara rute dan modal
 * dirender oleh `AppRoutes` dan `GlobalModals`. Yang tersisa di sini adalah
 * kabel antar keduanya, supaya alurnya bisa dibaca dalam satu layar.
 */
function AppContent() {
  const navigate = useNavigate();
  const path = useLocation().pathname;

  const feedback = useFeedback();
  const auth = useAuth({ navigate, showConfirm: feedback.showConfirm });
  const { token, isPantarlih } = auth;

  const layout = useLayout({ path, showError: feedback.showError });

  const dashboard = useDashboard({ token, path, isPantarlih });
  const { fetchDashboard } = dashboard;
  const refreshDashboard = useCallback(() => { void fetchDashboard(true); }, [fetchDashboard]);
  const modeLangsung = useLiveDashboard({ token, path, isPantarlih, refresh: refreshDashboard });

  const tps = useTps({ token, path, isPantarlih, feedback });
  const qr = useQrCode({ token, showError: feedback.showError });
  const pemilih = usePemilih({ token, path, feedback });
  const { fetchDpts } = pemilih;
  const kpps = useKpps({ token, path, isPantarlih, feedback });
  const paslon = usePaslon({ token, path, isPantarlih, feedback });

  const importCsv = useImportCsv({ token, onSelesai: fetchDpts });
  const handleExport = useEksporPemilih({ token, feedback });
  const maraton = useUndanganMaraton({ token, feedback });

  // Perubahan tahapan menggeser angka di dashboard sekaligus isi tabelnya.
  const segarkanSetelahTahapan = useCallback(() => {
    void fetchDpts();
    refreshDashboard();
  }, [fetchDpts, refreshDashboard]);

  const tahapan = useTahapanPemilih({
    token,
    tpsFilter: pemilih.filter.tpsId,
    feedback,
    onSelesai: segarkanSetelahTahapan,
  });

  if (!token) {
    return <PublicRoutes auth={auth} navigate={navigate} />;
  }

  return (
    <div className={`app-container${layout.isSidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
      {/* Peringatan sebelum sesi ditutup. Tidak muncul sama sekali untuk
          sekretariat "Lihat Saja" — sesinya memang tanpa batas. */}
      <PenjagaSesi sesi={auth.sesi} perpanjang={auth.perpanjangSesi} akhiri={auth.akhiriSesi} />

      <MobileTopbar isNavOpen={layout.isMobileNavOpen} onOpenNav={layout.openMobileNav} />

      <div
        className={`nav-backdrop${layout.isMobileNavOpen ? ' is-open' : ''}`}
        onClick={layout.closeMobileNav}
        aria-hidden="true"
      />

      <Sidebar
        path={path}
        user={auth.user}
        navigate={navigate}
        handleLogout={auth.handleLogout}
        isCollapsed={layout.isSidebarCollapsed}
        toggleCollapsed={layout.toggleSidebarCollapsed}
        isFullscreen={layout.isFullscreen}
        toggleFullscreen={layout.toggleFullscreen}
        isPantarlih={isPantarlih}
        isMobileOpen={layout.isMobileNavOpen}
        closeMobileNav={layout.closeMobileNav}
      />

      <main className="main-content">
        <AppRoutes
          auth={auth}
          feedback={feedback}
          dashboard={dashboard}
          modeLangsung={modeLangsung}
          tps={tps}
          pemilih={pemilih}
          tahapan={tahapan}
          kpps={kpps}
          paslon={paslon}
          qr={qr}
          importCsv={importCsv}
          handleExport={handleExport}
          maraton={maraton}
          navigate={navigate}
        />
      </main>

      <GlobalModals
        feedback={feedback}
        isPantarlih={isPantarlih}
        tps={tps}
        pemilih={pemilih}
        kpps={kpps}
        paslon={paslon}
        qr={qr}
        importCsv={importCsv}
      />
    </div>
  );
}
