import React from 'react';

interface TpsDetailTabProps {
  tpsDetailData: any;
  setPage: (page: string) => void;
}

export const TpsDetailTab: React.FC<TpsDetailTabProps> = ({
  tpsDetailData,
  setPage,
}) => {
  const getPaslonLabel = (num: number, defaultLabel: string) => {
    if (!tpsDetailData?.paslons) return defaultLabel;
    const match = tpsDetailData.paslons.find((p: any) => p.nomor_urut === num);
    if (!match) return defaultLabel;
    return `${match.nomor_urut}. ${match.nama_ketua} - ${match.nama_wakil}`;
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <button onClick={() => setPage('dashboard')} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', marginBottom: '16px' }}>
          &larr; Kembali ke Dashboard
        </button>
        <h1 className="section-title">{tpsDetailData.tps.nama}</h1>
        <p className="section-desc">Wilayah: {tpsDetailData.tps.wilayah}</p>
      </div>

      <div className="grid-cols-4">
        <div className="card">
          <div className="card-title">Total Pemilih (Voters)</div>
          <div className="card-value">{tpsDetailData.stats.total_pemilih}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: '500' }}>
            DPT: {tpsDetailData.stats.total_dpt} | DPK: {tpsDetailData.stats.total_dpk} | DPS: {tpsDetailData.stats.total_dps} | DPTb: {tpsDetailData.stats.total_dptb}
          </div>
        </div>
        <div className="card">
          <div className="card-title">Check-in Hadir</div>
          <div className="card-value" style={{ color: 'var(--success)' }}>{tpsDetailData.stats.hadir}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: '500' }}>
            DPT: {tpsDetailData.stats.hadir_dpt} | DPK: {tpsDetailData.stats.hadir_dpk} | DPS: {tpsDetailData.stats.hadir_dps} | DPTb: {tpsDetailData.stats.hadir_dptb}
          </div>
        </div>
        <div className="card">
          <div className="card-title">Belum Hadir</div>
          <div className="card-value" style={{ color: 'var(--text-muted)' }}>{tpsDetailData.stats.tidak_hadir}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: '500' }}>
            Total pemilih belum absen
          </div>
        </div>
        <div className="card">
          <div className="card-title">Persentase Kehadiran</div>
          <div className="card-value">{tpsDetailData.stats.persentase_kehadiran}%</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: '500' }}>
            Dari total pemilih
          </div>
        </div>
      </div>

      <div className="detail-grid">
        {/* Voter list log */}
        <div className="card">
          <h3 style={{ fontWeight: '700', marginBottom: '16px' }}>Log Kehadiran Pemilih</h3>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>NIK</th>
                  <th>Nama Pemilih</th>
                  <th>Tipe</th>
                  <th>Status</th>
                  <th>Waktu Check-in</th>
                </tr>
              </thead>
              <tbody>
                {tpsDetailData.voters.map((v: any) => (
                  <tr key={v.nik}>
                    <td>{v.nik}</td>
                    <td style={{ fontWeight: '500' }}>{v.nama}</td>
                    <td>
                      <span className={`badge ${
                        v.jenis_pemilih === 'dpk'
                          ? 'badge-warning'
                          : v.jenis_pemilih === 'dps'
                          ? 'badge-success'
                          : v.jenis_pemilih === 'dptb'
                          ? 'badge-secondary'
                          : 'badge-info'
                      }`}>
                        {v.jenis_pemilih?.toUpperCase() || 'DPT'}
                      </span>
                    </td>
                    <td>
                      {v.status_hadir ? (
                        <span className="badge badge-success">Hadir</span>
                      ) : (
                        <span className="badge badge-danger">Belum Hadir</span>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {v.waktu_checkin ? new Date(v.waktu_checkin).toLocaleString('id-ID') : '-'}
                    </td>
                  </tr>
                ))}
                {tpsDetailData.voters.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Tidak ada data pemilih terdaftar di TPS ini.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Count and Device logs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card">
            <h3 style={{ fontWeight: '700', marginBottom: '16px' }}>Hasil Quick Count TPS</h3>
            {tpsDetailData.quick_count ? (
              <div className="quickcount-stats">
                <div className="quickcount-row">
                  <span>{getPaslonLabel(1, 'Kandidat 01')}</span>
                  <span>{tpsDetailData.quick_count.kandidat_1} suara</span>
                </div>
                <div className="quickcount-row">
                  <span>{getPaslonLabel(2, 'Kandidat 02')}</span>
                  <span>{tpsDetailData.quick_count.kandidat_2} suara</span>
                </div>
                <div className="quickcount-row">
                  <span>{getPaslonLabel(3, 'Kandidat 03')}</span>
                  <span>{tpsDetailData.quick_count.kandidat_3} suara</span>
                </div>
                <div className="quickcount-row" style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                  <span>Suara Tidak Sah</span>
                  <span>{tpsDetailData.quick_count.suara_tidak_sah} suara</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Status Laporan:</span>
                  {tpsDetailData.quick_count.status === 'final' ? (
                    <span className="badge badge-success">Final (LOCKED)</span>
                  ) : (
                    <span className="badge badge-warning">Draft</span>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>KPPS belum menginput data Quick Count.</div>
            )}
          </div>

          <div className="card">
            <h3 style={{ fontWeight: '700', marginBottom: '16px' }}>Log Sinkronisasi Device KPPS</h3>
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {tpsDetailData.recent_syncs.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {tpsDetailData.recent_syncs.map((log: any) => (
                    <div key={log.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px', fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600' }}>
                        <span style={{ color: 'var(--primary)' }}>
                          {log.action === 'voter_checkin' ? 'Kehadiran Sync' : 'Quick Count Sync'}
                        </span>
                        <span style={{ color: 'var(--text-muted)' }}>
                          {new Date(log.waktu_sync).toLocaleTimeString('id-ID')}
                        </span>
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>
                        Device ID: {log.device_id.substring(0, 12)}...
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '10px 0', fontSize: '0.875rem' }}>Belum ada log sync.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default TpsDetailTab;
