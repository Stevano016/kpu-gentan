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
          {/* Tahapan pendataan: DP4 -> DPS (+DPTb) -> DPT -> DPK */}
          <div className="grid-cols-4">
            <div className="card">
              <div className="card-title">DP4 — Belum Diverifikasi</div>
              <div className="card-value">{dashboardData.stats.total_dp4 ?? 0}</div>
              <div className="card-subtext">Data impor yang menunggu verifikasi</div>
            </div>
            <div className="card">
              <div className="card-title">DPS — Hasil Verifikasi</div>
              <div className="card-value">{dashboardData.stats.total_dps}</div>
              <div className="card-subtext">Menunggu penetapan jadi DPT</div>
            </div>
            <div className="card">
              <div className="card-title">DPTb — Pemilih Tambahan</div>
              <div className="card-value">{dashboardData.stats.total_dptb}</div>
              <div className="card-subtext">Didaftarkan setelah verifikasi</div>
            </div>
            <div className="card">
              <div className="card-title">TMS — Tidak Memenuhi Syarat</div>
              <div className="card-value">{dashboardData.stats.total_tms ?? 0}</div>
              <div className="card-subtext">Gugur saat verifikasi, tidak dihitung</div>
            </div>
          </div>

          {/* Aggregate Widgets */}
          <div className="grid-cols-4">
            <div className="card">
              <div className="card-title">Total Pemilih Berhak</div>
              <div className="card-value" style={{ fontSize: '1.5rem', whiteSpace: 'nowrap' }}>
                DPT: {dashboardData.stats.total_dpt} | DPK: {dashboardData.stats.total_dpk}
              </div>
              {/* DP4 dan DPS masih proses, TMS sudah gugur — hanya DPT dan DPK
                  yang berhak memilih, jadi hanya keduanya yang dijumlahkan. */}
              <div className="card-subtext">Total Pemilih : {dashboardData.stats.total_pemilih}</div>
            </div>
            <div className="card">
              <div className="card-title">Kehadiran (Check-In)</div>
              <div className="card-value">{dashboardData.stats.total_hadir}</div>
              <div className="card-subtext">DPT: {dashboardData.stats.total_hadir_dpt} | DPK: {dashboardData.stats.total_hadir_dpk} ({dashboardData.stats.persentase_kehadiran}%)</div>
            </div>
            <div className="card">
              <div className="card-title">TPS Final QC</div>
              <div className="card-value">{dashboardData.stats.tps_sudah_lapor_qc}</div>
              <div className="card-subtext">
                {(dashboardData.stats.tps_draft_qc ?? 0) > 0
                  ? `+${dashboardData.stats.tps_draft_qc} sedang menghitung`
                  : `Dari ${dashboardData.stats.total_tps} total TPS`}
              </div>
            </div>
            <div className="card">
              <div className="card-title">TPS Belum Kirim QC</div>
              <div className="card-value">{dashboardData.stats.tps_belum_lapor_qc}</div>
              <div className="card-subtext">Belum ada data sama sekali</div>
            </div>
          </div>

          <div className="grid-cols-2">
            {/* Quick Count Aggregates */}
            <div className="card">
              <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '20px' }}>
                Agregat Quick Count
                {(dashboardData.stats.tps_draft_qc ?? 0) > 0 && (
                  <span className="qc-tag-sementara">sementara</span>
                )}
              </h2>
              <div className="quickcount-stats">
                {dashboardData.paslons?.map((p: any) => {
                  const suara = dashboardData.quick_count_aggregates[`kandidat_${p.nomor_urut}`] ?? 0;
                  const totalSuara = dashboardData.quick_count_aggregates.total_suara_masuk;
                  const persentase = totalSuara > 0 ? (suara / totalSuara) * 100 : 0;
                  const barColors = [
                    'oklch(0.60 0.15 200)',
                    'oklch(0.60 0.15 30)',
                    'oklch(0.60 0.15 120)',
                    'oklch(0.60 0.15 280)',
                    'oklch(0.60 0.15 340)',
                    'oklch(0.60 0.15 80)',
                    'oklch(0.60 0.15 160)'
                  ];
                  const barColor = barColors[(p.nomor_urut - 1) % barColors.length];

                  return (
                    <div key={p.id} style={{ marginBottom: '12px' }}>
                      <div className="quickcount-row">
                        <span>{p.nomor_urut}. {p.nama_ketua}</span>
                        <span>{suara} suara</span>
                      </div>
                      <div className="quickcount-bar-container">
                        <div 
                          className="quickcount-bar" 
                          style={{ 
                            width: `${persentase}%`,
                            backgroundColor: barColor
                          }} 
                        />
                      </div>
                    </div>
                  );
                })}
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
                    <span>Hadir: {dashboardData.stats.total_hadir} (DPT: {dashboardData.stats.total_hadir_dpt} | DPK: {dashboardData.stats.total_hadir_dpk})</span>
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
                  <th>DP4</th>
                  <th>DPS</th>
                  <th>DPTb</th>
                  <th>DPT</th>
                  <th>DPK</th>
                  <th>Total Pemilih</th>
                  <th>Hadir (Check-In)</th>
                  <th>% Kehadiran</th>
                  <th>Status Quick Count</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.tps_list.map((t: any) => {
                  const totalVoters = (t.total_dp4 ?? 0) + t.total_dps + t.total_dptb + t.total_dpt + t.total_dpk;
                  return (
                    <tr key={t.id}>
                      <td style={{ fontWeight: '600' }}>{t.nama}</td>
                      <td>{t.wilayah}</td>
                      <td>{t.total_dp4 ?? 0}</td>
                      <td>{t.total_dps}</td>
                      <td>{t.total_dptb}</td>
                      <td>{t.total_dpt}</td>
                      <td>{t.total_dpk}</td>
                      <td>{totalVoters}</td>
                      <td>
                        {t.hadir}
                        <div style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>
                          DP4:{t.hadir_dp4 ?? 0}|DPS:{t.hadir_dps}|DPTb:{t.hadir_dptb}|DPT:{t.hadir_dpt}|DPK:{t.hadir_dpk}
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
