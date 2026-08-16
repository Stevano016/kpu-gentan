import React from 'react';
import { Icons } from '../Icons';

interface ImportCsvModalProps {
  isOpen: boolean;
  onClose: () => void;
  importFile: File | null;
  setImportFile: (file: File | null) => void;
  importStatus: { success?: string; errors?: string[] } | null;
  importLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const ImportCsvModal: React.FC<ImportCsvModalProps> = ({
  isOpen,
  onClose,
  importFile,
  setImportFile,
  importStatus,
  importLoading,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ width: '600px' }}>
        <div className="modal-header">
          <h2 className="modal-title">Bulk Import DPT via CSV</h2>
          <button onClick={onClose} className="modal-close"><Icons.Close /></button>
        </div>
        <form onSubmit={onSubmit}>
          <div style={{ backgroundColor: 'var(--surface-alt)', padding: '16px', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
            <p style={{ fontWeight: '700', marginBottom: '8px' }}>Aturan Format File CSV:</p>
            <ul style={{ marginLeft: '16px' }}>
              <li>File harus memiliki baris header di awal.</li>
              <li>Wajib memuat kolom: <strong>NIK</strong> dan <strong>NAMA_LGKP</strong> (atau <strong>Nama</strong>).</li>
              <li>Mendukung pemetaan kolom opsional seperti <strong>NO_TPS</strong> atau <strong>TPS</strong>.</li>
              <li>Jika kolom TPS tidak ditemukan, sistem otomatis mengidentifikasinya dari nama berkas (contoh: <code>tps_02.csv</code> akan otomatis masuk ke TPS 02) atau default ke <strong>TPS 01</strong>.</li>
              <li><strong>NIK</strong> harus bernilai tepat 16 digit angka.</li>
            </ul>
          </div>

          <div className="form-group">
            <label className="form-label">Pilih File CSV</label>
            <input
              type="file"
              accept=".csv,.txt"
              className="form-control"
              required
              onChange={e => setImportFile(e.target.files?.[0] || null)}
            />
          </div>

          {importStatus && (
            <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '20px', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', ... (importStatus.success ? { backgroundColor: 'var(--success-light)', color: 'var(--success)' } : { backgroundColor: 'var(--danger-light)', color: 'var(--danger)' }) }}>
              {importStatus.success && <p style={{ fontWeight: '700' }}>{importStatus.success}</p>}
              {importStatus.errors && importStatus.errors.length > 0 && (
                <div>
                  <p style={{ fontWeight: '700' }}>Detail Log Masalah / Error:</p>
                  <ul style={{ marginLeft: '12px', marginTop: '4px' }}>
                    {importStatus.errors.map((err, i) => <li key={i}>{err}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={importLoading}>Tutup</button>
            <button type="submit" className="btn btn-primary" disabled={!importFile || importLoading}>
              {importLoading ? 'Memproses...' : 'Mulai Unggah & Impor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
