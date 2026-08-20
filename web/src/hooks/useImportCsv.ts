import { useCallback, useState } from 'react';
import { ApiService } from '../services/api';
import { jalankanAksi } from '../utils/request';
import type { ImportStatus } from '../types/app';

interface Argumen {
  token: string | null;
  /** Dipanggil setelah impor berhasil, supaya tabel pemilih menyusul. */
  onSelesai: () => void;
}

export interface ImportCsvController {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  file: File | null;
  setFile: (file: File | null) => void;
  status: ImportStatus | null;
  loading: boolean;
  handleImport: (e: React.FormEvent) => Promise<void>;
}

/**
 * Impor pemilih dari CSV.
 *
 * Hasilnya tetap ditampilkan di dalam modal, bukan lewat modal peringatan:
 * baris yang ditolak bisa berjumlah puluhan dan operator perlu membacanya
 * berdampingan dengan berkas yang baru saja dipilihnya.
 */
export function useImportCsv({ token, onSelesai }: Argumen): ImportCsvController {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<ImportStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);

  const close = useCallback(() => {
    setIsOpen(false);
    setStatus(null);
    setFile(null);
  }, []);

  const handleImport = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !token) return;

    setLoading(true);
    setStatus(null);

    const hasil = await jalankanAksi(() => ApiService.importCsv(token, file));
    if (!hasil) {
      setStatus({ errors: ['Gagal menghubungi server.'] });
    } else if (!hasil.ok) {
      setStatus({ errors: [hasil.json.message || 'Impor gagal.'] });
    } else {
      setStatus({
        success: hasil.json.message,
        errors: hasil.json.errors?.length ? hasil.json.errors : undefined,
      });
      setFile(null);
      onSelesai();
    }

    setLoading(false);
  }, [token, file, onSelesai]);

  return { isOpen, open, close, file, setFile, status, loading, handleImport };
}
