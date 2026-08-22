import React from 'react';
import { Icons } from '../Icons';
import { PasswordInput } from '../PasswordInput';

interface KppsModalProps {
  isOpen: boolean;
  onClose: () => void;
  kppsFormUsername: string;
  setKppsFormUsername: (val: string) => void;
  kppsFormPassword: string;
  setKppsFormPassword: (val: string) => void;
  kppsFormTps: string;
  setKppsFormTps: (val: string) => void;
  kppsFormRw: string;
  setKppsFormRw: (val: string) => void;
  kppsFormRole: string;
  setKppsFormRole: (val: string) => void;
  kppsFormAccountType: string;
  setKppsFormAccountType: (val: string) => void;
  kppsFormSekretariatRole: string;
  setKppsFormSekretariatRole: (val: string) => void;
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
  kppsFormRw,
  setKppsFormRw,
  kppsFormRole,
  setKppsFormRole,
  kppsFormAccountType,
  setKppsFormAccountType,
  kppsFormSekretariatRole,
  setKppsFormSekretariatRole,
  tpsList,
  onSubmit,
}) => {
  if (!isOpen) return null;

  const isKpps = kppsFormAccountType === 'kpps';
  const isPantarlih = kppsFormAccountType === 'pantarlih';

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">Buat Akun Baru</h2>
          <button onClick={onClose} className="modal-close"><Icons.Close /></button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label className="form-label">Jenis Akun</label>
            <select
              className="form-control"
              required
              value={kppsFormAccountType}
              onChange={e => setKppsFormAccountType(e.target.value)}
            >
              <option value="kpps">KPPS (Aplikasi Mobile)</option>
              <option value="sekretariat">Sekretariat (Panel Web)</option>
              <option value="pantarlih">Pantarlih (Pendata Lapangan)</option>
              <option value="monitor">Pemantau (Hanya Dashboard &amp; QC)</option>
            </select>
            {isPantarlih && (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px', lineHeight: '1.5' }}>
                Pantarlih hanya bisa mendaftarkan pemilih baru, dan setiap data yang
                dimasukkannya otomatis tercatat sebagai DPTb.
              </p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-control"
              required
              placeholder={isKpps ? 'Contoh: kpps04' : isPantarlih ? 'Contoh: pantarlih01' : 'Contoh: sekretariat02'}
              value={kppsFormUsername}
              onChange={e => setKppsFormUsername(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <PasswordInput
              value={kppsFormPassword}
              onChange={setKppsFormPassword}
              required
              minLength={6}
              placeholder="Minimal 6 karakter"
            />
          </div>

          {isKpps ? (
            <>
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
                  <option value="full">Validasi &amp; Quick Count (Akses Penuh)</option>
                  <option value="validasi">Hanya Validasi Kehadiran (Check-in)</option>
                </select>
              </div>
            </>
          ) : isPantarlih ? (
            <div className="form-group">
              <label className="form-label">RW Wilayah Tugas</label>
              <select
                className="form-control"
                required
                value={kppsFormRw}
                onChange={e => setKppsFormRw(e.target.value)}
              >
                <option value="">Pilih RW...</option>
                {Array.from({ length: 14 }, (_, i) => String(i + 1).padStart(3, '0')).map(num => (
                  <option key={num} value={num}>RW {num}</option>
                ))}
              </select>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                Pantarlih hanya bisa melihat dan mendata pemilih di RW tugas ini.
              </p>
            </div>
          ) : kppsFormAccountType === 'monitor' ? (
            <div className="form-group">
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: '10px 0' }}>
                Akun Pemantau hanya memiliki hak akses untuk melihat halaman <strong>Dashboard Monitor</strong> dan <strong>Quick Count</strong>. Menu data pemilih, keluarga, akun, dan paslon akan sepenuhnya disembunyikan.
              </p>
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label">Hak Akses Sekretariat</label>
              <select
                className="form-control"
                required
                value={kppsFormSekretariatRole}
                onChange={e => setKppsFormSekretariatRole(e.target.value)}
              >
                <option value="admin">Admin Sekretariat (Akses Penuh / CRUD)</option>
                <option value="viewer">Pemantau (Hanya Lihat, Tanpa Ubah Data)</option>
              </select>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.5 }}>
                {kppsFormSekretariatRole === 'admin'
                  ? 'Dapat menambah, mengubah, dan menghapus seluruh data termasuk membuat akun baru.'
                  : 'Hanya dapat membuka panel web dan melihat data. Tidak bisa login di aplikasi mobile.'}
              </p>
            </div>
          )}

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">Batal</button>
            <button type="submit" className="btn btn-primary">Simpan</button>
          </div>
        </form>
      </div>
    </div>
  );
};
