import React from 'react';
import { Icons } from '../Icons';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  resetUser: any;
  resetPasswordVal: string;
  setResetPasswordVal: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  isOpen,
  onClose,
  resetUser,
  resetPasswordVal,
  setResetPasswordVal,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">Reset Password</h2>
          <button onClick={onClose} className="modal-close"><Icons.Close /></button>
        </div>
        <form onSubmit={onSubmit}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Ganti password untuk akun KPPS: <strong>{resetUser?.username}</strong>
          </p>
          <div className="form-group">
            <label className="form-label">Password Baru</label>
            <input
              type="password"
              className="form-control"
              required
              minLength={6}
              placeholder="Masukkan password baru (min 6 karakter)"
              value={resetPasswordVal}
              onChange={e => setResetPasswordVal(e.target.value)}
            />
          </div>
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">Batal</button>
            <button type="submit" className="btn btn-primary">Simpan Password</button>
          </div>
        </form>
      </div>
    </div>
  );
};
