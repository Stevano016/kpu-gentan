import { useCallback } from 'react';
import { ApiService } from '../services/api';
import { bacaJson } from '../utils/request';
import { unduhExcelPemilih } from '../utils/excelPemilih';
import type { Feedback } from '../types/app';

interface Argumen {
  token: string | null;
  feedback: Feedback;
}

/**
 * Ekspor pemilih menghasilkan .xlsx sungguhan, bukan CSV.
 *
 * CSV tidak menyimpan tipe kolom, jadi Excel menebak sendiri — dan untuk NIK
 * 16 digit tebakannya selalu "angka": kolomnya tampil `3,31E+15` dan digit
 * terakhirnya benar-benar hilang. Server mengirim datanya sebagai JSON dan
 * berkasnya disusun di sini, tempat tipe tiap kolom bisa ditetapkan.
 */
export function useEksporPemilih({ token, feedback }: Argumen) {
  const { showSuccess, showError } = feedback;

  return useCallback(async (params: Record<string, string>, denganNikNkk: boolean = true) => {
    if (!token) return;
    try {
      const res = await ApiService.exportPemilih(token, { ...params, format: 'json' });
      const json = await bacaJson(res);

      if (!res.ok || json?.status !== 'success') {
        showError(json.message || 'Ekspor ditolak server.', 'Gagal Mengekspor');
        return;
      }

      if (!json.data.jumlah) {
        showError('Tidak ada pemilih pada pilihan ini.', 'Tidak Ada Data');
        return;
      }

      const namaBerkas = await unduhExcelPemilih(json.data, denganNikNkk);
      showSuccess(
        'Ekspor Selesai',
        `Berkas ${namaBerkas} sudah diunduh — ${json.data.jumlah.toLocaleString('id-ID')} pemilih, NIK dan No. KK ${denganNikNkk ? 'tersimpan sebagai teks' : 'dihilangkan'}.`,
      );
    } catch {
      showError('Gagal menyusun berkas Excel.', 'Gagal Mengekspor');
    }
  }, [token, showSuccess, showError]);
}
