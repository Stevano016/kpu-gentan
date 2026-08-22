import React from 'react';
import type { PemilihPublik } from '../../types/app';
import { KartuPemilih } from './KartuPemilih';
import { LandingIcons } from './LandingIcons';

interface TidakDitemukanProps {
  onLihatSyarat: () => void;
}

const TidakDitemukan: React.FC<TidakDitemukanProps> = ({ onLihatSyarat }) => (
  <div className="landing-empty">
    <p className="landing-empty-title">Data Tidak Ditemukan</p>
    <p className="landing-empty-text">
      Nama atau NIK yang Anda masukkan tidak terdaftar dalam sistem.
    </p>
    <p className="landing-empty-text">
      Pastikan ejaan nama, RT, dan RW sudah sesuai. Jika anda warga gentan, yang memenuhi
      syarat, dan belum terdaftar silahkan hubungi pantarlih, ketua Rt, RW, atau sekertariat desa.
    </p>
    <button type="button" onClick={onLihatSyarat} className="landing-syarat-btn">
      <LandingIcons.Dokumen />
      Syarat Pemilih
    </button>
  </div>
);

interface HasilPencarianProps {
  hasil: PemilihPublik[] | null;
  onLihatSyarat: () => void;
}

/** Daftar pemilih yang cocok, atau penjelasan bila tidak ada yang cocok. */
export const HasilPencarian: React.FC<HasilPencarianProps> = ({ hasil, onLihatSyarat }) => (
  <div className="landing-results">
    <h4 className="landing-results-title">Hasil Pencarian:</h4>

    {hasil && hasil.length > 0 ? (
      <div className="landing-results-list">
        {/* NIK ganda masih mungkin muncul di data DPT, jadi indeks ikut jadi kunci. */}
        {hasil.map((pemilih, index) => (
          <KartuPemilih key={`${pemilih.nik}-${index}`} pemilih={pemilih} />
        ))}
      </div>
    ) : (
      <TidakDitemukan onLihatSyarat={onLihatSyarat} />
    )}
  </div>
);
