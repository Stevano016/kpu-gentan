import React from 'react';
import { Icons } from '../Icons';

interface VoterSuccessModalProps {
  newVoterSuccess: { nik: string; nama: string; id_pemilih: string; qrcode: string } | null;
  onClose: () => void;
  downloadQrCode: (base64: string, name: string) => void;
}

export const VoterSuccessModal: React.FC<VoterSuccessModalProps> = ({
  newVoterSuccess,
  onClose,
  downloadQrCode,
}) => {
  if (!newVoterSuccess) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ textAlign: 'center', maxWidth: '380px' }}>
        <div className="modal-header">
          <h2 className="modal-title" style={{ color: 'var(--success)' }}>Pemilih Ditambahkan</h2>
          <button onClick={onClose} className="modal-close"><Icons.Close /></button>
        </div>
        <div style={{ marginTop: '16px', marginBottom: '24px' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Pemilih baru telah berhasil didaftarkan ke database.
          </p>
          <div style={{ marginTop: '16px', padding: '16px', backgroundColor: 'var(--surface-alt)', borderRadius: 'var(--radius-md)' }}>
            <p style={{ fontWeight: '700', fontSize: '1.05rem', color: 'var(--text)' }}>{newVoterSuccess.nama}</p>
            <p style={{ fontSize: '0.85rem', fontFamily: 'monospace', fontWeight: '700', color: 'var(--primary)', marginTop: '4px' }}>ID: {newVoterSuccess.id_pemilih}</p>
            <p style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--text-muted)', marginTop: '2px' }}>NIK: {newVoterSuccess.nik}</p>
          </div>
          <div style={{ marginTop: '20px' }}>
            <img 
              src={newVoterSuccess.qrcode} 
              alt="QR Code Baru" 
              style={{ width: '180px', height: '180px', display: 'block', margin: '0 auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '6px' }} 
            />
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '16px' }}>
            Harap unduh QR Code ini untuk diserahkan kepada pemilih sebagai kartu check-in TPS.
          </p>
        </div>
        <div className="modal-footer" style={{ justifyContent: 'center', gap: '8px' }}>
          <button 
            type="button" 
            onClick={() => downloadQrCode(newVoterSuccess.qrcode, newVoterSuccess.nama)} 
            className="btn btn-primary"
          >
            Unduh Gambar QR
          </button>
        </div>
        <div style={{ marginTop: '12px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary" style={{ width: '100%' }}>Selesai & Tutup</button>
        </div>
      </div>
    </div>
  );
};
