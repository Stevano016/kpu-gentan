import React from 'react';
import { Icons } from '../Icons';
import { LoadingHint } from '../LoadingHint';
import { TAHAPAN, URUTAN_TAHAPAN, metaTahapan } from '../../utils/tahapan';
import { ApiService } from '../../services/api';
import { PDFDocument, TextAlignment, StandardFonts, PDFName } from 'pdf-lib';
import QRCode from 'qrcode';

interface PemilihTabProps {
  dptData: any;
  dptLoading: boolean;
  dptSearch: string;
  setDptSearch: (val: string) => void;
  dptTpsFilter: string;
  setDptTpsFilter: (val: string) => void;
  dptJenisFilter: string;
  setDptJenisFilter: (val: string) => void;
  dptKeteranganFilter: string;
  setDptKeteranganFilter: (val: string) => void;
  setDptPage: (page: number) => void;
  tpsList: any[];
  setIsImportModalOpen: (open: boolean) => void;
  setIsDptModalOpen: (open: boolean) => void;
  setEditingDpt: (voter: any) => void;
  setDptFormNik: (val: string) => void;
  setDptFormNkk: (val: string) => void;
  setDptFormNama: (val: string) => void;
  setDptFormTps: (val: string) => void;
  setDptFormJenis: (val: string) => void;
  setDptFormUmur: (val: string) => void;
  setDptFormStatusKawin: (val: string) => void;
  setDptFormJenisKelamin: (val: string) => void;
  setDptFormAlamat: (val: string) => void;
  setDptFormRt: (val: string) => void;
  setDptFormRw: (val: string) => void;
  setDptFormPekerjaan: (val: string) => void;
  setDptFormDisabilitas: (val: string) => void;
  setDptFormKeterangan: (val: string) => void;
  fetchQrCode: (nik: string, name: string) => Promise<void>;
  fetchEditingQr: (nik: string) => Promise<void>;
  handleDeleteDpt: (nik: string) => Promise<void>;
  handleVerifikasiDp4: () => void;
  handleTetapkanDpt: () => void;
  handleTandaiTms: (voter: any) => void;
  handleBatalkanTms: (nik: string) => void;
  handleTandaiDpk: (nik: string, nama: string) => void;
  handleBatalkanDpk: (nik: string) => void;
  isAdmin: boolean;
  isPantarlih?: boolean;
  daftarRw: string[];
  handleExport: (params: Record<string, string>, denganNikNkk?: boolean) => Promise<void>;
}

const JENIS_OPTIONS = [
  { value: '', label: 'Semua', judul: 'Tampilkan seluruh tahapan' },
  // Label pendek supaya tujuh chip muat dalam satu baris; nama lengkap dan
  // penjelasannya tetap tersedia lewat tooltip.
  ...URUTAN_TAHAPAN.map((t) => ({
    value: t,
    label: TAHAPAN[t].singkat,
    judul: `${TAHAPAN[t].label} — ${TAHAPAN[t].keterangan}`,
  })),
];

export const PemilihTab: React.FC<PemilihTabProps> = ({
  dptData,
  dptLoading,
  dptSearch,
  setDptSearch,
  dptTpsFilter,
  setDptTpsFilter,
  dptJenisFilter,
  setDptJenisFilter,
  dptKeteranganFilter,
  setDptKeteranganFilter,
  setDptPage,
  tpsList,
  setIsImportModalOpen,
  setIsDptModalOpen,
  setEditingDpt,
  setDptFormNik,
  setDptFormNkk,
  setDptFormNama,
  setDptFormTps,
  setDptFormJenis,
  setDptFormUmur,
  setDptFormStatusKawin,
  setDptFormJenisKelamin,
  setDptFormAlamat,
  setDptFormRt,
  setDptFormRw,
  setDptFormPekerjaan,
  setDptFormDisabilitas,
  setDptFormKeterangan,
  fetchQrCode,
  fetchEditingQr,
  handleDeleteDpt,
  handleVerifikasiDp4,
  handleTetapkanDpt,
  handleTandaiTms,
  handleBatalkanTms,
  handleTandaiDpk,
  handleBatalkanDpk,
  isAdmin,
  isPantarlih = false,
  daftarRw,
  handleExport,
}) => {
  const [menuEksporTerbuka, setMenuEksporTerbuka] = React.useState(false);
  const [expandedNik, setExpandedNik] = React.useState<string | null>(null);
  const [exportParams, setExportParams] = React.useState<Record<string, string> | null>(null);
  const [isExportConfirmOpen, setIsExportConfirmOpen] = React.useState(false);
  const [downloadingNik, setDownloadingNik] = React.useState<string | null>(null);

  const handleDownloadC6 = async (v: any) => {
    if (downloadingNik) return;
    setDownloadingNik(v.nik);
    try {
      const apiResponse = await ApiService.cekPemilih(v.nik);
      if (!apiResponse.ok) {
        alert("Gagal menghubungi server untuk memverifikasi data pemilih.");
        return;
      }
      
      const res = await apiResponse.json();
      if (!res || res.status !== 'success' || !res.data || res.data.length === 0) {
        alert("Data pemilih tidak ditemukan atau belum terverifikasi.");
        return;
      }
      
      const voter = res.data[0];
      
      const response = await fetch('/undangan.pdf');
      if (!response.ok) {
        throw new Error("Gagal mengunduh template undangan.");
      }
      const pdfBytes = await response.arrayBuffer();

      const pdfDoc = await PDFDocument.load(pdfBytes);
      const form = pdfDoc.getForm();

      form.getTextField('nomor').setText(voter.no_urut !== null && voter.no_urut !== undefined ? String(voter.no_urut) : '');
      form.getTextField('nama').setText(voter.nama);
      form.getTextField('jenis_kelamin').setText(voter.jenis_kelamin === 'LAKI-LAKI' ? 'Laki-laki' : 'Perempuan');
      form.getTextField('dusun').setText(voter.alamat || '');
      form.getTextField('rt').setText(voter.rt || '');
      form.getTextField('rw').setText(voter.rw || '');
      form.getTextField('hari_tanggal').setText("Kamis, 10 Desember 2026");

      const tpsTotal = voter.tps_total_dpt || 1;
      const voterIdx = voter.tps_voter_index || 0;
      const segmentSize = Math.ceil(tpsTotal / 6);
      const session = Math.min(6, Math.max(1, Math.floor(voterIdx / segmentSize) + 1));
      const timeSlots = [
        "07:00 - 08:00 WIB",
        "08:00 - 09:00 WIB",
        "09:00 - 10:00 WIB",
        "10:00 - 11:00 WIB",
        "11:00 - 12:00 WIB",
        "12:00 - 13:00 WIB"
      ];
      const waktuStr = timeSlots[session - 1];
      form.getTextField('waktu').setText(waktuStr);

      const getTpsLocationName = (tpsName: string) => {
        if (!tpsName) return "Balai Desa Gentan";
        const match = tpsName.match(/\d+/);
        if (!match) return "Balai Desa Gentan";
        const num = parseInt(match[0], 10);
        switch (num) {
          case 1: return "Ngemplak RT. 3/1";
          case 2: return "JOGLO SATRIO PINAYUNGAN RT. 1/3";
          case 3: return "PAUD SRIKANDI KEDEN RT. 1/7";
          case 4: return "NGENDEN RT. 1/8";
          case 5: return "GEDUNG BULU TANGKIS KANTOR DESA";
          default: return "Balai Desa Gentan";
        }
      };
      form.getTextField('tempat1').setText(getTpsLocationName(voter.tps));
      form.getTextField('tempat2').setText("Gentan, Baki, Sukoharjo");

      const fieldTgl = form.getTextField('tgl_dikeluarkan');
      fieldTgl.setText("04 Desember 2026");
      fieldTgl.setAlignment(TextAlignment.Center);

      const fieldKetua = form.getTextField('nama_ketua');
      fieldKetua.setText("MOCH. SUTOPO, S. H., M. H.");
      fieldKetua.setAlignment(TextAlignment.Center);

      const qrDataUrl = await QRCode.toDataURL(voter.id_pemilih || voter.nik || "", {
        margin: 1,
        width: 150
      });
      
      const qrImageBytes = await fetch(qrDataUrl).then(res => res.arrayBuffer());
      const qrImage = await pdfDoc.embedPng(qrImageBytes);

      const page = pdfDoc.getPages()[0];
      page.drawImage(qrImage, {
        x: 470,
        y: 725,
        width: 80,
        height: 80
      });

      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      form.getFields().forEach(field => {
        if (typeof (field as any).setText === 'function') {
          (field as any).setText((field as any).getText() || '');
        }
        field.acroField.getWidgets().forEach(widget => {
          const mk = widget.dict.get(PDFName.of('MK'));
          if (mk && typeof (mk as any).delete === 'function') {
            (mk as any).delete(PDFName.of('BG'));
          }
        });
      });

      form.updateFieldAppearances(helveticaBold);
      form.flatten();

      const modifiedPdfBytes = await pdfDoc.save();
      const blob = new Blob([modifiedPdfBytes as any], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Undangan_${voter.nama.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Gagal mengunduh C6:", error);
      alert("Terjadi kesalahan saat membuat undangan C6.");
    } finally {
      setDownloadingNik(null);
    }
  };
  const activeJenisLabel = dptJenisFilter ? metaTahapan(dptJenisFilter).singkat : 'Semua Kategori';

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 className="section-title">Data Pemilih</h1>
          <p className="section-desc">
            {isPantarlih
              ? 'Daftarkan pemilih yang belum terdata. Setiap data yang Anda masukkan otomatis tercatat sebagai DPTb (Pemilih Tambahan).'
              : `Alur pendataan: DP4 → verifikasi → DPS, ditambah DPTb, lalu ditetapkan jadi DPT, dan kasus khusus dipilah ke DPK. Menampilkan: ${activeJenisLabel}.`}
          </p>
        </div>
        {(isAdmin || isPantarlih) && (
          <div className="header-actions">
            {isAdmin && (
              <>
                <button onClick={handleVerifikasiDp4} className="btn btn-secondary" title="DP4 yang lolos menjadi DPS">
                  <span>Verifikasi DP4</span>
                </button>
                <button onClick={handleTetapkanDpt} className="btn btn-secondary" title="Gabungkan DPS dan DPTb menjadi DPT">
                  <span>Tetapkan DPT</span>
                </button>
                <button onClick={() => setIsImportModalOpen(true)} className="btn btn-secondary">
                  <Icons.Upload />
                  <span>Impor CSV</span>
                </button>
              </>
            )}
            {isPantarlih ? (
              <button
                onClick={() => { setExportParams({}); setIsExportConfirmOpen(true); }}
                className="btn btn-secondary"
                title="Unduh seluruh pemilih di TPS Anda"
              >
                <Icons.Download />
                <span>Unduh Excel TPS Saya</span>
              </button>
            ) : (
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setMenuEksporTerbuka((v) => !v)}
                  className="btn btn-secondary"
                >
                  <Icons.Download />
                  <span>Ekspor Excel</span>
                </button>
                {menuEksporTerbuka && (
                  <div className="export-menu">
                    <button
                      type="button"
                      className="export-menu-item"
                      onClick={() => { setMenuEksporTerbuka(false); setExportParams({ lingkup: 'all' }); setIsExportConfirmOpen(true); }}
                    >
                      Semua data pemilih
                    </button>

                    <div className="export-menu-label">Per TPS</div>
                    {tpsList.map((t) => (
                      <button
                        key={`tps-${t.id}`}
                        type="button"
                        className="export-menu-item"
                        onClick={() => { setMenuEksporTerbuka(false); setExportParams({ lingkup: 'tps', tps_id: String(t.id) }); setIsExportConfirmOpen(true); }}
                      >
                        {t.nama}
                      </button>
                    ))}

                    <div className="export-menu-label">Per RW</div>
                    {daftarRw.length === 0 && <div className="export-menu-kosong">Belum ada data RW</div>}
                    {daftarRw.map((rw) => (
                      <button
                        key={`rw-${rw}`}
                        type="button"
                        className="export-menu-item"
                        onClick={() => { setMenuEksporTerbuka(false); setExportParams({ lingkup: 'rw', rw }); setIsExportConfirmOpen(true); }}
                      >
                        RW {rw}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => {
                setEditingDpt(null);
                setDptFormNik('');
                setDptFormNkk('');
                setDptFormNama('');
                setDptFormTps('');
                // Ikuti filter aktif; kalau "Semua", default ke DPT
                setDptFormJenis(dptJenisFilter || 'dpt');
                setDptFormUmur('');
                setDptFormStatusKawin('');
                setDptFormJenisKelamin('');
                setDptFormAlamat('');
                setDptFormRt('');
                setDptFormRw('');
                setDptFormPekerjaan('');
                setDptFormDisabilitas('');
                setDptFormKeterangan('');
                setIsDptModalOpen(true);
              }}
              className="btn btn-primary"
            >
              <Icons.Plus />
              <span>Tambah Pemilih</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter jenis pemilih */}
      <div className="jenis-filter">
        {JENIS_OPTIONS.map(opt => (
          <button
            key={opt.value || 'all'}
            type="button"
            onClick={() => {
              setDptJenisFilter(opt.value);
              setDptPage(1);
            }}
            title={opt.judul}
            className={`jenis-filter-btn${dptJenisFilter === opt.value ? ' active' : ''}`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Filter & Search Bar */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', backgroundColor: 'var(--surface)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexGrow: 1, minWidth: '240px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', gap: '8px', alignItems: 'center', backgroundColor: 'var(--background)' }}>
          <Icons.Search />
          <input
            type="text"
            placeholder="Cari berdasarkan NIK atau Nama Pemilih..."
            style={{ border: 'none', outline: 'none', background: 'none', width: '100%', fontSize: '0.875rem' }}
            value={dptSearch}
            onChange={e => {
              setDptSearch(e.target.value);
              setDptPage(1);
            }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Filter TPS:</label>
          <select
            className="form-control"
            style={{ width: '180px', padding: '8px 12px' }}
            value={dptTpsFilter}
            onChange={e => {
              setDptTpsFilter(e.target.value);
              setDptPage(1);
            }}
          >
            <option value="">Semua TPS</option>
            {tpsList.map(t => (
              <option key={t.id} value={t.id}>{t.nama}</option>
            ))}
          </select>
        </div>
        {dptJenisFilter === 'tms' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Alasan TMS:</label>
            <select
              className="form-control"
              style={{ width: '180px', padding: '8px 12px' }}
              value={dptKeteranganFilter}
              onChange={e => {
                setDptKeteranganFilter(e.target.value);
                setDptPage(1);
              }}
            >
              <option value="">Semua Alasan</option>
              <option value="4 : Meninggal">Meninggal</option>
              <option value="5 : Ganda">Ganda</option>
              <option value="6 : Dibawah Umur">Dibawah Umur</option>
              <option value="7 : Tidak Ditemukan">Tidak Ditemukan</option>
            </select>
          </div>
        )}
      </div>

      <LoadingHint show={dptLoading} label="Memuat data pemilih..." />

      {dptData && (
        <>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID Pemilih</th>
                  <th>NIK</th>
                  <th>Nama Pemilih</th>
                  <th>Jenis</th>
                  <th>TPS Terdaftar</th>
                  <th>Kehadiran</th>
                  <th>Waktu Check-in</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {dptData.data.map((v: any) => (
                  <React.Fragment key={v.nik}>
                    <tr style={{ borderBottom: expandedNik === v.nik ? 'none' : '1px solid var(--border)' }}>
                      <td className="cell-nowrap" style={{ fontFamily: 'monospace', fontWeight: '700', color: 'var(--primary)' }}>{v.id_pemilih}</td>
                      <td className="cell-nowrap" style={{ fontFamily: 'monospace', fontWeight: '500' }}>
                        {v.nik}
                        {/* Nomor sementara buatan sistem harus terbaca sebagai
                            nomor sementara di mana pun ia muncul; tanpa tanda
                            ini ia tampak seperti NIK resmi. */}
                        {v.nik_sintetis && (
                          <span
                            className="badge badge-warning"
                            style={{ marginLeft: '6px' }}
                            title="NIK asli belum ada di data pembanding — nomor ini dibuat sistem dan wajib dilengkapi saat coklit"
                          >
                            sementara
                          </span>
                        )}
                      </td>
                      <td style={{ fontWeight: '600' }}>{v.nama}</td>
                      <td>
                        <span
                          className={`badge ${metaTahapan(v.tahapan).badge}`}
                          title={metaTahapan(v.tahapan).keterangan}
                        >
                          {metaTahapan(v.tahapan).singkat}
                        </span>
                        {/* Setelah jadi DPT, asalnya tidak lagi terlihat dari
                            tahapan — padahal itu yang dilaporkan ke KPU. */}
                        {v.tahapan === 'dpt' && v.asal === 'dptb' && (
                          <span
                            style={{ marginLeft: '6px', fontSize: '0.7rem', color: 'var(--text-muted)' }}
                            title="Masuk lewat DPTb, bukan dari DP4"
                          >
                            eks-DPTb
                          </span>
                        )}
                      </td>
                      <td>{v.tps?.nama || `TPS ID: ${v.tps_id}`}</td>
                      <td>
                        {v.status_hadir ? (
                          <span className="badge badge-success">Hadir</span>
                        ) : (
                          <span className="badge badge-danger">Belum Hadir</span>
                        )}
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>
                        {v.waktu_checkin ? new Date(v.waktu_checkin).toLocaleString('id-ID') : '-'}
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            onClick={() => fetchQrCode(v.nik, v.nama)}
                            className="btn btn-secondary"
                            style={{ color: 'var(--primary)' }}
                          >
                            QR
                          </button>
                          {(v.tahapan === 'dpt' || v.tahapan === 'dpk') && (
                            <button
                              type="button"
                              onClick={() => handleDownloadC6(v)}
                              className="btn btn-secondary"
                              style={{ color: downloadingNik === v.nik ? 'var(--text-muted)' : 'oklch(0.5 0.15 140)', fontWeight: '600' }}
                              disabled={downloadingNik !== null}
                              title="Unduh Undangan C6"
                            >
                              {downloadingNik === v.nik ? '...' : 'C6'}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setExpandedNik(expandedNik === v.nik ? null : v.nik)}
                            className="btn btn-secondary"
                            style={{ color: expandedNik === v.nik ? 'var(--primary)' : 'inherit' }}
                          >
                            {expandedNik === v.nik ? 'Tutup' : 'Detail'}
                          </button>
                          {isAdmin && v.tahapan === 'dp4' && (
                            <button
                              type="button"
                              onClick={() => handleTandaiTms(v)}
                              className="btn btn-secondary"
                              style={{ color: 'var(--danger)' }}
                              title="Tandai tidak memenuhi syarat"
                            >
                              TMS
                            </button>
                          )}
                          {isAdmin && v.tahapan === 'tms' && (
                            <button
                              type="button"
                              onClick={() => handleBatalkanTms(v.nik)}
                              className="btn btn-secondary"
                              title={v.tms_alasan ? `Alasan: ${v.tms_alasan}` : 'Kembalikan ke DP4'}
                            >
                              Batal TMS
                            </button>
                          )}
                          {isAdmin && v.tahapan === 'dpt' && (
                            <button
                              type="button"
                              onClick={() => handleTandaiDpk(v.nik, v.nama)}
                              className="btn btn-secondary"
                              style={{ color: 'var(--warning)' }}
                              title="Pilah sebagai pemilih khusus"
                            >
                              Jadikan DPK
                            </button>
                          )}
                          {isAdmin && v.tahapan === 'dpk' && (
                            <button
                              type="button"
                              onClick={() => handleBatalkanDpk(v.nik)}
                              className="btn btn-secondary"
                              title={v.dpk_alasan ? `Alasan: ${v.dpk_alasan}` : 'Kembalikan ke DPT'}
                            >
                              Batal DPK
                            </button>
                          )}
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => {
                                  setEditingDpt(v);
                                  setDptFormNik(v.nik);
                                  setDptFormNkk(v.nkk || '');
                                  setDptFormNama(v.nama);
                                  setDptFormTps(String(v.tps_id));
                                  setDptFormJenis(v.tahapan || 'dp4');
                                  setDptFormUmur(v.umur ? String(v.umur) : '');
                                  setDptFormStatusKawin(v.status_kawin || '');
                                  setDptFormJenisKelamin(v.jenis_kelamin || '');
                                  setDptFormAlamat(v.alamat || '');
                                  setDptFormRt(v.rt || '');
                                  setDptFormRw(v.rw || '');
                                  setDptFormPekerjaan(v.pekerjaan || '');
                                  setDptFormDisabilitas(v.disabilitas || '');
                                  setDptFormKeterangan(v.keterangan || '');
                                  setIsDptModalOpen(true);
                                  fetchEditingQr(v.nik);
                                }}
                                className="btn btn-secondary"
                                style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteDpt(v.nik)}
                                className="btn btn-secondary"
                                style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--danger)' }}
                              >
                                Hapus
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedNik === v.nik && (
                      <tr style={{ backgroundColor: 'oklch(0.98 0.005 165)' }}>
                        <td colSpan={8} style={{ padding: '16px 24px', borderTop: 'none', borderBottom: '1px solid var(--border)' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px 24px' }}>
                            <div>
                              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '4px' }}>NKK</div>
                              <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                                {v.nkk || '-'}
                                {v.nkk_sintetis && (
                                  <span
                                    className="badge badge-warning"
                                    style={{ marginLeft: '6px' }}
                                    title="NKK asli belum ada — nomor sementara, keluarganya belum bisa dikelompokkan"
                                  >
                                    sementara
                                  </span>
                                )}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '4px' }}>Umur</div>
                              <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>{v.umur ? `${v.umur} Tahun` : '-'}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '4px' }}>Jenis Kelamin</div>
                              <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>{v.jenis_kelamin || '-'}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '4px' }}>Status Perkawinan</div>
                              <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>{v.status_kawin || '-'}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '4px' }}>Pekerjaan</div>
                              <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>{v.pekerjaan || '-'}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '4px' }}>Alamat</div>
                              <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>{v.alamat || '-'}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '4px' }}>RT / RW</div>
                              <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>RT {v.rt || '-'} / RW {v.rw || '-'}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '4px' }}>Disabilitas</div>
                              <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>{v.disabilitas || '-'}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '4px' }}>Keterangan</div>
                              <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>{v.keterangan || '-'}</div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                {dptData.data.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Tidak ditemukan data pemilih.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="pagination">
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Menampilkan Halaman {dptData.current_page} dari {dptData.last_page} ({dptData.total} pemilih)
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                disabled={dptData.current_page === 1}
                onClick={() => setDptPage(Math.max(1, dptData.current_page - 1))}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              >
                Sebelumnya
              </button>
              <button
                disabled={dptData.current_page === dptData.last_page}
                onClick={() => setDptPage(Math.min(dptData.last_page, dptData.current_page + 1))}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              >
                Selanjutnya
              </button>
            </div>
          </div>
        </>
      )}

      {isExportConfirmOpen && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: '420px', padding: '24px' }}>
            <h3 className="modal-title" style={{ marginBottom: '12px', fontSize: '1.2rem', fontWeight: '700' }}>
              Pilih Opsi Ekspor Excel
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: '1.5' }}>
              Silakan pilih format berkas Excel yang ingin Anda unduh:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
                onClick={() => {
                  if (exportParams) handleExport(exportParams, true);
                  setIsExportConfirmOpen(false);
                  setExportParams(null);
                }}
              >
                <span>Unduh DENGAN NIK & NKK</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ width: '100%', justifyContent: 'center', padding: '10px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
                onClick={() => {
                  if (exportParams) handleExport(exportParams, false);
                  setIsExportConfirmOpen(false);
                  setExportParams(null);
                }}
              >
                <span>Unduh TANPA NIK & NKK</span>
              </button>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 0 }}>
              <button
                type="button"
                onClick={() => {
                  setIsExportConfirmOpen(false);
                  setExportParams(null);
                }}
                className="btn btn-secondary"
                style={{ minWidth: '80px', padding: '8px 16px', fontSize: '0.875rem' }}
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default PemilihTab;
