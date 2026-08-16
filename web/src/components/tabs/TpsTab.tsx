import React from 'react';
import { Icons } from '../Icons';
import { roundVal } from '../../utils/helpers';

interface TpsTabProps {
  tpsPageData: any;
  tpsPageLoading: boolean;
  setTpsPage: React.Dispatch<React.SetStateAction<number>>;
  setIsTpsModalOpen: (open: boolean) => void;
  setSelectedTpsId: (id: number | null) => void;
  setPage: (page: string) => void;
}

export const TpsTab: React.FC<TpsTabProps> = ({
  tpsPageData,
  tpsPageLoading,
  setTpsPage,
  setIsTpsModalOpen,
  setSelectedTpsId,
  setPage,
}) => {
  return (
    <div>
      <div className="section-header">
        <div>
          <h1 className="section-title">Tempat Pemungutan Suara (TPS)</h1>
          <p className="section-desc">Daftar wilayah TPS dan manajemen alur rekapitulasi.</p>
        </div>
        <button onClick={() => setIsTpsModalOpen(true)} className="btn btn-primary">
          <Icons.Plus />
          <span>Tambah TPS</span>
        </button>
      </div>

      {tpsPageLoading && <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '16px' }}>Memuat data TPS...</div>}

      {tpsPageData && (
        <>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nama TPS</th>
                  <th>Wilayah / Alamat</th>
                  <th>Jumlah Pemilih (DPT)</th>
                  <th>Kehadiran (Hadir)</th>
                  <th>% Kehadiran</th>
                  <th>Jumlah Akun KPPS</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {tpsPageData.data.map((t: any) => (
                  <tr key={t.id}>
                    <td>{t.id}</td>
                    <td style={{ fontWeight: '600' }}>{t.nama}</td>
                    <td>{t.wilayah}</td>
                    <td>{t.dpt_count ?? t.total_dpt}</td>
                    <td>{t.hadir_count ?? 0}</td>
                    <td>
                      {t.dpt_count > 0 ? `${roundVal(((t.hadir_count ?? 0) / t.dpt_count) * 100)}%` : '0%'}
                    </td>
                    <td>{t.users_count}</td>
                    <td>
                      <button
                        onClick={() => {
                          setSelectedTpsId(t.id);
                          setPage('tps-detail');
                        }}
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      >
                        Lihat Detail
                      </button>
                    </td>
                  </tr>
                ))}
                {tpsPageData.data.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada data TPS.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="pagination">
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Menampilkan Halaman {tpsPageData.current_page} dari {tpsPageData.last_page} ({tpsPageData.total} TPS)
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                disabled={tpsPageData.current_page === 1}
                onClick={() => setTpsPage(prev => Math.max(1, prev - 1))}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              >
                Sebelumnya
              </button>
              <button
                disabled={tpsPageData.current_page === tpsPageData.last_page}
                onClick={() => setTpsPage(prev => Math.min(tpsPageData.last_page, prev + 1))}
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
export default TpsTab;
