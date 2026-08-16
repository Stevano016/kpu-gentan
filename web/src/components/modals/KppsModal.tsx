import React from 'react';
import { Icons } from '../Icons';

interface KppsModalProps {
  isOpen: boolean;
  onClose: () => void;
  kppsFormUsername: string;
  setKppsFormUsername: (val: string) => void;
  kppsFormPassword: string;
  setKppsFormPassword: (val: string) => void;
  kppsFormTps: string;
  setKppsFormTps: (val: string) => void;
  kppsFormRole: string;
  setKppsFormRole: (val: string) => void;
  tpsList: any[];
  onSubmit: (e: React.FormEvent) => void;
}

export const KppsModal: React.FC<KppsModalProps> = ({
  isOpen,
  onClose,
  kppsFormUsername,
  setKppsFormUsername,
  kppsFormPassword,
  setKppsFormPassword,
  kppsFormTps,
  setKppsFormTps,
  kppsFormRole,
  setKppsFormRole,
  tpsList,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">Buat Akun KPPS Baru</h2>
          <button onClick={onClose} className="modal-close"><Icons.Close /></button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-control"
              required
              placeholder="Contoh: kpps04"
              value={kppsFormUsername}
              onChange={e => setKppsFormUsername(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              required
              minLength={6}
              placeholder="Minimal 6 karakter"
              value={kppsFormPassword}
              onChange={e => setKppsFormPassword(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Asosiasi TPS</label>
            <select
              className="form-control"
              required
              value={kppsFormTps}
              onChange={e => setKppsFormTps(e.target.value)}
            >
              <option value="">Pilih TPS...</option>
              {tpsList.map(t => (
                <option key={t.id} value={t.id}>{t.nama} ({t.wilayah})</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Hak Akses / Peran</label>
            <select
              className="form-control"
              required
              value={kppsFormRole}
              onChange={e => setKppsFormRole(e.target.value)}
            >
              <option value="full">Validasi & Quick Count (Akses Penuh)</option>
              <option value="validasi">Hanya Validasi Kehadiran (Check-in)</option>
            </select>
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
