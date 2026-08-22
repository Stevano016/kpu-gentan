import React from 'react';
import { LandingIcons } from './LandingIcons';

interface LandingHeaderProps {
  onGoToLogin: () => void;
}

/** Topbar halaman publik: identitas aplikasi dan pintu masuk petugas. */
export const LandingHeader: React.FC<LandingHeaderProps> = ({ onGoToLogin }) => (
  <header className="landing-header">
    <div className="landing-brand">
      <img src="/logo.png" alt="Logo" className="landing-brand-logo" />
      <div>
        <span className="landing-brand-text">GENTARA</span>
        <span className="landing-brand-sub">Bersama, Transparan, untuk Gentan.</span>
      </div>
    </div>
    <button
      type="button"
      onClick={onGoToLogin}
      className="btn btn-secondary landing-login-btn"
    >
      <LandingIcons.Akun />
      {/* Label disembunyikan di layar sempit; ikonnya sudah cukup jelas. */}
      <span className="landing-login-btn-text">Login Petugas</span>
    </button>
  </header>
);
