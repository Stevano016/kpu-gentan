import React, { useState } from 'react';
import { ApiService } from '../services/api';
import { PDFDocument, TextAlignment, StandardFonts, PDFName, rgb } from 'pdf-lib';
import QRCode from 'qrcode';

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
  id_pemilih: string;
  no_urut: number | null;
  tps_total_dpt: number;
  tps_voter_index: number;
}

interface LandingPageProps {
  onGoToLogin: () => void;
}

const getTpsMapLink = (tpsName: string): string | null => {
  if (!tpsName) return null;
  const match = tpsName.match(/\d+/);
  if (!match) return null;
  const num = parseInt(match[0], 10);
  switch (num) {
    case 1:
      return "https://maps.app.goo.gl/9YHcDxAozyhNCs4s7";
    case 2:
      return "https://maps.app.goo.gl/vi53HNZ2U6j567jy6";
    case 3:
      return "https://maps.app.goo.gl/P64tA2GycyTEkMBt7";
    case 4:
      return "https://maps.app.goo.gl/4yijrPFXTH9WsMuq7";
    case 5:
      return "https://maps.app.goo.gl/woGtfTiZyNAsfZgg8";
    default:
      return null;
  }
};

const downloadUndangan = async (voter: VoterData) => {
  try {
    const response = await fetch('/undangan.pdf');
    if (!response.ok) {
      throw new Error("Gagal mengunduh template undangan.");
    }
    const pdfBytes = await response.arrayBuffer();

    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();

    // Fill the text fields
    form.getTextField('nomor').setText(voter.no_urut !== null && voter.no_urut !== undefined ? String(voter.no_urut) : '');
    form.getTextField('nama').setText(voter.nama);
    form.getTextField('jenis_kelamin').setText(voter.jenis_kelamin === 'LAKI-LAKI' ? 'Laki-laki' : 'Perempuan');
    form.getTextField('dusun').setText(voter.alamat || '');
    form.getTextField('rt').setText(voter.rt || '');
    form.getTextField('rw').setText(voter.rw || '');
    form.getTextField('hari_tanggal').setText("Kamis, 10 Desember 2026");

    const tpsTotal = voter.tps_total_dpt || 1;
    const voterIdx = voter.tps_voter_index || 0;
    const segmentSize = Math.ceil(tpsTotal / 6);
    const session = Math.min(6, Math.max(1, Math.floor(voterIdx / segmentSize) + 1));
    const timeSlots = [
      "07:00 - 08:00 WIB",
      "08:00 - 09:00 WIB",
      "09:00 - 10:00 WIB",
      "10:00 - 11:00 WIB",
      "11:00 - 12:00 WIB",
      "12:00 - 13:00 WIB"
    ];
    const waktuStr = timeSlots[session - 1];
    form.getTextField('waktu').setText(waktuStr);

    const getTpsLocationName = (tpsName: string) => {
      if (!tpsName) return "Balai Desa Gentan";
      const match = tpsName.match(/\d+/);
      if (!match) return "Balai Desa Gentan";
      const num = parseInt(match[0], 10);
      switch (num) {
        case 1: return "Ngemplak RT. 3/1";
        case 2: return "JOGLO SATRIO PINAYUNGAN RT. 1/3";
        case 3: return "PAUD SRIKANDI KEDEN RT. 1/7";
        case 4: return "NGENDEN RT. 1/8";
        case 5: return "GEDUNG BULU TANGKIS KANTOR DESA";
        default: return "Balai Desa Gentan";
      }
    };
    form.getTextField('tempat1').setText(getTpsLocationName(voter.tps));
    form.getTextField('tempat2').setText("Gentan, Baki, Sukoharjo");

    // Center tgl_dikeluarkan and nama_ketua text fields
    const fieldTgl = form.getTextField('tgl_dikeluarkan');
    fieldTgl.setText("04 Desember 2026");
    fieldTgl.setAlignment(TextAlignment.Center);

    const fieldKetua = form.getTextField('nama_ketua');
    fieldKetua.setText("MOCH. SUTOPO, S. H., M. H.");
    fieldKetua.setAlignment(TextAlignment.Center);

    const qrDataUrl = await QRCode.toDataURL(voter.id_pemilih || voter.nik || "", {
      margin: 1,
      width: 150
    });
    
    const qrImageBytes = await fetch(qrDataUrl).then(res => res.arrayBuffer());
    const qrImage = await pdfDoc.embedPng(qrImageBytes);

    const page = pdfDoc.getPages()[0];
    page.drawImage(qrImage, {
      x: 470,
      y: 725,
      width: 80,
      height: 80
    });

    // Make all filled values bold, and clear background highlights
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Draw white rectangle to cover the original "Telah diterima pada tanggal :" label
    // The label is roughly in the range x: 50 to 215, y: 150 to 175
    page.drawRectangle({
      x: 50,
      y: 150,
      width: 170,
      height: 25,
      color: rgb(1, 1, 1), // White color
    });

    // Draw the new label shifted to the right (toward the middle)
    // Shifted from x: ~50 to x: 80
    page.drawText('Telah diterima pada tanggal :', {
      x: 80,
      y: 161,
      size: 10,
      font: helvetica,
    });

    // Reposition/resize the tgl_diterima field widget to line up with the new label
    const fieldTglDiterima = form.getTextField('tgl_diterima');
    const widgetTglDiterima = fieldTglDiterima.acroField.getWidgets()[0];
    widgetTglDiterima.setRectangle({ x: 235, y: 156.8898, width: 320, height: 16 });

    // Remove background colors and force appearance regeneration for all fields (including empty/unfilled ones)
    form.getFields().forEach(field => {
      // Force appearance regeneration by resetting text to its current value or empty string
      if (typeof (field as any).setText === 'function') {
        (field as any).setText((field as any).getText() || '');
      }

      // Delete background highlights from the widget annotation's MK dictionary
      field.acroField.getWidgets().forEach(widget => {
        const mk = widget.dict.get(PDFName.of('MK'));
        if (mk && typeof (mk as any).delete === 'function') {
          (mk as any).delete(PDFName.of('BG'));
        }
      });
    });

    // Re-generate appearances using the bold font
    form.updateFieldAppearances(helveticaBold);

    // Flatten form so they become flat static elements and lose all field outlines
    form.flatten();

    const modifiedPdfBytes = await pdfDoc.save();
    const blob = new Blob([modifiedPdfBytes as any], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Undangan_${voter.nama.replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Gagal membuat undangan:", error);
    alert("Terjadi kesalahan saat membuat file undangan PDF.");
  }
};

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
            PILKADES GENTAN 2026 BAKI SUKOHARJO
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
                        <div className="voter-detail-row" style={{ alignItems: 'center' }}>
                          <span className="voter-detail-label">TPS Terdaftar</span>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            <span className="voter-detail-value" style={{ fontWeight: '700', color: 'var(--primary)' }}>{voter.tps}</span>
                            {getTpsMapLink(voter.tps) && (
                              <a
                                href={getTpsMapLink(voter.tps)!}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '0.725rem',
                                  fontWeight: '600',
                                  color: 'var(--primary)',
                                  textDecoration: 'none',
                                  backgroundColor: 'var(--primary-light)',
                                  padding: '4px 8px',
                                  borderRadius: 'var(--radius-sm)',
                                  border: '1px solid var(--border)',
                                  transition: 'var(--transition)'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = 'var(--border)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'var(--primary-light)';
                                }}
                                title="Buka Lokasi TPS di Google Maps"
                              >
                                <svg
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                  style={{ width: '12px', height: '12px' }}
                                >
                                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                                </svg>
                                Lokasi TPS
                              </a>
                            )}
                          </div>
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
                        Terdaftar sebagai Pemilih ({voter.tahapan.toUpperCase()})
                      </div>

                      {(voter.tahapan === 'dpt' || voter.tahapan === 'dpk') && (
                        <button
                          type="button"
                          onClick={() => downloadUndangan(voter)}
                          style={{
                            marginTop: '12px',
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            padding: '10px 16px',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            backgroundColor: 'var(--primary)',
                            color: 'var(--surface)',
                            border: 'none',
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer',
                            transition: 'var(--transition)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--primary-hover)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--primary)';
                          }}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            style={{ width: '16px', height: '16px' }}
                          >
                            <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z" />
                          </svg>
                          Unduh Surat Pemberitahuan (C6)
                        </button>
                      )}
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
                        <th style={{ padding: '8px', fontWeight: '600', width: '60%' }}>Nama</th>
                        <th style={{ padding: '8px', fontWeight: '600', width: '25%' }}>RW</th>
                        <th style={{ padding: '8px', fontWeight: '600', width: '15%', textAlign: 'center' }}>WA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { no: 1, nama: "DANANG SUPRIYDI", kedudukan: "PANTARLIH", wilayah: "RW. 001", wa: "628112631016" },
                        { no: 2, nama: "DWI SETIAWAN", kedudukan: "PANTARLIH", wilayah: "RW. 002", wa: "6281382286151" },
                        { no: 3, nama: "YOGI YUNIANTO", kedudukan: "PANTARLIH", wilayah: "RW. 003", wa: "62895327040201" },
                        { no: 4, nama: "RAHAYU EMBONG W", kedudukan: "PANTARLIH", wilayah: "RW. 004", wa: "6288808310449" },
                        { no: 5, nama: "AGUS SUTAMTOMO", kedudukan: "PANTARLIH", wilayah: "RW. 005", wa: "6289509789748" },
                        { no: 6, nama: "MUHAMMAD KRISNA MUKTI", kedudukan: "PANTARLIH", wilayah: "RW. 006", wa: "6289690010502" },
                        { no: 7, nama: "SUROSO", kedudukan: "PANTARLIH", wilayah: "RW. 007", wa: "6288802655697" },
                        { no: 8, nama: "TRI HARYONO", kedudukan: "PANTARLIH", wilayah: "RW. 008", wa: "6285712750705" },
                        { no: 9, nama: "KALIKTUS TUNA", kedudukan: "PANTARLIH", wilayah: "RW. 009", wa: "6281226282460" },
                        { no: 10, nama: "EKA RAHMAWAN", kedudukan: "PANTARLIH", wilayah: "RW. 010", wa: "6285647020102" },
                        { no: 11, nama: "TRI UTOMO", kedudukan: "PANTARLIH", wilayah: "RW. 011", wa: "6283179331297" },
                        { no: 12, nama: "TEGUH SUPRIANTO", kedudukan: "PANTARLIH", wilayah: "RW. 012", wa: "6283179331297" },
                        { no: 13, nama: "DIANA ASRININGRUM", kedudukan: "PANTARLIH", wilayah: "RW. 013", wa: "6281227916591" },
                        { no: 14, nama: "SUNARYO", kedudukan: "PANTARLIH", wilayah: "RW. 014", wa: "628122585546" }
                      ].map((p, idx) => (
                        <tr key={idx} style={{ borderBottom: idx < 13 ? '1px solid var(--border)' : 'none' }}>
                          <td style={{ padding: '8px', fontWeight: '600' }}>{p.nama}</td>
                          <td style={{ padding: '8px', fontWeight: '600', color: 'var(--primary)' }}>{p.wilayah}</td>
                          <td style={{ padding: '8px 4px', textAlign: 'center' }}>
                            <a
                              href={`https://wa.me/${p.wa}?text=${encodeURIComponent(`Halo Pak/Bu ${p.nama}, saya warga Gentan ingin berkoordinasi mengenai pendaftaran/pemutakhiran data pemilih di ${p.wilayah}.`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                backgroundColor: 'oklch(0.62 0.16 145)', // WA brand-like success color
                                color: '#ffffff',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'transform 0.2s, background-color 0.2s',
                              }}
                              title={`Hubungi ${p.nama} via WhatsApp`}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'oklch(0.55 0.16 145)';
                                e.currentTarget.style.transform = 'scale(1.1)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'oklch(0.62 0.16 145)';
                                e.currentTarget.style.transform = 'scale(1)';
                              }}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                style={{ width: '18px', height: '18px' }}
                              >
                                <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 0 0 1.333 4.982L2 22l5.202-1.362a9.92 9.92 0 0 0 4.808 1.237h.005c5.507 0 9.99-4.478 9.99-9.985 0-2.67-1.039-5.177-2.927-7.065A9.92 9.92 0 0 0 12.012 2Zm5.72 14.12c-.244.686-1.42 1.252-1.95 1.293-.483.037-.992.058-2.883-.72a11.16 11.16 0 0 1-4.823-4.248c-.96-1.285-1.536-2.766-1.536-4.288 0-1.616.843-2.408 1.142-2.721.222-.232.488-.343.729-.343h.525c.169 0 .393.007.568.423.22.525.75 1.83.815 1.963.064.133.107.288.02.464-.087.176-.131.288-.262.44-.131.152-.275.339-.393.457-.133.133-.273.278-.117.546.156.268.694 1.144 1.488 1.85.998.887 1.838 1.162 2.098 1.293.26.13.41.11.562-.066.153-.176.657-.76.833-1.019.176-.26.352-.217.593-.127.242.09 1.53.72 1.792.85.263.13.438.196.503.31.066.113.066.653-.178 1.339Z" />
                              </svg>
                            </a>
                          </td>
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
