import React from 'react';
import { tautanPetaTps } from '../../constants/landing';
import type { PemilihPublik } from '../../types/app';
import { LandingIcons } from './LandingIcons';

interface BarisProps {
  label: string;
  className?: string;
  children: React.ReactNode;
}

const Baris: React.FC<BarisProps> = ({ label, className = '', children }) => (
  <div className={`voter-detail-row${className ? ` ${className}` : ''}`}>
    <span className="voter-detail-label">{label}</span>
    {children}
  </div>
);

/** Server memakai penulisan huruf besar; di layar dibuat lebih enak dibaca. */
const namaJenisKelamin = (kode: string): string =>
  kode === 'LAKI-LAKI' ? 'Laki-laki' : 'Perempuan';

interface KartuPemilihProps {
  pemilih: PemilihPublik;
}

/** Rincian satu pemilih yang cocok dengan pencarian. */
export const KartuPemilih: React.FC<KartuPemilihProps> = ({ pemilih }) => {
  const peta = tautanPetaTps(pemilih.tps);

  return (
    <div className="voter-card">
      <h3 className="voter-card-name">{pemilih.nama}</h3>

      <div className="voter-detail-grid">
        <Baris label="NIK">
          <span className="voter-detail-value is-mono">{pemilih.nik}</span>
        </Baris>

        {pemilih.nkk && (
          <Baris label="No. KK">
            <span className="voter-detail-value is-mono">{pemilih.nkk}</span>
          </Baris>
        )}

        <Baris label="Jenis Kelamin">
          <span className="voter-detail-value">{namaJenisKelamin(pemilih.jenis_kelamin)}</span>
        </Baris>

        <Baris label="TPS Terdaftar" className="is-tps">
          <div className="voter-tps">
            <span className="voter-detail-value is-tps">{pemilih.tps}</span>
            {peta && (
              <a
                href={peta}
                target="_blank"
                rel="noopener noreferrer"
                className="voter-tps-link"
                title="Buka Lokasi TPS di Google Maps"
              >
                <LandingIcons.Peta />
                Lokasi TPS
              </a>
            )}
          </div>
        </Baris>

        {pemilih.alamat && (
          <Baris label="Alamat">
            <span className="voter-detail-value">{pemilih.alamat}</span>
          </Baris>
        )}

        <Baris label="RT / RW">
          <span className="voter-detail-value">RT {pemilih.rt} / RW {pemilih.rw}</span>
        </Baris>
      </div>

      <div className="voter-status">
        Terdaftar sebagai Pemilih ({pemilih.tahapan.toUpperCase()})
      </div>
    </div>
  );
};
