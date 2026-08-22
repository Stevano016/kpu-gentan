import React from 'react';

/** Bilah bawah tetap: nama program dan kredit pendukung. */
export const LandingFooter: React.FC = () => (
  <footer className="landing-footer">
    <div className="landing-footer-title">Ruang Komunitas Digital Desa</div>
    <div className="landing-credit-wrap">
      <span className="landing-credit">
        <img src="/ush_logo.png" alt="Logo USH" className="landing-credit-logo" />
        <span className="landing-credit-text">
          Support by KKN Universitas Sugeng Hartono(USH) Kel-7 2026
        </span>
      </span>
    </div>
  </footer>
);
