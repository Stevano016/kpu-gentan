import { useCallback, useState } from 'react';
import { ApiService } from '../services/api';
import { bacaJson } from '../utils/request';

interface Argumen {
  token: string | null;
  showError: (message: string, title?: string) => void;
}

export interface QrController {
  /** QR yang sedang ditampilkan di modal penampil. */
  selectedVoterQr: string | null;
  selectedVoterName: string;
  isQrModalOpen: boolean;
  closeQrModal: () => void;
  fetchQrCode: (nik: string, name: string) => Promise<void>;
  /** QR yang ditempelkan di dalam modal sunting pemilih. */
  editingQrCode: string | null;
  fetchEditingQr: (nik: string) => Promise<void>;
}

/** Mengambil QR Code pemilih dari server, untuk penampil dan modal sunting. */
export function useQrCode({ token, showError }: Argumen): QrController {
  const [selectedVoterQr, setSelectedVoterQr] = useState<string | null>(null);
  const [selectedVoterName, setSelectedVoterName] = useState('');
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [editingQrCode, setEditingQrCode] = useState<string | null>(null);

  const fetchQrCode = useCallback(async (nik: string, name: string) => {
    if (!token) return;
    try {
      const res = await ApiService.getQrCode(token, nik);
      const json = await bacaJson(res);
      if (!res.ok) {
        showError('Gagal mengambil QR Code.', 'Gagal Memuat QR');
        return;
      }
      setSelectedVoterQr(json.qrcode);
      setSelectedVoterName(name);
      setIsQrModalOpen(true);
    } catch {
      showError('Gagal menghubungi server.', 'Gagal Memuat QR');
    }
  }, [token, showError]);

  // Gagal memuat dibiarkan senyap: modal suntingnya tetap terpakai tanpa QR.
  const fetchEditingQr = useCallback(async (nik: string) => {
    if (!token) return;
    setEditingQrCode(null);
    try {
      const res = await ApiService.getQrCode(token, nik);
      const json = await bacaJson(res);
      if (res.ok) setEditingQrCode(json.qrcode);
    } catch { /* diamkan */ }
  }, [token]);

  const closeQrModal = useCallback(() => {
    setIsQrModalOpen(false);
    setSelectedVoterQr(null);
  }, []);

  return {
    selectedVoterQr,
    selectedVoterName,
    isQrModalOpen,
    closeQrModal,
    fetchQrCode,
    editingQrCode,
    fetchEditingQr,
  };
}
