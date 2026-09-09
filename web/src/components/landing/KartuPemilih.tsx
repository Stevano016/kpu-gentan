import React from 'react';
import { tautanPetaTps } from '../../constants/landing';
import type { PemilihPublik } from '../../types/app';
import { BERHAK_MEMILIH } from '../../utils/tahapan';
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

/**
 * Nomor urut yang ditampilkan untuk satu pemilih — atau `null` bila belum
 * waktunya ditampilkan.
 *
 * **Hanya DPT dan DPK yang diberi nomor di kartu ini.** Sebelum penetapan,
 * nomor seseorang masih bergerak setiap kali ada yang dicoret atau
 * ditambahkan; menampilkannya saat itu berarti mengundang warga menghafal
 * angka yang hampir pasti berubah, dan mencocokkannya dengan lembar yang belum
 * dicetak. Karena itu DPS, DPTb, dan DP4 tidak menampilkan nomor sama sekali —
 * bukan karena tidak punya, tapi karena nomornya belum berarti apa-apa.
 *
 * Begitu ia ditetapkan jadi DPT, nomornya muncul sendiri. Tidak ada saklar
 * fase yang harus dinyalakan seseorang: yang menentukan tahapan pemilihnya.
 *
 * DPK ikut diberi label DPT karena ia memang bagian dari daftar tetap dan
 * dinomori di daftar yang sama.
 */
function nomorUrutTampil(pemilih: PemilihPublik): number | null {
  if (!BERHAK_MEMILIH.includes(pemilih.tahapan)) {
    return null;
  }

  return pemilih.no_urut_tampil ?? null;
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
      {urut !== null && (
        <div className="voter-nomor">
          <div className="voter-nomor-utama">
            <span className="voter-nomor-label">No. Urut DPT</span>
            <span className="voter-nomor-nilai">{urut}</span>
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
