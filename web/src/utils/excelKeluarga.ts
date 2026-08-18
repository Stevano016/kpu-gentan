import type ExcelJS from 'exceljs';
import { GAYA, bingkai, muatExcelJS, unduhWorkbook } from './excelDasar';

/**
 * Penyusun berkas Excel "Daftar Pemilih per Kartu Keluarga".
 *
 * Dibuat di peramban, bukan di server, karena dua alasan: berkas berformat
 * .xlsx bergaya butuh pustaka besar yang tidak perlu ikut dipasang di hosting,
 * dan satu TPS hanya sekitar 1.600 baris sehingga ringan disusun di sisi klien.
 *
 * Yang paling penting di berkas ini: **NIK dan NKK ditulis sebagai teks**.
 * Nomor 16 digit melampaui presisi angka Excel — begitu ia masuk sebagai
 * angka, tampilannya berubah menjadi `3,31E+15` dan digit terakhirnya
 * benar-benar hilang (`...900001` tersimpan sebagai `...900000`). Format `@`
 * pada kolom plus nilai bertipe string adalah yang menahannya.
 */

export interface AnggotaKeluarga {
  nik: string;
  nkk: string;
  nik_sintetis?: boolean;
  nkk_sintetis?: boolean;
  nama: string;
  id_pemilih?: string | null;
  jenis_kelamin?: string | null;
  umur?: number | null;
  status_kawin?: string | null;
  pekerjaan?: string | null;
  disabilitas?: string | null;
  alamat?: string | null;
  rt?: string | null;
  rw?: string | null;
  tahapan?: string | null;
  keterangan?: string | null;
}

export interface Keluarga {
  nkk: string;
  nkk_sintetis?: boolean;
  jumlah_anggota: number;
  rt?: string | null;
  rw?: string | null;
  alamat?: string | null;
  anggota: AnggotaKeluarga[];
}

export interface DataEkspor {
  tps?: { id: number; nama: string; wilayah?: string } | null;
  jumlah_keluarga: number;
  jumlah_pemilih: number;
  keluarga: Keluarga[];
}

const KOLOM = [
  { judul: 'No', kunci: 'no', lebar: 5 },
  { judul: 'No. KK', kunci: 'nkk', lebar: 20 },
  { judul: 'NIK', kunci: 'nik', lebar: 20 },
  { judul: 'Nama Lengkap', kunci: 'nama', lebar: 30 },
  { judul: 'L/P', kunci: 'jk', lebar: 6 },
  { judul: 'Umur', kunci: 'umur', lebar: 7 },
  { judul: 'Status Kawin', kunci: 'status_kawin', lebar: 16 },
  { judul: 'Pekerjaan', kunci: 'pekerjaan', lebar: 24 },
  { judul: 'Disabilitas', kunci: 'disabilitas', lebar: 13 },
  { judul: 'Alamat', kunci: 'alamat', lebar: 38 },
  { judul: 'RT', kunci: 'rt', lebar: 6 },
  { judul: 'RW', kunci: 'rw', lebar: 6 },
  { judul: 'Tahapan', kunci: 'tahapan', lebar: 10 },
  { judul: 'Catatan', kunci: 'catatan', lebar: 34 },
];

const JUMLAH_KOLOM = KOLOM.length;

/** Nama sheet Excel: maksimal 31 karakter dan tidak boleh memuat : \ / ? * [ ] */
function namaSheet(rw: string, rt: string): string {
  return `RW ${rw || '-'} RT ${rt || '-'}`.replace(/[:\\/?*[\]]/g, '-').slice(0, 31);
}

function judulBerkas(data: DataEkspor): string {
  const tps = data.tps?.nama ? data.tps.nama.replace(/\s+/g, '-').toLowerCase() : 'semua-tps';
  const kini = new Date();
  const tanggal = [
    kini.getFullYear(),
    String(kini.getMonth() + 1).padStart(2, '0'),
    String(kini.getDate()).padStart(2, '0'),
  ].join('');
  return `kartu-keluarga-${tps}-${tanggal}.xlsx`;
}

/** Keluarga dipecah per RT/RW; tiap kelompok jadi satu sheet. */
function kelompokkanPerRtRw(keluarga: Keluarga[]): Map<string, Keluarga[]> {
  const peta = new Map<string, Keluarga[]>();

  for (const k of keluarga) {
    const kunci = `${k.rw || '-'}|${k.rt || '-'}`;
    const isi = peta.get(kunci);
    if (isi) isi.push(k);
    else peta.set(kunci, [k]);
  }

  return new Map([...peta.entries()].sort((a, b) => a[0].localeCompare(b[0])));
}

function tulisKepala(
  ws: ExcelJS.Worksheet,
  baris: string[],
): void {
  baris.forEach((teks, i) => {
    const nomor = i + 1;
    ws.mergeCells(nomor, 1, nomor, JUMLAH_KOLOM);
    const sel = ws.getCell(nomor, 1);
    sel.value = teks;
    sel.alignment = { horizontal: 'center', vertical: 'middle' };
    sel.font = i === 0
      ? { name: 'Calibri', size: 14, bold: true, color: { argb: GAYA.hijauTua } }
      : { name: 'Calibri', size: 10, color: { argb: GAYA.abuTeks } };
    ws.getRow(nomor).height = i === 0 ? 24 : 16;
  });
}

function tulisBarisJudulKolom(ws: ExcelJS.Worksheet, nomorBaris: number): void {
  const baris = ws.getRow(nomorBaris);

  KOLOM.forEach((kolom, i) => {
    const sel = baris.getCell(i + 1);
    sel.value = kolom.judul;
    sel.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    sel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GAYA.hijauTua } };
    sel.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    sel.border = bingkai(GAYA.hijauTua);
  });

  baris.height = 28;
}

function siapkanKolom(ws: ExcelJS.Worksheet): void {
  KOLOM.forEach((kolom, i) => {
    const c = ws.getColumn(i + 1);
    c.width = kolom.lebar;
    // Kolom nomor identitas dipaksa bertipe teks; inilah yang mencegah
    // 3311101008210003 berubah menjadi 3,31E+15.
    if (kolom.kunci === 'nik' || kolom.kunci === 'nkk') c.numFmt = '@';
  });
}

function catatanAnggota(a: AnggotaKeluarga): string {
  const catatan: string[] = [];
  if (a.nik_sintetis) catatan.push('NIK sementara — belum ada NIK asli');
  if (a.nkk_sintetis) catatan.push('NKK sementara — belum tergabung ke KK');
  if (a.keterangan) catatan.push(String(a.keterangan).toUpperCase());
  return catatan.join('; ');
}

function tulisSheetKeluarga(
  wb: ExcelJS.Workbook,
  nama: string,
  subjudul: string[],
  daftar: Keluarga[],
): void {
  const ws = wb.addWorksheet(nama, {
    views: [{ state: 'frozen', ySplit: subjudul.length + 1 }],
    pageSetup: {
      orientation: 'landscape',
      paperSize: 9,
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.3, right: 0.3, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 },
    },
  });

  siapkanKolom(ws);
  tulisKepala(ws, subjudul);

  const barisJudul = subjudul.length + 1;
  tulisBarisJudulKolom(ws, barisJudul);
  ws.autoFilter = {
    from: { row: barisJudul, column: 1 },
    to: { row: barisJudul, column: JUMLAH_KOLOM },
  };
  // Judul kolom ikut tercetak di tiap halaman kertas.
  ws.pageSetup.printTitlesRow = `${barisJudul}:${barisJudul}`;

  let nomorBaris = barisJudul + 1;

  daftar.forEach((keluarga, indeksKeluarga) => {
    const awal = nomorBaris;
    // Warna berselang per keluarga, bukan per baris: batas antar rumah tangga
    // itulah yang perlu terlihat saat berkas dibaca di lapangan.
    const latar = keluarga.nkk_sintetis
      ? GAYA.kuningTanda
      : indeksKeluarga % 2 === 0
        ? undefined
        : GAYA.abuSelang;

    keluarga.anggota.forEach((anggota, indeksAnggota) => {
      const baris = ws.getRow(nomorBaris);
      const nilai: Record<string, string | number | null> = {
        no: indeksAnggota === 0 ? indeksKeluarga + 1 : '',
        nkk: indeksAnggota === 0 ? keluarga.nkk : '',
        nik: anggota.nik ?? '',
        nama: anggota.nama ?? '',
        jk: anggota.jenis_kelamin === 'PEREMPUAN' ? 'P' : anggota.jenis_kelamin === 'LAKI-LAKI' ? 'L' : '',
        umur: anggota.umur ?? '',
        status_kawin: anggota.status_kawin ?? '',
        pekerjaan: anggota.pekerjaan ?? '',
        disabilitas: anggota.disabilitas === '-' ? '' : (anggota.disabilitas ?? ''),
        alamat: anggota.alamat ?? '',
        rt: anggota.rt ?? '',
        rw: anggota.rw ?? '',
        tahapan: (anggota.tahapan ?? '').toUpperCase(),
        catatan: catatanAnggota(anggota),
      };

      KOLOM.forEach((kolom, i) => {
        const sel = baris.getCell(i + 1);
        sel.value = nilai[kolom.kunci] === '' ? null : nilai[kolom.kunci];
        sel.border = bingkai();
        sel.font = { name: 'Calibri', size: 10 };
        sel.alignment = {
          vertical: 'middle',
          horizontal: ['no', 'jk', 'umur', 'rt', 'rw', 'tahapan'].includes(kolom.kunci)
            ? 'center'
            : 'left',
          wrapText: kolom.kunci === 'alamat' || kolom.kunci === 'catatan',
        };

        if (latar) {
          sel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: latar } };
        }

        if (kolom.kunci === 'nkk' || kolom.kunci === 'nik') {
          sel.numFmt = '@';
          sel.font = { name: 'Consolas', size: 10 };
        }

        if (kolom.kunci === 'nama' && indeksAnggota === 0) {
          sel.font = { name: 'Calibri', size: 10, bold: true };
        }

        if (kolom.kunci === 'catatan' && nilai.catatan) {
          sel.font = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF9A6B00' } };
        }
      });

      baris.height = 18;
      nomorBaris += 1;
    });

    // Satu nomor urut dan satu No. KK per keluarga — digabung ke bawah supaya
    // terbaca sebagai satu blok, bukan deretan nomor yang berulang.
    if (keluarga.anggota.length > 1) {
      ws.mergeCells(awal, 1, nomorBaris - 1, 1);
      ws.mergeCells(awal, 2, nomorBaris - 1, 2);
      ws.getCell(awal, 1).alignment = { horizontal: 'center', vertical: 'middle' };
      ws.getCell(awal, 2).alignment = { horizontal: 'center', vertical: 'middle' };
    }

    // Garis tebal menutup tiap keluarga.
    for (let kolom = 1; kolom <= JUMLAH_KOLOM; kolom += 1) {
      const sel = ws.getCell(nomorBaris - 1, kolom);
      sel.border = { ...sel.border, bottom: { style: 'medium', color: { argb: GAYA.hijauTua } } };
    }
  });

  // Baris penutup: jumlah, supaya angka di berkas tidak perlu dihitung ulang.
  const barisJumlah = ws.getRow(nomorBaris + 1);
  ws.mergeCells(nomorBaris + 1, 1, nomorBaris + 1, 3);
  const selJumlah = barisJumlah.getCell(1);
  selJumlah.value = 'JUMLAH';
  selJumlah.font = { name: 'Calibri', size: 10, bold: true };
  selJumlah.alignment = { horizontal: 'right', vertical: 'middle' };

  const totalPemilih = daftar.reduce((n, k) => n + k.anggota.length, 0);
  const selIsi = barisJumlah.getCell(4);
  selIsi.value = `${daftar.length} keluarga · ${totalPemilih} pemilih`;
  selIsi.font = { name: 'Calibri', size: 10, bold: true, color: { argb: GAYA.hijauTua } };
  selIsi.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GAYA.hijauMuda } };
}

function tulisSheetRingkasan(
  wb: ExcelJS.Workbook,
  data: DataEkspor,
  kelompok: Map<string, Keluarga[]>,
  dicetak: string,
): void {
  const ws = wb.addWorksheet('Ringkasan', {
    views: [{ state: 'frozen', ySplit: 6 }],
  });

  ws.getColumn(1).width = 18;
  ws.getColumn(2).width = 16;
  ws.getColumn(3).width = 16;
  ws.getColumn(4).width = 22;
  ws.getColumn(5).width = 26;

  const kepala = [
    'REKAP PEMILIH PER KARTU KELUARGA',
    data.tps?.nama ? `${data.tps.nama} — ${data.tps.wilayah ?? ''}` : 'Seluruh TPS Kelurahan Gentan',
    `Dicetak ${dicetak}`,
    `${data.jumlah_keluarga} keluarga · ${data.jumlah_pemilih} pemilih`,
  ];

  kepala.forEach((teks, i) => {
    ws.mergeCells(i + 1, 1, i + 1, 5);
    const sel = ws.getCell(i + 1, 1);
    sel.value = teks;
    sel.alignment = { horizontal: 'center', vertical: 'middle' };
    sel.font = i === 0
      ? { name: 'Calibri', size: 14, bold: true, color: { argb: GAYA.hijauTua } }
      : { name: 'Calibri', size: 10, color: { argb: GAYA.abuTeks } };
  });

  const judul = ['Lembar', 'Keluarga', 'Pemilih', 'Rata-rata per KK', 'Perlu dilengkapi'];
  const barisJudul = ws.getRow(6);
  judul.forEach((teks, i) => {
    const sel = barisJudul.getCell(i + 1);
    sel.value = teks;
    sel.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    sel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GAYA.hijauTua } };
    sel.alignment = { horizontal: 'center', vertical: 'middle' };
    sel.border = bingkai(GAYA.hijauTua);
  });
  barisJudul.height = 22;

  let nomor = 7;
  for (const [kunci, daftar] of kelompok) {
    const [rw, rt] = kunci.split('|');
    const pemilih = daftar.reduce((n, k) => n + k.anggota.length, 0);
    const perluDilengkapi = daftar.reduce(
      (n, k) => n + k.anggota.filter((a) => a.nik_sintetis || a.nkk_sintetis).length,
      0,
    );

    const baris = ws.getRow(nomor);
    const isi: (string | number)[] = [
      namaSheet(rw, rt),
      daftar.length,
      pemilih,
      Math.round((pemilih / daftar.length) * 10) / 10,
      perluDilengkapi ? `${perluDilengkapi} orang` : '—',
    ];

    isi.forEach((nilai, i) => {
      const sel = baris.getCell(i + 1);
      sel.value = nilai;
      sel.border = bingkai();
      sel.font = { name: 'Calibri', size: 10 };
      sel.alignment = { horizontal: i === 0 ? 'left' : 'center', vertical: 'middle' };
      if (nomor % 2 === 0) {
        sel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GAYA.abuSelang } };
      }
      if (i === 4 && perluDilengkapi) {
        sel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GAYA.kuningTanda } };
      }
    });

    nomor += 1;
  }

  const barisTotal = ws.getRow(nomor);
  ['TOTAL', data.jumlah_keluarga, data.jumlah_pemilih, '', ''].forEach((nilai, i) => {
    const sel = barisTotal.getCell(i + 1);
    sel.value = nilai === '' ? null : nilai;
    sel.font = { name: 'Calibri', size: 10, bold: true, color: { argb: GAYA.hijauTua } };
    sel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GAYA.hijauMuda } };
    sel.border = bingkai(GAYA.hijauTua);
    sel.alignment = { horizontal: i === 0 ? 'left' : 'center', vertical: 'middle' };
  });

  ws.getRow(nomor + 2).getCell(1).value = 'Keterangan';
  ws.getRow(nomor + 2).getCell(1).font = { name: 'Calibri', size: 10, bold: true };
  ws.getRow(nomor + 3).getCell(1).value =
    'Baris berlatar kuning = NKK/NIK masih nomor sementara buatan sistem (awalan 9999/9998), belum nomor asli.';
  ws.getRow(nomor + 4).getCell(1).value =
    'Nomor KK dan NIK ditulis sebagai teks agar 16 digitnya utuh; jangan diubah formatnya menjadi Angka.';
}

/** Susun workbook dan langsung unduh di peramban. */
export async function unduhExcelKeluarga(data: DataEkspor): Promise<string> {
  const Excel = await muatExcelJS();
  const wb = new Excel.Workbook();
  wb.creator = 'GENTARA — Sekretariat Kelurahan Gentan';
  wb.created = new Date();

  const dicetak = new Date().toLocaleString('id-ID', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  const kelompok = kelompokkanPerRtRw(data.keluarga);

  tulisSheetRingkasan(wb, data, kelompok, dicetak);

  for (const [kunci, daftar] of kelompok) {
    const [rw, rt] = kunci.split('|');
    tulisSheetKeluarga(wb, namaSheet(rw, rt), [
      'DAFTAR PEMILIH PER KARTU KELUARGA',
      `${data.tps?.nama ?? 'Seluruh TPS'} · RW ${rw} / RT ${rt} · Kelurahan Gentan, Baki, Sukoharjo`,
      `Dicetak ${dicetak} — ${daftar.length} keluarga, ${daftar.reduce((n, k) => n + k.anggota.length, 0)} pemilih`,
    ], daftar);
  }

  return unduhWorkbook(wb, judulBerkas(data));
}
