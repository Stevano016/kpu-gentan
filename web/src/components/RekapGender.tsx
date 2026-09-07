import React, { useMemo, useState } from 'react';
import { BERHAK_MEMILIH, URUTAN_TAHAPAN, metaTahapan } from '../utils/tahapan';

/**
 * Rekapitulasi jumlah pemilih Laki-laki dan Perempuan.
 *
 * Angka ini bukan hiasan dashboard: Berita Acara menyebut jumlah L dan P per
 * TPS beserta totalnya — saat penetapan untuk daftar pemilihnya, dan pada hari
 * pemungutan suara untuk yang benar-benar hadir. Sebelum ada halaman ini angka
 * itu hanya bisa didapat dengan mengunduh Excel lalu menghitung sendiri.
 *
 * Karena keperluannya administratif, tabelnya yang jadi pokok — batangnya
 * hanya membantu membandingkan antar TPS dengan sekali lihat. Identitas L/P
 * tidak pernah bergantung pada warna saja: tiap batang punya keterangan
 * warnanya, angkanya tertulis di tabel, dan komposisinya bisa dibaca dengan
 * mengarahkan tetikus ke batangnya.
 */

export interface AngkaGender {
  l: number;
  p: number;
  /** Jumlah baris pada tahapan itu — belum tentu `l + p`; lihat `belumTercatat`. */
  n: number;
  /** Yang sudah check-in, dengan pemilahan yang sama. */
  lh: number;
  ph: number;
  nh: number;
}

/** Rekap satu wilayah, dipilah per tahapan. Bentuknya sama dengan keluaran API. */
export type GenderPerTahapan = Record<string, AngkaGender | undefined>;

export interface BarisRekapGender {
  id: number | string;
  nama: string;
  gender?: GenderPerTahapan;
}

interface Lingkup {
  id: string;
  label: string;
  keterangan: string;
  tahapan: readonly string[];
}

/**
 * Tiga lingkup yang benar-benar dipakai, bukan satu tombol per tahapan.
 *
 * Penetapan DPT membandingkan dua hal: siapa yang diajukan (DPS beserta
 * pemilih tambahannya) dan siapa yang akhirnya tetap. Keduanya diberi tombol
 * sendiri. Lingkup ketiga menjaring seluruh tahapan aktif untuk pemeriksaan
 * silang saat pendataan masih berjalan dan orangnya tersebar di DP4.
 */
const LINGKUP: Lingkup[] = [
  {
    id: 'berhak',
    label: 'DPT + DPK',
    keterangan: 'Pemilih yang berhak memilih — dipakai Berita Acara Penetapan.',
    tahapan: BERHAK_MEMILIH,
  },
  {
    id: 'dps',
    label: 'DPS + DPTb',
    keterangan: 'Calon DPT: hasil verifikasi beserta pemilih tambahan.',
    tahapan: ['dps', 'dptb'],
  },
  {
    id: 'aktif',
    label: 'Semua Aktif',
    keterangan: 'Seluruh tahapan kecuali TMS, termasuk DP4 yang belum diverifikasi.',
    tahapan: URUTAN_TAHAPAN.filter((t) => t !== 'tms'),
  },
];

type IdMode = 'terdaftar' | 'hadir';

/**
 * Dua himpunan angka yang sama-sama diminta Berita Acara, dipisah tombol.
 *
 * Bisa saja keduanya ditampilkan berdampingan sebagai kolom tambahan, tapi itu
 * membuat tabelnya sepuluh kolom dan memaksa pembacanya memilah sendiri kolom
 * mana yang sedang ia butuhkan. Satu tombol lebih jujur: yang tampil selalu
 * satu himpunan, dan judul kolomnya menyebut himpunan yang mana.
 */
const MODE: { id: IdMode; label: string; keterangan: string }[] = [
  {
    id: 'terdaftar',
    label: 'Terdaftar',
    keterangan: 'Jumlah pemilih yang terdaftar pada tahapan itu.',
  },
  {
    id: 'hadir',
    label: 'Hadir (Check-In)',
    keterangan: 'Jumlah pemilih yang sudah check-in di TPS.',
  },
];

const KOSONG: AngkaGender = { l: 0, p: 0, n: 0, lh: 0, ph: 0, nh: 0 };

/** Menjumlahkan beberapa tahapan menjadi satu angka. */
function jumlahkan(gender: GenderPerTahapan | undefined, tahapan: readonly string[]): AngkaGender {
  if (!gender) return KOSONG;
  return tahapan.reduce<AngkaGender>((akumulasi, t) => {
    const angka = gender[t];
    if (!angka) return akumulasi;
    return {
      l: akumulasi.l + (angka.l ?? 0),
      p: akumulasi.p + (angka.p ?? 0),
      n: akumulasi.n + (angka.n ?? 0),
      lh: akumulasi.lh + (angka.lh ?? 0),
      ph: akumulasi.ph + (angka.ph ?? 0),
      nh: akumulasi.nh + (angka.nh ?? 0),
    };
  }, KOSONG);
}

interface AngkaTampil {
  l: number;
  p: number;
  n: number;
  /** Jumlah terdaftar per jenis kelamin — pembanding saat mode "Hadir". */
  lTerdaftar: number;
  pTerdaftar: number;
}

/** Memilih pasangan angka mana yang dipakai seluruh kartu. */
const tampilkan = (a: AngkaGender, mode: IdMode): AngkaTampil =>
  mode === 'hadir'
    ? { l: a.lh ?? 0, p: a.ph ?? 0, n: a.nh ?? 0, lTerdaftar: a.l, pTerdaftar: a.p }
    : { l: a.l, p: a.p, n: a.n, lTerdaftar: a.l, pTerdaftar: a.p };

const persen = (bagian: number, total: number): string =>
  total > 0 ? `${((bagian / total) * 100).toFixed(1)}%` : '—';

const angka = (n: number): string => n.toLocaleString('id-ID');

/**
 * Batang komposisi satu wilayah.
 *
 * Panjang batangnya sebanding dengan jumlah pemilih wilayah itu terhadap
 * wilayah terbanyak, jadi sekali lihat terbaca dua hal sekaligus: TPS mana yang
 * lebih besar, dan seberapa berimbang L/P-nya. Ruas bernilai nol tidak
 * digambar — kalau digambar, sisa 2px pemisahnya menyisakan garis warna yang
 * seolah mewakili pemilih yang sebenarnya tidak ada.
 */
const BatangGender: React.FC<{ angkaGender: AngkaTampil; maksimum: number; nama: string }> = ({
  angkaGender,
  maksimum,
  nama,
}) => {
  const total = angkaGender.l + angkaGender.p;
  const lebar = maksimum > 0 ? (total / maksimum) * 100 : 0;

  return (
    <div className="rekap-bar-track">
      <div className="rekap-bar" style={{ width: `${lebar}%` }}>
        {angkaGender.l > 0 && (
          <span
            className="rekap-seg rekap-seg-l"
            style={{ flexGrow: angkaGender.l }}
            title={`${nama} — Laki-laki: ${angka(angkaGender.l)} (${persen(angkaGender.l, total)})`}
          />
        )}
        {angkaGender.p > 0 && (
          <span
            className="rekap-seg rekap-seg-p"
            style={{ flexGrow: angkaGender.p }}
            title={`${nama} — Perempuan: ${angka(angkaGender.p)} (${persen(angkaGender.p, total)})`}
          />
        )}
      </div>
    </div>
  );
};

/** Tahapan yang bukan bagian dari daftar aktif; totalnya tidak menjumlahnya. */
const TAHAPAN_GUGUR = ['tms'];

const TAHAPAN_AKTIF = URUTAN_TAHAPAN.filter((t) => !TAHAPAN_GUGUR.includes(t));

/**
 * Rincian L/P tiap tahapan — keenamnya, termasuk DP4 dan TMS.
 *
 * Sengaja tidak mengikuti tombol lingkup di atasnya. Lingkup itu menjaring
 * tahapan yang dijumlahkan jadi satu angka; DP4 tidak punya lingkupnya sendiri
 * dan TMS tidak masuk lingkup mana pun, jadi kalau tabel ini ikut disaring,
 * L/P kedua tahapan itu tidak akan pernah kelihatan di layar padahal
 * angkanya sudah dihitung server.
 *
 * TMS tetap ditampilkan tapi ditandai: ia gugur, dan ikut menjumlahkannya ke
 * total akan menggelembungkan jumlah pemilih.
 */
const TabelTahapan: React.FC<{ gender: GenderPerTahapan | undefined; mode: IdMode }> = ({
  gender,
  mode,
}) => {
  const aktif = tampilkan(jumlahkan(gender, TAHAPAN_AKTIF), mode);
  const jumlahAktif = aktif.l + aktif.p;

  return (
    <div className="rekap-rincian">
      <h3 className="rekap-subjudul">
        Rincian per tahapan — {mode === 'hadir' ? 'hadir (check-in)' : 'terdaftar'}
      </h3>
      <div className="table-container rekap-tabel">
        <table>
          <thead>
            <tr>
              <th>Tahapan</th>
              <th>L</th>
              <th>P</th>
              <th>Total</th>
              <th>% L</th>
              <th>% P</th>
            </tr>
          </thead>
          <tbody>
            {URUTAN_TAHAPAN.map((t) => {
              const a = tampilkan(gender?.[t] ?? KOSONG, mode);
              const jumlah = a.l + a.p;
              const gugur = TAHAPAN_GUGUR.includes(t);
              return (
                <tr key={t} className={gugur ? 'is-gugur' : undefined}>
                  <td style={{ fontWeight: 600 }}>
                    {metaTahapan(t).singkat}
                    {gugur && <span className="rekap-tanda-gugur">tidak dihitung</span>}
                  </td>
                  <td>{angka(a.l)}</td>
                  <td>{angka(a.p)}</td>
                  <td>{angka(jumlah)}</td>
                  <td>{persen(a.l, jumlah)}</td>
                  <td>{persen(a.p, jumlah)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="rekap-tabel-total">
              <td>TOTAL AKTIF</td>
              <td>{angka(aktif.l)}</td>
              <td>{angka(aktif.p)}</td>
              <td>{angka(jumlahAktif)}</td>
              <td>{persen(aktif.l, jumlahAktif)}</td>
              <td>{persen(aktif.p, jumlahAktif)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="rekap-keterangan">
        Baris TOTAL AKTIF menjumlahkan DP4 sampai DPK; TMS tidak ikut karena pemilihnya sudah
        gugur.
        {mode === 'hadir' &&
          ' Angkanya menghitung pemilih yang sudah check-in, bukan yang terdaftar.'}
      </p>
    </div>
  );
};

interface RekapGenderProps {
  /** Rekap seluruh wilayah yang dicakup — jadi angka utama dan baris total tabel. */
  total: GenderPerTahapan | undefined;
  /** Rincian per TPS. Dikosongkan pada halaman detail satu TPS. */
  perTps?: BarisRekapGender[];
  judul?: string;
  keterangan?: string;
}

export const RekapGender: React.FC<RekapGenderProps> = ({
  total,
  perTps,
  judul = 'Rekapitulasi Jenis Kelamin',
  keterangan,
}) => {
  /**
   * Lingkup awal mengikuti data yang sudah ada, bukan tetap satu pilihan.
   *
   * Sebelum penetapan, DPT masih kosong dan membuka halaman pada "DPT + DPK"
   * berarti menyuguhkan tiga angka nol; sesudahnya, justru DPS-lah yang habis.
   * Yang ditampilkan lebih dulu adalah lingkup yang benar-benar berisi.
   *
   * Yang diperiksa selalu jumlah terdaftar, bukan jumlah hadir: sebelum hari
   * pemungutan suara seluruh angka kehadiran masih nol, dan memakainya sebagai
   * penentu hanya akan membuat lingkup awalnya jatuh sembarangan.
   */
  const awal = useMemo(() => {
    const berisi = LINGKUP.find((l) => {
      const a = jumlahkan(total, l.tahapan);
      return a.l + a.p > 0;
    });
    return berisi?.id ?? LINGKUP[0].id;
  }, [total]);

  const [idLingkup, setIdLingkup] = useState(awal);
  const [mode, setMode] = useState<IdMode>('terdaftar');
  const lingkup = LINGKUP.find((l) => l.id === idLingkup) ?? LINGKUP[0];
  const modeHadir = mode === 'hadir';

  const angkaTotal = tampilkan(jumlahkan(total, lingkup.tahapan), mode);
  const jumlahTotal = angkaTotal.l + angkaTotal.p;
  const terdaftarTotal = angkaTotal.lTerdaftar + angkaTotal.pTerdaftar;
  const belumTercatat = Math.max(0, angkaTotal.n - jumlahTotal);

  const baris = useMemo(
    () =>
      (perTps ?? []).map((t) => {
        const a = tampilkan(jumlahkan(t.gender, lingkup.tahapan), mode);
        return { ...t, angkaGender: a, jumlah: a.l + a.p };
      }),
    [perTps, lingkup, mode],
  );

  const maksimum = baris.reduce((m, b) => Math.max(m, b.jumlah), 0);
  const adaRincian = baris.length > 0;

  /**
   * Keterangan di bawah angka utama.
   *
   * Pembandingnya berganti bersama modenya, dan itu memang yang dicari: pada
   * "Terdaftar" yang menarik komposisinya (berapa persen dari seluruh pemilih),
   * pada "Hadir" yang menarik capaiannya (berapa persen L yang sudah datang).
   */
  const subAngka = (bagian: number, terdaftar: number): string =>
    modeHadir
      ? `${persen(bagian, terdaftar)} dari ${angka(terdaftar)} terdaftar`
      : `${persen(bagian, jumlahTotal)} dari total`;

  return (
    <div className="card rekap-gender">
      <div className="rekap-header">
        <div>
          <h2 className="rekap-judul">{judul}</h2>
          <p className="rekap-keterangan">{keterangan ?? lingkup.keterangan}</p>
        </div>

        {/* Dua penyaring dalam satu baris di atas angkanya: himpunan mana
            (terdaftar / hadir), lalu tahapan mana. */}
        <div className="rekap-penyaring">
          <div className="rekap-lingkup" role="group" aria-label="Himpunan angka">
            {MODE.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                className={`rekap-lingkup-btn${m.id === mode ? ' is-aktif' : ''}`}
                aria-pressed={m.id === mode}
                title={m.keterangan}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="rekap-lingkup" role="group" aria-label="Lingkup tahapan">
            {LINGKUP.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setIdLingkup(l.id)}
                className={`rekap-lingkup-btn${l.id === idLingkup ? ' is-aktif' : ''}`}
                aria-pressed={l.id === idLingkup}
                title={l.keterangan}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Angka utama; kotak warnanya sekaligus jadi keterangan warna batang. */}
      <div className="rekap-angka">
        <div className="rekap-angka-item">
          <span className="rekap-swatch rekap-swatch-l" aria-hidden="true" />
          <div>
            <div className="rekap-angka-label">Laki-laki (L){modeHadir ? ' hadir' : ''}</div>
            <div className="rekap-angka-nilai">{angka(angkaTotal.l)}</div>
            <div className="rekap-angka-sub">{subAngka(angkaTotal.l, angkaTotal.lTerdaftar)}</div>
          </div>
        </div>
        <div className="rekap-angka-item">
          <span className="rekap-swatch rekap-swatch-p" aria-hidden="true" />
          <div>
            <div className="rekap-angka-label">Perempuan (P){modeHadir ? ' hadir' : ''}</div>
            <div className="rekap-angka-nilai">{angka(angkaTotal.p)}</div>
            <div className="rekap-angka-sub">{subAngka(angkaTotal.p, angkaTotal.pTerdaftar)}</div>
          </div>
        </div>
        {/* Tanpa kotak warna: tidak ada ruas berwarna kelabu di batangnya,
            dan kotak yang tidak mewakili apa pun akan terbaca sebagai
            keterangan warna untuk deret ketiga yang sebenarnya tidak ada. */}
        <div className="rekap-angka-item is-total">
          <div>
            <div className="rekap-angka-label">
              {modeHadir ? 'Total hadir' : 'Total'} {lingkup.label}
            </div>
            <div className="rekap-angka-nilai">{angka(jumlahTotal)}</div>
            <div className="rekap-angka-sub">
              {modeHadir
                ? `${persen(jumlahTotal, terdaftarTotal)} kehadiran`
                : adaRincian
                  ? `Tersebar di ${baris.length} TPS`
                  : 'Pada TPS ini'}
            </div>
          </div>
        </div>
      </div>

      {jumlahTotal === 0 ? (
        <p className="rekap-hampa">
          {modeHadir
            ? `Belum ada pemilih ${lingkup.label} yang check-in.`
            : `Belum ada pemilih pada tahapan ${lingkup.label}.`}{' '}
          Angka tiap tahapan tetap terbaca pada rincian di bawah.
        </p>
      ) : (
        <>
          {/* Tanpa rincian antar-TPS, komposisinya tetap digambar sekali.
              Tanpa batang ini, dua kotak warna di atas tidak mewakili apa pun
              yang tampak di layar. */}
          {!adaRincian && (
            <div className="rekap-batang">
              <div className="rekap-batang-baris">
                <span className="rekap-batang-nama">L / P</span>
                <BatangGender
                  angkaGender={angkaTotal}
                  maksimum={jumlahTotal}
                  nama={lingkup.label}
                />
                <span className="rekap-batang-nilai">{angka(jumlahTotal)}</span>
              </div>
            </div>
          )}

          {/* Batang per TPS: panjangnya bisa dibandingkan antar baris. */}
          {adaRincian && (
            <div className="rekap-batang">
              {baris.map((b) => (
                <div key={b.id} className="rekap-batang-baris">
                  <span className="rekap-batang-nama">{b.nama}</span>
                  <BatangGender angkaGender={b.angkaGender} maksimum={maksimum} nama={b.nama} />
                  {/* Hanya ujung batang yang diberi angka; rincian L/P ada di tabel. */}
                  <span className="rekap-batang-nilai">{angka(b.jumlah)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Tabel per TPS mengikuti lingkup; rincian per tahapan tidak. */}
          {adaRincian && (
            <div className="table-container rekap-tabel">
              <table>
                <thead>
                  <tr>
                    <th>TPS</th>
                    <th>L</th>
                    <th>P</th>
                    <th>Total</th>
                    <th>% L</th>
                    <th>% P</th>
                    {modeHadir && <th>% Kehadiran</th>}
                  </tr>
                </thead>
                <tbody>
                  {baris.map((b) => (
                    <tr key={b.id}>
                      <td style={{ fontWeight: 600 }}>{b.nama}</td>
                      <td>{angka(b.angkaGender.l)}</td>
                      <td>{angka(b.angkaGender.p)}</td>
                      <td>{angka(b.jumlah)}</td>
                      <td>{persen(b.angkaGender.l, b.jumlah)}</td>
                      <td>{persen(b.angkaGender.p, b.jumlah)}</td>
                      {modeHadir && (
                        <td>
                          {persen(b.jumlah, b.angkaGender.lTerdaftar + b.angkaGender.pTerdaftar)}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="rekap-tabel-total">
                    <td>
                      {modeHadir ? 'TOTAL HADIR' : 'TOTAL'} {lingkup.label}
                    </td>
                    <td>{angka(angkaTotal.l)}</td>
                    <td>{angka(angkaTotal.p)}</td>
                    <td>{angka(jumlahTotal)}</td>
                    <td>{persen(angkaTotal.l, jumlahTotal)}</td>
                    <td>{persen(angkaTotal.p, jumlahTotal)}</td>
                    {modeHadir && <td>{persen(jumlahTotal, terdaftarTotal)}</td>}
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </>
      )}

      {/* Di luar cabang di atas: rincian per tahapan tetap tampil walau
          lingkup yang dipilih kosong — di situlah DP4 dan TMS terbaca. */}
      <TabelTahapan gender={total} mode={mode} />

      {/* Kalau ada baris yang jenis kelaminnya kosong, L + P tidak akan
          menjumlah ke jumlah pemilih. Itu dikatakan, bukan didiamkan. */}
      {belumTercatat > 0 && (
        <p className="rekap-catatan">
          {angka(belumTercatat)} pemilih pada lingkup ini belum tercatat jenis kelaminnya,
          sehingga tidak masuk hitungan L maupun P.
        </p>
      )}
    </div>
  );
};

export default RekapGender;
