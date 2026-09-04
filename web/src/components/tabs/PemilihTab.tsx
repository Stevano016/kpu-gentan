import React from 'react';
import { Icons } from '../Icons';
import { LoadingHint } from '../LoadingHint';
import { TAHAPAN, URUTAN_TAHAPAN, metaTahapan } from '../../utils/tahapan';
import { PILIHAN_SENSOR } from '../../constants/app';
import { ApiService } from '../../services/api';
import { unduhUndanganSatuan } from '../../utils/undanganC6';
import { UKURAN_SEGMEN, type MaratonController } from '../../hooks/useUndanganMaraton';
import type { ModeNomor } from '../../utils/excelDasar';

interface PemilihTabProps {
  dptData: any;
  dptLoading: boolean;
  dptSearch: string;
  setDptSearch: (val: string) => void;
  dptTpsFilter: string;
  setDptTpsFilter: (val: string) => void;
  dptJenisFilter: string;
  setDptJenisFilter: (val: string) => void;
  dptKeteranganFilter: string;
  setDptKeteranganFilter: (val: string) => void;
  setDptPage: (page: number) => void;
  tpsList: any[];
  setIsImportModalOpen: (open: boolean) => void;
  setIsDptModalOpen: (open: boolean) => void;
  setEditingDpt: (voter: any) => void;
  setDptFormNik: (val: string) => void;
  setDptFormNkk: (val: string) => void;
  setDptFormNama: (val: string) => void;
  setDptFormTps: (val: string) => void;
  setDptFormJenis: (val: string) => void;
  setDptFormUmur: (val: string) => void;
  setDptFormStatusKawin: (val: string) => void;
  setDptFormJenisKelamin: (val: string) => void;
  setDptFormAlamat: (val: string) => void;
  setDptFormRt: (val: string) => void;
  setDptFormRw: (val: string) => void;
  setDptFormPekerjaan: (val: string) => void;
  setDptFormDisabilitas: (val: string) => void;
  setDptFormKeterangan: (val: string) => void;
  fetchQrCode: (nik: string, name: string) => Promise<void>;
  fetchEditingQr: (nik: string) => Promise<void>;
  handleDeleteDpt: (nik: string) => Promise<void>;
  handleVerifikasiDp4: () => void;
  handleTetapkanDpt: () => void;
  handleTandaiTms: (voter: any) => void;
  handleBatalkanTms: (voter: any) => void;
  handleTandaiDpk: (nik: string, nama: string) => void;
  handleBatalkanDpk: (nik: string) => void;
  isAdmin: boolean;
  isPantarlih?: boolean;
  daftarRw: string[];
  handleExport: (params: Record<string, string>, mode?: ModeNomor) => Promise<void>;
  maraton: MaratonController;
}

const JENIS_OPTIONS = [
  { value: '', label: 'Semua', judul: 'Tampilkan seluruh tahapan' },
  // Label pendek supaya tujuh chip muat dalam satu baris; nama lengkap dan
  // penjelasannya tetap tersedia lewat tooltip.
  ...URUTAN_TAHAPAN.map((t) => ({
    value: t,
    label: TAHAPAN[t].singkat,
    judul: `${TAHAPAN[t].label} — ${TAHAPAN[t].keterangan}`,
  })),
];

export const PemilihTab: React.FC<PemilihTabProps> = ({
  dptData,
  dptLoading,
  dptSearch,
  setDptSearch,
  dptTpsFilter,
  setDptTpsFilter,
  dptJenisFilter,
  setDptJenisFilter,
  dptKeteranganFilter,
  setDptKeteranganFilter,
  setDptPage,
  tpsList,
  setIsImportModalOpen,
  setIsDptModalOpen,
  setEditingDpt,
  setDptFormNik,
  setDptFormNkk,
  setDptFormNama,
  setDptFormTps,
  setDptFormJenis,
  setDptFormUmur,
  setDptFormStatusKawin,
  setDptFormJenisKelamin,
  setDptFormAlamat,
  setDptFormRt,
  setDptFormRw,
  setDptFormPekerjaan,
  setDptFormDisabilitas,
  setDptFormKeterangan,
  fetchQrCode,
  fetchEditingQr,
  handleDeleteDpt,
  handleVerifikasiDp4,
  handleTetapkanDpt,
  handleTandaiTms,
  handleBatalkanTms,
  handleTandaiDpk,
  handleBatalkanDpk,
  isAdmin,
  isPantarlih = false,
  daftarRw,
  handleExport,
  maraton,
}) => {
  const [menuEksporTerbuka, setMenuEksporTerbuka] = React.useState(false);
  const [expandedNik, setExpandedNik] = React.useState<string | null>(null);
  const [exportParams, setExportParams] = React.useState<Record<string, string> | null>(null);
  const [isExportConfirmOpen, setIsExportConfirmOpen] = React.useState(false);
  const [downloadingNik, setDownloadingNik] = React.useState<string | null>(null);
  const [c6VoterSelect, setC6VoterSelect] = React.useState<any | null>(null);
  const [menuMaratonTerbuka, setMenuMaratonTerbuka] = React.useState(false);

  /**
   * Undangan satu orang.
   *
   * Datanya diambil dari `/pemilih/cek` — bukan dari baris tabel — karena di
   * sanalah nomor urut kedatangan dan jumlah pemilih TPS dihitung, dan dua
   * angka itulah yang menentukan sesi jam pada undangan. Yang tidak bisa
   * diambil dari sana hanya NKK: rute itu menyamarkannya, sementara undangan
   * mencetak 8 digit terakhirnya di bawah kode batang. Nomor aslinya
   * ditambalkan dari baris tabel, yang memang sudah terautentikasi.
   */
  const handleDownloadC6 = async (v: any, denganTemplate: boolean = true) => {
    if (downloadingNik) return;
    setDownloadingNik(v.nik);
    try {
      const tanggapan = await ApiService.cekPemilih(v.nik);
      if (!tanggapan.ok) {
        alert('Gagal menghubungi server untuk memverifikasi data pemilih.');
        return;
      }

      const res = await tanggapan.json();
      if (!res || res.status !== 'success' || !res.data || res.data.length === 0) {
        alert('Data pemilih tidak ditemukan atau belum terverifikasi.');
        return;
      }

      await unduhUndanganSatuan({ ...res.data[0], nkk: v.nkk ?? null }, denganTemplate);
    } catch (error) {
      console.error('Gagal mengunduh C6:', error);
      alert('Terjadi kesalahan saat membuat undangan C6.');
    } finally {
      setDownloadingNik(null);
    }
  };

  const activeJenisLabel = dptJenisFilter ? metaTahapan(dptJenisFilter).singkat : 'Semua Kategori';

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 className="section-title">Data Pemilih</h1>
          <p className="section-desc">
            {isPantarlih
              ? 'Daftarkan pemilih yang belum terdata. Setiap data yang Anda masukkan otomatis tercatat sebagai DPTb (Pemilih Tambahan).'
              : `Alur pendataan: DP4 → verifikasi → DPS, ditambah DPTb, lalu ditetapkan jadi DPT, dan kasus khusus dipilah ke DPK. Menampilkan: ${activeJenisLabel}.`}
          </p>
        </div>
        {(isAdmin || isPantarlih) && (
          <div className="header-actions">
            {isAdmin && (
              <>
                <button onClick={handleVerifikasiDp4} className="btn btn-secondary" title="DP4 yang lolos menjadi DPS">
                  <span>Verifikasi DP4</span>
                </button>
                <button onClick={handleTetapkanDpt} className="btn btn-secondary" title="Gabungkan DPS dan DPTb menjadi DPT">
                  <span>Tetapkan DPT</span>
                </button>
                <button onClick={() => setIsImportModalOpen(true)} className="btn btn-secondary">
                  <Icons.Upload />
                  <span>Impor CSV</span>
                </button>
              </>
            )}
            {isPantarlih ? (
              <button
                onClick={() => { setExportParams({}); setIsExportConfirmOpen(true); }}
                className="btn btn-secondary"
                title="Unduh seluruh pemilih di TPS Anda"
              >
                <Icons.Download />
                <span>Unduh Excel TPS Saya</span>
              </button>
            ) : (
              <div className="export-dropdown">
                <button
                  type="button"
                  onClick={() => setMenuEksporTerbuka((v) => !v)}
                  className="btn btn-secondary"
                >
                  <Icons.Download />
                  <span>Ekspor Excel</span>
                </button>
                {menuEksporTerbuka && (
                  <div className="export-menu">
                    <button
                      type="button"
                      className="export-menu-item"
                      onClick={() => { setMenuEksporTerbuka(false); setExportParams({ lingkup: 'all' }); setIsExportConfirmOpen(true); }}
                    >
                      Semua data pemilih
                    </button>

                    <div className="export-menu-label">Per TPS</div>
                    {tpsList.map((t) => (
                      <button
                        key={`tps-${t.id}`}
                        type="button"
                        className="export-menu-item"
                        onClick={() => { setMenuEksporTerbuka(false); setExportParams({ lingkup: 'tps', tps_id: String(t.id) }); setIsExportConfirmOpen(true); }}
                      >
                        {t.nama}
                      </button>
                    ))}

                    <div className="export-menu-label">Per RW</div>
                    {daftarRw.length === 0 && <div className="export-menu-kosong">Belum ada data RW</div>}
                    {daftarRw.map((rw) => (
                      <button
                        key={`rw-${rw}`}
                        type="button"
                        className="export-menu-item"
                        onClick={() => { setMenuEksporTerbuka(false); setExportParams({ lingkup: 'rw', rw }); setIsExportConfirmOpen(true); }}
                      >
                        RW {rw}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Undangan maraton: satu TPS dicetak bersegmen, bukan satu-satu
                dari tombol C6 di tiap baris. */}
            {!isPantarlih && (
              <div className="export-dropdown">
                <button
                  type="button"
                  onClick={() => setMenuMaratonTerbuka((v) => !v)}
                  className="btn btn-secondary"
                  title="Cetak undangan C6 satu TPS per segmen 20/50/75 orang"
                >
                  <Icons.Download />
                  <span>Undangan Maraton</span>
                </button>
                {menuMaratonTerbuka && (
                  <div className="export-menu">
                    <div className="export-menu-label">Pilih TPS</div>
                    {tpsList.length === 0 && <div className="export-menu-kosong">Belum ada data TPS</div>}
                    {tpsList.map((t) => (
                      <button
                        key={`maraton-${t.id}`}
                        type="button"
                        className="export-menu-item"
                        onClick={() => { setMenuMaratonTerbuka(false); maraton.buka(String(t.id), t.nama); }}
                      >
                        {t.nama}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => {
                setEditingDpt(null);
                setDptFormNik('');
                setDptFormNkk('');
                setDptFormNama('');
                setDptFormTps('');
                // Ikuti filter aktif; kalau "Semua", default ke DPT
                setDptFormJenis(dptJenisFilter || 'dpt');
                setDptFormUmur('');
                setDptFormStatusKawin('');
                setDptFormJenisKelamin('');
                setDptFormAlamat('');
                setDptFormRt('');
                setDptFormRw('');
                setDptFormPekerjaan('');
                setDptFormDisabilitas('');
                setDptFormKeterangan('');
                setIsDptModalOpen(true);
              }}
              className="btn btn-primary"
            >
              <Icons.Plus />
              <span>Tambah Pemilih</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter jenis pemilih */}
      <div className="jenis-filter">
        {JENIS_OPTIONS.map(opt => (
          <button
            key={opt.value || 'all'}
            type="button"
            onClick={() => {
              setDptJenisFilter(opt.value);
              setDptPage(1);
            }}
            title={opt.judul}
            className={`jenis-filter-btn${dptJenisFilter === opt.value ? ' active' : ''}`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Filter & Search Bar */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', backgroundColor: 'var(--surface)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexGrow: 1, minWidth: '240px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', gap: '8px', alignItems: 'center', backgroundColor: 'var(--background)' }}>
          <Icons.Search />
          <input
            type="text"
            placeholder="Cari berdasarkan NIK atau Nama Pemilih..."
            style={{ border: 'none', outline: 'none', background: 'none', width: '100%', fontSize: '0.875rem' }}
            value={dptSearch}
            onChange={e => {
              setDptSearch(e.target.value);
              setDptPage(1);
            }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Filter TPS:</label>
          <select
            className="form-control"
            style={{ width: '180px', padding: '8px 12px' }}
            value={dptTpsFilter}
            onChange={e => {
              setDptTpsFilter(e.target.value);
              setDptPage(1);
            }}
          >
            <option value="">Semua TPS</option>
            {tpsList.map(t => (
              <option key={t.id} value={t.id}>{t.nama}</option>
            ))}
          </select>
        </div>
        {dptJenisFilter === 'tms' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Alasan TMS:</label>
            <select
              className="form-control"
              style={{ width: '180px', padding: '8px 12px' }}
              value={dptKeteranganFilter}
              onChange={e => {
                setDptKeteranganFilter(e.target.value);
                setDptPage(1);
              }}
            >
              <option value="">Semua Alasan</option>
              <option value="4 : Meninggal">Meninggal</option>
              <option value="5 : Ganda">Ganda</option>
              <option value="6 : Dibawah Umur">Dibawah Umur</option>
              <option value="7 : Tidak Ditemukan">Tidak Ditemukan</option>
            </select>
          </div>
        )}
      </div>

      <LoadingHint show={dptLoading} label="Memuat data pemilih..." />

      {dptData && (
        <>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID Pemilih</th>
                  <th>NIK</th>
                  <th>Nama Pemilih</th>
                  <th>Jenis</th>
                  <th>TPS Terdaftar</th>
                  <th>Kehadiran</th>
                  <th>Waktu Check-in</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {dptData.data.map((v: any) => (
                  <React.Fragment key={v.nik}>
                    <tr style={{ borderBottom: expandedNik === v.nik ? 'none' : '1px solid var(--border)' }}>
                      <td className="cell-nowrap" style={{ fontFamily: 'monospace', fontWeight: '700', color: 'var(--primary)' }}>{v.id_pemilih}</td>
                      <td className="cell-nowrap" style={{ fontFamily: 'monospace', fontWeight: '500' }}>
                        {v.nik}
                        {/* Nomor sementara buatan sistem harus terbaca sebagai
                            nomor sementara di mana pun ia muncul; tanpa tanda
                            ini ia tampak seperti NIK resmi. */}
                        {v.nik_sintetis && (
                          <span
                            className="badge badge-warning"
                            style={{ marginLeft: '6px' }}
                            title="NIK asli belum ada di data pembanding — nomor ini dibuat sistem dan wajib dilengkapi saat coklit"
                          >
                            sementara
                          </span>
                        )}
                      </td>
                      <td style={{ fontWeight: '600' }}>{v.nama}</td>
                      <td>
                        <span
                          className={`badge ${metaTahapan(v.tahapan).badge}`}
                          title={metaTahapan(v.tahapan).keterangan}
                        >
                          {metaTahapan(v.tahapan).singkat}
                        </span>
                        {/* Setelah jadi DPT, asalnya tidak lagi terlihat dari
                            tahapan — padahal itu yang dilaporkan ke KPU. */}
                        {v.tahapan === 'dpt' && v.asal === 'dptb' && (
                          <span
                            style={{ marginLeft: '6px', fontSize: '0.7rem', color: 'var(--text-muted)' }}
                            title="Masuk lewat DPTb, bukan dari DP4"
                          >
                            eks-DPTb
                          </span>
                        )}
                      </td>
                      <td>{v.tps?.nama || `TPS ID: ${v.tps_id}`}</td>
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
                      <td>
                        <div className="row-actions">
                          <button
                            onClick={() => fetchQrCode(v.nik, v.nama)}
                            className="btn btn-secondary"
                            style={{ color: 'var(--primary)' }}
                          >
                            QR
                          </button>
                          {(v.tahapan === 'dpt' || v.tahapan === 'dpk') && (
                            <button
                              type="button"
                              onClick={() => setC6VoterSelect(v)}
                              className="btn btn-secondary"
                              style={{ color: downloadingNik === v.nik ? 'var(--text-muted)' : 'oklch(0.5 0.15 140)', fontWeight: '600' }}
                              disabled={downloadingNik !== null}
                              title="Unduh Undangan C6"
                            >
                              {downloadingNik === v.nik ? '...' : 'C6'}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setExpandedNik(expandedNik === v.nik ? null : v.nik)}
                            className="btn btn-secondary"
                            style={{ color: expandedNik === v.nik ? 'var(--primary)' : 'inherit' }}
                          >
                            {expandedNik === v.nik ? 'Tutup' : 'Detail'}
                          </button>
                          {/* TMS juga bisa ditandai dari DPS: pemilih yang
                              meninggal, ganda, atau pindah kadang baru
                              ketahuan setelah verifikasi lewat, dan tanpa
                              tombol ini petugas harus memundurkan orangnya ke
                              DP4 lebih dulu. */}
                          {isAdmin && (v.tahapan === 'dp4' || v.tahapan === 'dps') && (
                            <button
                              type="button"
                              onClick={() => handleTandaiTms(v)}
                              className="btn btn-secondary"
                              style={{ color: 'var(--danger)' }}
                              title={v.tahapan === 'dps'
                                ? 'Tandai tidak memenuhi syarat — data akan keluar dari DPS'
                                : 'Tandai tidak memenuhi syarat'}
                            >
                              TMS
                            </button>
                          )}
                          {isAdmin && v.tahapan === 'tms' && (
                            <button
                              type="button"
                              onClick={() => handleBatalkanTms(v)}
                              className="btn btn-secondary"
                              title={[
                                v.tms_alasan ? `Alasan: ${v.tms_alasan}` : '',
                                `Kembali ke ${v.tahapan_sebelum_tms === 'dps' ? 'DPS' : 'DP4'}`,
                              ].filter(Boolean).join(' · ')}
                            >
                              Batal TMS
                            </button>
                          )}
                          {isAdmin && v.tahapan === 'dpt' && (
                            <button
                              type="button"
                              onClick={() => handleTandaiDpk(v.nik, v.nama)}
                              className="btn btn-secondary"
                              style={{ color: 'var(--warning)' }}
                              title="Pilah sebagai pemilih khusus"
                            >
                              Jadikan DPK
                            </button>
                          )}
                          {isAdmin && v.tahapan === 'dpk' && (
                            <button
                              type="button"
                              onClick={() => handleBatalkanDpk(v.nik)}
                              className="btn btn-secondary"
                              title={v.dpk_alasan ? `Alasan: ${v.dpk_alasan}` : 'Kembalikan ke DPT'}
                            >
                              Batal DPK
                            </button>
                          )}
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => {
                                  setEditingDpt(v);
                                  setDptFormNik(v.nik);
                                  setDptFormNkk(v.nkk || '');
                                  setDptFormNama(v.nama);
                                  setDptFormTps(String(v.tps_id));
                                  setDptFormJenis(v.tahapan || 'dp4');
                                  setDptFormUmur(v.umur ? String(v.umur) : '');
                                  setDptFormStatusKawin(v.status_kawin || '');
                                  setDptFormJenisKelamin(v.jenis_kelamin || '');
                                  setDptFormAlamat(v.alamat || '');
                                  setDptFormRt(v.rt || '');
                                  setDptFormRw(v.rw || '');
                                  setDptFormPekerjaan(v.pekerjaan || '');
                                  setDptFormDisabilitas(v.disabilitas || '');
                                  setDptFormKeterangan(v.keterangan || '');
                                  setIsDptModalOpen(true);
                                  fetchEditingQr(v.nik);
                                }}
                                className="btn btn-secondary"
                                style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteDpt(v.nik)}
                                className="btn btn-secondary"
                                style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--danger)' }}
                              >
                                Hapus
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedNik === v.nik && (
                      <tr style={{ backgroundColor: 'oklch(0.98 0.005 165)' }}>
                        <td colSpan={8} style={{ padding: '16px 24px', borderTop: 'none', borderBottom: '1px solid var(--border)' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px 24px' }}>
                            <div>
                              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '4px' }}>NKK</div>
                              <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                                {v.nkk || '-'}
                                {v.nkk_sintetis && (
                                  <span
                                    className="badge badge-warning"
                                    style={{ marginLeft: '6px' }}
                                    title="NKK asli belum ada — nomor sementara, keluarganya belum bisa dikelompokkan"
                                  >
                                    sementara
                                  </span>
                                )}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '4px' }}>Umur</div>
                              <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>{v.umur ? `${v.umur} Tahun` : '-'}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '4px' }}>Jenis Kelamin</div>
                              <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>{v.jenis_kelamin || '-'}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '4px' }}>Status Perkawinan</div>
                              <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>{v.status_kawin || '-'}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '4px' }}>Pekerjaan</div>
                              <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>{v.pekerjaan || '-'}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '4px' }}>Alamat</div>
                              <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>{v.alamat || '-'}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '4px' }}>RT / RW</div>
                              <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>RT {v.rt || '-'} / RW {v.rw || '-'}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '4px' }}>Disabilitas</div>
                              <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>{v.disabilitas || '-'}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '4px' }}>Keterangan</div>
                              <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>{v.keterangan || '-'}</div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                {dptData.data.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Tidak ditemukan data pemilih.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="pagination">
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Menampilkan Halaman {dptData.current_page} dari {dptData.last_page} ({dptData.total} pemilih)
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                disabled={dptData.current_page === 1}
                onClick={() => setDptPage(Math.max(1, dptData.current_page - 1))}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              >
                Sebelumnya
              </button>
              <button
                disabled={dptData.current_page === dptData.last_page}
                onClick={() => setDptPage(Math.min(dptData.last_page, dptData.current_page + 1))}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              >
                Selanjutnya
              </button>
            </div>
          </div>
        </>
      )}

      {isExportConfirmOpen && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: '420px', padding: '24px' }}>
            <h3 className="modal-title" style={{ marginBottom: '12px', fontSize: '1.2rem', fontWeight: '700' }}>
              Pilih Opsi Ekspor Excel
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: '1.5' }}>
              Silakan pilih format berkas Excel yang ingin Anda unduh:
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
                  onClick={() => {
                    if (exportParams) handleExport(exportParams, pilihan.mode);
                    setIsExportConfirmOpen(false);
                    setExportParams(null);
                  }}
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
                onClick={() => {
                  setIsExportConfirmOpen(false);
                  setExportParams(null);
                }}
                className="btn btn-secondary"
                style={{ minWidth: '80px', padding: '8px 16px', fontSize: '0.875rem' }}
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {maraton.terbuka && maraton.tps && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: '560px', padding: '24px' }}>
            <h3 className="modal-title" style={{ marginBottom: '6px', fontSize: '1.2rem', fontWeight: '700' }}>
              Undangan Maraton — {maraton.tps.nama}
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '18px', lineHeight: '1.5' }}>
              {maraton.memuat
                ? 'Memuat daftar pemilih...'
                : `${maraton.daftar.length.toLocaleString('id-ID')} undangan (DPT dan DPK) dari ${maraton.jumlahAktif.toLocaleString('id-ID')} pemilih aktif. Segmen diunduh berurutan; satu segmen menjadi satu berkas PDF.`}
            </p>

            {!maraton.memuat && maraton.daftar.length > 0 && (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    Besar segmen
                  </label>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                    {UKURAN_SEGMEN.map((n) => (
                      <button
                        key={n}
                        type="button"
                        disabled={maraton.sedangUnduh !== null}
                        onClick={() => maraton.setUkuran(n)}
                        className={`jenis-filter-btn${maraton.ukuran === n ? ' active' : ''}`}
                      >
                        {n} orang
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    Format lembar
                  </label>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      disabled={maraton.sedangUnduh !== null}
                      onClick={() => maraton.setDenganTemplate(true)}
                      className={`jenis-filter-btn${maraton.denganTemplate ? ' active' : ''}`}
                      title="Beserta desain latar belakang, bingkai, dan teks panduan"
                    >
                      Dengan template
                    </button>
                    <button
                      type="button"
                      disabled={maraton.sedangUnduh !== null}
                      onClick={() => maraton.setDenganTemplate(false)}
                      className={`jenis-filter-btn${!maraton.denganTemplate ? ' active' : ''}`}
                      title="Halaman kosong berisi data saja, untuk dicetak di atas kertas undangan"
                    >
                      Hanya data
                    </button>
                  </div>
                </div>

                {/* Markah: hijau bercentang = sudah diunduh. Inilah yang
                    menjawab "tadi sudah sampai mana" setelah petugas berganti
                    atau peramban ditutup. */}
                <div style={{ marginBottom: '18px' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    Segmen — {maraton.segmen.filter((sg) => sg.selesai).length} dari {maraton.segmen.length} sudah diunduh
                  </label>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(104px, 1fr))',
                      gap: '6px',
                      marginTop: '8px',
                      maxHeight: '220px',
                      overflowY: 'auto',
                      padding: '2px',
                    }}
                  >
                    {maraton.segmen.map((sg) => {
                      const sedang = maraton.sedangUnduh === sg.indeks;
                      return (
                        <button
                          key={sg.indeks}
                          type="button"
                          disabled={maraton.sedangUnduh !== null}
                          onClick={() => { void maraton.unduhSegmen(sg.indeks); }}
                          title={`Segmen ${sg.indeks + 1}: nomor ${sg.awal}–${sg.akhir} (${sg.jumlah} undangan)${sg.selesai ? ' — sudah diunduh' : ''}`}
                          style={{
                            padding: '8px 6px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: maraton.sedangUnduh !== null ? 'default' : 'pointer',
                            borderRadius: 'var(--radius-sm)',
                            border: `1px solid ${sg.selesai ? 'var(--primary)' : 'var(--border)'}`,
                            backgroundColor: sedang
                              ? '#FFF3CD'
                              : sg.selesai
                                ? 'oklch(0.95 0.03 165)'
                                : 'var(--surface)',
                            color: sg.selesai ? 'var(--primary)' : 'var(--text)',
                            textAlign: 'center',
                            lineHeight: 1.35,
                          }}
                        >
                          <div>{sg.selesai ? '✓ ' : ''}Segmen {sg.indeks + 1}</div>
                          <div style={{ fontWeight: 400, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {sg.awal}–{sg.akhir}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {maraton.kemajuan && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                    Menyusun lembar {maraton.kemajuan.selesai} dari {maraton.kemajuan.total}... jangan tutup jendela ini.
                  </p>
                )}

                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: '12px', marginBottom: '10px' }}
                  disabled={maraton.sedangUnduh !== null || !maraton.segmenBerikutnya}
                  onClick={() => {
                    if (maraton.segmenBerikutnya) void maraton.unduhSegmen(maraton.segmenBerikutnya.indeks);
                  }}
                >
                  <span>
                    {maraton.sedangUnduh !== null
                      ? 'Sedang menyusun berkas...'
                      : maraton.segmenBerikutnya
                        ? `Unduh Segmen ${maraton.segmenBerikutnya.indeks + 1} (nomor ${maraton.segmenBerikutnya.awal}–${maraton.segmenBerikutnya.akhir})`
                        : 'Semua segmen sudah diunduh'}
                  </span>
                </button>
              </>
            )}

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 0, gap: '8px' }}>
              <button
                type="button"
                onClick={maraton.lupakanTanda}
                className="btn btn-secondary"
                disabled={maraton.sedangUnduh !== null || !maraton.segmen.some((sg) => sg.selesai)}
                style={{ padding: '8px 16px', fontSize: '0.875rem' }}
              >
                Hapus markah
              </button>
              <button
                type="button"
                onClick={maraton.tutup}
                className="btn btn-secondary"
                disabled={maraton.sedangUnduh !== null}
                style={{ minWidth: '80px', padding: '8px 16px', fontSize: '0.875rem' }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {c6VoterSelect && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: '420px', padding: '24px' }}>
            <h3 className="modal-title" style={{ marginBottom: '12px', fontSize: '1.2rem', fontWeight: '700' }}>
              Pilih Format Unduhan C6
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: '1.5' }}>
              Silakan pilih format dokumen C6 untuk pemilih <strong>{c6VoterSelect.nama}</strong>:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '12px', height: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                onClick={() => {
                  handleDownloadC6(c6VoterSelect, true);
                  setC6VoterSelect(null);
                }}
              >
                <span style={{ fontWeight: '600' }}>Dengan Template Lengkap</span>
                <span style={{ fontSize: '0.75rem', opacity: 0.85, marginTop: '4px', fontWeight: 'normal' }}>
                  Unduh beserta desain latar belakang, bingkai, dan teks panduan
                </span>
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ width: '100%', justifyContent: 'center', padding: '12px', height: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
                onClick={() => {
                  handleDownloadC6(c6VoterSelect, false);
                  setC6VoterSelect(null);
                }}
              >
                <span style={{ fontWeight: '600', color: 'var(--text)' }}>Tanpa Template (Hanya Data)</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Halaman kosong berisi data saja, cocok untuk dicetak pada kertas undangan fisik
                </span>
              </button>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 0 }}>
              <button
                type="button"
                onClick={() => setC6VoterSelect(null)}
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
export default PemilihTab;
