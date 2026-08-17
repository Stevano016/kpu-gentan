import React from 'react';
import { Icons } from '../Icons';

interface PaslonModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEditing: boolean;
  nomorUrut: string;
  setNomorUrut: (val: string) => void;
  namaKetua: string;
  setNamaKetua: (val: string) => void;
  foto: File | null;
  setFoto: (f: File | null) => void;
  fotoLama?: string | null;
  onSubmit: (e: React.FormEvent) => void;
}

export const PaslonModal: React.FC<PaslonModalProps> = ({
  isOpen,
  onClose,
  isEditing,
  nomorUrut,
  setNomorUrut,
  namaKetua,
  setNamaKetua,
  foto,
  setFoto,
  fotoLama,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">{isEditing ? 'Edit Pasangan Calon' : 'Tambah Pasangan Calon'}</h2>
          <button onClick={onClose} className="modal-close"><Icons.Close /></button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label className="form-label">Nomor Urut</label>
            <input
              type="number"
              min="1"
              className="form-control"
              required
              placeholder="Contoh: 1"
              disabled={isEditing}
              value={nomorUrut}
              onChange={e => setNomorUrut(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Nama Calon Ketua (Presiden/Bupati/dll)</label>
            <input
              type="text"
              className="form-control"
              required
              placeholder="Masukkan nama ketua..."
              value={namaKetua}
              onChange={e => setNamaKetua(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Foto Calon</label>
            <input
              type="file"
              className="form-control"
              accept="image/jpeg,image/png,image/webp"
              onChange={e => setFoto(e.target.files?.[0] ?? null)}
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
              JPG, PNG, atau WEBP, maksimal 2 MB. Kosongkan bila tidak ingin mengubah foto.
            </p>

            {(foto || fotoLama) && (
              <img
                src={foto ? URL.createObjectURL(foto) : (fotoLama as string)}
                alt="Pratinjau foto calon"
                style={{
                  marginTop: '12px',
                  width: '96px',
                  height: '96px',
                  objectFit: 'cover',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                }}
              />
            )}
          </div>
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">Batal</button>
            <button type="submit" className="btn btn-primary">Simpan</button>
          </div>
        </form>
      </div>
    </div>
  );
};
