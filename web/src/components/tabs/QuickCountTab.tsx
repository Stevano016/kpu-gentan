import React from 'react';
import { Icons } from '../Icons';
import { LoadingHint } from '../LoadingHint';

interface QuickCountTabProps {
  dashboardData: any;
  dashboardLoading: boolean;
  fetchDashboard: (silent?: boolean) => Promise<void>;
}

/**
 * Warna identitas kandidat.
 *
 * Diambil dari palet yang sudah divalidasi, bukan dipilih dengan mata. Warna
 * lama (teal / oranye / hijau) gagal uji: pasangan hijau–oranye hanya berjarak
 * ΔE 3.5 untuk deuteranopia, artinya pemilih buta warna merah-hijau tidak bisa
 * membedakan dua kandidat sama sekali. Trio ini lolos seluruh pemeriksaan pada
 * mode terang maupun gelap (ΔE terburuk 9.2).
 *
 * Warna mengikuti nomor urut, bukan peringkat — supaya kandidat tidak berganti
 * warna ketika urutan perolehan berubah.
 */
const WARNA_KANDIDAT = [
  'var(--seri-1)',
  'var(--seri-2)',
  'var(--seri-3)',
  'oklch(0.60 0.15 280)',
  'oklch(0.60 0.15 340)',
  'oklch(0.60 0.15 80)',
  'oklch(0.60 0.15 160)',
  'oklch(0.60 0.15 220)',
  'oklch(0.60 0.15 10)'
];

const persen = (bagian: number, total: number) => (total > 0 ? (bagian / total) * 100 : 0);
const format = (n: number) => n.toLocaleString('id-ID');
const satuDesimal = (n: number) => n.toFixed(1).replace('.', ',');

export const QuickCountTab: React.FC<QuickCountTabProps> = ({
  dashboardData,
  dashboardLoading,
  fetchDashboard,
}) => {
  const stats = dashboardData?.stats;
  const agg = dashboardData?.quick_count_aggregates;
  const tpsList: any[] = dashboardData?.tps_list ?? [];
  const paslons: any[] = dashboardData?.paslons ?? [];

  // Suara sah saja — pembagi persentase perolehan tiap kandidat. Memasukkan
  // suara tidak sah akan membuat jumlah persentase kandidat tidak mencapai 100%.
  const suaraSah = agg ? paslons.reduce((sum, p) => sum + (agg[`kandidat_${p.nomor_urut}`] ?? 0), 0) : 0;
  const tidakSah = agg?.suara_tidak_sah ?? 0;
  const totalMasuk = agg?.total_suara_masuk ?? suaraSah + tidakSah;

  const kandidat = paslons
    .map((p) => ({
      nomor: p.nomor_urut,
      nama: p.nama_ketua,
      foto: p.foto_url,
      suara: agg?.[`kandidat_${p.nomor_urut}`] ?? 0,
      warna: WARNA_KANDIDAT[(p.nomor_urut - 1) % WARNA_KANDIDAT.length] ?? 'var(--seri-1)',
    }));

  const urutTerbanyak = [...kandidat].sort((a, b) => b.suara - a.suara);
  const suaraTertinggi = urutTerbanyak[0]?.suara ?? 0;
  const unggul = suaraTertinggi > 0 ? urutTerbanyak[0] : null;
  const selisih = urutTerbanyak.length > 1 ? suaraTertinggi - urutTerbanyak[1].suara : 0;

  const tpsLapor = stats?.tps_sudah_lapor_qc ?? 0;
  const tpsTotal = stats?.total_tps ?? 0;
  const pemilihBerhak = stats?.total_pemilih ?? 0;

  const sudahAdaData = totalMasuk > 0;

  return (
    <div className="qc-root">
      <div className="section-header">
        <div>
          <h1 className="section-title">Quick Count</h1>
          <p className="section-desc">
            Perolehan suara sementara dari {tpsLapor} dari {tpsTotal} TPS yang sudah mengirim hasil final.
          </p>
        </div>
        <div className="header-actions">
          <button onClick={() => fetchDashboard()} disabled={dashboardLoading} className="btn btn-secondary">
            <Icons.Refresh />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      <LoadingHint show={dashboardLoading} label="Memuat hasil quick count..." />

      {!dashboardData ? null : (
        <>
          {/* Angka utama: satu hal yang paling ingin diketahui orang. */}
          <div className="qc-hero">
            <div>
              <div className="qc-hero-label">Total Suara Masuk</div>
              <div className="qc-hero-value">{format(totalMasuk)}</div>
              <div className="qc-hero-sub">
                {suaraSah > 0
                  ? `${format(suaraSah)} suara sah · ${format(tidakSah)} tidak sah`
                  : 'Belum ada TPS yang mengirim hasil final'}
              </div>
            </div>

            {unggul && (
              <div className="qc-hero-lead">
                <div className="qc-hero-label">Perolehan Tertinggi</div>
                <div className="qc-lead-name">
                  <span className="qc-swatch" style={{ backgroundColor: unggul.warna }} aria-hidden="true" />
                  {unggul.nomor}. {unggul.nama}
                </div>
                <div className="qc-hero-sub">
                  {satuDesimal(persen(unggul.suara, suaraSah))}% · selisih {format(selisih)} suara
                </div>
              </div>
            )}
          </div>

          <div className="grid-cols-4">
            <div className="card">
              <div className="card-title">TPS Sudah Lapor</div>
              <div className="card-value">{tpsLapor}<span className="qc-of">/{tpsTotal}</span></div>
              <div className="qc-meter" role="img" aria-label={`${tpsLapor} dari ${tpsTotal} TPS sudah lapor`}>
                <div className="qc-meter-fill" style={{ width: `${persen(tpsLapor, tpsTotal)}%` }} />
              </div>
            </div>
            <div className="card">
              <div className="card-title">Suara Sah</div>
              <div className="card-value">{format(suaraSah)}</div>
              <div className="card-subtext">{satuDesimal(persen(suaraSah, totalMasuk))}% dari suara masuk</div>
            </div>
            <div className="card">
              <div className="card-title">Suara Tidak Sah</div>
              <div className="card-value">{format(tidakSah)}</div>
              <div className="card-subtext">{satuDesimal(persen(tidakSah, totalMasuk))}% dari suara masuk</div>
            </div>
            <div className="card">
              <div className="card-title">Partisipasi</div>
              <div className="card-value">{satuDesimal(persen(totalMasuk, pemilihBerhak))}%</div>
              <div className="card-subtext">dari {format(pemilihBerhak)} pemilih berhak</div>
            </div>
          </div>

          {/* Kartu kandidat: foto, nomor urut, nama, perolehan, persentase. */}
          <h2 className="qc-section-title">Kandidat</h2>
          <div className="qc-kandidat-grid">
            {kandidat.map((k) => (
              <div className="card qc-kandidat" key={k.nomor}>
                <div className="qc-kandidat-atas">
                  {k.foto ? (
                    <img src={k.foto} alt={`Foto ${k.nama}`} className="qc-foto" />
                  ) : (
                    <div className="qc-foto qc-foto-kosong">Tanpa foto</div>
                  )}
                  <div className="qc-nomor" style={{ backgroundColor: k.warna }}>{k.nomor}</div>
                </div>

                <div className="qc-nama">{k.nama}</div>

                <div className="qc-angka">
                  <span className="qc-persen">{satuDesimal(persen(k.suara, suaraSah))}%</span>
                  <span className="qc-suara">{format(k.suara)} suara</span>
                </div>

                <div className="qc-bar-track">
                  <div
                    className="qc-bar-fill"
                    style={{ width: `${persen(k.suara, suaraSah)}%`, backgroundColor: k.warna }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Pembanding antar kandidat. Batang horizontal karena namanya panjang
              dan jumlahnya sedikit; diurutkan dari perolehan terbanyak. */}
          <div className="card qc-chart-card">
            <div className="qc-chart-head">
              <h2 className="qc-section-title qc-flush">Pembanding Perolehan</h2>
              <div className="qc-legend">
                {kandidat.map((k) => (
                  <span className="qc-legend-item" key={k.nomor}>
                    <span className="qc-swatch" style={{ backgroundColor: k.warna }} aria-hidden="true" />
                    {k.nomor}. {k.nama}
                  </span>
                ))}
              </div>
            </div>

            {!sudahAdaData ? (
              <p className="qc-kosong">Grafik akan terisi setelah ada TPS yang mengirim hasil final.</p>
            ) : (
              <div className="qc-bars">
                {urutTerbanyak.map((k) => (
                  <div className="qc-bar-row" key={k.nomor} title={`${k.nama}: ${format(k.suara)} suara (${satuDesimal(persen(k.suara, suaraSah))}%)`}>
                    <div className="qc-bar-label">
                      <span className="qc-swatch" style={{ backgroundColor: k.warna }} aria-hidden="true" />
                      <span className="qc-bar-nama">{k.nomor}. {k.nama}</span>
                    </div>
                    <div className="qc-bar-plot">
                      {/* Batang punya jalur sendiri supaya persentasenya dihitung
                          dari ruang plot, bukan dari seluruh baris — kalau tidak,
                          label nilainya terdorong melewati tepi halaman. */}
                      <div className="qc-bar-lajur">
                        <div
                          className="qc-bar-mark"
                          style={{
                            width: `${persen(k.suara, suaraTertinggi)}%`,
                            backgroundColor: k.warna,
                          }}
                        />
                      </div>
                      {/* Label nilai selalu terlihat — salah satu warna berada di
                          bawah kontras 3:1 terhadap latar, jadi angka tidak boleh
                          bergantung pada warna saja. */}
                      <span className="qc-bar-nilai">
                        {format(k.suara)} <span className="qc-bar-nilai-persen">({satuDesimal(persen(k.suara, suaraSah))}%)</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Komposisi per TPS: menunjukkan sebaran, sekaligus TPS mana yang
              belum masuk. */}
          <div className="card qc-chart-card">
            <h2 className="qc-section-title qc-flush">Perolehan per TPS</h2>

            <div className="qc-tps-list">
              {tpsList.map((t) => {
                const qc = t.quick_count;
                const sahTps = qc ? paslons.reduce((sum, p) => sum + (qc[`kandidat_${p.nomor_urut}`] ?? 0), 0) : 0;
                return (
                  <div className="qc-tps-row" key={t.id}>
                    <div className="qc-tps-nama">
                      {t.nama}
                      {t.quick_count_status !== 'final' && <span className="qc-badge-menunggu">belum final</span>}
                    </div>

                    {sahTps > 0 ? (
                      <>
                        <div className="qc-stack" role="img" aria-label={`${t.nama}: ${kandidat.map((k) => `${k.nama} ${qc[`kandidat_${k.nomor}`] ?? 0}`).join(', ')}`}>
                          {kandidat.map((k) => {
                            const v = qc[`kandidat_${k.nomor}`] ?? 0;
                            if (v <= 0) return null;
                            return (
                              <div
                                key={k.nomor}
                                className="qc-stack-seg"
                                style={{ width: `${persen(v, sahTps)}%`, backgroundColor: k.warna }}
                                title={`${t.nama} — ${k.nomor}. ${k.nama}: ${format(v)} (${satuDesimal(persen(v, sahTps))}%)`}
                              />
                            );
                          })}
                        </div>
                        <div className="qc-tps-total">{format(sahTps)}</div>
                      </>
                    ) : (
                      <>
                        <div className="qc-stack qc-stack-kosong" />
                        <div className="qc-tps-total qc-muted">—</div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tabel angka: jalur baca yang tidak bergantung warna sama sekali. */}
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>TPS</th>
                  {kandidat.map((k) => (
                    <th key={k.nomor}>{k.nomor}. {k.nama}</th>
                  ))}
                  <th>Tidak Sah</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {tpsList.map((t) => {
                  const qc = t.quick_count;
                  const sahTps = qc ? paslons.reduce((sum, p) => sum + (qc[`kandidat_${p.nomor_urut}`] ?? 0), 0) : 0;
                  return (
                    <tr key={t.id}>
                      <td style={{ fontWeight: 600 }}>{t.nama}</td>
                      {kandidat.map((k) => (
                        <td key={k.nomor}>{qc ? format(qc[`kandidat_${k.nomor}`] ?? 0) : '—'}</td>
                      ))}
                      <td>{qc ? format(qc.suara_tidak_sah ?? 0) : '—'}</td>
                      <td style={{ fontWeight: 600 }}>{qc ? format(sahTps + (qc.suara_tidak_sah ?? 0)) : '—'}</td>
                      <td>
                        <span className={`badge ${t.quick_count_status === 'final' ? 'badge-success' : 'badge-info'}`}>
                          {t.quick_count_status === 'final' ? 'Final' : t.quick_count_status === 'draft' ? 'Draft' : 'Belum Isi'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                <tr className="qc-total-row">
                  <td style={{ fontWeight: 700 }}>Total</td>
                  {kandidat.map((k) => (
                    <td key={k.nomor} style={{ fontWeight: 700 }}>{format(k.suara)}</td>
                  ))}
                  <td style={{ fontWeight: 700 }}>{format(tidakSah)}</td>
                  <td style={{ fontWeight: 700 }}>{format(totalMasuk)}</td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default QuickCountTab;
