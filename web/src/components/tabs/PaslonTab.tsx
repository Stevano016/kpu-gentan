import React from 'react';
import { Icons } from '../Icons';
import { LoadingHint } from '../LoadingHint';

interface PaslonTabProps {
  paslons: any[];
  loading: boolean;
  setIsModalOpen: (val: boolean) => void;
  setIsEditing: (val: boolean) => void;
  setEditingPaslon: (val: any) => void;
  setNomorUrut: (val: string) => void;
  setNamaKetua: (val: string) => void;
  setFoto: (f: File | null) => void;
  handleDeletePaslon: (id: number) => Promise<void>;
  isAdmin: boolean;
}

export const PaslonTab: React.FC<PaslonTabProps> = ({
  paslons,
  loading,
  setIsModalOpen,
  setIsEditing,
  setEditingPaslon,
  setNomorUrut,
  setNamaKetua,
  setFoto,
  handleDeletePaslon,
  isAdmin,
}) => {
  return (
    <div>
      <div className="section-header">
        <div>
          <h1 className="section-title">Pasangan Calon (Paslon)</h1>
          <p className="section-desc">Kelola kontestan pemilihan umum wilayah Gentan.</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => {
              setIsEditing(false);
              setEditingPaslon(null);
              setNomorUrut('');
              setNamaKetua('');
              setFoto(null);
              setIsModalOpen(true);
            }}
            className="btn btn-primary"
          >
            <Icons.Plus />
            <span>Tambah Paslon</span>
          </button>
        )}
      </div>

      <LoadingHint show={loading} label="Memuat data pasangan calon..." />

      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px', marginTop: '8px' }}>
          {paslons.map(p => (
            <div
              key={p.id}
              style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '28px',
                textAlign: 'center',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '220px'
              }}
            >
              <div>
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary-light)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.75rem',
                    fontWeight: '800',
                    margin: '0 auto 16px',
                    border: '2px solid var(--primary)'
                  }}
                >
                  {p.nomor_urut}
                </div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--text)', marginBottom: '6px' }}>
                  {p.nama_ketua}
                </h3>
                {p.foto_url ? (
                  <img
                    src={p.foto_url}
                    alt={`Foto ${p.nama_ketua}`}
                    style={{
                      width: '110px',
                      height: '110px',
                      objectFit: 'cover',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                      margin: '0 auto 20px',
                      display: 'block',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '110px',
                      height: '110px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px dashed var(--border)',
                      margin: '0 auto 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                    }}
                  >
                    Belum ada foto
                  </div>
                )}
              </div>

              {isAdmin && (
              <div style={{ display: 'flex', gap: '12px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setEditingPaslon(p);
                    setNomorUrut(String(p.nomor_urut));
                    setNamaKetua(p.nama_ketua);
                    setFoto(null);
                    setIsModalOpen(true);
                  }}
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '8px 12px', fontSize: '0.875rem' }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeletePaslon(p.id)}
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '8px 12px', fontSize: '0.875rem', color: 'var(--danger)' }}
                >
                  Hapus
                </button>
              </div>
              )}
            </div>
          ))}

          {paslons.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
              Belum ada pasangan calon terdaftar.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default PaslonTab;
