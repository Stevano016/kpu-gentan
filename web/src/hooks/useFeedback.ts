import { useCallback, useMemo, useRef, useState } from 'react';
import type { AlertVariant } from '../components/CustomAlertModal';
import type { Feedback } from '../types/app';

interface KondisiAlert {
  open: boolean;
  variant: AlertVariant;
  title: string;
  message: string;
}

interface KondisiConfirm {
  open: boolean;
  title: string;
  message: string;
  btnText: string;
  danger: boolean;
}

interface KondisiPrompt {
  open: boolean;
  title: string;
  message: string;
  saran: string[];
  pilihan?: string[];
}

export interface FeedbackController extends Feedback {
  alert: KondisiAlert;
  confirm: KondisiConfirm;
  prompt: KondisiPrompt;
  closeAlert: () => void;
  closeConfirm: () => void;
  closePrompt: () => void;
  /** Menutup modal lalu menjalankan aksi yang tadi dikonfirmasi. */
  submitConfirm: () => void;
  submitPrompt: (alasan: string) => void;
}

const ALERT_TERTUTUP: KondisiAlert = { open: false, variant: 'success', title: '', message: '' };
const CONFIRM_TERTUTUP: KondisiConfirm = {
  open: false, title: '', message: '', btnText: 'Ya', danger: false,
};
const PROMPT_TERTUTUP: KondisiPrompt = {
  open: false, title: '', message: '', saran: [], pilihan: undefined,
};

/**
 * Pengganti `window.alert`, `window.confirm`, dan `window.prompt`.
 *
 * Ketiganya memblokir tab dan tidak bisa digaya, jadi panel memakai modal
 * sendiri. Hook ini menyimpan kondisinya sekaligus menyediakan pemanggilnya,
 * supaya hook domain lain (pemilih, TPS, akun) cukup menerima satu objek
 * `Feedback` dan tidak perlu tahu modal mana yang dipakai.
 */
export function useFeedback(): FeedbackController {
  const [alert, setAlert] = useState<KondisiAlert>(ALERT_TERTUTUP);
  const [confirm, setConfirm] = useState<KondisiConfirm>(CONFIRM_TERTUTUP);
  const [prompt, setPrompt] = useState<KondisiPrompt>(PROMPT_TERTUTUP);

  // Aksinya disimpan di ref, bukan di state: sebuah fungsi di dalam state harus
  // dibungkus lagi agar tidak dianggap penyetel fungsional, dan memanggilnya
  // dari dalam updater akan menjalankannya dua kali di mode ketat React.
  const aksiConfirm = useRef<(() => void) | null>(null);
  const aksiPrompt = useRef<((alasan: string) => void) | null>(null);

  const showAlert = useCallback((variant: AlertVariant, title: string, message: string) => {
    setAlert({ open: true, variant, title, message });
  }, []);

  const showSuccess = useCallback(
    (title: string, message: string) => showAlert('success', title, message),
    [showAlert],
  );

  const showError = useCallback(
    (message: string, title = 'Gagal Menyimpan') => showAlert('error', title, message),
    [showAlert],
  );

  const showConfirm = useCallback(
    (title: string, message: string, onConfirm: () => void, btnText = 'Ya', danger = false) => {
      aksiConfirm.current = onConfirm;
      setConfirm({ open: true, title, message, btnText, danger });
    },
    [],
  );

  const mintaAlasan = useCallback(
    (
      title: string,
      message: string,
      saran: string[],
      onSubmit: (alasan: string) => void,
      pilihan?: string[],
    ) => {
      aksiPrompt.current = onSubmit;
      setPrompt({ open: true, title, message, saran, pilihan });
    },
    [],
  );

  const closeAlert = useCallback(() => setAlert((s) => ({ ...s, open: false })), []);
  const closeConfirm = useCallback(() => setConfirm((s) => ({ ...s, open: false })), []);
  const closePrompt = useCallback(() => setPrompt((s) => ({ ...s, open: false })), []);

  const submitConfirm = useCallback(() => {
    closeConfirm();
    aksiConfirm.current?.();
  }, [closeConfirm]);

  const submitPrompt = useCallback((alasan: string) => {
    closePrompt();
    aksiPrompt.current?.(alasan);
  }, [closePrompt]);

  return useMemo(
    () => ({
      alert, confirm, prompt,
      showAlert, showSuccess, showError, showConfirm, mintaAlasan,
      closeAlert, closeConfirm, closePrompt, submitConfirm, submitPrompt,
    }),
    [
      alert, confirm, prompt,
      showAlert, showSuccess, showError, showConfirm, mintaAlasan,
      closeAlert, closeConfirm, closePrompt, submitConfirm, submitPrompt,
    ],
  );
}
