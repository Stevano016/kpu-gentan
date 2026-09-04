import type ExcelJS from 'exceljs';

/**
 * Bagian bersama penyusun berkas Excel: palet, bingkai, dan pengunduhan.
 *
 * Warnanya sengaja diambil dari tema aplikasi (--primary, --surface-alt,
 * --warning) supaya berkas cetak terlihat berasal dari sistem yang sama, dan
 * ditaruh di satu tempat supaya dua ekspor tidak pelan-pelan jadi berbeda rupa.
 */

export const GAYA = {
  hijauTua: 'FF146B52',
  hijauMuda: 'FFE7F2EE',
  abuSelang: 'FFF6F8F7',
  abuTeks: 'FF5A6B65',
  kuningTanda: 'FFFFF3CD',
  garis: 'FFCBD5D0',
} as const;

/**
 * Seberapa terbuka nomor identitas ditulis di berkas ekspor.
 *
 * Ekspor dipakai untuk dua hal yang tuntutannya berlawanan: kerja coklit butuh
 * nomor utuh, sedangkan berkas yang dibagikan ke luar sekretariat tidak boleh
 * membawanya. Dulu pilihannya hanya "ada" atau "tidak ada kolomnya" — dan
 * yang kedua membuat berkas tidak bisa dicocokkan sama sekali. `sensor`
 * menyisakan 8 digit terakhir: cukup untuk mencocokkan baris dengan data
 * sumber, tidak cukup untuk menyusun ulang NIK seseorang.
 */
export type ModeNomor = 'penuh' | 'sensor' | 'sembunyi';

/** Berapa digit terakhir yang tetap terlihat pada mode `sensor`. */
export const DIGIT_TERLIHAT = 8;

/**
 * `3311091204010001` → `********04010001`.
 *
 * Bintangnya sebanyak digit yang disembunyikan, bukan jumlah tetap, supaya
 * panjang aslinya tetap terbaca dan kolomnya tetap rata di Excel.
 */
export function sensorNomor(nilai?: string | null): string {
  const teks = String(nilai ?? '');
  if (!teks) return '';
  if (teks.length <= DIGIT_TERLIHAT) return teks;

  return '*'.repeat(teks.length - DIGIT_TERLIHAT) + teks.slice(-DIGIT_TERLIHAT);
}

/** Nomor identitas sesuai mode; `sembunyi` tidak pernah sampai ke sini. */
export function nomorSesuaiMode(nilai: string | null | undefined, mode: ModeNomor): string {
  if (mode === 'sensor') return sensorNomor(nilai);
  return String(nilai ?? '');
}

const tipis = (warna: string) => ({ style: 'thin' as const, color: { argb: warna } });

export const bingkai = (warna: string = GAYA.garis) => ({
  top: tipis(warna),
  left: tipis(warna),
  bottom: tipis(warna),
  right: tipis(warna),
});

/**
 * ExcelJS diambil hanya saat seseorang benar-benar mengekspor.
 *
 * Pustakanya ~900 kB — kalau ikut dalam bundel utama, setiap petugas yang
 * membuka dashboard dari ponsel di lapangan membayarnya, padahal ekspor
 * dipakai sesekali. Dinamis begini ia baru diunduh saat tombolnya ditekan.
 */
export async function muatExcelJS() {
  const modul = await import('exceljs');
  return (modul as unknown as { default?: typeof import('exceljs') }).default ?? modul;
}

/** Tulis workbook ke berkas dan langsung picu unduhan. Mengembalikan namanya. */
export async function unduhWorkbook(wb: ExcelJS.Workbook, namaBerkas: string): Promise<string> {
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = namaBerkas;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);

  return namaBerkas;
}
