import React from 'react';
import { Icons } from '../Icons';
import { roundVal } from '../../utils/helpers';
import { LoadingHint } from '../LoadingHint';

interface DashboardTabProps {
  dashboardData: any;
  dashboardLoading: boolean;
  fetchDashboard: (silent?: boolean) => Promise<void>;
  setSelectedTpsId: (id: number | null) => void;
  setPage: (page: string) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  dashboardData,
  dashboardLoading,
  fetchDashboard,
  setSelectedTpsId,
  setPage,
}) => {
  const getPaslonLabel = (num: number, defaultLabel: string) => {
    if (!dashboardData?.paslons) return defaultLabel;
    const match = dashboardData.paslons.find((p: any) => p.nomor_urut === num);
    if (!match) return defaultLabel;
    return `${match.nomor_urut}. ${match.nama_ketua} - ${match.nama_wakil}`;
  };

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 className="section-title">Dashboard Umum</h1>
          <p className="section-desc">Statistik real-time kehadiran pemilih dan quick count suara.</p>
        </div>
        {/* Wrapped: passing the handler directly would hand the click event in as
            `silent`, making the manual refresh silent too. */}
        <button onClick={() => fetchDashboard()} disabled={dashboardLoading} className="btn btn-secondary">
          <Icons.Refresh />
          <span>Segarkan</span>
        </button>
      </div>

      <LoadingHint show={dashboardLoading} />

      {dashboardData && (
        <>
          {/* Aggregate Widgets */}
          <div className="grid-cols-4">
            <div className="card">
              <div className="card-title">Total Pemilih (Voters)</div>
              <div className="card-value">{dashboardData.stats.total_pemilih}</div>
              <div className="card-subtext">DPT: {dashboardData.stats.total_dpt} | DPK: {dashboardData.stats.total_dpk} | DPS: {dashboardData.stats.total_dps} | DPTb: {dashboardData.stats.total_dptb}</div>
            </div>
            <div className="card">
              <div className="card-title">Kehadiran (Check-In)</div>
              <div className="card-value">{dashboardData.stats.total_hadir}</div>
              <div className="card-subtext">DPT: {dashboardData.stats.total_hadir_dpt} | DPK: {dashboardData.stats.total_hadir_dpk} | DPS: {dashboardData.stats.total_hadir_dps} | DPTb: {dashboardData.stats.total_hadir_dptb} ({dashboardData.stats.persentase_kehadiran}%)</div>
            </div>
            <div className="card">
              <div className="card-title">TPS Sudah Kirim QC</div>
              <div className="card-value">{dashboardData.stats.tps_sudah_lapor_qc}</div>
              <div className="card-subtext">Dari {dashboardData.stats.total_tps} total TPS</div>
            </div>
            <div className="card">
              <div className="card-title">TPS Belum Kirim QC</div>
              <div className="card-value">{dashboardData.stats.tps_belum_lapor_qc}</div>
              <div className="card-subtext">Menunggu submit final KPPS</div>
            </div>
          </div>

          <div className="grid-cols-2">
            {/* Quick Count Aggregates */}
            <div className="card">
              <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '20px' }}>Agregat Quick Count</h2>
              <div className="quickcount-stats">
                <div>
                  <div className="quickcount-row">
                    <span>{getPaslonLabel(1, 'Kandidat 01')}</span>
                    <span>{dashboardData.quick_count_aggregates.kandidat_1} suara</span>
                  </div>
                  <div className="quickcount-bar-container">
                    <div 
                      className="quickcount-bar" 
                      style={{ 
                        width: `${dashboardData.quick_count_aggregates.total_suara_masuk > 0 ? (dashboardData.quick_count_aggregates.kandidat_1 / dashboardData.quick_count_aggregates.total_suara_masuk) * 100 : 0}%`,
                        backgroundColor: 'oklch(0.60 0.15 200)'
                      }} 
                    />
                  </div>
                </div>
                <div>
                  <div className="quickcount-row">
                    <span>{getPaslonLabel(2, 'Kandidat 02')}</span>
                    <span>{dashboardData.quick_count_aggregates.kandidat_2} suara</span>
                  </div>
                  <div className="quickcount-bar-container">
                    <div 
                      className="quickcount-bar" 
                      style={{ 
                        width: `${dashboardData.quick_count_aggregates.total_suara_masuk > 0 ? (dashboardData.quick_count_aggregates.kandidat_2 / dashboardData.quick_count_aggregates.total_suara_masuk) * 100 : 0}%`,
                        backgroundColor: 'oklch(0.60 0.15 30)'
                      }} 
                    />
                  </div>
                </div>
                <div>
                  <div className="quickcount-row">
                    <span>{getPaslonLabel(3, 'Kandidat 03')}</span>
                    <span>{dashboardData.quick_count_aggregates.kandidat_3} suara</span>
                  </div>
                  <div className="quickcount-bar-container">
                    <div 
                      className="quickcount-bar" 
                      style={{ 
                        width: `${dashboardData.quick_count_aggregates.total_suara_masuk > 0 ? (dashboardData.quick_count_aggregates.kandidat_3 / dashboardData.quick_count_aggregates.total_suara_masuk) * 100 : 0}%`,
                        backgroundColor: 'oklch(0.60 0.15 120)'
                      }} 
                    />
                  </div>
                </div>
                <div style={{ marginTop: '12px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                  <div className="quickcount-row" style={{ backgroundColor: 'transparent', padding: '4px 0' }}>
                    <span>Suara Tidak Sah</span>
                    <span>{dashboardData.quick_count_aggregates.suara_tidak_sah} suara</span>
                  </div>
                  <div className="quickcount-row" style={{ backgroundColor: 'transparent', padding: '4px 0', fontWeight: '700', fontSize: '1rem' }}>
                    <span>Total Suara Masuk</span>
                    <span>{dashboardData.quick_count_aggregates.total_suara_masuk} suara</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Attendance Monitor */}
            <div className="card">
              <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '20px' }}>Persentase Kehadiran Wilayah</h2>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80%' }}>
                <div style={{ position: 'relative', width: '160px', height: '160px', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
                  <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                    <path
                      style={{ stroke: 'var(--border)', fill: 'none', strokeWidth: '3.8' }}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="attendance-ring-value"
                      style={{ stroke: 'var(--primary)', fill: 'none', strokeWidth: '3.8', strokeDasharray: `${dashboardData.stats.persentase_kehadiran}, 100` }}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text)' }}>{dashboardData.stats.persentase_kehadiran}%</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>Kehadiran</span>
                  </div>
                </div>
                <div style={{ marginTop: '24px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '16px', fontSize: '0.875rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--primary)' }}></span>
                    <span>Hadir: {dashboardData.stats.total_hadir} (DPT: {dashboardData.stats.total_hadir_dpt} | DPK: {dashboardData.stats.total_hadir_dpk} | DPS: {dashboardData.stats.total_hadir_dps} | DPTb: {dashboardData.stats.total_hadir_dptb})</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--border)' }}></span>
                    <span>Belum Hadir: {dashboardData.stats.total_pemilih - dashboardData.stats.total_hadir}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dashboard TPS Reporting Table */}
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '16px' }}>Status Laporan per TPS</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Nama TPS</th>
                  <th>Wilayah</th>
                  <th>DPT</th>
                  <th>DPK</th>
                  <th>DPS</th>
                  <th>DPTb</th>
                  <th>Total Pemilih</th>
                  <th>Hadir (Check-In)</th>
                  <th>% Kehadiran</th>
                  <th>Status Quick Count</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.tps_list.map((t: any) => {
                  const totalVoters = t.total_dpt + t.total_dpk + t.total_dps + t.total_dptb;
                  return (
                    <tr key={t.id}>
                      <td style={{ fontWeight: '600' }}>{t.nama}</td>
                      <td>{t.wilayah}</td>
                      <td>{t.total_dpt}</td>
                      <td>{t.total_dpk}</td>
                      <td>{t.total_dps}</td>
                      <td>{t.total_dptb}</td>
                      <td>{totalVoters}</td>
                      <td>
                        {t.hadir}
                        <div style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>
                          DPT:{t.hadir_dpt}|DPK:{t.hadir_dpk}|DPS:{t.hadir_dps}|DPTb:{t.hadir_dptb}
                        </div>
                      </td>
                      <td>
                        {totalVoters > 0 ? `${roundVal((t.hadir / totalVoters) * 100)}%` : '0%'}
                      </td>
                      <td>
                        {t.quick_count_status === 'final' ? (
                          <span className="badge badge-success">Final (Terkunci)</span>
                        ) : t.quick_count_status === 'draft' ? (
                          <span className="badge badge-warning">Draft (Belum Submit)</span>
                        ) : (
                          <span className="badge badge-danger">Belum Input</span>
                        )}
                      </td>
                    <td>
                      <button 
                        onClick={() => {
                          setSelectedTpsId(t.id);
                          setPage('tps-detail');
                        }} 
                        className="btn btn-secondary" 
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      >
                        Detail Monitor
                      </button>
                    </td>
                  </tr>
                );
              })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};
export default DashboardTab;
