import React from 'react';
import { Icons } from '../Icons';

interface DptModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingDpt: any;
  dptFormNik: string;
  setDptFormNik: (val: string) => void;
  dptFormNama: string;
  setDptFormNama: (val: string) => void;
  dptFormTps: string;
  setDptFormTps: (val: string) => void;
  dptFormJenis: string;
  setDptFormJenis: (val: string) => void;
  tpsList: any[];
  editingQrCode: string | null;
  downloadQrCode: (base64: string, name: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const DptModal: React.FC<DptModalProps> = ({
  isOpen,
  onClose,
  editingDpt,
  dptFormNik,
  setDptFormNik,
  dptFormNama,
  setDptFormNama,
  dptFormTps,
  setDptFormTps,
  dptFormJenis,
  setDptFormJenis,
  tpsList,
  editingQrCode,
  downloadQrCode,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">{editingDpt ? 'Edit Data Pemilih' : 'Tambah Pemilih Baru'}</h2>
          <button onClick={onClose} className="modal-close"><Icons.Close /></button>
        </div>
        <form onSubmit={onSubmit}>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '240px' }}>
              <div className="form-group">
                <label className="form-label">NIK (16 Digit)</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  maxLength={16}
                  minLength={16}
                  disabled={!!editingDpt}
                  placeholder="Masukkan 16 digit NIK"
                  value={dptFormNik}
                  onChange={e => setDptFormNik(e.target.value.replace(/\D/g, ''))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Nama Lengkap</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="Masukkan nama lengkap pemilih"
                  value={dptFormNama}
                  onChange={e => setDptFormNama(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Jenis Pemilih</label>
                <select
                  className="form-control"
                  required
                  value={dptFormJenis}
                  onChange={e => setDptFormJenis(e.target.value)}
                >
                  <option value="dpt">DPT — Daftar Pemilih Tetap</option>
                  <option value="dpk">DPK — Daftar Pemilih Khusus</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Alokasi TPS</label>
                <select
                  className="form-control"
                  required
                  value={dptFormTps}
                  onChange={e => setDptFormTps(e.target.value)}
                >
                  <option value="">Pilih TPS...</option>
                  {tpsList.map(t => (
                    <option key={t.id} value={t.id}>{t.nama} ({t.wilayah})</option>
                  ))}
                </select>
              </div>
            </div>

            {editingDpt && (
              <div style={{ width: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderLeft: '1px solid var(--border)', paddingLeft: '24px' }}>
                <label className="form-label" style={{ textAlign: 'center', width: '100%', fontWeight: '600', marginBottom: '12px' }}>QR Code Pemilih</label>
                {editingQrCode ? (
                  <>
                    <img src={editingQrCode} alt="Voter QR" style={{ width: '140px', height: '140px', display: 'block', marginBottom: '12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '4px' }} />
                    <button 
                      type="button" 
                      onClick={() => downloadQrCode(editingQrCode, dptFormNama)}
                      className="btn btn-secondary" 
                      style={{ fontSize: '0.75rem', width: '100%', padding: '6px 8px', color: 'var(--primary)' }}
                    >
                      Unduh QR
                    </button>
                  </>
                ) : (
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Memuat QR...</p>
                )}
              </div>
            )}
          </div>
          <div className="modal-footer" style={{ marginTop: '24px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">Batal</button>
            <button type="submit" className="btn btn-primary">Simpan</button>
          </div>
        </form>
      </div>
    </div>
  );
};
