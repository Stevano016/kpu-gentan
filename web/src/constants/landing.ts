/**
 * Data tetap milik halaman publik (cek daftar pemilih).
 *
 * Semuanya dulu ditulis inline di dalam JSX, sehingga mengubah satu nomor
 * WhatsApp berarti menyunting berkas komponen sepanjang 800 baris. Di sini
 * datanya berdiri sendiri dan bisa disunting tanpa menyentuh tampilan.
 */

/** Nomor TPS → tautan Google Maps lokasinya. TPS tanpa entri tidak diberi tautan. */
const TAUTAN_PETA_TPS: Record<number, string> = {
  1: 'https://maps.app.goo.gl/9YHcDxAozyhNCs4s7',
  2: 'https://maps.app.goo.gl/vi53HNZ2U6j567jy6',
  3: 'https://maps.app.goo.gl/P64tA2GycyTEkMBt7',
  4: 'https://maps.app.goo.gl/4yijrPFXTH9WsMuq7',
  5: 'https://maps.app.goo.gl/woGtfTiZyNAsfZgg8',
};

/**
 * Nama TPS dari server berbentuk bebas ("TPS 03", "TPS 3 Balai Desa"), jadi
 * nomornya diambil dari angka pertama yang ditemukan.
 */
export function tautanPetaTps(namaTps: string): string | null {
  const nomor = namaTps?.match(/\d+/)?.[0];
  if (!nomor) return null;
  return TAUTAN_PETA_TPS[Number(nomor)] ?? null;
}

const daftarNomor = (jumlah: number): string[] =>
  Array.from({ length: jumlah }, (_, i) => String(i + 1).padStart(3, '0'));

/** Pilihan RT dan RW pada pencarian berdasarkan nama; format tiga digit mengikuti data DPT. */
export const OPSI_RT = daftarNomor(10);
export const OPSI_RW = daftarNomor(14);

export interface Pantarlih {
  nama: string;
  wilayah: string;
  /** Nomor WhatsApp berformat internasional tanpa tanda plus. */
  wa: string;
}

/** Kontak pantarlih per RW, ditampilkan saat data pemilih tidak ditemukan. */
export const DAFTAR_PANTARLIH: Pantarlih[] = [
  { nama: 'DANANG SUPRIYDI', wilayah: 'RW. 001', wa: '628112631016' },
  { nama: 'DWI SETIAWAN', wilayah: 'RW. 002', wa: '6281382286151' },
  { nama: 'YOGI YUNIANTO', wilayah: 'RW. 003', wa: '62895327040201' },
  { nama: 'RAHAYU EMBONG W', wilayah: 'RW. 004', wa: '6288808310449' },
  { nama: 'AGUS SUTAMTOMO', wilayah: 'RW. 005', wa: '6289509789748' },
  { nama: 'MUHAMMAD KRISNA MUKTI', wilayah: 'RW. 006', wa: '6289690010502' },
  { nama: 'SUROSO', wilayah: 'RW. 007', wa: '6288802655697' },
  { nama: 'TRI HARYONO', wilayah: 'RW. 008', wa: '6285712750705' },
  { nama: 'KALIKTUS TUNA', wilayah: 'RW. 009', wa: '6281226282460' },
  { nama: 'EKA RAHMAWAN', wilayah: 'RW. 010', wa: '6285647020102' },
  { nama: 'TRI UTOMO', wilayah: 'RW. 011', wa: '6283179331297' },
  { nama: 'TEGUH SUPRIANTO', wilayah: 'RW. 012', wa: '6283179331297' },
  { nama: 'DIANA ASRININGRUM', wilayah: 'RW. 013', wa: '6281227916591' },
  { nama: 'SUNARYO', wilayah: 'RW. 014', wa: '628122585546' },
];

/** Tautan WhatsApp beserta pesan pembuka yang sudah terisi. */
export const tautanWaPantarlih = (p: Pantarlih): string => {
  const pesan = `Halo Pak/Bu ${p.nama}, saya warga Gentan ingin berkoordinasi mengenai pendaftaran/pemutakhiran data pemilih di ${p.wilayah}.`;
  return `https://wa.me/${p.wa}?text=${encodeURIComponent(pesan)}`;
};

/** Syarat pemilih bagi warga yang belum tercatat di DP4. */
export const SYARAT_PEMILIH: string[] = [
  'Penduduk Desa yang pada hari H pencoblosan ( 10 Des 2026 ) sudah berumur 17 tahun',
  'Tidak terganggu jiwanya',
  'tidak sedang dicabut hak pilihnya berdasarkan putusan pengadilan yang telah memperoleh kekuatan hukum tetap;',
  'berdomisili di desa sekurang-kurangnya 6 (enam) bulan sebelum disahkannya daftar pemilih sementara yang dibuktikan dengan Kartu Tanda Penduduk atau surat keterangan penduduk',
];
