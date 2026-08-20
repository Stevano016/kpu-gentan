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
      {/* Header Topbar */}
      <header style={{
        display: 'flex',
        justifyContent: 'between',
        alignItems: 'center',
        padding: '16px 24px',
        backgroundColor: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        boxShadow: 'var(--shadow)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/logo.png" alt="Logo" style={{ height: '36px', width: 'auto' }} />
          <div>
            <span style={{ fontWeight: '700', fontSize: '1.15rem', color: 'var(--primary)', display: 'block', lineHeight: '1.2' }}>GENTARA</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Portal Warga Gentan</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onGoToLogin}
          className="btn btn-secondary"
          style={{ padding: '8px 16px', fontSize: '0.875rem' }}
        >
          <svg style={{ width: '16px', height: '16px', fill: 'currentColor', marginRight: '6px' }} viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
          </svg>
          Login Petugas
        </button>
      </header>

      {/* Main Content Area */}
      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '540px',
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border)',
          overflow: 'hidden'
        }}>
          {/* Card Header */}
          <div style={{
            padding: '32px 32px 24px 32px',
            textAlign: 'center',
            borderBottom: '1px solid var(--border)'
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary)', marginBottom: '8px' }}>
              Cek Daftar Pemilih
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              Pemilihan Kepala Desa Gentan, Kecamatan Baki Tahun 2026
            </p>
          </div>

          {/* Mode Switch Tabs */}
          <div style={{
            display: 'flex',
            backgroundColor: 'var(--surface-alt)',
            padding: '6px',
            margin: '24px 32px 0 32px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)'
          }}>
            <button
              type="button"
              onClick={() => { setSearchMode('nik'); resetForm(); }}
              style={{
                flex: 1,
                padding: '10px',
                border: 'none',
                background: searchMode === 'nik' ? 'var(--surface)' : 'none',
                borderRadius: 'var(--radius-sm)',
                fontWeight: searchMode === 'nik' ? '600' : '500',
                color: searchMode === 'nik' ? 'var(--primary)' : 'var(--text-muted)',
                cursor: 'pointer',
                boxShadow: searchMode === 'nik' ? 'var(--shadow)' : 'none',
                transition: 'var(--transition)'
              }}
            >
              Cari dengan NIK
            </button>
            <button
              type="button"
              onClick={() => { setSearchMode('nama'); resetForm(); }}
              style={{
                flex: 1,
                padding: '10px',
                border: 'none',
                background: searchMode === 'nama' ? 'var(--surface)' : 'none',
                borderRadius: 'var(--radius-sm)',
                fontWeight: searchMode === 'nama' ? '600' : '500',
                color: searchMode === 'nama' ? 'var(--primary)' : 'var(--text-muted)',
                cursor: 'pointer',
                boxShadow: searchMode === 'nama' ? 'var(--shadow)' : 'none',
                transition: 'var(--transition)'
              }}
            >
              Cari dengan Nama & RT/RW
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSearch} style={{ padding: '24px 32px 32px 32px' }}>
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
            <div style={{
              padding: '0 32px 32px 32px',
              borderTop: '1px solid var(--border)',
              backgroundColor: 'var(--surface-alt)'
            }}>
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
                        <div style={{ display: 'flex', borderBottom: '1px solid var(--background)', paddingBottom: '6px' }}>
                          <span style={{ width: '120px', color: 'var(--text-muted)', fontWeight: '500' }}>NIK</span>
                          <span style={{ fontFamily: 'Consolas, monospace', fontWeight: '600' }}>{voter.nik}</span>
                        </div>
                        {voter.nkk && (
                          <div style={{ display: 'flex', borderBottom: '1px solid var(--background)', paddingBottom: '6px' }}>
                            <span style={{ width: '120px', color: 'var(--text-muted)', fontWeight: '500' }}>No. KK</span>
                            <span style={{ fontFamily: 'Consolas, monospace', fontWeight: '600' }}>{voter.nkk}</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', borderBottom: '1px solid var(--background)', paddingBottom: '6px' }}>
                          <span style={{ width: '120px', color: 'var(--text-muted)', fontWeight: '500' }}>Jenis Kelamin</span>
                          <span>{voter.jenis_kelamin === 'LAKI-LAKI' ? 'Laki-laki' : 'Perempuan'}</span>
                        </div>
                        <div style={{ display: 'flex', borderBottom: '1px solid var(--background)', paddingBottom: '6px' }}>
                          <span style={{ width: '120px', color: 'var(--text-muted)', fontWeight: '500' }}>TPS Terdaftar</span>
                          <span style={{ fontWeight: '700', color: 'var(--primary)' }}>{voter.tps}</span>
                        </div>
                        <div style={{ display: 'flex', borderBottom: '1px solid var(--background)', paddingBottom: '6px' }}>
                          <span style={{ width: '120px', color: 'var(--text-muted)', fontWeight: '500' }}>RT / RW</span>
                          <span>RT {voter.rt} / RW {voter.rw}</span>
                        </div>
                        {voter.alamat && (
                          <div style={{ display: 'flex', paddingBottom: '4px' }}>
                            <span style={{ width: '120px', color: 'var(--text-muted)', fontWeight: '500' }}>Alamat</span>
                            <span>{voter.alamat}</span>
                          </div>
                        )}
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
      </main>

      {/* Footer bar */}
      <footer style={{
        textAlign: 'center',
        padding: '16px',
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
        borderTop: '1px solid var(--border)',
        backgroundColor: 'var(--surface)'
      }}>
        © 2026 Panitia Pemilihan Kepala Desa Gentan. All Rights Reserved.
      </footer>
    </div>
  );
};
