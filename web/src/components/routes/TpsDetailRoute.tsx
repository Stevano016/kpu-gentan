import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { TpsDetailTab } from '../tabs/TpsDetailTab';

interface TpsDetailRouteProps {
  fetchTpsDetail: (id: number) => void;
  tpsDetailData: any;
  onBack: () => void;
}

/**
 * Detail satu TPS. Nomornya datang dari URL, jadi rute ini yang memicu
 * pemuatannya — bukan halaman daftar yang mengantar datanya lewat state, supaya
 * tautan langsung dan tombol muat ulang browser tetap bekerja.
 */
export const TpsDetailRoute: React.FC<TpsDetailRouteProps> = ({
  fetchTpsDetail,
  tpsDetailData,
  onBack,
}) => {
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    if (id) fetchTpsDetail(parseInt(id, 10));
  }, [id, fetchTpsDetail]);

  if (!tpsDetailData) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
        Memuat detail TPS...
      </div>
    );
  }

  return <TpsDetailTab tpsDetailData={tpsDetailData} setPage={onBack} />;
};
