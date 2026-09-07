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
  /** Nomor DPS-nya, disebut hanya bila sudah berbeda dari nomor yang tampil. */
  nomorDps: number | null;
}

/**
 * Nomor urut yang pantas ditampilkan untuk satu pemilih, beserta namanya.
 *
 * Tidak ada saklar fase yang harus dinyalakan seseorang: yang menentukan adalah
 * tahapan pemilihnya sendiri. Selama ia masih DPS, `no_urut_dpt` dari server
 * bernilai `null` dan yang tampil nomor DPS-nya; begitu ia ditetapkan jadi DPT,
 * nomor DPT-nya ada dan kartu ini berganti sendiri.
 *
 * Keduanya bisa berbeda, dan bukan karena salah hitung: penetapan DPT menutup
 * lubang yang ditinggalkan pemilih yang gugur, sehingga nomornya bergeser maju.
 * Undangan cetak masih membawa nomor DPS-nya, jadi angka itu tetap disebut di
 * bawah — tanpa itu, warga yang memegang undangan akan menyangka datanya salah.
 *
 * `null` berarti pemilihnya memang belum bernomor — pemilih tambahan yang baru
 * didata dan belum masuk daftar cetak mana pun.
 */
function nomorUrutTampil(pemilih: PemilihPublik): NomorUrut | null {
  if (BERHAK_MEMILIH.includes(pemilih.tahapan)) {
    if (pemilih.no_urut_dpt === null) return null;
    return {
      label: 'No. Urut DPT',
      nomor: pemilih.no_urut_dpt,
      nomorDps:
        pemilih.no_urut_dps !== null && pemilih.no_urut_dps !== pemilih.no_urut_dpt
          ? pemilih.no_urut_dps
          : null,
    };
  }

  if (pemilih.no_urut_dps === null) return null;
  return {
    label: `No. Urut ${metaTahapan(pemilih.tahapan).singkat}`,
    nomor: pemilih.no_urut_dps,
    nomorDps: null,
  };
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
          {urut.nomorDps !== null && (
            <p className="voter-nomor-catatan">
              Nomor pada DPS dan undangan cetak: <strong>{urut.nomorDps}</strong>. Nomor
              bergeser karena DPT dinomori ulang setelah penetapan.
            </p>
          )}
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
