import React from 'react';
import { Icons } from '../Icons';

interface QrViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVoterQr: string | null;
  selectedVoterName: string;
  downloadQrCode: (base64: string, name: string) => void;
}

export const QrViewerModal: React.FC<QrViewerModalProps> = ({
  isOpen,
  onClose,
  selectedVoterQr,
  selectedVoterName,
  downloadQrCode,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ textAlign: 'center', maxWidth: '360px' }}>
        <div className="modal-header">
          <h2 className="modal-title">QR Code Pemilih</h2>
          <button onClick={onClose} className="modal-close"><Icons.Close /></button>
        </div>
        <div style={{ marginTop: '16px', marginBottom: '24px' }}>
          <p style={{ fontWeight: '600', marginBottom: '16px' }}>{selectedVoterName}</p>
          {selectedVoterQr ? (
            <img src={selectedVoterQr} alt="QR Code Pemilih" style={{ width: '220px', height: '220px', display: 'block', margin: '0 auto' }} />
          ) : (
            <p>Memuat...</p>
          )}
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '16px' }}>
            QR Code ini unik dan hanya dapat digunakan sekali untuk memvalidasi kehadiran di TPS.
          </p>
        </div>
        <div className="modal-footer" style={{ justifyContent: 'center', gap: '8px' }}>
          <button 
            type="button" 
            onClick={() => downloadQrCode(selectedVoterQr!, selectedVoterName)} 
            className="btn btn-secondary"
          >
            Unduh Gambar QR
          </button>
          <button 
            type="button" 
            onClick={() => {
              const win = window.open();
              if (win) {
                win.document.write(`<div style="text-align:center;font-family:sans-serif;padding:40px;"><h2>GENTARA - KARTU PEMILIH</h2><h3>${selectedVoterName}</h3><img src="${selectedVoterQr}" style="width:300px;height:300px;margin-top:20px;"/><p style="margin-top:20px;font-size:14px;color:#666;">Harap bawa kode QR ini saat datang ke TPS untuk check-in.</p></div>`);
                win.print();
                win.close();
              }
            }} 
            className="btn btn-primary"
          >
            Cetak Kartu QR
          </button>
        </div>
      </div>
    </div>
  );
};
