import { PDFDocument, TextAlignment, StandardFonts, PDFName, rgb } from 'pdf-lib';
import QRCode from 'qrcode';

/**
 * Penyusun undangan C6 (surat pemberitahuan memilih).
 *
 * Dipisahkan dari `PemilihTab` karena undangan sekarang dicetak lewat dua
 * jalan yang harus menghasilkan berkas yang sama persis: satuan dari tombol di
 * tabel, dan maraton per segmen 20/50/75 orang. Selama penyusunnya tersalin di
 * dua tempat, satu perbaikan koordinat pasti terpasang di salah satunya saja.
 */

export interface PemilihUndangan {
  nama: string;
  nkk?: string | null;
  nik?: string | null;
  id_pemilih?: string | null;
  jenis_kelamin?: string | null;
  umur?: number | null;
  alamat?: string | null;
  rt?: string | null;
  rw?: string | null;
  tps?: string | null;
  no_urut?: number | null;
  tps_total_dpt?: number | null;
  tps_voter_index?: number | null;
}

/** Hari pemungutan suara, tanggal surat, dan penanda tangan. */
const HARI_PEMILIHAN = 'Kamis, 10 Desember 2026';
const TANGGAL_SURAT = '04 Desember 2026';
const NAMA_KETUA = 'MOCH. SUTOPO, S. H., M. H.';

/** Enam sesi kedatangan; pembagiannya dihitung dari urutan pemilih di TPS. */
const SESI = [
  '07:00 - 08:00 WIB',
  '08:00 - 09:00 WIB',
  '09:00 - 10:00 WIB',
  '10:00 - 11:00 WIB',
  '11:00 - 12:00 WIB',
  '12:00 - 13:00 WIB',
];

/** Letak dan ukuran kode batang QR pada lembar undangan, dalam titik PDF. */
const QR = { x: 470, y: 725, sisi: 80 };

const lokasiTps = (namaTps?: string | null): string => {
  if (!namaTps) return 'Balai Desa Gentan';
  const cocok = namaTps.match(/\d+/);
  if (!cocok) return 'Balai Desa Gentan';

  switch (parseInt(cocok[0], 10)) {
    case 1: return 'Ngemplak RT. 3/1';
    case 2: return 'JOGLO SATRIO PINAYUNGAN RT. 1/3';
    case 3: return 'PAUD SRIKANDI KEDEN RT. 1/7';
    case 4: return 'NGENDEN RT. 1/8';
    case 5: return 'GEDUNG BULU TANGKIS KANTOR DESA';
    default: return 'Balai Desa Gentan';
  }
};

const sesiPemilih = (p: PemilihUndangan): string => {
  const total = p.tps_total_dpt || 1;
  const urutan = p.tps_voter_index || 0;
  const perSegmen = Math.ceil(total / SESI.length);
  const sesi = Math.min(SESI.length, Math.max(1, Math.floor(urutan / perSegmen) + 1));

  return SESI[sesi - 1];
};

/** 8 digit terakhir NKK — yang tercetak di bawah kode batang. */
export const nkkDelapanDigit = (nkk?: string | null): string =>
  String(nkk ?? '').replace(/\D/g, '').slice(-8);

/**
 * Templatenya diambil sekali lalu ditahan.
 *
 * Cetak maraton menyusun sampai 75 lembar dalam satu tekan tombol; tanpa
 * penahanan ini berkas template yang sama diminta 75 kali.
 */
let templateTertahan: Promise<ArrayBuffer> | null = null;

export function muatTemplateUndangan(): Promise<ArrayBuffer> {
  if (!templateTertahan) {
    templateTertahan = fetch('/undangan.pdf').then((res) => {
      if (!res.ok) {
        templateTertahan = null;
        throw new Error('Gagal mengunduh template undangan.');
      }
      return res.arrayBuffer();
    });
  }

  return templateTertahan;
}

/** Satu lembar undangan siap pakai, belum disimpan ke berkas. */
export async function susunUndangan(
  pemilih: PemilihUndangan,
  denganTemplate: boolean,
): Promise<PDFDocument> {
  const templateBytes = await muatTemplateUndangan();
  // Disalin dulu: `PDFDocument.load` membaca dari buffer yang sama, sementara
  // buffer itu dipakai ulang untuk lembar-lembar berikutnya.
  const pdfDoc = await PDFDocument.load(templateBytes.slice(0));
  const page = pdfDoc.getPages()[0];

  if (!denganTemplate) {
    // Buang seluruh isi halaman template: bingkai, latar, dan teks panduan.
    page.node.delete(PDFName.of('Contents'));
  }

  const form = pdfDoc.getForm();

  const nomor = form.getTextField('nomor');
  nomor.setFontSize(14);
  nomor.setText(
    pemilih.no_urut !== null && pemilih.no_urut !== undefined ? String(pemilih.no_urut) : '',
  );

  form.getTextField('nama').setText(pemilih.nama);
  form.getTextField('jenis_kelamin').setText('');
  form.getTextField('dusun').setText(pemilih.alamat || '');
  form.getTextField('rt').setText(pemilih.rt || '');
  form.getTextField('rw').setText(pemilih.rw || '');
  form.getTextField('hari_tanggal').setText(HARI_PEMILIHAN);
  form.getTextField('waktu').setText('');
  form.getTextField('tempat1').setText(lokasiTps(pemilih.tps));
  form.getTextField('tempat2').setText('Gentan, Baki, Sukoharjo');

  const fieldTgl = form.getTextField('tgl_dikeluarkan');
  fieldTgl.setText(TANGGAL_SURAT);
  fieldTgl.setAlignment(TextAlignment.Center);

  const fieldKetua = form.getTextField('nama_ketua');
  fieldKetua.setText(NAMA_KETUA);
  fieldKetua.setAlignment(TextAlignment.Center);

  const qrDataUrl = await QRCode.toDataURL(pemilih.id_pemilih || pemilih.nik || '', {
    margin: 1,
    width: 150,
  });
  const qrBytes = await fetch(qrDataUrl).then((res) => res.arrayBuffer());
  const qrImage = await pdfDoc.embedPng(qrBytes);

  page.drawImage(qrImage, { x: QR.x, y: QR.y, width: QR.sisi, height: QR.sisi });

  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  /**
   * 8 digit terakhir NKK di bawah kode batang, selebar kode batangnya.
   *
   * Ukuran hurufnya dihitung, bukan ditetapkan: yang diminta adalah lebarnya
   * sama dengan lebar kode batang, dan itu bergantung pada lebar digit font
   * ini. Gunanya sama seperti angka di bawah barcode belanjaan — kalau QR-nya
   * tidak terbaca pemindai, petugas masih bisa mencocokkan dengan mata.
   */
  const nkk8 = nkkDelapanDigit(pemilih.nkk);
  if (nkk8) {
    const lebarAcuan = helveticaBold.widthOfTextAtSize(nkk8, 10);
    const ukuran = lebarAcuan > 0 ? (QR.sisi / lebarAcuan) * 10 : 10;
    page.drawText(nkk8, {
      x: QR.x,
      y: QR.y - ukuran - 1,
      size: ukuran,
      font: helveticaBold,
      color: rgb(0.1, 0.1, 0.1),
    });
  }

  // Jenis kelamin ditulis manual supaya umurnya bisa merah dan lebih besar.
  const teksJk = pemilih.jenis_kelamin === 'LAKI-LAKI' ? 'Laki-laki' : 'Perempuan';
  const teksUmur = pemilih.umur ? ` / ${pemilih.umur}` : '';
  const lebarJk = helveticaBold.widthOfTextAtSize(teksJk, 12);

  page.drawText(teksJk, {
    x: 169,
    y: 533.8898 + 3,
    size: 12,
    font: helveticaBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  if (teksUmur) {
    page.drawText(teksUmur, {
      x: 169 + lebarJk,
      y: 533.8898 + 3,
      size: 14,
      font: helveticaBold,
      color: rgb(0.85, 0.15, 0.15),
    });
  }

  page.drawText(sesiPemilih(pemilih), {
    x: 169,
    y: 437.8898 + 3,
    size: 14,
    font: helveticaBold,
    color: rgb(0.85, 0.15, 0.15),
  });

  // Kotak merah "HADIR SESUAI WAKTU YANG DITETAPKAN".
  const merah = rgb(0.85, 0.15, 0.15);
  page.drawRectangle({
    x: 450,
    y: 405,
    width: 100,
    height: 65,
    color: rgb(1, 1, 1),
    borderColor: merah,
    borderWidth: 2,
  });

  ['HADIR SESUAI', 'WAKTU YANG', 'DITETAPKAN'].forEach((teks, i) => {
    const lebar = helveticaBold.widthOfTextAtSize(teks, 11);
    page.drawText(teks, {
      x: 500 - lebar / 2,
      y: 447 - i * 13,
      size: 11,
      font: helveticaBold,
      color: merah,
    });
  });

  form.getFields().forEach((field) => {
    if (typeof (field as any).setText === 'function') {
      (field as any).setText((field as any).getText() || '');
    }
    field.acroField.getWidgets().forEach((widget) => {
      const mk = widget.dict.get(PDFName.of('MK'));
      if (mk && typeof (mk as any).delete === 'function') {
        (mk as any).delete(PDFName.of('BG'));
      }
    });
  });

  form.updateFieldAppearances(helveticaBold);
  form.flatten();

  return pdfDoc;
}

/** Picu unduhan berkas PDF di peramban. */
export function unduhPdf(bytes: Uint8Array, namaBerkas: string): string {
  const blob = new Blob([bytes as any], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const tautan = document.createElement('a');
  tautan.href = url;
  tautan.download = namaBerkas;
  document.body.appendChild(tautan);
  tautan.click();
  tautan.remove();
  URL.revokeObjectURL(url);

  return namaBerkas;
}

const namaAman = (teks: string) => teks.replace(/\s+/g, '_').replace(/[\\/:*?"<>|]/g, '');

/** Satu undangan, satu berkas. */
export async function unduhUndanganSatuan(
  pemilih: PemilihUndangan,
  denganTemplate: boolean,
): Promise<string> {
  const doc = await susunUndangan(pemilih, denganTemplate);
  const akhiran = denganTemplate ? '' : '_Hanya_Data';

  return unduhPdf(await doc.save(), `Undangan_${namaAman(pemilih.nama)}${akhiran}.pdf`);
}

/**
 * Sekumpulan undangan dalam satu berkas PDF, satu orang per halaman.
 *
 * Satu berkas per segmen, bukan 20–75 berkas terpisah: peramban menahan
 * unduhan bertubi-tubi sebagai unduhan otomatis yang mencurigakan, dan
 * mencetak 75 berkas satu per satu jauh lebih lama daripada mencetak satu
 * berkas 75 halaman.
 */
export async function unduhUndanganGabungan(
  daftar: PemilihUndangan[],
  denganTemplate: boolean,
  namaBerkas: string,
  onKemajuan?: (selesai: number, total: number) => void,
): Promise<string> {
  const gabungan = await PDFDocument.create();

  for (let i = 0; i < daftar.length; i += 1) {
    const doc = await susunUndangan(daftar[i], denganTemplate);
    const [halaman] = await gabungan.copyPages(doc, [0]);
    gabungan.addPage(halaman);
    onKemajuan?.(i + 1, daftar.length);
  }

  return unduhPdf(await gabungan.save(), namaBerkas);
}
