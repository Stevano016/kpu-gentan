import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiService, daftarkanPenanganSesiBerakhir } from '../services/api';
import { bacaJson } from '../utils/request';
import { PERAN_PANEL } from '../constants/app';
import type { InfoSesi } from '../components/PenjagaSesi';
import type { AlasanSesiBerakhir, HakAkses, PanelUser } from '../types/app';

interface Argumen {
  navigate: (to: string) => void;
  showConfirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    btnText?: string,
    danger?: boolean,
  ) => void;
}

export interface AuthController extends HakAkses {
  token: string | null;
  user: PanelUser | null;
  /**
   * Umur sesi ditentukan server dan dikirim saat masuk / lewat /api/me.
   * Sekretariat "Lihat Saja" dan KPPS mendapat `tanpa_batas: true`.
   */
  sesi: InfoSesi | null;

  // Formulir masuk
  username: string;
  setUsername: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  showPassword: boolean;
  setShowPassword: (val: boolean) => void;
  loginError: string;
  /** Detik tersisa sebelum tombol Masuk aktif lagi; 0 = tidak terkunci. */
  sisaKunci: number;

  handleLogin: (e: React.FormEvent) => Promise<void>;
  handleLogout: () => void;
  perpanjangSesi: () => Promise<void>;
  akhiriSesi: (alasan: AlasanSesiBerakhir) => void;
}

const PESAN_SESI: Record<AlasanSesiBerakhir, string> = {
  menganggur: 'Sesi ditutup otomatis karena panel dibiarkan menganggur. Silakan masuk lagi.',
  kedaluwarsa: 'Sesi Anda sudah mencapai batas waktu. Silakan masuk lagi.',
  ditolak: 'Sesi Anda berakhir. Silakan masuk lagi.',
};

/**
 * Sesi petugas: masuk, keluar, penguncian setelah salah sandi, dan hak akses
 * yang diturunkan dari perannya.
 */
export function useAuth({ navigate, showConfirm }: Argumen): AuthController {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [user, setUser] = useState<PanelUser | null>(null);
  const [sesi, setSesi] = useState<InfoSesi | null>(null);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  // Kapan penguncian login berakhir (epoch ms); null = tidak terkunci.
  const [kunciSampai, setKunciSampai] = useState<number | null>(null);
  const [sisaKunci, setSisaKunci] = useState(0);

  // Pantarlih hanya mendata pemilih susulan; seluruh menu dan aksi lain
  // disembunyikan supaya panelnya tidak membingungkan.
  const isPantarlih = user?.role === 'pantarlih';
  // Sekretariat viewer, monitor, kpps, dan pantarlih tidak memiliki hak admin.
  const isAdmin = user ? user.role === 'sekretariat' && user.sekretariat_role === 'admin' : false;

  // Dibaca lewat ref supaya `bersihkanSesi` dan turunannya berhenti berubah
  // identitas setiap kali rutenya berpindah — kalau tidak, efek pemuat profil
  // ikut jalan ulang pada setiap navigasi.
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  const bersihkanSesi = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setSesi(null);
    navigateRef.current('/login');
  }, []);

  /**
   * Sesi habis — entah karena menganggur, mencapai batas waktu, atau server
   * menolak tokennya (401 dari mana pun, ditangkap terpusat di `api.ts`).
   *
   * Pesannya ditulis di layar masuk, bukan lewat modal peringatan: modalnya
   * ikut hilang bersama panel saat rutenya berpindah ke /login, jadi petugas
   * tidak akan sempat membacanya.
   */
  const akhiriSesi = useCallback((alasan: AlasanSesiBerakhir) => {
    bersihkanSesi();
    setLoginError(PESAN_SESI[alasan]);
  }, [bersihkanSesi]);

  const muatProfil = useCallback(async () => {
    if (!token) return;
    try {
      const res = await ApiService.getProfile(token);
      const json = await bacaJson(res);
      if (!res.ok) {
        bersihkanSesi();
        return;
      }
      setUser(json.user);
      setSesi(json.sesi ?? null);
      if (!PERAN_PANEL.includes(json.user.role)) {
        bersihkanSesi();
        setLoginError('Akses Ditolak. Panel ini hanya untuk Sekretariat dan Pantarlih.');
      }
    } catch {
      bersihkanSesi();
    }
  }, [token, bersihkanSesi]);

  useEffect(() => { void muatProfil(); }, [muatProfil]);

  // 401 dari permintaan mana pun berarti tokennya sudah tidak berlaku lagi.
  useEffect(() => {
    daftarkanPenanganSesiBerakhir(() => {
      // Tanpa penjagaan ini, beberapa permintaan yang gagal bersamaan akan
      // memicu logout berkali-kali dan menimpa pesan yang sudah tampil.
      if (localStorage.getItem('token')) akhiriSesi('ditolak');
    });
    return () => daftarkanPenanganSesiBerakhir(null);
  }, [akhiriSesi]);

  // Hitung mundur penguncian login: tombol Masuk mati sampai waktunya habis,
  // supaya percobaan yang pasti ditolak tidak menambah hitungan lagi.
  useEffect(() => {
    if (!kunciSampai) { setSisaKunci(0); return; }

    const hitung = () => {
      const sisa = Math.ceil((kunciSampai - Date.now()) / 1000);
      if (sisa <= 0) {
        setKunciSampai(null);
        setSisaKunci(0);
        setLoginError('');
      } else {
        setSisaKunci(sisa);
      }
    };

    hitung();
    const denyut = window.setInterval(hitung, 1000);
    return () => window.clearInterval(denyut);
  }, [kunciSampai]);

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await ApiService.login(username, password);
      const json = await bacaJson(res);

      if (res.ok) {
        if (!PERAN_PANEL.includes(json.user.role)) {
          setLoginError('Akses Ditolak. Hanya Sekretariat dan Pantarlih yang bisa masuk ke panel ini.');
          return;
        }
        localStorage.setItem('token', json.token);
        setToken(json.token);
        setUser(json.user);
        setSesi(json.sesi ?? null);
        navigateRef.current(json.user.role === 'pantarlih' ? '/pemilih' : '/dashboard');
        return;
      }

      if (res.status === 429) {
        // Terkunci setelah terlalu banyak percobaan gagal. Sisa waktunya
        // ditampilkan supaya petugas yang salah ketik tahu harus menunggu
        // berapa lama, bukan menebak-nebak apakah sistemnya rusak.
        setLoginError(json.message || 'Terlalu banyak percobaan masuk. Coba lagi nanti.');
        setKunciSampai(Date.now() + (Number(json.retry_after) || 60) * 1000);
        return;
      }

      setLoginError(json.errors?.username?.[0] || json.message || 'Login gagal.');
    } catch {
      setLoginError('Gagal terhubung ke server.');
    }
  }, [username, password]);

  const handleLogout = useCallback(() => {
    showConfirm(
      'Keluar Panel Admin?',
      'Apakah Anda yakin ingin keluar dari panel admin Gentara?',
      async () => {
        try {
          if (token) await ApiService.logout(token);
        } catch { /* token tetap dibuang meski server tidak menjawab */ }
        bersihkanSesi();
      },
      'Keluar',
      true,
    );
  }, [showConfirm, token, bersihkanSesi]);

  /** Menyentuh endpoint ringan supaya server mencatat sesi ini masih dipakai. */
  const perpanjangSesi = useCallback(async () => {
    if (!token) return;
    try {
      const res = await ApiService.getProfile(token);
      if (res.ok) {
        const json = await bacaJson(res);
        setSesi(json.sesi ?? null);
      }
    } catch {
      /* gagal menyambung bukan alasan memutus sesi; denyut berikutnya mencoba lagi */
    }
  }, [token]);

  return {
    token, user, sesi, isPantarlih, isAdmin,
    username, setUsername,
    password, setPassword,
    showPassword, setShowPassword,
    loginError, sisaKunci,
    handleLogin, handleLogout, perpanjangSesi, akhiriSesi,
  };
}
