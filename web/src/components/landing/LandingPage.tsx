import React, { useState } from 'react';
import { useCekPemilih } from '../../hooks/useCekPemilih';
import { FormPencarian } from './FormPencarian';
import { HasilPencarian } from './HasilPencarian';
import { LandingFooter } from './LandingFooter';
import { LandingHeader } from './LandingHeader';
import { GAYA_LANDING } from './landingStyles';
import { SyaratPemilihModal } from './SyaratPemilihModal';

interface LandingPageProps {
  onGoToLogin: () => void;
}

/**
 * Halaman publik: warga memeriksa apakah dirinya terdaftar sebagai pemilih.
 *
 * Berkas ini hanya merangkai bagian-bagiannya. Logika pencarian ada di
 * `useCekPemilih`, datanya di `constants/landing`, dan gayanya di
 * `landingStyles` — masing-masing bisa disunting tanpa membuka yang lain.
 */
export const LandingPage: React.FC<LandingPageProps> = ({ onGoToLogin }) => {
  const pencarian = useCekPemilih();
  const [showSyaratModal, setShowSyaratModal] = useState(false);

  return (
    <div className="landing-page">
      <style dangerouslySetInnerHTML={{ __html: GAYA_LANDING }} />

      <LandingHeader onGoToLogin={onGoToLogin} />

      <main className="landing-main">
        <div className="landing-column">
          <h1 className="landing-title">PILKADES GENTAN 2026 BAKI SUKOHARJO</h1>

          <div className="landing-card">
            <div className="landing-card-header">
              <h2 className="landing-card-title">Cek Daftar Pemilih</h2>
            </div>

            <FormPencarian pencarian={pencarian} />

            {pencarian.sudahCek && (
              <HasilPencarian
                hasil={pencarian.hasil}
                onLihatSyarat={() => setShowSyaratModal(true)}
              />
            )}
          </div>
        </div>
      </main>

      <LandingFooter />

      <SyaratPemilihModal
        isOpen={showSyaratModal}
        onClose={() => setShowSyaratModal(false)}
      />
    </div>
  );
};
