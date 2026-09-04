import { GAYA, bingkai, muatExcelJS, nomorSesuaiMode, unduhWorkbook, type ModeNomor } from './excelDasar';

/**
 * Penyusun berkas Excel "Daftar Pemilih" — versi .xlsx sungguhan dari ekspor
 * yang dulu berupa CSV.
 *
 * CSV-nya diganti karena satu alasan yang tidak bisa diperbaiki di dalam CSV:
 * berkas CSV tidak menyimpan tipe kolom, jadi Excel menebak sendiri, dan
 * tebakannya untuk NIK 16 digit selalu "angka" — tampil `3,31E+15` dengan
 * digit terakhir yang hilang beneran. Di .xlsx tipe kolom ikut tersimpan.
 */

export interface BarisPemilih {
  id_pemilih?: string | null;
  nik: string;
  nkk?: string | null;
  nama: string;
  rt?: string | null;
  rw?: string | null;
  alamat?: string | null;
  jenis_kelamin?: string | null;
  umur?: number | null;
  status_kawin?: string | null;
  pekerjaan?: string | null;
  disabilitas?: string | null;
  tahapan?: string | null;
  asal?: string | null;
  keterangan?: string | null;
  tps?: string | null;
  status_hadir?: boolean;
  waktu_checkin?: string | null;
  nik_sintetis?: boolean;
  nkk_sintetis?: boolean;
}

export interface DataEksporPemilih {
  label: string;
  judul: string;
  jumlah: number;
  baris: BarisPemilih[];
}

interface Kolom {
  judul: string;
  ambil: (b: BarisPemilih) => string | number | null;
  lebar: number;
  teks?: boolean;
  tengah?: boolean;
}

const kolomUntuk = (mode: ModeNomor): Kolom[] => [
  { judul: 'No', ambil: () => null, lebar: 6, tengah: true },
  { judul: 'ID Pemilih', ambil: (b) => b.id_pemilih ?? '', lebar: 17 },
  { judul: 'NIK', ambil: (b) => nomorSesuaiMode(b.nik, mode), lebar: 20, teks: true },
  { judul: 'No. KK', ambil: (b) => nomorSesuaiMode(b.nkk, mode), lebar: 20, teks: true },
  { judul: 'Nama Lengkap', ambil: (b) => b.nama ?? '', lebar: 30 },
  { judul: 'L/P', ambil: (b) => (b.jenis_kelamin === 'PEREMPUAN' ? 'P' : b.jenis_kelamin === 'LAKI-LAKI' ? 'L' : ''), lebar: 6, tengah: true },
  { judul: 'Umur', ambil: (b) => b.umur ?? '', lebar: 7, tengah: true },
  { judul: 'Status Kawin', ambil: (b) => b.status_kawin ?? '', lebar: 16 },
  { judul: 'Pekerjaan', ambil: (b) => b.pekerjaan ?? '', lebar: 24 },
  { judul: 'Disabilitas', ambil: (b) => (b.disabilitas === '-' ? '' : b.disabilitas ?? ''), lebar: 13 },
  { judul: 'Alamat', ambil: (b) => b.alamat ?? '', lebar: 38 },
  { judul: 'RT', ambil: (b) => b.rt ?? '', lebar: 6, tengah: true },
  { judul: 'RW', ambil: (b) => b.rw ?? '', lebar: 6, tengah: true },
  { judul: 'TPS', ambil: (b) => b.tps ?? '', lebar: 10, tengah: true },
  { judul: 'Tahapan', ambil: (b) => (b.tahapan ?? '').toUpperCase(), lebar: 10, tengah: true },
  { judul: 'Asal', ambil: (b) => (b.asal ?? '').toUpperCase(), lebar: 9, tengah: true },
  { judul: 'Keterangan', ambil: (b) => (b.keterangan ?? '').toUpperCase(), lebar: 15 },
  { judul: 'Kehadiran', ambil: (b) => (b.status_hadir ? 'Hadir' : 'Belum Hadir'), lebar: 13, tengah: true },
  { judul: 'Waktu Check-in', ambil: (b) => b.waktu_checkin ?? '', lebar: 19, tengah: true },
  {
    judul: 'Catatan',
    ambil: (b) => [b.nik_sintetis ? 'NIK sementara' : '', b.nkk_sintetis ? 'NKK sementara' : ''].filter(Boolean).join(' + '),
    lebar: 26,
  },
];

export async function unduhExcelPemilih(data: DataEksporPemilih, mode: ModeNomor = 'penuh'): Promise<string> {
  const Excel = await muatExcelJS();
  const wb = new Excel.Workbook();
  wb.creator = 'GENTARA — Sekretariat Kelurahan Gentan';
  wb.created = new Date();

  const dicetak = new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' });
  const ws = wb.addWorksheet('Daftar Pemilih', {
    views: [{ state: 'frozen', ySplit: 4 }],
    pageSetup: {
      orientation: 'landscape',
      paperSize: 9,
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
    },
  });

  const semuaKolom = kolomUntuk(mode);
  const kolomTersaring = mode === 'sembunyi'
    ? semuaKolom.filter((k) => k.judul !== 'NIK' && k.judul !== 'No. KK')
    : semuaKolom;

  kolomTersaring.forEach((kolom, i) => {
    const c = ws.getColumn(i + 1);
    c.width = kolom.lebar;
    // Inilah perbaikannya: kolom nomor identitas dikunci sebagai teks.
    if (kolom.teks) c.numFmt = '@';
  });

  const kepala = [
    'DAFTAR PEMILIH',
    `${data.judul} · Kelurahan Gentan, Baki, Sukoharjo`,
    `Dicetak ${dicetak} — ${data.jumlah.toLocaleString('id-ID')} pemilih`,
  ];

  kepala.forEach((teks, i) => {
    ws.mergeCells(i + 1, 1, i + 1, kolomTersaring.length);
    const sel = ws.getCell(i + 1, 1);
    sel.value = teks;
    sel.alignment = { horizontal: 'center', vertical: 'middle' };
    sel.font = i === 0
      ? { name: 'Calibri', size: 14, bold: true, color: { argb: GAYA.hijauTua } }
      : { name: 'Calibri', size: 10, color: { argb: GAYA.abuTeks } };
    ws.getRow(i + 1).height = i === 0 ? 24 : 16;
  });

  const barisJudul = ws.getRow(4);
  kolomTersaring.forEach((kolom, i) => {
    const sel = barisJudul.getCell(i + 1);
    sel.value = kolom.judul;
    sel.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    sel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GAYA.hijauTua } };
    sel.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    sel.border = bingkai(GAYA.hijauTua);
  });
  barisJudul.height = 28;

  ws.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4, column: kolomTersaring.length } };
  ws.pageSetup.printTitlesRow = '4:4';

  data.baris.forEach((data_baris, indeks) => {
    const baris = ws.getRow(5 + indeks);
    const perluDilengkapi = data_baris.nik_sintetis || data_baris.nkk_sintetis;

    kolomTersaring.forEach((kolom, i) => {
      const sel = baris.getCell(i + 1);
      const nilai = i === 0 ? indeks + 1 : kolom.ambil(data_baris);
      sel.value = nilai === '' ? null : nilai;
      sel.border = bingkai();
      sel.font = kolom.teks
        ? { name: 'Consolas', size: 10 }
        : { name: 'Calibri', size: 10, bold: kolom.judul === 'Nama Lengkap' };
      sel.alignment = {
        vertical: 'middle',
        horizontal: kolom.tengah ? 'center' : 'left',
        wrapText: kolom.judul === 'Alamat',
      };
      if (kolom.teks) sel.numFmt = '@';

      if (perluDilengkapi) {
        sel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GAYA.kuningTanda } };
      } else if (indeks % 2 === 1) {
        sel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GAYA.abuSelang } };
      }
    });

    baris.height = 18;
  });

  const barisCatatan = 5 + data.baris.length + 2;
  ws.getCell(barisCatatan, 1).value = 'Keterangan';
  ws.getCell(barisCatatan, 1).font = { name: 'Calibri', size: 10, bold: true };
  if (mode === 'penuh') {
    ws.getCell(barisCatatan + 1, 1).value =
      'Baris berlatar kuning = NIK/NKK masih nomor sementara buatan sistem (awalan 9999/9998), bukan nomor asli.';
    ws.getCell(barisCatatan + 2, 1).value =
      'Kolom NIK dan No. KK bertipe teks agar 16 digitnya utuh; jangan diubah formatnya menjadi Angka.';
  } else if (mode === 'sensor') {
    ws.getCell(barisCatatan + 1, 1).value =
      'NIK dan No. KK disensor: hanya 8 digit terakhir yang ditampilkan, sisanya diganti tanda bintang.';
    ws.getCell(barisCatatan + 2, 1).value =
      'Berkas ini tidak bisa dipakai untuk memperbaiki data — untuk itu gunakan ekspor tanpa sensor.';
  } else {
    ws.getCell(barisCatatan + 1, 1).value =
      'Data diekspor tanpa memuat kolom NIK dan Nomor KK atas alasan privasi.';
  }

  return unduhWorkbook(wb, `pemilih-${data.label}${AKHIRAN[mode]}-${cap()}.xlsx`);
}

/** Nama berkas ikut menyebut modenya; berkas sensor dan penuh mudah tertukar. */
const AKHIRAN: Record<ModeNomor, string> = {
  penuh: '',
  sensor: '-sensor',
  sembunyi: '-tanpa-nik',
};

function cap(): string {
  const kini = new Date();
  return [
    kini.getFullYear(),
    String(kini.getMonth() + 1).padStart(2, '0'),
    String(kini.getDate()).padStart(2, '0'),
  ].join('');
}
