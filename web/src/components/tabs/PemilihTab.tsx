import React from 'react';
import { Icons } from '../Icons';

interface PemilihTabProps {
  dptData: any;
  dptLoading: boolean;
  dptSearch: string;
  setDptSearch: (val: string) => void;
  dptTpsFilter: string;
  setDptTpsFilter: (val: string) => void;
  dptJenisFilter: string;
  setDptJenisFilter: (val: string) => void;
  setDptPage: (page: number) => void;
  tpsList: any[];
  setIsImportModalOpen: (open: boolean) => void;
  setIsDptModalOpen: (open: boolean) => void;
  setEditingDpt: (voter: any) => void;
  setDptFormNik: (val: string) => void;
  setDptFormNama: (val: string) => void;
  setDptFormTps: (val: string) => void;
  setDptFormJenis: (val: string) => void;
  fetchQrCode: (nik: string, name: string) => Promise<void>;
  fetchEditingQr: (nik: string) => Promise<void>;
  handleDeleteDpt: (nik: string) => Promise<void>;
  isAdmin: boolean;
}

const JENIS_OPTIONS = [
  { value: '', label: 'Semua Pemilih' },
  { value: 'dpt', label: 'DPT — Pemilih Tetap' },
  { value: 'dpk', label: 'DPK — Pemilih Khusus' },
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
  setDptPage,
  tpsList,
  setIsImportModalOpen,
  setIsDptModalOpen,
  setEditingDpt,
  setDptFormNik,
  setDptFormNama,
  setDptFormTps,
  setDptFormJenis,
  fetchQrCode,
  fetchEditingQr,
  handleDeleteDpt,
  isAdmin,
}) => {
  const activeJenisLabel =
    dptJenisFilter === 'dpt' ? 'DPT' : dptJenisFilter === 'dpk' ? 'DPK' : 'DPT & DPK';

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 className="section-title">Data Pemilih</h1>
          <p className="section-desc">
            Kelola seluruh pemilih wilayah Gentan — saring berdasarkan DPT atau DPK. Menampilkan: {activeJenisLabel}.
          </p>
        </div>
        {isAdmin && (
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => setIsImportModalOpen(true)} className="btn btn-secondary">
              <Icons.Upload />
              <span>Impor CSV Bulk</span>
            </button>
            <button
              onClick={() => {
                setEditingDpt(null);
                setDptFormNik('');
                setDptFormNama('');
                setDptFormTps('');
                // Ikuti filter aktif; kalau "Semua", default ke DPT
                setDptFormJenis(dptJenisFilter || 'dpt');
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
      </div>

      {dptLoading && <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '16px' }}>Memuat data pemilih...</div>}

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
                  <tr key={v.nik}>
                    <td style={{ fontFamily: 'monospace', fontWeight: '700', color: 'var(--primary)' }}>{v.id_pemilih}</td>
                    <td style={{ fontFamily: 'monospace', fontWeight: '500' }}>{v.nik}</td>
                    <td style={{ fontWeight: '600' }}>{v.nama}</td>
                    <td>
                      {v.jenis_pemilih === 'dpk' ? (
                        <span className="badge badge-warning">DPK</span>
                      ) : (
                        <span className="badge badge-info">DPT</span>
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
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => fetchQrCode(v.nik, v.nama)}
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--primary)' }}
                        >
                          Lihat QR
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => {
                                setEditingDpt(v);
                                setDptFormNik(v.nik);
                                setDptFormNama(v.nama);
                                setDptFormTps(String(v.tps_id));
                                setDptFormJenis(v.jenis_pemilih || 'dpt');
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
    </div>
  );
};
export default PemilihTab;
