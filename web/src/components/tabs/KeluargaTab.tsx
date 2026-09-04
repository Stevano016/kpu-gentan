import React from 'react';
import { Icons } from '../Icons';
import { LoadingHint } from '../LoadingHint';
import { ApiService } from '../../services/api';
import { metaTahapan } from '../../utils/tahapan';
import { unduhExcelKeluarga, type Keluarga } from '../../utils/excelKeluarga';
import type { ModeNomor } from '../../utils/excelDasar';
import { PILIHAN_SENSOR } from '../../constants/app';

interface KeluargaTabProps {
  token: string | null;
  tpsList: any[];
  isPantarlih: boolean;
  showSuccess: (judul: string, pesan: string) => void;
  showError: (pesan: string, judul?: string) => void;
}

interface Ringkasan {
  jumlah_pemilih: number;
  jumlah_keluarga: number;
  nkk_sintetis: number;
  nik_sintetis: number;
}

/**
 * Data Keluarga — pemilih yang sama, disusun per nomor Kartu Keluarga.
 *
 * Pantarlih mendatangi rumah, bukan orang: daftar per orang membuat mereka
 * harus menyusun sendiri siapa saja yang satu rumah. Halaman ini melakukannya
 * dan menghasilkan berkas Excel siap cetak, satu lembar per RT.
 */
export const KeluargaTab: React.FC<KeluargaTabProps> = ({
  token,
  tpsList,
  isPantarlih,
  showSuccess,
  showError,
}) => {
  const [data, setData] = React.useState<any>(null);
  const [ringkasan, setRingkasan] = React.useState<Ringkasan | null>(null);
  const [memuat, setMemuat] = React.useState(false);
  const [mengekspor, setMengekspor] = React.useState(false);
  const [pilihSensor, setPilihSensor] = React.useState(false);

  const [tpsFilter, setTpsFilter] = React.useState('');
  const [rwFilter, setRwFilter] = React.useState('');
  const [rtFilter, setRtFilter] = React.useState('');
  const [cari, setCari] = React.useState('');
  const [cariTertunda, setCariTertunda] = React.useState('');
  const [halaman, setHalaman] = React.useState(1);
  const [terbuka, setTerbuka] = React.useState<string | null>(null);

  const [wilayah, setWilayah] = React.useState<{ rw: string[]; rt_per_rw: Record<string, string[]> }>({
    rw: [],
    rt_per_rw: {},
  });

  // Mengetik tidak boleh memicu satu permintaan per huruf.
  React.useEffect(() => {
    const jeda = setTimeout(() => {
      setCari(cariTertunda);
      setHalaman(1);
    }, 400);
    return () => clearTimeout(jeda);
  }, [cariTertunda]);

  const parameter = React.useCallback(() => {
    const p: Record<string, string> = {};
    if (!isPantarlih && tpsFilter) p.tps_id = tpsFilter;
    if (rwFilter) p.rw = rwFilter;
    if (rtFilter) p.rt = rtFilter;
    return p;
  }, [isPantarlih, tpsFilter, rwFilter, rtFilter]);

  React.useEffect(() => {
    if (!token) return;
    const p: Record<string, string> = !isPantarlih && tpsFilter ? { tps_id: tpsFilter } : {};
    ApiService.getWilayahKeluarga(token, p)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (j?.data) setWilayah(j.data); })
      .catch(() => { /* pilihan filter saja; biarkan kosong bila gagal */ });
  }, [token, tpsFilter, isPantarlih]);

  React.useEffect(() => {
    if (!token) return;
    let dibatalkan = false;
    setMemuat(true);

    const p: Record<string, string> = { ...parameter(), page: String(halaman), per_page: '10' };
    if (cari) p.search = cari;

    ApiService.getKeluarga(token, p)
      .then((r) => r.json())
      .then((j) => {
        if (dibatalkan) return;
        if (j?.status === 'success') {
          setData(j.data);
          setRingkasan(j.ringkasan);
        } else {
          showError(j?.message || 'Gagal memuat data keluarga.');
        }
      })
      .catch(() => { if (!dibatalkan) showError('Gagal menghubungi server.'); })
      .finally(() => { if (!dibatalkan) setMemuat(false); });

    return () => { dibatalkan = true; };
  }, [token, parameter, halaman, cari]);

  const ekspor = async (mode: ModeNomor) => {
    if (!token || mengekspor) return;
    setMengekspor(true);
    try {
      const res = await ApiService.getKeluargaUntukEkspor(token, parameter());
      const json = await res.json().catch(() => ({}));

      if (!res.ok || json?.status !== 'success') {
        showError(json?.message || 'Ekspor ditolak server.', 'Gagal Mengekspor');
        return;
      }

      if (!json.data.keluarga.length) {
        showError('Tidak ada keluarga pada pilihan wilayah ini.', 'Tidak Ada Data');
        return;
      }

      const berkas = await unduhExcelKeluarga(json.data, mode);
      showSuccess(
        'Ekspor Selesai',
        `Berkas ${berkas} sudah diunduh — ${json.data.jumlah_keluarga} keluarga, ${json.data.jumlah_pemilih} pemilih, terbagi per lembar RT/RW.`,
      );
    } catch {
      showError('Gagal menyusun berkas Excel.', 'Gagal Mengekspor');
    } finally {
      setMengekspor(false);
    }
  };

  const daftarRt = rwFilter ? (wilayah.rt_per_rw?.[rwFilter] ?? []) : [];
  const namaTps = (id: number) => tpsList.find((t) => t.id === id)?.nama ?? `TPS ${id}`;
  const lingkupTerpilih = isPantarlih
    ? 'TPS Anda'
    : tpsFilter
      ? namaTps(Number(tpsFilter))
      : 'seluruh TPS';

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 className="section-title">Data Keluarga</h1>
          <p className="section-desc">
            Pemilih dikelompokkan menurut nomor Kartu Keluarga, jadi terlihat siapa saja yang
            tinggal serumah. Unduhannya berupa berkas Excel siap cetak — satu lembar per RT.
          </p>
        </div>
        <div className="header-actions">
          <button
            type="button"
            onClick={() => setPilihSensor(true)}
            className="btn btn-primary"
            disabled={mengekspor}
            title={`Unduh Excel untuk ${lingkupTerpilih}${rwFilter ? `, RW ${rwFilter}` : ''}${rtFilter ? ` RT ${rtFilter}` : ''}`}
          >
            <Icons.Download />
            <span>{mengekspor ? 'Menyusun berkas...' : 'Cetak Excel per KK'}</span>
          </button>
        </div>
      </div>

      {ringkasan && (
        <div className="grid-cols-4" style={{ marginBottom: '24px' }}>
          <div className="card">
            <div className="card-title">Kartu Keluarga</div>
            <div className="card-value">{ringkasan.jumlah_keluarga.toLocaleString('id-ID')}</div>
            <div className="card-subtext">Kelompok rumah tangga di {lingkupTerpilih}</div>
          </div>
          <div className="card">
            <div className="card-title">Pemilih Terkelompok</div>
            <div className="card-value">{ringkasan.jumlah_pemilih.toLocaleString('id-ID')}</div>
            <div className="card-subtext">
              Rata-rata {ringkasan.jumlah_keluarga
                ? (ringkasan.jumlah_pemilih / ringkasan.jumlah_keluarga).toFixed(1)
                : '0'} orang per KK
            </div>
          </div>
          <div className="card">
            <div className="card-title">NKK Belum Ada</div>
            <div className="card-value" style={{ color: 'var(--warning)' }}>
              {ringkasan.nkk_sintetis.toLocaleString('id-ID')}
            </div>
            <div className="card-subtext">Memakai nomor sementara — keluarganya belum bisa digabung</div>
          </div>
          <div className="card">
            <div className="card-title">NIK Belum Ada</div>
            <div className="card-value" style={{ color: 'var(--warning)' }}>
              {ringkasan.nik_sintetis.toLocaleString('id-ID')}
            </div>
            <div className="card-subtext">Wajib dilengkapi pantarlih saat coklit</div>
          </div>
        </div>
      )}

      <div className="filter-bar">
        <div className="filter-search">
          <Icons.Search />
          <input
            type="text"
            placeholder="Cari nama, NIK, No. KK, atau alamat — seisi rumahnya ikut muncul..."
            value={cariTertunda}
            onChange={(e) => setCariTertunda(e.target.value)}
          />
        </div>

        {!isPantarlih && (
          <div className="filter-field">
            <label>TPS</label>
            <select
              className="form-control"
              value={tpsFilter}
              onChange={(e) => { setTpsFilter(e.target.value); setRwFilter(''); setRtFilter(''); setHalaman(1); }}
            >
              <option value="">Semua TPS</option>
              {tpsList.map((t) => <option key={t.id} value={t.id}>{t.nama}</option>)}
            </select>
          </div>
        )}

        <div className="filter-field">
          <label>RW</label>
          <select
            className="form-control"
            value={rwFilter}
            onChange={(e) => { setRwFilter(e.target.value); setRtFilter(''); setHalaman(1); }}
          >
            <option value="">Semua RW</option>
            {wilayah.rw.map((rw) => <option key={rw} value={rw}>RW {rw}</option>)}
          </select>
        </div>

        <div className="filter-field">
          <label>RT</label>
          <select
            className="form-control"
            value={rtFilter}
            onChange={(e) => { setRtFilter(e.target.value); setHalaman(1); }}
            disabled={!rwFilter}
            title={rwFilter ? '' : 'Pilih RW dulu'}
          >
            <option value="">Semua RT</option>
            {daftarRt.map((rt) => <option key={rt} value={rt}>RT {rt}</option>)}
          </select>
        </div>
      </div>

      <LoadingHint show={memuat} label="Menyusun daftar keluarga..." />

      {data && (
        <>
          <div className="kk-list">
            {data.data.map((k: Keluarga & { tps_id: number; ada_nik_sintetis?: boolean }) => {
              const dibuka = terbuka === k.nkk;

              return (
                <div key={k.nkk} className={`kk-card${k.nkk_sintetis ? ' kk-card-tanda' : ''}`}>
                  <button
                    type="button"
                    className="kk-head"
                    onClick={() => setTerbuka(dibuka ? null : k.nkk)}
                    aria-expanded={dibuka}
                  >
                    <div className="kk-head-utama">
                      <div className="kk-nomor">
                        <span className="kk-label">No. KK</span>
                        <span className="kk-nkk">{k.nkk}</span>
                        {k.nkk_sintetis && (
                          <span className="badge badge-warning" title="Nomor sementara buatan sistem — NKK asli belum ditemukan">
                            NKK sementara
                          </span>
                        )}
                      </div>
                      <div className="kk-kepala" style={{ fontSize: '0.875rem', color: 'var(--text)', marginTop: '4px' }}>
                        <span style={{ fontWeight: '500', color: 'var(--text-muted)' }}>Kepala Keluarga: </span>
                        <span style={{ fontWeight: '600' }}>{k.anggota && k.anggota.length > 0 ? k.anggota[0].nama : '-'}</span>
                      </div>
                      <div className="kk-alamat" style={{ marginTop: '2px' }}>{k.alamat || 'Alamat belum terdata'}</div>
                    </div>
                    <div className="kk-head-meta">
                      <span className="kk-chip">RT {k.rt || '-'} / RW {k.rw || '-'}</span>
                      <span className="kk-chip">{namaTps(k.tps_id)}</span>
                      <span className="kk-chip kk-chip-kuat">{k.jumlah_anggota} anggota</span>
                      <span className="kk-kait">{dibuka ? '▲' : '▼'}</span>
                    </div>
                  </button>

                  {dibuka && (
                    <div className="table-container" style={{ margin: 0, borderRadius: 0 }}>
                      <table>
                        <thead>
                          <tr>
                            <th style={{ width: '44px' }}>No</th>
                            <th>NIK</th>
                            <th>Nama</th>
                            <th>L/P</th>
                            <th>Umur</th>
                            <th>Status Kawin</th>
                            <th>Pekerjaan</th>
                            <th>Tahapan</th>
                          </tr>
                        </thead>
                        <tbody>
                          {k.anggota.map((a, i) => (
                            <tr key={a.nik}>
                              <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{i + 1}</td>
                              <td className="cell-nowrap" style={{ fontFamily: 'monospace' }}>
                                {a.nik}
                                {a.nik_sintetis && (
                                  <span
                                    className="badge badge-warning"
                                    style={{ marginLeft: '6px' }}
                                    title="Nomor sementara buatan sistem — NIK asli belum ada"
                                  >
                                    sementara
                                  </span>
                                )}
                              </td>
                              <td style={{ fontWeight: 600 }}>{a.nama}</td>
                              <td style={{ textAlign: 'center' }}>
                                {a.jenis_kelamin === 'PEREMPUAN' ? 'P' : a.jenis_kelamin === 'LAKI-LAKI' ? 'L' : '-'}
                              </td>
                              <td style={{ textAlign: 'center' }}>{a.umur ?? '-'}</td>
                              <td>{a.status_kawin || '-'}</td>
                              <td>{a.pekerjaan || '-'}</td>
                              <td>
                                <span
                                  className={`badge ${metaTahapan(a.tahapan ?? '').badge}`}
                                  title={metaTahapan(a.tahapan ?? '').keterangan}
                                >
                                  {metaTahapan(a.tahapan ?? '').singkat}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}

            {data.data.length === 0 && (
              <div className="kk-kosong">Tidak ada keluarga yang cocok dengan pilihan ini.</div>
            )}
          </div>

          <div className="pagination">
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Halaman {data.current_page} dari {data.last_page} ({data.total.toLocaleString('id-ID')} keluarga)
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                disabled={data.current_page === 1}
                onClick={() => setHalaman(Math.max(1, data.current_page - 1))}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              >
                Sebelumnya
              </button>
              <button
                disabled={data.current_page === data.last_page}
                onClick={() => setHalaman(Math.min(data.last_page, data.current_page + 1))}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              >
                Selanjutnya
              </button>
            </div>
          </div>
        </>
      )}
      {pilihSensor && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: '460px', padding: '24px' }}>
            <h3 className="modal-title" style={{ marginBottom: '12px', fontSize: '1.2rem', fontWeight: '700' }}>
              Pilih Opsi Ekspor Excel
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: '1.5' }}>
              Setiap baris memuat NIK dan No. KK-nya sendiri. Pilih seberapa terbuka nomor itu ditulis:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              {PILIHAN_SENSOR.map((pilihan, i) => (
                <button
                  key={pilihan.mode}
                  type="button"
                  className={i === 0 ? 'btn btn-primary' : 'btn btn-secondary'}
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    padding: '12px',
                    height: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    ...(i === 0 ? {} : { backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }),
                  }}
                  onClick={() => { setPilihSensor(false); void ekspor(pilihan.mode); }}
                >
                  <span style={{ fontWeight: 600 }}>{pilihan.judul}</span>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      marginTop: '4px',
                      fontWeight: 'normal',
                      ...(i === 0 ? { opacity: 0.85 } : { color: 'var(--text-muted)' }),
                    }}
                  >
                    {pilihan.keterangan}
                  </span>
                </button>
              ))}
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 0 }}>
              <button
                type="button"
                onClick={() => setPilihSensor(false)}
                className="btn btn-secondary"
                style={{ minWidth: '80px', padding: '8px 16px', fontSize: '0.875rem' }}
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KeluargaTab;
