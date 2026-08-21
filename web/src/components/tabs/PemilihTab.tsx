import React from 'react';
import { Icons } from '../Icons';
import { LoadingHint } from '../LoadingHint';
import { TAHAPAN, URUTAN_TAHAPAN, metaTahapan } from '../../utils/tahapan';

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
