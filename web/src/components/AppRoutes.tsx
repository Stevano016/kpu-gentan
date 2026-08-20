import { Navigate, Route, Routes } from 'react-router-dom';
import { DashboardTab } from './tabs/DashboardTab';
import { QuickCountTab } from './tabs/QuickCountTab';
import { TpsTab } from './tabs/TpsTab';
import { PemilihTab } from './tabs/PemilihTab';
import { KeluargaTab } from './tabs/KeluargaTab';
import { KppsTab } from './tabs/KppsTab';
import { PaslonTab } from './tabs/PaslonTab';
import { TpsDetailRoute } from './routes/TpsDetailRoute';
import type { AuthController } from '../hooks/useAuth';
import type { DashboardController } from '../hooks/useDashboard';
import type { ImportCsvController } from '../hooks/useImportCsv';
import type { KppsController } from '../hooks/useKpps';
import type { PaslonController } from '../hooks/usePaslon';
import type { PemilihController } from '../hooks/usePemilih';
import type { QrController } from '../hooks/useQrCode';
import type { TahapanController } from '../hooks/useTahapanPemilih';
import type { TpsController } from '../hooks/useTps';
import type { Feedback } from '../types/app';

interface AppRoutesProps {
  auth: AuthController;
  feedback: Feedback;
  dashboard: DashboardController;
  tps: TpsController;
  pemilih: PemilihController;
  tahapan: TahapanController;
  kpps: KppsController;
  paslon: PaslonController;
  qr: QrController;
  importCsv: ImportCsvController;
  handleExport: (params: Record<string, string>, denganNikNkk?: boolean) => Promise<void>;
  navigate: (to: string) => void;
}

/**
 * Peta rute panel setelah petugas masuk.
 *
 * Setiap layar menerima satu kelompok state dari hook domainnya, jadi berkas ini
 * hanya berisi pemetaan URL → layar dan aturan siapa boleh membukanya.
 */
export const AppRoutes: React.FC<AppRoutesProps> = ({
  auth,
  feedback,
  dashboard,
  tps,
  pemilih,
  tahapan,
  kpps,
  paslon,
  qr,
  importCsv,
  handleExport,
  navigate,
}) => {
  const { token, user, isPantarlih, isAdmin } = auth;
  const bukaTps = (id: number | null) => navigate(`/tps/${id}`);
  const bukaHalaman = (halaman: string) => navigate('/' + halaman);
  const dptField = pemilih.form.setField;

  // Pantarlih hanya punya satu halaman kerja; rute lain dialihkan ke sana
  // ketimbang memuat layar yang endpoint-nya akan menolaknya dengan 403.
  const berandaPeran = isPantarlih ? '/pemilih' : '/dashboard';
  const hanyaSekretariat = (layar: React.ReactElement) =>
    isPantarlih ? <Navigate to="/pemilih" replace /> : layar;

  return (
    <Routes>
      <Route path="/" element={<Navigate to={berandaPeran} replace />} />

      <Route path="/dashboard" element={hanyaSekretariat(
        <DashboardTab
          dashboardData={dashboard.dashboardData}
          dashboardLoading={dashboard.dashboardLoading}
          fetchDashboard={dashboard.fetchDashboard}
          setSelectedTpsId={bukaTps}
          setPage={bukaHalaman}
        />
      )} />

      <Route path="/quick-count" element={hanyaSekretariat(
        <QuickCountTab
          dashboardData={dashboard.dashboardData}
          dashboardLoading={dashboard.dashboardLoading}
          fetchDashboard={dashboard.fetchDashboard}
        />
      )} />

      <Route path="/tps" element={
        <TpsTab
          tpsPageData={tps.tpsPageData}
          tpsPageLoading={tps.tpsPageLoading}
          setTpsPage={tps.setTpsPage}
          setIsTpsModalOpen={tps.setIsModalOpen}
          setSelectedTpsId={bukaTps}
          setPage={bukaHalaman}
          isAdmin={isAdmin}
        />
      } />

      <Route path="/tps/:id" element={
        <TpsDetailRoute
          fetchTpsDetail={tps.fetchTpsDetail}
          tpsDetailData={tps.tpsDetailData}
          onBack={() => navigate('/tps')}
        />
      } />

      <Route path="/pemilih" element={
        <PemilihTab
          dptData={pemilih.dptData}
          dptLoading={pemilih.dptLoading}
          dptSearch={pemilih.filter.search}
          setDptSearch={pemilih.filter.setSearch}
          dptTpsFilter={pemilih.filter.tpsId}
          setDptTpsFilter={pemilih.filter.setTpsId}
          dptJenisFilter={pemilih.filter.jenis}
          setDptJenisFilter={pemilih.filter.setJenis}
          setDptPage={pemilih.filter.setPage}
          tpsList={tps.tpsList}
          setIsImportModalOpen={importCsv.open}
          setIsDptModalOpen={pemilih.setIsModalOpen}
          setEditingDpt={pemilih.setEditingDpt}
          setDptFormNik={dptField.nik}
          setDptFormNkk={dptField.nkk}
          setDptFormNama={dptField.nama}
          setDptFormTps={dptField.tps}
          setDptFormJenis={dptField.jenis}
          setDptFormUmur={dptField.umur}
          setDptFormStatusKawin={dptField.statusKawin}
          setDptFormJenisKelamin={dptField.jenisKelamin}
          setDptFormAlamat={dptField.alamat}
          setDptFormRt={dptField.rt}
          setDptFormRw={dptField.rw}
          setDptFormPekerjaan={dptField.pekerjaan}
          setDptFormDisabilitas={dptField.disabilitas}
          setDptFormKeterangan={dptField.keterangan}
          fetchQrCode={qr.fetchQrCode}
          fetchEditingQr={qr.fetchEditingQr}
          handleDeleteDpt={pemilih.handleDeleteDpt}
          handleVerifikasiDp4={tahapan.handleVerifikasiDp4}
          handleTetapkanDpt={tahapan.handleTetapkanDpt}
          handleTandaiTms={tahapan.handleTandaiTms}
          handleBatalkanTms={tahapan.handleBatalkanTms}
          handleTandaiDpk={tahapan.handleTandaiDpk}
          handleBatalkanDpk={tahapan.handleBatalkanDpk}
          isPantarlih={isPantarlih}
          daftarRw={pemilih.daftarRw}
          handleExport={handleExport}
          isAdmin={isAdmin}
        />
      } />

      <Route path="/keluarga" element={
        <KeluargaTab
          token={token}
          tpsList={tps.tpsList}
          isPantarlih={isPantarlih}
          showSuccess={feedback.showSuccess}
          showError={feedback.showError}
        />
      } />

      {/* Rute lama diarahkan ke menu gabungan agar bookmark tetap berfungsi */}
      <Route path="/dpt" element={<Navigate to="/pemilih" replace />} />
      <Route path="/dpk" element={<Navigate to="/pemilih" replace />} />

      <Route path="/kpps" element={
        <KppsTab
          kppsUsers={kpps.kppsUsers}
          kppsLoading={kpps.kppsLoading}
          setKppsPage={kpps.setKppsPage}
          setIsKppsModalOpen={kpps.setIsModalOpen}
          setResetUser={kpps.setResetUser}
          setResetPasswordVal={kpps.setResetPasswordVal}
          setIsResetModalOpen={kpps.setIsResetModalOpen}
          handleDeleteUser={kpps.handleDeleteUser}
          isAdmin={isAdmin}
          currentUserId={user?.id}
        />
      } />

      <Route path="/paslon" element={
        <PaslonTab
          paslons={paslon.paslons}
          loading={paslon.loading}
          setIsModalOpen={paslon.setIsModalOpen}
          setIsEditing={paslon.setIsEditing}
          setEditingPaslon={paslon.setEditingPaslon}
          setNomorUrut={paslon.form.setField.nomorUrut}
          setNamaKetua={paslon.form.setField.namaKetua}
          setFoto={paslon.form.setField.foto}
          handleDeletePaslon={paslon.handleDeletePaslon}
          isAdmin={isAdmin}
        />
      } />

      <Route path="*" element={<Navigate to={berandaPeran} replace />} />
    </Routes>
  );
};
