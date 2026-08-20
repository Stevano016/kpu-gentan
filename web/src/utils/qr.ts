/**
 * Mengunduh QR Code pemilih yang datang dari server sebagai data URL.
 *
 * Ekstensinya diambil dari tipe MIME di dalam data URL-nya, bukan diasumsikan
 * .png: server bisa mengirim SVG atau JPEG, dan berkas dengan ekstensi salah
 * gagal dibuka di sebagian pengelola berkas Windows.
 */
export const downloadQrCode = (base64Data: string, name: string) => {
  const link = document.createElement('a');
  link.href = base64Data;
  link.download = `QR-${name.replace(/\s+/g, '_')}.${ekstensiDariDataUrl(base64Data)}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const ekstensiDariDataUrl = (dataUrl: string): string => {
  const subtipe = dataUrl.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,/)?.[1];
  if (!subtipe) return 'png';
  if (subtipe.includes('svg')) return 'svg';
  if (subtipe.includes('jpeg') || subtipe.includes('jpg')) return 'jpg';
  return 'png';
};
