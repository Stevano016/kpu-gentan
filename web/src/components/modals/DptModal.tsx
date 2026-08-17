import React from 'react';
import { Icons } from '../Icons';
import { KETERANGAN } from '../../utils/tahapan';

interface DptModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingDpt: any;
  dptFormNik: string;
  setDptFormNik: (val: string) => void;
  dptFormNkk: string;
  setDptFormNkk: (val: string) => void;
  dptFormNama: string;
  setDptFormNama: (val: string) => void;
  dptFormTps: string;
  setDptFormTps: (val: string) => void;
  dptFormJenis: string;
  isPantarlih?: boolean;
  setDptFormJenis: (val: string) => void;
  dptFormUmur: string;
  setDptFormUmur: (val: string) => void;
  dptFormStatusKawin: string;
  setDptFormStatusKawin: (val: string) => void;
  dptFormJenisKelamin: string;
  setDptFormJenisKelamin: (val: string) => void;
  dptFormAlamat: string;
  setDptFormAlamat: (val: string) => void;
  dptFormRt: string;
  setDptFormRt: (val: string) => void;
  dptFormRw: string;
  setDptFormRw: (val: string) => void;
  dptFormPekerjaan: string;
  setDptFormPekerjaan: (val: string) => void;
  dptFormDisabilitas: string;
  setDptFormDisabilitas: (val: string) => void;
  dptFormKeterangan: string;
  setDptFormKeterangan: (val: string) => void;
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
  dptFormNkk,
  setDptFormNkk,
  dptFormNama,
  setDptFormNama,
  dptFormTps,
  setDptFormTps,
  dptFormJenis,
  isPantarlih = false,
  setDptFormJenis,
  dptFormUmur,
  setDptFormUmur,
  dptFormStatusKawin,
  setDptFormStatusKawin,
  dptFormJenisKelamin,
  setDptFormJenisKelamin,
  dptFormAlamat,
  setDptFormAlamat,
  dptFormRt,
  setDptFormRt,
  dptFormRw,
  setDptFormRw,
  dptFormPekerjaan,
  setDptFormPekerjaan,
  dptFormDisabilitas,
  setDptFormDisabilitas,
  dptFormKeterangan,
  setDptFormKeterangan,
  tpsList,
  editingQrCode,
  downloadQrCode,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ width: '680px', maxWidth: '95%' }}>
        <div className="modal-header">
          <h2 className="modal-title">{editingDpt ? 'Edit Data Pemilih' : 'Tambah Pemilih Baru'}</h2>
          <button onClick={onClose} className="modal-close"><Icons.Close /></button>
        </div>
        <form onSubmit={onSubmit}>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '280px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' }}>
              
              <div className="form-group" style={{ gridColumn: 'span 1', marginBottom: 0 }}>
                <label className="form-label">NIK (16 Digit)</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  maxLength={16}
                  minLength={16}
                  disabled={!!editingDpt}
                  placeholder="NIK 16 Digit"
                  value={dptFormNik}
                  onChange={e => setDptFormNik(e.target.value.replace(/\D/g, ''))}
                />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 1', marginBottom: 0 }}>
                <label className="form-label">NKK (16 Digit)</label>
                <input
                  type="text"
                  className="form-control"
                  maxLength={16}
                  minLength={16}
                  placeholder="NKK 16 Digit"
                  value={dptFormNkk}
                  onChange={e => setDptFormNkk(e.target.value.replace(/\D/g, ''))}
                />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2', marginBottom: 0 }}>
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

              <div className="form-group" style={{ gridColumn: 'span 1', marginBottom: 0 }}>
                <label className="form-label">Jenis Pemilih</label>
                {isPantarlih ? (
                  // Pantarlih hanya mendata pemilih susulan. Server memang sudah
                  // memaksa DPTb, tapi menampilkan pilihan lain di sini hanya
                  // akan menyesatkan.
                  <>
                    <input className="form-control" value="DPTb — Daftar Pemilih Tambahan" readOnly disabled />
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                      Semua data yang Anda daftarkan tercatat sebagai DPTb.
                    </p>
                  </>
                ) : (
                  <select
                    className="form-control"
                    required
                    value={dptFormJenis}
                    onChange={e => setDptFormJenis(e.target.value)}
                  >
                    <option value="dp4">DP4 — Belum Diverifikasi</option>
                    <option value="dps">DPS — Daftar Pemilih Sementara</option>
                    <option value="dptb">DPTb — Daftar Pemilih Tambahan</option>
                    <option value="dpt">DPT — Daftar Pemilih Tetap</option>
                    <option value="dpk">DPK — Daftar Pemilih Khusus</option>
                  </select>
                )}
              </div>

              <div className="form-group" style={{ gridColumn: 'span 1', marginBottom: 0 }}>
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

              <div className="form-group" style={{ gridColumn: 'span 1', marginBottom: 0 }}>
                <label className="form-label">Umur</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Contoh: 32"
                  value={dptFormUmur}
                  onChange={e => setDptFormUmur(e.target.value.replace(/\D/g, ''))}
                />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 1', marginBottom: 0 }}>
                <label className="form-label">Jenis Kelamin (L/P)</label>
                <select
                  className="form-control"
                  value={dptFormJenisKelamin}
                  onChange={e => setDptFormJenisKelamin(e.target.value)}
                >
                  <option value="">-- Pilih L/P --</option>
                  <option value="LAKI-LAKI">Laki-laki</option>
                  <option value="PEREMPUAN">Perempuan</option>
                </select>
              </div>

              <div className="form-group" style={{ gridColumn: 'span 1', marginBottom: 0 }}>
                <label className="form-label">Status Perkawinan</label>
                <select
                  className="form-control"
                  value={dptFormStatusKawin}
                  onChange={e => setDptFormStatusKawin(e.target.value)}
                >
                  <option value="">-- Pilih Status --</option>
                  <option value="BELUM KAWIN">Belum Kawin</option>
                  <option value="KAWIN">Kawin</option>
                  <option value="CERAI HIDUP">Cerai Hidup</option>
                  <option value="CERAI MATI">Cerai Mati</option>
                </select>
              </div>

              <div className="form-group" style={{ gridColumn: 'span 1', marginBottom: 0 }}>
                <label className="form-label">Pekerjaan</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Contoh: WIRASWASTA"
                  value={dptFormPekerjaan}
                  onChange={e => setDptFormPekerjaan(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2', marginBottom: 0 }}>
                <label className="form-label">Alamat</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Contoh: GENTAN CITRA INDAH"
                  value={dptFormAlamat}
                  onChange={e => setDptFormAlamat(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 1', marginBottom: 0 }}>
                <label className="form-label">RT</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Contoh: 001"
                  value={dptFormRt}
                  onChange={e => setDptFormRt(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 1', marginBottom: 0 }}>
                <label className="form-label">RW</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Contoh: 014"
                  value={dptFormRw}
                  onChange={e => setDptFormRw(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 1', marginBottom: 0 }}>
                <label className="form-label">Disabilitas</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Contoh: - (jika tidak ada)"
                  value={dptFormDisabilitas}
                  onChange={e => setDptFormDisabilitas(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 1', marginBottom: 0 }}>
                <label className="form-label">Keterangan</label>
                {/* Kategori tetap: nilainya tersimpan sebagai enum di basis data. */}
                <select
                  className="form-control"
                  value={dptFormKeterangan}
                  onChange={e => setDptFormKeterangan(e.target.value)}
                >
                  <option value="">— Belum ditentukan —</option>
                  {KETERANGAN.map((k) => (
                    <option key={k} value={k}>{k}</option>
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
