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
  namaWakil: string;
  setNamaWakil: (val: string) => void;
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
  namaWakil,
  setNamaWakil,
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
            <label className="form-label">Nama Calon Wakil (Wakil Presiden/Wakil Bupati/dll)</label>
            <input
              type="text"
              className="form-control"
              required
              placeholder="Masukkan nama wakil..."
              value={namaWakil}
              onChange={e => setNamaWakil(e.target.value)}
            />
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
