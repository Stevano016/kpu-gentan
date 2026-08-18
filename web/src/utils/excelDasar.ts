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
