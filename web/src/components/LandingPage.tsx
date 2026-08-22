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
  const [showSyaratModal, setShowSyaratModal] = useState(false);

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
          width: 50%;
          padding: 10px;
          border: none;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: var(--transition);
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
              style={{
                background: searchMode === 'nik' ? 'var(--surface)' : 'none',
                fontWeight: '600',
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
              style={{
                background: searchMode === 'nama' ? 'var(--surface)' : 'none',
                fontWeight: '600',
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
                    Pastikan ejaan nama, RT, dan RW sudah sesuai. Jika anda warga gentan, yang memenuhi syarat, dan belum terdaftar silahkan hubungi pantarlih, ketua Rt, RW, atau sekertariat desa.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowSyaratModal(true)}
                    style={{
                      marginTop: '12px',
                      padding: '8px 16px',
                      backgroundColor: 'var(--primary)',
                      color: 'var(--surface)',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'var(--transition)'
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'var(--primary-hover)')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'var(--primary)')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '16px', height: '16px' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Syarat Pemilih
                  </button>
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
        padding: '12px 16px',
        fontSize: '0.8rem',
        fontWeight: '700',
        color: 'var(--text-muted)',
        borderTop: '1px solid var(--border)',
        backgroundColor: 'var(--surface)',
        zIndex: 1000,
        lineHeight: '1.4'
      }}>
        <div style={{ marginBottom: '6px' }}>Ruang Komunitas Digital Desa</div>
        <div style={{ textAlign: 'center', width: '100%', boxSizing: 'border-box' }}>
          <span style={{
            display: 'inline-block',
            padding: '4px 10px',
            backgroundColor: 'var(--primary-light)',
            color: 'var(--primary)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.75rem',
            fontWeight: '600',
            border: '1px solid oklch(0.55 0.16 165 / 0.15)',
            letterSpacing: '0.02em',
            maxWidth: '100%',
            boxSizing: 'border-box',
            textAlign: 'center'
          }}>
            <img 
              src="/ush_logo.png" 
              alt="Logo USH" 
              style={{ 
                height: '22px', 
                borderRadius: '3px', 
                verticalAlign: 'middle', 
                marginRight: '6px',
                display: 'inline-block'
              }} 
            />
            <span style={{ verticalAlign: 'middle', display: 'inline' }}>
              Support by KKN Universitas Sugeng Hartono(USH) Kel-7 2026
            </span>
          </span>
        </div>
      </footer>

      {showSyaratModal && (
        <div className="modal-overlay" onClick={() => setShowSyaratModal(false)}>
          <div className="modal-content" style={{ maxWidth: '600px', width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ marginBottom: '8px' }}>
              <h3 className="modal-title" style={{ color: 'var(--primary)' }}>Syarat Pemilih & Daftar Pantarlih</h3>
              <button onClick={() => setShowSyaratModal(false)} className="modal-close" style={{ padding: '4px' }} title="Tutup">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '8px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text)', marginBottom: '10px' }}>
                  Persyaratan Pemilih (Belum Terdaftar di DP4):
                </h4>
                <ul style={{ listStyleType: 'none', paddingLeft: '0', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.875rem', lineHeight: '1.4' }}>
                  <li style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>a.</span>
                    <span>Penduduk Desa yang pada hari H pencoblosan ( 10 Des 2026 ) sudah berumur 17 tahun</span>
                  </li>
                  <li style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>b.</span>
                    <span>Tidak terganggu jiwanya</span>
                  </li>
                  <li style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>c.</span>
                    <span>tidak sedang dicabut hak pilihnya berdasarkan putusan pengadilan yang telah memperoleh kekuatan hukum tetap;</span>
                  </li>
                  <li style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>d.</span>
                    <span>berdomisili di desa sekurang-kurangnya 6 (enam) bulan sebelum disahkannya daftar pemilih sementara yang dibuktikan dengan Kartu Tanda Penduduk atau surat keterangan penduduk</span>
                  </li>
                </ul>
              </div>

              <div style={{
                padding: '12px 16px',
                backgroundColor: 'var(--danger-light)',
                border: '1px solid var(--danger)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--danger)',
                fontSize: '0.85rem',
                fontWeight: '500',
                lineHeight: '1.4'
              }}>
                <strong>Penting:</strong> Maksimal Pindah datang ditanggal 8 Maret 2026. Pindah Datang setelah 8 Maret 2026 Tidak memiliki Hak Pilih.
              </div>

              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text)', marginBottom: '10px' }}>
                  Silakan Menghubungi Pantarlih:
                </h4>
                <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--surface-alt)', borderBottom: '1px solid var(--border)' }}>
                        <th style={{ padding: '8px 12px', fontWeight: '600' }}>Nama</th>
                        <th style={{ padding: '8px 12px', fontWeight: '600' }}>Wilayah Kerja (RW)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { no: 1, nama: "DANANG SUPRIYDI", kedudukan: "PANTARLIH", wilayah: "RW. 001" },
                        { no: 2, nama: "DWI SETIAWAN", kedudukan: "PANTARLIH", wilayah: "RW. 002" },
                        { no: 3, nama: "YOGI YUNIANTO", kedudukan: "PANTARLIH", wilayah: "RW. 003" },
                        { no: 4, nama: "RAHAYU EMBONG W", kedudukan: "PANTARLIH", wilayah: "RW. 004" },
                        { no: 5, nama: "AGUS SUTAMTOMO", kedudukan: "PANTARLIH", wilayah: "RW. 005" },
                        { no: 6, nama: "MUHAMMAD KRISNA MUKTI", kedudukan: "PANTARLIH", wilayah: "RW. 006" },
                        { no: 7, nama: "SUROSO", kedudukan: "PANTARLIH", wilayah: "RW. 007" },
                        { no: 8, nama: "TRI HARYONO", kedudukan: "PANTARLIH", wilayah: "RW. 008" },
                        { no: 9, nama: "KALIKTUS TUNA", kedudukan: "PANTARLIH", wilayah: "RW. 009" },
                        { no: 10, nama: "EKA RAHMAWAN", kedudukan: "PANTARLIH", wilayah: "RW. 010" },
                        { no: 11, nama: "TRI UTOMO", kedudukan: "PANTARLIH", wilayah: "RW. 011" },
                        { no: 12, nama: "TEGUH SUPRIANTO", kedudukan: "PANTARLIH", wilayah: "RW. 012" },
                        { no: 13, nama: "DIANA ASRININGRUM", kedudukan: "PANTARLIH", wilayah: "RW. 013" },
                        { no: 14, nama: "SUNARYO", kedudukan: "PANTARLIH", wilayah: "RW. 014" }
                      ].map((p, idx) => (
                        <tr key={idx} style={{ borderBottom: idx < 13 ? '1px solid var(--border)' : 'none' }}>
                          <td style={{ padding: '8px 12px', fontWeight: '600' }}>{p.nama}</td>
                          <td style={{ padding: '8px 12px', fontWeight: '600', color: 'var(--primary)' }}>{p.wilayah}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ marginTop: '8px' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setShowSyaratModal(false)}
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
