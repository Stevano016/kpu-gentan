import React, { useState } from 'react';
import { ApiService } from '../services/api';

interface VoterData {
  nama: string;
  nik: string;
  nkk: string | null;
  jenis_kelamin: string;
  tps: string;
  rt: string;
  rw: string;
  alamat: string;
  tahapan: string;
}

interface LandingPageProps {
  onGoToLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGoToLogin }) => {
  const [searchMode, setSearchMode] = useState<'nik' | 'nama'>('nik');
  const [nik, setNik] = useState('');
  const [nama, setNama] = useState('');
  const [rt, setRt] = useState('');
  const [rw, setRw] = useState('');

  const [loading, setLoading] = useState(false);
  const [hasil, setHasil] = useState<VoterData[] | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [sudahCek, setSudahCek] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setHasil(null);
    setSudahCek(false);

    try {
      let res;
      if (searchMode === 'nik') {
        if (!nik || nik.length < 4) {
          setErrorMsg('Harap masukkan NIK dengan benar (minimal 4 karakter).');
          setLoading(false);
          return;
        }
        res = await ApiService.cekPemilih(nik);
      } else {
        if (!nama || nama.trim().length < 3) {
          setErrorMsg('Harap masukkan nama lengkap (minimal 3 karakter).');
          setLoading(false);
          return;
        }
        if (!rt) {
          setErrorMsg('Harap pilih RT Anda.');
          setLoading(false);
          return;
        }
        if (!rw) {
          setErrorMsg('Harap pilih RW Anda.');
          setLoading(false);
          return;
        }
        res = await ApiService.cekPemilih(undefined, nama, rt, rw);
      }

      const json = await res.json().catch(() => ({}));
      if (res.ok && json.status === 'success') {
        setHasil(json.data);
      } else {
        setErrorMsg(json.message || 'Gagal mencari data. Silakan coba lagi.');
      }
    } catch {
      setErrorMsg('Gagal menghubungi server. Harap periksa koneksi internet Anda.');
    } finally {
      setLoading(false);
      setSudahCek(true);
    }
  };

  // Helper untuk membersihkan form
  const resetForm = () => {
    setNik('');
    setNama('');
    setRt('');
    setRw('');
    setHasil(null);
    setErrorMsg('');
    setSudahCek(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'var(--background)',
      color: 'var(--text)'
    }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .landing-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          background-color: var(--surface);
          border-bottom: 1px solid var(--border);
          box-shadow: var(--shadow);
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .landing-main {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 24px 92px 24px;
        }
        .landing-card {
          width: 100%;
          max-width: 540px;
          background-color: var(--surface);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          border: 1px solid var(--border);
          overflow: hidden;
        }
        .landing-card-header {
          padding: 32px 32px 24px 32px;
          text-align: center;
          border-bottom: 1px solid var(--border);
        }
        .landing-tabs {
          display: flex;
          background-color: var(--surface-alt);
          padding: 6px;
          margin: 24px 32px 0 32px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border);
        }
        .landing-tab-btn {
          flex: 1;
          padding: 10px;
          border: none;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: var(--transition);
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .landing-tab-btn::after {
          display: block;
          content: attr(data-text);
          font-weight: 600;
          height: 0;
          overflow: hidden;
          visibility: hidden;
        }
        .landing-form {
          padding: 24px 32px 32px 32px;
        }
        .landing-results {
          padding: 0 32px 32px 32px;
          border-top: 1px solid var(--border);
          background-color: var(--surface-alt);
        }
        .voter-detail-row {
          display: flex;
          border-bottom: 1px solid var(--background);
          padding-bottom: 6px;
        }
        .voter-detail-label {
          width: 120px;
          flex-shrink: 0;
          color: var(--text-muted);
          font-weight: 500;
        }
        .voter-detail-value {
          word-break: break-word;
        }
        
        /* Mobile Responsiveness Rules */
        @media (max-width: 576px) {
          .landing-header {
            padding: 12px 16px !important;
          }
          .landing-brand-text {
            font-size: 1rem !important;
          }
          .landing-brand-sub {
            font-size: 0.65rem !important;
          }
          .landing-login-btn {
            padding: 6px 12px !important;
            font-size: 0.8rem !important;
          }
          .landing-login-btn-text {
            display: none;
          }
          .landing-login-btn svg {
            margin-right: 0 !important;
          }
          .landing-main {
            padding: 16px 12px 68px 12px !important;
          }
          .landing-card-header {
            padding: 20px 20px 16px 20px !important;
          }
          .landing-tabs {
            margin: 16px 20px 0 20px !important;
            flex-direction: column !important;
            gap: 6px !important;
          }
          .landing-tab-btn {
            width: 100% !important;
            padding: 8px !important;
            font-size: 0.85rem !important;
          }
          .landing-form {
            padding: 16px 20px 20px 20px !important;
          }
          .landing-results {
            padding: 0 20px 20px 20px !important;
          }
        }

        @media (max-width: 480px) {
          .voter-detail-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 4px;
            padding-bottom: 8px !important;
          }
          .voter-detail-label {
            width: auto !important;
            margin-bottom: 2px;
          }
        }
      ` }} />

      {/* Header Topbar */}
      <header className="landing-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/logo.png" alt="Logo" style={{ height: '36px', width: 'auto' }} />
          <div>
            <span className="landing-brand-text" style={{ fontWeight: '700', fontSize: '1.15rem', color: 'var(--primary)', display: 'block', lineHeight: '1.2' }}>GENTARA</span>
            <span className="landing-brand-sub" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Bersama, Transparan, untuk Gentan.</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onGoToLogin}
          className="btn btn-secondary landing-login-btn"
          style={{ padding: '8px 16px', fontSize: '0.875rem' }}
        >
          <svg style={{ width: '16px', height: '16px', fill: 'currentColor', marginRight: '6px' }} viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
          </svg>
          <span className="landing-login-btn-text">Login Petugas</span>
        </button>
      </header>

      {/* Main Content Area */}
      <main className="landing-main">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', width: '100%', maxWidth: '540px' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--warning)', textAlign: 'center', textTransform: 'uppercase' }}>
            PILKADES GENTAN 2026 GENTAN BAKI
          </h1>
          <div className="landing-card">
            {/* Card Header */}
            <div className="landing-card-header">
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary)', marginBottom: '8px' }}>
                Cek Daftar Pemilih
              </h2>
            </div>

          {/* Mode Switch Tabs */}
          <div className="landing-tabs">
            <button
              type="button"
              onClick={() => { setSearchMode('nik'); resetForm(); }}
              className="landing-tab-btn"
              data-text="Cari dengan NIK"
              style={{
                background: searchMode === 'nik' ? 'var(--surface)' : 'none',
                fontWeight: searchMode === 'nik' ? '600' : '500',
                color: searchMode === 'nik' ? 'var(--primary)' : 'var(--text-muted)',
                boxShadow: searchMode === 'nik' ? 'var(--shadow)' : 'none',
              }}
            >
              Cari dengan NIK
            </button>
            <button
              type="button"
              onClick={() => { setSearchMode('nama'); resetForm(); }}
              className="landing-tab-btn"
              data-text="Cari dengan Nama & RT/RW"
              style={{
                background: searchMode === 'nama' ? 'var(--surface)' : 'none',
                fontWeight: searchMode === 'nama' ? '600' : '500',
                color: searchMode === 'nama' ? 'var(--primary)' : 'var(--text-muted)',
                boxShadow: searchMode === 'nama' ? 'var(--shadow)' : 'none',
              }}
            >
              Cari dengan Nama & RT/RW
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSearch} className="landing-form">
            {errorMsg && (
              <div style={{
                padding: '12px 16px',
                backgroundColor: 'var(--danger-light)',
                color: 'var(--danger)',
                border: '1px solid oklch(0.85 0.05 28)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                marginBottom: '20px',
                fontWeight: '500'
              }}>
                {errorMsg}
              </div>
            )}

            {searchMode === 'nik' ? (
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '8px', color: 'var(--text)' }}>
                  Nomor Induk Kependudukan (NIK)
                </label>
                <input
                  type="text"
                  maxLength={16}
                  value={nik}
                  onChange={(e) => setNik(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Masukkan NIK 16 digit..."
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--surface)',
                    fontSize: '0.95rem',
                    outline: 'none',
                    transition: 'var(--transition)'
                  }}
                  required
                />
              </div>
            ) : (
              <>
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '8px', color: 'var(--text)' }}>
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    placeholder="Masukkan nama lengkap sesuai KTP..."
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--surface)',
                      fontSize: '0.95rem',
                      outline: 'none',
                      transition: 'var(--transition)'
                    }}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  <div className="form-group">
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '8px', color: 'var(--text)' }}>
                      RT
                    </label>
                    <select
                      value={rt}
                      onChange={(e) => setRt(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--surface)',
                        fontSize: '0.95rem',
                        outline: 'none',
                        transition: 'var(--transition)',
                        cursor: 'pointer'
                      }}
                      required
                    >
                      <option value="">Pilih RT</option>
                      {Array.from({ length: 10 }, (_, i) => String(i + 1).padStart(3, '0')).map(num => (
                        <option key={num} value={num}>RT {num}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '8px', color: 'var(--text)' }}>
                      RW
                    </label>
                    <select
                      value={rw}
                      onChange={(e) => setRw(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--surface)',
                        fontSize: '0.95rem',
                        outline: 'none',
                        transition: 'var(--transition)',
                        cursor: 'pointer'
                      }}
                      required
                    >
                      <option value="">Pilih RW</option>
                      {Array.from({ length: 14 }, (_, i) => String(i + 1).padStart(3, '0')).map(num => (
                        <option key={num} value={num}>RW {num}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '1rem',
                fontWeight: '600',
                justifyContent: 'center',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow)'
              }}
            >
              {loading ? (
                <span>Memeriksa data...</span>
              ) : (
                <>
                  <svg style={{ width: '20px', height: '20px', fill: 'currentColor', marginRight: '8px' }} viewBox="0 0 24 24">
                    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                  </svg>
                  <span>Periksa Data</span>
                </>
              )}
            </button>
          </form>

          {/* Results Area */}
          {sudahCek && (
            <div className="landing-results">
              <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text)', margin: '24px 0 16px 0' }}>
                Hasil Pencarian:
              </h4>

              {hasil && hasil.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {hasil.map((voter, index) => (
                    <div
                      key={index}
                      style={{
                        padding: '20px',
                        backgroundColor: 'var(--surface)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)',
                        boxShadow: 'var(--shadow)'
                      }}
                    >
                      <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--primary)', marginBottom: '14px', borderBottom: '1px dashed var(--border)', paddingBottom: '8px' }}>
                        {voter.nama}
                      </h3>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px', fontSize: '0.875rem', color: 'var(--text)' }}>
                        <div className="voter-detail-row">
                          <span className="voter-detail-label">NIK</span>
                          <span className="voter-detail-value" style={{ fontFamily: 'Consolas, monospace', fontWeight: '600' }}>{voter.nik}</span>
                        </div>
                        {voter.nkk && (
                          <div className="voter-detail-row">
                            <span className="voter-detail-label">No. KK</span>
                            <span className="voter-detail-value" style={{ fontFamily: 'Consolas, monospace', fontWeight: '600' }}>{voter.nkk}</span>
                          </div>
                        )}
                        <div className="voter-detail-row">
                          <span className="voter-detail-label">Jenis Kelamin</span>
                          <span className="voter-detail-value">{voter.jenis_kelamin === 'LAKI-LAKI' ? 'Laki-laki' : 'Perempuan'}</span>
                        </div>
                        <div className="voter-detail-row">
                          <span className="voter-detail-label">TPS Terdaftar</span>
                          <span className="voter-detail-value" style={{ fontWeight: '700', color: 'var(--primary)' }}>{voter.tps}</span>
                        </div>
                        {voter.alamat && (
                          <div className="voter-detail-row">
                            <span className="voter-detail-label">Alamat</span>
                            <span className="voter-detail-value">{voter.alamat}</span>
                          </div>
                        )}
                        <div className="voter-detail-row">
                          <span className="voter-detail-label">RT / RW</span>
                          <span className="voter-detail-value">RT {voter.rt} / RW {voter.rw}</span>
                        </div>
                      </div>

                      <div style={{
                        marginTop: '16px',
                        padding: '10px 14px',
                        backgroundColor: 'var(--success-light)',
                        color: 'var(--success)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.825rem',
                        fontWeight: '600',
                        textAlign: 'center',
                        border: '1px solid oklch(0.85 0.05 145)'
                      }}>
                        Terdaftar sebagai Pemilih
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  padding: '24px',
                  backgroundColor: 'var(--warning-light)',
                  border: '1px dashed var(--warning)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text)',
                  fontSize: '0.875rem',
                  lineHeight: '1.5'
                }}>
                  <p style={{ fontWeight: '700', color: 'oklch(0.55 0.12 78)', marginBottom: '8px' }}>
                    Data Tidak Ditemukan
                  </p>
                  <p style={{ color: 'var(--text-muted)' }}>
                    Nama atau NIK yang Anda masukkan tidak terdaftar dalam sistem.
                  </p>
                  <p style={{ marginTop: '8px', color: 'var(--text-muted)' }}>
                    Pastikan ejaan nama, RT, dan RW sudah sesuai. Jika Anda warga Gentan dan belum terdaftar, silakan hubungi petugas Pantarlih/Sekretariat Desa Gentan untuk melakukan pendataan.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>

      {/* Footer bar */}
      <footer style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        textAlign: 'center',
        padding: '16px',
        fontSize: '0.8rem',
        fontWeight: '700',
        color: 'var(--text-muted)',
        borderTop: '1px solid var(--border)',
        backgroundColor: 'var(--surface)',
        zIndex: 1000
      }}>
        Support by KKN USH-7 2026 Dinaungi Tim Digitalisasi Desa Gentan
      </footer>
    </div>
  );
};
