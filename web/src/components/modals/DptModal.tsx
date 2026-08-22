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

const getTpsIdFromRtRw = (rt: string, rw: string, tpsList: any[]): string => {
  if (!rt || !rw) return '';
  const cleanRt = rt.replace(/\D/g, '').padStart(3, '0');
  const cleanRw = rw.replace(/\D/g, '').padStart(3, '0');

  let targetTpsNum = 0;

  // Pemetaan wilayah TPS Kelurahan Gentan (dari seeder)
  if (cleanRw === '001' || cleanRw === '002') {
    targetTpsNum = 1;
  } else if (cleanRw === '010' && (cleanRt === '006' || cleanRt === '007')) {
    targetTpsNum = 1;
  } else if (cleanRw === '003' || cleanRw === '004' || cleanRw === '014') {
    targetTpsNum = 2;
  } else if (cleanRw === '006' && ['002', '004', '006', '008'].includes(cleanRt)) {
    targetTpsNum = 2;
  } else if (cleanRw === '007' || cleanRw === '013') {
    targetTpsNum = 3;
  } else if (cleanRw === '006' && ['001', '003', '005', '007'].includes(cleanRt)) {
    targetTpsNum = 3;
  } else if (cleanRw === '009' && cleanRt === '001') {
    targetTpsNum = 3;
  } else if (cleanRw === '008' || cleanRw === '012') {
    targetTpsNum = 4;
  } else if (cleanRw === '005' || cleanRw === '011') {
    targetTpsNum = 5;
  } else if (cleanRw === '009' && ['002', '003', '004', '005'].includes(cleanRt)) {
    targetTpsNum = 5;
  } else if (cleanRw === '010' && ['001', '002', '003', '004', '005'].includes(cleanRt)) {
    targetTpsNum = 5;
  }

  if (targetTpsNum > 0) {
    const foundTps = tpsList.find(t => 
      t.id === targetTpsNum || 
      String(t.id) === String(targetTpsNum) ||
      t.nama === `TPS 0${targetTpsNum}` ||
      t.nama === `TPS ${targetTpsNum}`
    );
    if (foundTps) {
      return String(foundTps.id);
    }
  }

  return '';
};

/** Panjang resmi NIK dan NKK. */
const PANJANG_NOMOR = 16;

/**
 * Membuang selain angka lalu memotong di 16 digit.
 *
 * Pemotongan sengaja dilakukan **setelah** penyaringan, bukan lewat atribut
 * `maxLength`: browser memotong teks mentah lebih dulu, jadi menempelkan
 * "3311 0912 0401 0001" hanya menyisakan "3311 0912 0401 0" dan berubah
 * menjadi 13 digit — tiga digit hilang tanpa terlihat.
 */
const rapikanNomor = (teks: string): string =>
  teks.replace(/\D/g, '').slice(0, PANJANG_NOMOR);

/**
 * Penghitung digit di bawah kolom nomor.
 *
 * Nomor yang kurang panjang harus ketahuan sebelum ditekan Simpan, bukan
 * setelah server menolaknya.
 */
const HitungDigit: React.FC<{ nilai: string }> = ({ nilai }) => {
  if (!nilai) return null;
  const kurang = PANJANG_NOMOR - nilai.length;
  const lengkap = kurang === 0;

  return (
    <small
      style={{
        display: 'block',
        marginTop: '4px',
        fontSize: '0.75rem',
        color: lengkap ? 'var(--text-muted)' : 'var(--danger)',
        fontWeight: lengkap ? 400 : 600,
      }}
    >
      {nilai.length}/{PANJANG_NOMOR} digit
      {lengkap ? '' : ` — kurang ${kurang} digit`}
    </small>
  );
};

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

  // Nomor sementara buatan sistem berawalan 9999 (NIK) / 9998 (NKK); lihat
  // migrasi `tandai_nik_nkk_sintetis_pada_dpt` di backend.
  const nikSementara = !!editingDpt?.nik_sintetis;

  React.useEffect(() => {
    if (dptFormNik && dptFormNik.length === 16 && /^\d+$/.test(dptFormNik)) {
      if (dptFormNik.startsWith('9999') || dptFormNik.startsWith('9998')) {
        return;
      }

      const dayStr = dptFormNik.substring(6, 8);
      const monthStr = dptFormNik.substring(8, 10);
      const yearStr = dptFormNik.substring(10, 12);

      const dayVal = parseInt(dayStr, 10);
      const monthVal = parseInt(monthStr, 10);
      const yearVal = parseInt(yearStr, 10);

      if (!isNaN(dayVal) && !isNaN(monthVal) && !isNaN(yearVal)) {
        if (monthVal >= 1 && monthVal <= 12) {
          let isFemale = false;
          let day = dayVal;
          if (day > 40) {
            isFemale = true;
            day = day - 40;
          }

          if (day >= 1 && day <= 31) {
            const birthYear = yearVal <= 9 ? 2000 + yearVal : 1900 + yearVal;
            const today = new Date();
            const birthDate = new Date(birthYear, monthVal - 1, day);
            
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
              age--;
            }

            if (age >= 0) {
              setDptFormUmur(age.toString());
            }

            setDptFormJenisKelamin(isFemale ? 'PEREMPUAN' : 'LAKI-LAKI');
          }
        }
      }
    }
  }, [dptFormNik, setDptFormUmur, setDptFormJenisKelamin]);

  React.useEffect(() => {
    if (!isPantarlih && dptFormRt && dptFormRw) {
      const autoTpsId = getTpsIdFromRtRw(dptFormRt, dptFormRw, tpsList);
      if (autoTpsId) {
        setDptFormTps(autoTpsId);
      }
    }
  }, [dptFormRt, dptFormRw, tpsList, setDptFormTps, isPantarlih]);

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
                <label className="form-label">
                  NIK (16 Digit)
                  {nikSementara && (
                    <span className="badge badge-warning" style={{ marginLeft: '8px' }}>
                      nomor sementara
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  className="form-control"
                  required
                  minLength={PANJANG_NOMOR}
                  /* NIK asli terkunci — ia primary key. Nomor sementara buatan
                     sistem justru harus bisa diganti: itulah cara 638 orang
                     tanpa NIK dilengkapi setelah coklit. */
                  disabled={!!editingDpt && !nikSementara}
                  placeholder="NIK 16 Digit"
                  value={dptFormNik}
                  onChange={e => setDptFormNik(rapikanNomor(e.target.value))}
                />
                <HitungDigit nilai={dptFormNik} />
                {nikSementara && (
                  <small style={{ display: 'block', marginTop: '4px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Nomor ini dibuat sistem karena NIK aslinya belum ada. Ganti dengan NIK asli bila sudah diketahui.
                  </small>
                )}
              </div>

              <div className="form-group" style={{ gridColumn: 'span 1', marginBottom: 0 }}>
                <label className="form-label">
                  NKK (16 Digit)
                  {editingDpt?.nkk_sintetis && (
                    <span className="badge badge-warning" style={{ marginLeft: '8px' }}>
                      nomor sementara
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  className="form-control"
                  minLength={PANJANG_NOMOR}
                  placeholder="NKK 16 Digit"
                  value={dptFormNkk}
                  onChange={e => setDptFormNkk(rapikanNomor(e.target.value))}
                />
                <HitungDigit nilai={dptFormNkk} />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2', marginBottom: 0 }}>
                <label className="form-label">Nama Lengkap</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="Masukkan nama lengkap pemilih"
                  value={dptFormNama}
                  onChange={e => setDptFormNama(e.target.value.toUpperCase())}
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
                  disabled={isPantarlih || (!isPantarlih && !!dptFormRt && !!dptFormRw)}
                >
                  <option value="">Pilih TPS...</option>
                  {tpsList.map(t => (
                    <option key={t.id} value={t.id}>{t.nama} ({t.wilayah})</option>
                  ))}
                </select>
                {!isPantarlih && !!dptFormRt && !!dptFormRw && (
                  <small style={{ display: 'block', marginTop: '4px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Otomatis ditentukan dari RT/RW.
                  </small>
                )}
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
                  onChange={e => setDptFormPekerjaan(e.target.value.toUpperCase())}
                />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 1', marginBottom: 0 }}>
                <label className="form-label">RT</label>
                <select
                  className="form-control"
                  value={dptFormRt}
                  onChange={e => setDptFormRt(e.target.value)}
                >
                  <option value="">Pilih RT...</option>
                  {Array.from({ length: 10 }, (_, i) => String(i + 1).padStart(3, '0')).map(num => (
                    <option key={num} value={num}>RT {num}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ gridColumn: 'span 1', marginBottom: 0 }}>
                <label className="form-label">RW</label>
                <select
                  className="form-control"
                  value={dptFormRw}
                  onChange={e => setDptFormRw(e.target.value)}
                >
                  <option value="">Pilih RW...</option>
                  {Array.from({ length: 14 }, (_, i) => String(i + 1).padStart(3, '0')).map(num => (
                    <option key={num} value={num}>RW {num}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2', marginBottom: 0 }}>
                <label className="form-label">Alamat</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Contoh: GENTAN CITRA INDAH"
                  value={dptFormAlamat}
                  onChange={e => setDptFormAlamat(e.target.value.toUpperCase())}
                />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2', marginBottom: 0 }}>
                <label className="form-label">Disabilitas</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Contoh: - (jika tidak ada)"
                  value={dptFormDisabilitas}
                  onChange={e => setDptFormDisabilitas(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2', marginBottom: 0 }}>
                <label className="form-label">Keterangan</label>
                <select
                  className="form-control"
                  value={dptFormKeterangan}
                  onChange={e => setDptFormKeterangan(e.target.value)}
                >
                  <option value="">— Belum ditentukan —</option>
                  {KETERANGAN.map((k) => {
                    let isDisabled = false;

                    if (k.includes('Dibawah Umur')) {
                      const ageVal = parseInt(dptFormUmur || '', 10);
                      if (!isNaN(ageVal) && ageVal >= 17) {
                        isDisabled = true;
                      }
                    }

                    if (k.includes('Ganda')) {
                      if (editingDpt) {
                        if (!editingDpt.is_ganda) {
                          isDisabled = true;
                        }
                      } else {
                        isDisabled = true;
                      }
                    }

                    return (
                      <option key={k} value={k} disabled={isDisabled}>
                        {k}{isDisabled ? ' (Tidak sesuai data)' : ''}
                      </option>
                    );
                  })}
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
