import React from 'react';
import { Icons } from '../Icons';
import { LoadingHint } from '../LoadingHint';

interface KppsTabProps {
  kppsUsers: any;
  kppsLoading: boolean;
  setKppsPage: React.Dispatch<React.SetStateAction<number>>;
  setIsKppsModalOpen: (open: boolean) => void;
  setResetUser: (user: any) => void;
  setResetPasswordVal: (val: string) => void;
  setIsResetModalOpen: (open: boolean) => void;
  handleDeleteUser: (id: number) => Promise<void>;
  isAdmin: boolean;
  currentUserId?: number;
}

const RoleBadge: React.FC<{ user: any }> = ({ user }) => {
  // Tanpa cabang ini pantarlih jatuh ke cabang KPPS di bawah dan salah dilabeli.
  if (user.role === 'pantarlih') {
    return (
      <span className="badge" style={{ backgroundColor: 'oklch(0.93 0.04 200)', color: 'oklch(0.38 0.13 200)' }}>
        Pantarlih — Pendata RW {user.rw || '?'}
      </span>
    );
  }

  if (user.role === 'sekretariat') {
    return user.sekretariat_role === 'viewer' ? (
      <span className="badge" style={{ backgroundColor: 'oklch(0.94 0.02 60)', color: 'oklch(0.45 0.12 60)' }}>
        Sekretariat — Lihat Saja
      </span>
    ) : (
      <span className="badge" style={{ backgroundColor: 'oklch(0.92 0.04 300)', color: 'oklch(0.40 0.15 300)' }}>
        Admin Sekretariat
      </span>
    );
  }

  if (user.role === 'monitor') {
    return (
      <span className="badge" style={{ backgroundColor: 'oklch(0.95 0.03 140)', color: 'oklch(0.40 0.12 140)' }}>
        Pemantau Dashboard &amp; QC
      </span>
    );
  }

  return user.kpps_role === 'validasi' ? (
    <span className="badge" style={{ backgroundColor: 'oklch(0.92 0.02 240)', color: 'oklch(0.40 0.10 240)' }}>
      KPPS — Hanya Validasi
    </span>
  ) : (
    <span className="badge" style={{ backgroundColor: 'oklch(0.92 0.05 160)', color: 'oklch(0.35 0.15 160)' }}>
      KPPS — Validasi &amp; Quick Count
    </span>
  );
};

export const KppsTab: React.FC<KppsTabProps> = ({
  kppsUsers,
  kppsLoading,
  setKppsPage,
  setIsKppsModalOpen,
  setResetUser,
  setResetPasswordVal,
  setIsResetModalOpen,
  handleDeleteUser,
  isAdmin,
  currentUserId,
}) => {
  return (
    <div>
      <div className="section-header">
        <div>
          <h1 className="section-title">Manajemen Akun</h1>
          <p className="section-desc">Akun KPPS untuk aplikasi Android lapangan dan akun Sekretariat untuk panel web.</p>
        </div>
        {isAdmin && (
          <button onClick={() => setIsKppsModalOpen(true)} className="btn btn-primary">
            <Icons.Plus />
            <span>Buat Akun</span>
          </button>
        )}
      </div>

      <LoadingHint show={kppsLoading} />

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
                  {isAdmin && <th>Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {kppsUsers.data.map((u: any) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: '600' }}>
                      {u.username}
                      {u.id === currentUserId && (
                        <span style={{ marginLeft: '8px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>(Anda)</span>
                      )}
                    </td>
                    <td><RoleBadge user={u} /></td>
                    <td>
                      {u.role === 'sekretariat' 
                        ? '—' 
                        : (u.role === 'pantarlih' 
                          ? `RW ${u.rw || '?'}` 
                          : (u.tps?.nama || 'Tidak Terhubung'))}
                    </td>
                    <td>{new Date(u.created_at).toLocaleString('id-ID')}</td>
                    {isAdmin && (
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
                          {u.id !== currentUserId && (
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="btn btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--danger)' }}
                            >
                              Hapus
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {kppsUsers.data.length === 0 && (
                  <tr>
                    <td colSpan={isAdmin ? 5 : 4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada akun terdaftar.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="pagination">
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Menampilkan Halaman {kppsUsers.current_page} dari {kppsUsers.last_page} ({kppsUsers.total} akun)
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
