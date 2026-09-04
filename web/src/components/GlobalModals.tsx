import { TpsModal } from './modals/TpsModal';
import { DptModal } from './modals/DptModal';
import { ImportCsvModal } from './modals/ImportCsvModal';
import { KppsModal } from './modals/KppsModal';
import { ResetPasswordModal } from './modals/ResetPasswordModal';
import { QrViewerModal } from './modals/QrViewerModal';
import { VoterSuccessModal } from './modals/VoterSuccessModal';
import { PaslonModal } from './modals/PaslonModal';
import { CustomConfirmModal } from './CustomConfirmModal';
import { CustomPromptModal } from './CustomPromptModal';
import { CustomAlertModal } from './CustomAlertModal';
import { downloadQrCode } from '../utils/qr';
import type { FeedbackController } from '../hooks/useFeedback';
import type { ImportCsvController } from '../hooks/useImportCsv';
import type { KppsController } from '../hooks/useKpps';
import type { PaslonController } from '../hooks/usePaslon';
import type { PemilihController } from '../hooks/usePemilih';
import type { QrController } from '../hooks/useQrCode';
import type { TpsController } from '../hooks/useTps';

interface GlobalModalsProps {
  feedback: FeedbackController;
  /** Pantarlih hanya boleh mendaftarkan pemilih baru sebagai DPTb. */
  isPantarlih: boolean;
  tps: TpsController;
  pemilih: PemilihController;
  kpps: KppsController;
  paslon: PaslonController;
  qr: QrController;
  importCsv: ImportCsvController;
}

/**
 * Seluruh modal panel, dirender satu kali di luar rute.
 *
 * Tempatnya di sini dan bukan di dalam layar masing-masing karena modalnya
 * harus tetap hidup saat rutenya berpindah — modal konfirmasi hapus yang ikut
 * hilang bersama halamannya membuat aksinya tidak pernah selesai.
 */
export const GlobalModals: React.FC<GlobalModalsProps> = ({
  feedback,
  isPantarlih,
  tps,
  pemilih,
  kpps,
  paslon,
  qr,
  importCsv,
}) => {
  const dpt = pemilih.form.values;
  const setDpt = pemilih.form.setField;
  const akun = kpps.form.values;
  const setAkun = kpps.form.setField;

  return (
    <>
      <TpsModal
        isOpen={tps.isModalOpen}
        onClose={() => tps.setIsModalOpen(false)}
        tpsName={tps.form.values.nama}
        setTpsName={tps.form.setField.nama}
        tpsRegion={tps.form.values.wilayah}
        setTpsRegion={tps.form.setField.wilayah}
        onSubmit={tps.handleCreateTps}
      />

      <DptModal
        isOpen={pemilih.isModalOpen}
        onClose={() => pemilih.setIsModalOpen(false)}
        editingDpt={pemilih.editingDpt}
        dptFormNik={dpt.nik}
        setDptFormNik={setDpt.nik}
        dptFormNkk={dpt.nkk}
        setDptFormNkk={setDpt.nkk}
        dptFormNama={dpt.nama}
        setDptFormNama={setDpt.nama}
        dptFormTps={dpt.tps}
        setDptFormTps={setDpt.tps}
        dptFormJenis={dpt.jenis}
        setDptFormJenis={setDpt.jenis}
        dptFormUmur={dpt.umur}
        setDptFormUmur={setDpt.umur}
        dptFormStatusKawin={dpt.statusKawin}
        setDptFormStatusKawin={setDpt.statusKawin}
        setDptFormJenisKelamin={setDpt.jenisKelamin}
        dptFormAlamat={dpt.alamat}
        setDptFormAlamat={setDpt.alamat}
        dptFormRt={dpt.rt}
        setDptFormRt={setDpt.rt}
        dptFormRw={dpt.rw}
        setDptFormRw={setDpt.rw}
        dptFormPekerjaan={dpt.pekerjaan}
        setDptFormPekerjaan={setDpt.pekerjaan}
        dptFormDisabilitas={dpt.disabilitas}
        setDptFormDisabilitas={setDpt.disabilitas}
        dptFormKeterangan={dpt.keterangan}
        setDptFormKeterangan={setDpt.keterangan}
        isPantarlih={isPantarlih}
        tpsList={tps.tpsList}
        cekNikMemeriksa={pemilih.cekNik.memeriksa}
        cekNikPesan={pemilih.cekNik.pesan}
        editingQrCode={qr.editingQrCode}
        downloadQrCode={downloadQrCode}
        onSubmit={pemilih.handleSaveDpt}
      />

      <ImportCsvModal
        isOpen={importCsv.isOpen}
        onClose={importCsv.close}
        importFile={importCsv.file}
        setImportFile={importCsv.setFile}
        importStatus={importCsv.status}
        importLoading={importCsv.loading}
        onSubmit={importCsv.handleImport}
      />

      <KppsModal
        isOpen={kpps.isModalOpen}
        onClose={() => kpps.setIsModalOpen(false)}
        kppsFormUsername={akun.username}
        setKppsFormUsername={setAkun.username}
        kppsFormPassword={akun.password}
        setKppsFormPassword={setAkun.password}
        kppsFormTps={akun.tps}
        setKppsFormTps={setAkun.tps}
        kppsFormRw={akun.rw}
        setKppsFormRw={setAkun.rw}
        kppsFormRole={akun.role}
        setKppsFormRole={setAkun.role}
        kppsFormAccountType={akun.accountType}
        setKppsFormAccountType={setAkun.accountType}
        kppsFormSekretariatRole={akun.sekretariatRole}
        setKppsFormSekretariatRole={setAkun.sekretariatRole}
        tpsList={tps.tpsList}
        onSubmit={kpps.handleCreateKpps}
      />

      <ResetPasswordModal
        isOpen={kpps.isResetModalOpen}
        onClose={() => kpps.setIsResetModalOpen(false)}
        resetUser={kpps.resetUser}
        resetPasswordVal={kpps.resetPasswordVal}
        setResetPasswordVal={kpps.setResetPasswordVal}
        onSubmit={kpps.handleResetKppsPassword}
      />

      <QrViewerModal
        isOpen={qr.isQrModalOpen}
        onClose={qr.closeQrModal}
        selectedVoterQr={qr.selectedVoterQr}
        selectedVoterName={qr.selectedVoterName}
        downloadQrCode={downloadQrCode}
      />

      <VoterSuccessModal
        newVoterSuccess={pemilih.newVoterSuccess}
        onClose={pemilih.clearNewVoterSuccess}
        downloadQrCode={downloadQrCode}
      />

      <PaslonModal
        isOpen={paslon.isModalOpen}
        onClose={() => paslon.setIsModalOpen(false)}
        isEditing={paslon.isEditing}
        nomorUrut={paslon.form.values.nomorUrut}
        setNomorUrut={paslon.form.setField.nomorUrut}
        namaKetua={paslon.form.values.namaKetua}
        setNamaKetua={paslon.form.setField.namaKetua}
        foto={paslon.form.values.foto}
        setFoto={paslon.form.setField.foto}
        fotoLama={paslon.editingPaslon?.foto_url ?? null}
        onSubmit={paslon.handleSavePaslon}
      />

      <CustomPromptModal
        isOpen={feedback.prompt.open}
        title={feedback.prompt.title}
        message={feedback.prompt.message}
        saran={feedback.prompt.saran}
        pilihan={feedback.prompt.pilihan}
        placeholder="Tulis alasan..."
        onCancel={feedback.closePrompt}
        onSubmit={feedback.submitPrompt}
      />

      <CustomConfirmModal
        isOpen={feedback.confirm.open}
        title={feedback.confirm.title}
        message={feedback.confirm.message}
        onCancel={feedback.closeConfirm}
        onConfirm={feedback.submitConfirm}
        btnText={feedback.confirm.btnText}
        isDanger={feedback.confirm.danger}
      />

      <CustomAlertModal
        isOpen={feedback.alert.open}
        variant={feedback.alert.variant}
        title={feedback.alert.title}
        message={feedback.alert.message}
        onClose={feedback.closeAlert}
        btnText={feedback.alert.variant === 'success' ? 'Selesai' : 'Tutup'}
      />
    </>
  );
};
