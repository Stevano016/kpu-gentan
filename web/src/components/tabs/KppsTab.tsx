import React from 'react';
import { Icons } from '../Icons';

interface KppsTabProps {
  kppsUsers: any;
  kppsLoading: boolean;
  setKppsPage: React.Dispatch<React.SetStateAction<number>>;
  setIsKppsModalOpen: (open: boolean) => void;
  setResetUser: (user: any) => void;
  setResetPasswordVal: (val: string) => void;
  setIsResetModalOpen: (open: boolean) => void;
  handleDeleteUser: (id: number) => Promise<void>;
}

export const KppsTab: React.FC<KppsTabProps> = ({
  kppsUsers,
  kppsLoading,
  setKppsPage,
  setIsKppsModalOpen,
  setResetUser,
  setResetPasswordVal,
  setIsResetModalOpen,
  handleDeleteUser,
}) => {
  return (
    <div>
      <div className="section-header">
        <div>
          <h1 className="section-title">Manajemen Akun KPPS</h1>
          <p className="section-desc">Provision akun KPPS (1 akun per TPS) untuk log in di aplikasi Android lapangan.</p>
        </div>
        <button onClick={() => setIsKppsModalOpen(true)} className="btn btn-primary">
          <Icons.Plus />
          <span>Buat Akun KPPS</span>
        </button>
      </div>

      {kppsLoading && <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '16px' }}>Memuat data...</div>}

      {kppsUsers && (
        <>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Hak Akses / Peran</th>
                  <th>Asosiasi TPS</th>
                  <th>Dibuat Tanggal</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {kppsUsers.data.map((u: any) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: '600' }}>{u.username}</td>
                    <td>
                      {u.kpps_role === 'validasi' ? (
                        <span className="badge badge-secondary" style={{ backgroundColor: 'oklch(0.92 0.02 240)', color: 'oklch(0.40 0.10 240)' }}>Hanya Validasi</span>
                      ) : (
                        <span className="badge badge-success" style={{ backgroundColor: 'oklch(0.92 0.05 160)', color: 'oklch(0.35 0.15 160)' }}>Validasi & Quick Count</span>
                      )}
                    </td>
                    <td>{u.tps?.nama || 'Tidak Terhubung'}</td>
                    <td>{new Date(u.created_at).toLocaleString('id-ID')}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => {
                            setResetUser(u);
                            setResetPasswordVal('');
                            setIsResetModalOpen(true);
                          }}
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                        >
                          Reset Password
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--danger)' }}
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {kppsUsers.data.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada akun KPPS terdaftar.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="pagination">
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Menampilkan Halaman {kppsUsers.current_page} dari {kppsUsers.last_page} ({kppsUsers.total} akun KPPS)
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                disabled={kppsUsers.current_page === 1}
                onClick={() => setKppsPage(prev => Math.max(1, prev - 1))}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              >
                Sebelumnya
              </button>
              <button
                disabled={kppsUsers.current_page === kppsUsers.last_page}
                onClick={() => setKppsPage(prev => Math.min(kppsUsers.last_page, prev + 1))}
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
export default KppsTab;
