import React from 'react';
import { Icons } from '../Icons';

interface TpsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tpsName: string;
  setTpsName: (val: string) => void;
  tpsRegion: string;
  setTpsRegion: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const TpsModal: React.FC<TpsModalProps> = ({
  isOpen,
  onClose,
  tpsName,
  setTpsName,
  tpsRegion,
  setTpsRegion,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">Tambah TPS Baru</h2>
          <button onClick={onClose} className="modal-close"><Icons.Close /></button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label className="form-label">Nama TPS</label>
            <input
              type="text"
              className="form-control"
              required
              placeholder="Contoh: TPS 04"
              value={tpsName}
              onChange={e => setTpsName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Wilayah / Alamat</label>
            <input
              type="text"
              className="form-control"
              required
              placeholder="Contoh: Gentan RT 04 / RW 01"
              value={tpsRegion}
              onChange={e => setTpsRegion(e.target.value)}
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
