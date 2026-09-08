import React from 'react';
import { tautanPetaTps } from '../../constants/landing';
import type { PemilihPublik } from '../../types/app';
import { BERHAK_MEMILIH, metaTahapan } from '../../utils/tahapan';
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

interface NomorUrut {
  label: string;
  nomor: number;
}

/**
 * Nomor urut yang ditampilkan untuk satu pemilih, beserta namanya.
 *
 * Angkanya datang dari server sudah jadi — posisi orang itu di daftar hari ini,
 * bukan nomor bawaan berkas DPS. Bedanya terasa begitu ada yang dicoret: nomor
 * semua orang di belakangnya naik satu, dan undangan cetaknya memakai angka
 * yang sama persis.
 *
 * Yang ditentukan di sini hanya namanya. Tidak ada saklar fase yang harus
 * dinyalakan seseorang: label mengikuti tahapan pemilihnya sendiri, jadi kartu
 * berganti dari "No. Urut DPS" ke "No. Urut DPT" saat ia ditetapkan. DPK ikut
 * disebut DPT karena ia memang bagian dari daftar tetap.
 *
 * `null` berarti pemilihnya memang belum bernomor.
 */
function nomorUrutTampil(pemilih: PemilihPublik): NomorUrut | null {
  if (pemilih.no_urut_tampil === null || pemilih.no_urut_tampil === undefined) {
    return null;
  }

  const label = BERHAK_MEMILIH.includes(pemilih.tahapan)
    ? 'DPT'
    : metaTahapan(pemilih.tahapan).singkat;

  return { label: `No. Urut ${label}`, nomor: pemilih.no_urut_tampil };
}

interface KartuPemilihProps {
  pemilih: PemilihPublik;
}

/** Rincian satu pemilih yang cocok dengan pencarian. */
export const KartuPemilih: React.FC<KartuPemilihProps> = ({ pemilih }) => {
  const peta = tautanPetaTps(pemilih.tps);
  const urut = nomorUrutTampil(pemilih);

  return (
    <div className="voter-card">
      <h3 className="voter-card-name">{pemilih.nama}</h3>

      {/* Nomor urut ditaruh paling atas dan dibuat besar: inilah satu angka
          yang dicocokkan warga dengan lembar tempel dan undangan cetaknya. */}
      {urut && (
        <div className="voter-nomor">
          <div className="voter-nomor-utama">
            <span className="voter-nomor-label">{urut.label}</span>
            <span className="voter-nomor-nilai">{urut.nomor}</span>
          </div>
        </div>
      )}

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
