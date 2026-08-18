import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom';
import { ApiService } from './services/api';

// Shared Layouts & Modals
import { LoginScreen } from './components/LoginScreen';
import { Sidebar } from './components/Sidebar';
import { Icons } from './components/Icons';
import { KETERANGAN_TMS } from './utils/tahapan';
import { TpsModal } from './components/modals/TpsModal';
import { DptModal } from './components/modals/DptModal';
import { ImportCsvModal } from './components/modals/ImportCsvModal';
import { KppsModal } from './components/modals/KppsModal';
import { ResetPasswordModal } from './components/modals/ResetPasswordModal';
import { QrViewerModal } from './components/modals/QrViewerModal';
import { VoterSuccessModal } from './components/modals/VoterSuccessModal';
import { CustomConfirmModal } from './components/CustomConfirmModal';
import { CustomPromptModal } from './components/CustomPromptModal';
import { CustomAlertModal, type AlertVariant } from './components/CustomAlertModal';
import { PaslonModal } from './components/modals/PaslonModal';

// Screen Tabs
import DashboardTab from './components/tabs/DashboardTab';
import TpsTab from './components/tabs/TpsTab';
import TpsDetailTab from './components/tabs/TpsDetailTab';
import PemilihTab from './components/tabs/PemilihTab';
import KppsTab from './components/tabs/KppsTab';
import { PaslonTab } from './components/tabs/PaslonTab';
import { QuickCountTab } from './components/tabs/QuickCountTab';
import KeluargaTab from './components/tabs/KeluargaTab';
import { unduhExcelPemilih } from './utils/excelPemilih';

// Live updates reach the origin directly on a forwarded port: the proxy chain in
// front of it drops the headers a WebSocket handshake needs, so the usual
// same-origin path cannot carry one. Set per environment via
// VITE_LIVE_SOCKET_URL — leaving it empty disables the socket and leaves the
// dashboard on polling, which is what a deployment without its own socket
// server needs. It must never be pointed at another environment's server, or
// that environment's activity would drive this one's dashboard.
const LIVE_SOCKET_URL = import.meta.env.VITE_LIVE_SOCKET_URL ?? '';

// Used only while the socket is down, so the dashboard keeps moving instead of
// going stale unnoticed.
const LIVE_POLL_INTERVAL_MS = 10000;

/** Peran yang boleh masuk ke panel web sama sekali. */
const PERAN_PANEL = ['sekretariat', 'pantarlih'];
const LIVE_SOCKET_RETRY_MS = 15000;

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

function TpsDetailRoute({ 
  fetchTpsDetail, 
  tpsDetailData, 
  navigate 
}: { 
  fetchTpsDetail: (id: number) => void; 
  tpsDetailData: any; 
  navigate: any;
}) {
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    if (id) {
      fetchTpsDetail(parseInt(id, 10));
    }
  }, [id]);

  if (!tpsDetailData) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
        Memuat detail TPS...
      </div>
    );
  }

  return (
    <TpsDetailTab
      tpsDetailData={tpsDetailData}
      setPage={() => navigate('/tps')}
    />
  );
}

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<any>(null);
  
  // Auth Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Dashboard Data
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  // TPS Data
  const [tpsList, setTpsList] = useState<any[]>([]);
  const [tpsDetailData, setTpsDetailData] = useState<any>(null);
  
  // TPS Form
  const [tpsName, setTpsName] = useState('');
  const [tpsRegion, setTpsRegion] = useState('');
  const [isTpsModalOpen, setIsTpsModalOpen] = useState(false);

  // DPT Data
  const [dptData, setDptData] = useState<any>(null);
  const [dptSearch, setDptSearch] = useState('');
  const [dptTpsFilter, setDptTpsFilter] = useState('');
  const [dptJenisFilter, setDptJenisFilter] = useState(''); // '' = semua, 'dpt', 'dpk'
  const [dptPage, setDptPage] = useState(1);
  const [dptLoading, setDptLoading] = useState(false);
  
  // DPT Form Modal
  const [isDptModalOpen, setIsDptModalOpen] = useState(false);
  const [editingDpt, setEditingDpt] = useState<any>(null);
  const [dptFormNik, setDptFormNik] = useState('');
  const [dptFormNkk, setDptFormNkk] = useState('');
  const [dptFormNama, setDptFormNama] = useState('');
  const [dptFormTps, setDptFormTps] = useState('');
  const [dptFormJenis, setDptFormJenis] = useState('dpt');
  const [dptFormUmur, setDptFormUmur] = useState('');
  const [dptFormStatusKawin, setDptFormStatusKawin] = useState('');
  const [dptFormJenisKelamin, setDptFormJenisKelamin] = useState('');
  const [dptFormAlamat, setDptFormAlamat] = useState('');
  const [dptFormRt, setDptFormRt] = useState('');
  const [dptFormRw, setDptFormRw] = useState('');
  const [dptFormPekerjaan, setDptFormPekerjaan] = useState('');
  const [dptFormDisabilitas, setDptFormDisabilitas] = useState('');
  const [dptFormKeterangan, setDptFormKeterangan] = useState('');
  
  // Edit QR and add success states
  const [editingQrCode, setEditingQrCode] = useState<string | null>(null);
  const [newVoterSuccess, setNewVoterSuccess] = useState<any>(null);
  
  // DPT CSV Import Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importStatus, setImportStatus] = useState<{ success?: string; errors?: string[] } | null>(null);
  const [importLoading, setImportLoading] = useState(false);

  // KPPS Accounts Data
  const [kppsUsers, setKppsUsers] = useState<any>(null);
  const [kppsPage, setKppsPage] = useState(1);
  const [kppsLoading, setKppsLoading] = useState(false);

  // TPS Pagination Data
  const [tpsPage, setTpsPage] = useState(1);
  const [tpsPageData, setTpsPageData] = useState<any>(null);
  const [tpsPageLoading, setTpsPageLoading] = useState(false);
  
  // KPPS Form
  const [isKppsModalOpen, setIsKppsModalOpen] = useState(false);
  const [kppsFormUsername, setKppsFormUsername] = useState('');
  const [kppsFormPassword, setKppsFormPassword] = useState('');
  const [kppsFormTps, setKppsFormTps] = useState('');
  const [kppsFormRole, setKppsFormRole] = useState('full'); // full | validasi
  const [kppsFormAccountType, setKppsFormAccountType] = useState('kpps'); // kpps | sekretariat
  const [kppsFormSekretariatRole, setKppsFormSekretariatRole] = useState('admin');

  // Password reset state
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetUser, setResetUser] = useState<any>(null);
  const [resetPasswordVal, setResetPasswordVal] = useState('');

  // Custom Confirm Modal State
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmModalTitle, setConfirmModalTitle] = useState('');
  const [confirmModalMessage, setConfirmModalMessage] = useState('');
  const [confirmModalCallback, setConfirmModalCallback] = useState<(() => void) | null>(null);
  const [confirmModalBtnText, setConfirmModalBtnText] = useState('Ya');
  const [confirmModalDanger, setConfirmModalDanger] = useState(false);

  // Layout: sidebar ciut (rail ikon) + mode layar penuh
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(
    () => localStorage.getItem('sidebarCollapsed') === '1'
  );
  const [isFullscreen, setIsFullscreen] = useState(false);

  // On narrow screens the sidebar is an off-canvas drawer rather than a column,
  // so the content starts at the top of the screen instead of below the menu.
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Modal alasan untuk keputusan TMS / DPK
  const [promptOpen, setPromptOpen] = useState(false);
  const [promptTitle, setPromptTitle] = useState('');
  const [promptMessage, setPromptMessage] = useState('');
  const [promptSaran, setPromptSaran] = useState<string[]>([]);
  const [promptPilihan, setPromptPilihan] = useState<string[] | undefined>(undefined);
  const [promptCallback, setPromptCallback] = useState<((v: string) => void) | null>(null);

  // Custom Alert Modal State (pengganti window.alert)
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [alertModalVariant, setAlertModalVariant] = useState<AlertVariant>('success');
  const [alertModalTitle, setAlertModalTitle] = useState('');
  const [alertModalMessage, setAlertModalMessage] = useState('');

  // QR Code viewer states
  const [selectedVoterQr, setSelectedVoterQr] = useState<string | null>(null);
  const [selectedVoterName, setSelectedVoterName] = useState<string>('');
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Paslon states
  const [paslons, setPaslons] = useState<any[]>([]);
  const [paslonLoading, setPaslonLoading] = useState(false);
  const [isPaslonModalOpen, setIsPaslonModalOpen] = useState(false);
  const [isPaslonEditing, setIsPaslonEditing] = useState(false);
  const [editingPaslon, setEditingPaslon] = useState<any>(null);
  const [paslonNomorUrut, setPaslonNomorUrut] = useState('');
  const [paslonNamaKetua, setPaslonNamaKetua] = useState('');
  const [paslonFoto, setPaslonFoto] = useState<File | null>(null);

  // Pantarlih hanya mendata pemilih susulan; seluruh menu dan aksi lain
  // disembunyikan supaya panelnya tidak membingungkan.
  const isPantarlih = user?.role === 'pantarlih';

  // Sekretariat viewer hanya boleh melihat: seluruh aksi tulis disembunyikan
  const isAdmin = user ? !isPantarlih && user.sekretariat_role !== 'viewer' : false;

  const showConfirm = (title: string, message: string, onConfirm: () => void, btnText = 'Ya', danger = false) => {
    setConfirmModalTitle(title);
    setConfirmModalMessage(message);
    setConfirmModalCallback(() => onConfirm);
    setConfirmModalBtnText(btnText);
    setConfirmModalDanger(danger);
    setConfirmModalOpen(true);
  };

  const showAlert = (variant: AlertVariant, title: string, message: string) => {
    setAlertModalVariant(variant);
    setAlertModalTitle(title);
    setAlertModalMessage(message);
    setAlertModalOpen(true);
  };

  const closeMobileNav = () => setIsMobileNavOpen(false);

  // The drawer covers the page, so leaving it open across a navigation would
  // hide whatever the operator just asked for.
  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [path]);

  useEffect(() => {
    if (!isMobileNavOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsMobileNavOpen(false); };
    document.addEventListener('keydown', onKey);
    // Stop the page behind the drawer from scrolling under it.
    document.body.classList.add('nav-open');
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('nav-open');
    };
  }, [isMobileNavOpen]);

  const toggleSidebarCollapsed = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sidebarCollapsed', next ? '1' : '0');
      return next;
    });
  };

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      showError('Browser menolak mode layar penuh. Gunakan tombol F11 sebagai gantinya.', 'Layar Penuh Gagal');
    }
  };

  // Sinkronkan state saat pengguna keluar fullscreen lewat F11 / Escape
  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const showSuccess = (title: string, message: string) => showAlert('success', title, message);
  const showError = (message: string, title = 'Gagal Menyimpan') => showAlert('error', title, message);

  // Fetch logged in profile
  useEffect(() => {
    if (token) {
      fetchProfile();
    }
  }, [token]);

  // Load section-specific data based on URL path
  useEffect(() => {
    if (!token) return;
    // Pantarlih hanya punya satu halaman; endpoint lain akan menolaknya.
    if (isPantarlih) {
      if (path === '/pemilih') {
        fetchDpts();
        fetchTpsList();
      } else if (path === '/keluarga') {
        fetchTpsList();
      }
      return;
    }
    if (path === '/' || path === '/dashboard' || path === '/quick-count') {
      fetchDashboard();
    } else if (path === '/tps') {
      fetchTpsPageData();
    } else if (path === '/pemilih') {
      fetchDpts();
      fetchTpsList();
    } else if (path === '/keluarga') {
      // Halaman keluarga menarik datanya sendiri; daftar TPS-nya dipakai untuk
      // penyaring dan penamaan.
      fetchTpsList();
    } else if (path === '/kpps') {
      fetchKppsUsers();
      fetchTpsList();
    } else if (path === '/paslon') {
      fetchPaslons();
    }
  }, [path, token, dptSearch, dptTpsFilter, dptJenisFilter, dptPage, tpsPage, kppsPage]);

  // Live updates for the dashboard.
  //
  // The socket server is reached directly on a forwarded port, because the proxy
  // chain in front of the origin drops the Connection/Upgrade headers a handshake
  // needs. If the socket cannot be established we fall back to polling, so the
  // numbers never silently stop moving during counting.
  //
  // Only the dashboard updates on its own. Reloading a list while someone is
  // working through it loses their place, so the other screens stay put.
  useEffect(() => {
    if (!token || isPantarlih) return;
    const isDashboard = path === '/' || path === '/dashboard' || path === '/quick-count';
    if (!isDashboard) return;

    const host = window.location.hostname || 'localhost';
    const isLocalHost = host === 'localhost' || host === '127.0.0.1';
    const socketUrl = isLocalHost ? `ws://${host}:8080` : LIVE_SOCKET_URL;

    let socket: WebSocket | null = null;
    let pollId: number | undefined;
    let retryId: number | undefined;
    let disposed = false;

    const refresh = () => {
      // Skip while the tab is in the background — nobody is reading it.
      if (!document.hidden) fetchDashboard(true);
    };

    const startPolling = () => {
      if (pollId !== undefined) return;
      pollId = window.setInterval(refresh, LIVE_POLL_INTERVAL_MS);
    };

    const stopPolling = () => {
      if (pollId === undefined) return;
      window.clearInterval(pollId);
      pollId = undefined;
    };

    const connect = () => {
      if (disposed) return;
      // No socket configured for this deployment — polling is the whole story.
      if (!socketUrl) {
        startPolling();
        return;
      }
      socket = new WebSocket(socketUrl);

      socket.onopen = () => {
        // Push is live, so the fallback is no longer needed.
        stopPolling();
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (
            payload.event === 'checkin' ||
            payload.event === 'quick-count' ||
            payload.event === 'update' ||
            payload.event === 'paslon_updated'
          ) {
            refresh();
          }
        } catch {
          // A malformed frame is not worth interrupting the operator over.
        }
      };

      socket.onclose = () => {
        socket = null;
        if (disposed) return;
        startPolling();
        retryId = window.setTimeout(connect, LIVE_SOCKET_RETRY_MS);
      };
    };

    connect();

    // Catch up immediately when the operator comes back to the tab.
    const onVisible = () => { if (!document.hidden) fetchDashboard(true); };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      disposed = true;
      document.removeEventListener('visibilitychange', onVisible);
      stopPolling();
      if (retryId !== undefined) window.clearTimeout(retryId);
      if (socket) socket.close();
    };
  }, [path, token]);

  const fetchProfile = async () => {
    try {
      const res = await ApiService.getProfile(token!);
      const json = await res.json();
      if (res.ok) {
        setUser(json.user);
        if (!PERAN_PANEL.includes(json.user.role)) {
          setLoginError('Akses Ditolak. Panel ini hanya untuk Sekretariat dan Pantarlih.');
          handleLogoutDirect();
        }
      } else {
        handleLogoutDirect();
      }
    } catch {
      handleLogoutDirect();
    }
  };

  const handleLogoutDirect = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    navigate('/login');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await ApiService.login(username, password);
      const json = await res.json();
      if (res.ok) {
        if (!PERAN_PANEL.includes(json.user.role)) {
          setLoginError('Akses Ditolak. Hanya Sekretariat dan Pantarlih yang bisa masuk ke panel ini.');
          return;
        }
        localStorage.setItem('token', json.token);
        setToken(json.token);
        setUser(json.user);
        navigate('/dashboard');
      } else {
        setLoginError(json.errors?.username?.[0] || json.message || 'Login gagal.');
      }
    } catch (err) {
      setLoginError('Gagal terhubung ke server.');
    }
  };

  const handleLogout = async () => {
    showConfirm(
      'Keluar Panel Admin?',
      'Apakah Anda yakin ingin keluar dari panel admin Gentara?',
      async () => {
        try {
          if (token) await ApiService.logout(token);
        } catch {}
        handleLogoutDirect();
      },
      'Keluar',
      true
    );
  };

  // `silent` keeps the loading indicator off for background refreshes, so the
  // auto-refresh swaps the numbers in place instead of flashing "Memuat data..."
  // and shifting the layout every few seconds.
  const fetchDashboard = async (silent = false) => {
    if (!token) return;
    if (!silent) setDashboardLoading(true);
    try {
      const res = await ApiService.getDashboardSummary(token);
      const json = await res.json();
      if (res.ok) {
        setDashboardData(json.data);
      }
    } catch {}
    if (!silent) setDashboardLoading(false);
  };

  const fetchTpsList = async () => {
    if (!token) return;
    try {
      const res = await ApiService.getTpsList(token);
      const json = await res.json();
      if (res.ok) {
        setTpsList(json.data);
      }
    } catch {}
  };

  const fetchTpsPageData = async () => {
    if (!token) return;
    setTpsPageLoading(true);
    try {
      const res = await ApiService.getTpsPage(token, tpsPage);
      const json = await res.json();
      if (res.ok) {
        setTpsPageData(json.data);
      }
    } catch {}
    setTpsPageLoading(false);
  };

  const fetchPaslons = async () => {
    if (!token) return;
    setPaslonLoading(true);
    try {
      const res = await ApiService.getPaslons(token);
      const json = await res.json();
      if (res.ok) {
        setPaslons(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPaslonLoading(false);
    }
  };

  const handleSavePaslon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    const form = new FormData();
    form.append('nomor_urut', String(parseInt(paslonNomorUrut, 10)));
    form.append('nama_ketua', paslonNamaKetua);
    // Hanya dikirim bila operator benar-benar memilih berkas; tanpa ini,
    // menyunting nama saja akan menghapus foto yang sudah ada.
    if (paslonFoto) form.append('foto', paslonFoto);

    try {
      const res = isPaslonEditing && editingPaslon
        ? await ApiService.updatePaslon(token, editingPaslon.id, form)
        : await ApiService.createPaslon(token, form);
      
      const json = await res.json();
      if (res.ok) {
        const wasEditing = isPaslonEditing;
        setIsPaslonModalOpen(false);
        fetchPaslons();
        showSuccess(
          wasEditing ? 'Paslon Diperbarui' : 'Paslon Ditambahkan',
          `Calon nomor urut ${paslonNomorUrut} (${paslonNamaKetua}) berhasil disimpan.`
        );
      } else {
        showError(json.message || 'Gagal menyimpan pasangan calon.');
      }
    } catch {
      showError('Gagal menghubungi server.');
    }
  };

  const handleDeletePaslon = async (id: number) => {
    showConfirm(
      'Hapus Pasangan Calon',
      'Apakah Anda yakin ingin menghapus pasangan calon ini?',
      async () => {
        if (!token) return;
        try {
          const res = await ApiService.deletePaslon(token, id);
          if (res.ok) {
            fetchPaslons();
          } else {
            const json = await res.json();
            showError(json.message || 'Gagal menghapus pasangan calon.', 'Gagal Menghapus');
          }
        } catch {
          showError('Gagal menghubungi server.', 'Gagal Menghapus');
        }
      },
      'Hapus',
      true
    );
  };

  const fetchTpsDetail = async (id: number) => {
    if (!token) return;
    try {
      const res = await ApiService.getTpsDetail(token, id);
      const json = await res.json();
      if (res.ok) {
        setTpsDetailData(json.data);
      }
    } catch {}
  };

  const fetchDpts = async () => {
    if (!token) return;
    setDptLoading(true);
    try {
      const res = await ApiService.getDpts(token, dptPage, dptSearch, dptTpsFilter, dptJenisFilter);
      const json = await res.json();
      if (res.ok) {
        setDptData(json.data);
      }
    } catch {}
    setDptLoading(false);
  };

  const fetchQrCode = async (nik: string, name: string) => {
    if (!token) return;
    try {
      const res = await ApiService.getQrCode(token, nik);
      const json = await res.json();
      if (res.ok) {
        setSelectedVoterQr(json.qrcode);
        setSelectedVoterName(name);
        setIsQrModalOpen(true);
      } else {
        showError('Gagal mengambil QR Code.', 'Gagal Memuat QR');
      }
    } catch {
      showError('Gagal menghubungi server.', 'Gagal Memuat QR');
    }
  };

  const downloadQrCode = (base64Data: string, name: string) => {
    let extension = 'png';
    const match = base64Data.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,/);
    if (match && match[1]) {
      const mimeSubtype = match[1];
      if (mimeSubtype.includes('svg')) {
        extension = 'svg';
      } else if (mimeSubtype.includes('jpeg') || mimeSubtype.includes('jpg')) {
        extension = 'jpg';
      } else if (mimeSubtype.includes('png')) {
        extension = 'png';
      }
    }

    const link = document.createElement('a');
    link.href = base64Data;
    link.download = `QR-${name.replace(/\s+/g, '_')}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fetchEditingQr = async (nik: string) => {
    if (!token) return;
    setEditingQrCode(null);
    try {
      const res = await ApiService.getQrCode(token, nik);
      const json = await res.json();
      if (res.ok) {
        setEditingQrCode(json.qrcode);
      }
    } catch {}
  };

  const fetchKppsUsers = async () => {
    if (!token) return;
    setKppsLoading(true);
    try {
      const res = await ApiService.getKppsUsers(token, kppsPage);
      const json = await res.json();
      if (res.ok) {
        setKppsUsers(json.data);
      }
    } catch {}
    setKppsLoading(false);
  };

  const handleCreateTps = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      const res = await ApiService.createTps(token, tpsName, tpsRegion);
      if (res.ok) {
        const savedName = tpsName;
        setIsTpsModalOpen(false);
        setTpsName('');
        setTpsRegion('');
        fetchTpsPageData();
        showSuccess('TPS Ditambahkan', `${savedName} berhasil disimpan ke daftar TPS.`);
      } else {
        const json = await res.json();
        showError(json.errors?.nama?.[0] || json.message || 'Gagal membuat TPS.');
      }
    } catch {
      showError('Gagal menghubungi server.');
    }
  };

  const handleSaveDpt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    const payload: any = {
      nama: dptFormNama,
      nkk: dptFormNkk || null,
      tps_id: dptFormTps,
      jenis_pemilih: dptFormJenis,
      umur: dptFormUmur ? parseInt(dptFormUmur) : null,
      status_kawin: dptFormStatusKawin || null,
      jenis_kelamin: dptFormJenisKelamin || null,
      alamat: dptFormAlamat || null,
      rt: dptFormRt || null,
      rw: dptFormRw || null,
      pekerjaan: dptFormPekerjaan || null,
      disabilitas: dptFormDisabilitas || null,
      keterangan: dptFormKeterangan || null,
    };

    // Saat menambah, NIK selalu ikut. Saat mengedit ia hanya boleh ikut kalau
    // nomornya masih sementara — server juga menolak perubahan NIK asli, ini
    // sekadar tidak mengirim yang percuma.
    if (!editingDpt || editingDpt.nik_sintetis) {
      payload.nik = dptFormNik;
    }

    try {
      const res = await ApiService.saveDpt(token, payload, editingDpt?.nik);
      if (res.ok) {
        setIsDptModalOpen(false);
        const json = await res.json();
        const savedNik = dptFormNik;
        const savedNama = dptFormNama;
        const savedIdPemilih = json.data?.id_pemilih || '';
        const isEditing = editingDpt !== null;

        setEditingDpt(null);
        setDptFormNik('');
        setDptFormNkk('');
        setDptFormNama('');
        setDptFormTps('');
        setDptFormJenis('dpt');
        setDptFormUmur('');
        setDptFormStatusKawin('');
        setDptFormJenisKelamin('');
        setDptFormAlamat('');
        setDptFormRt('');
        setDptFormRw('');
        setDptFormPekerjaan('');
        setDptFormDisabilitas('');
        setDptFormKeterangan('');
        fetchDpts();

        if (isEditing) {
          showSuccess('Data Pemilih Diperbarui', `Perubahan data ${savedNama} berhasil disimpan.`);
        } else {
          // Pemilih baru: kartu QR sekaligus menjadi konfirmasi keberhasilan.
          let qrShown = false;
          try {
            const qrRes = await ApiService.getQrCode(token, savedNik);
            const qrJson = await qrRes.json();
            if (qrRes.ok) {
              setNewVoterSuccess({
                nik: savedNik,
                nama: savedNama,
                id_pemilih: savedIdPemilih,
                qrcode: qrJson.qrcode
              });
              qrShown = true;
            }
          } catch {}

          if (!qrShown) {
            showSuccess(
              'Pemilih Ditambahkan',
              `${savedNama} berhasil didaftarkan. QR Code belum dapat dimuat — buka kembali lewat tombol QR pada tabel.`
            );
          }
        }
      } else {
        const json = await res.json();
        showError(json.message || 'Gagal menyimpan data.');
      }
    } catch {
      showError('Gagal menghubungi server.');
    }
  };

  // --- Ekspor ke Excel ---

  const [daftarRw, setDaftarRw] = useState<string[]>([]);

  useEffect(() => {
    if (!token) return;
    ApiService.daftarRw(token)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (j?.data) setDaftarRw(j.data); })
      .catch(() => { /* daftar RW hanya untuk kenyamanan; diamkan bila gagal */ });
  }, [token]);

  /**
   * Ekspor pemilih menghasilkan .xlsx sungguhan, bukan CSV.
   *
   * CSV tidak menyimpan tipe kolom, jadi Excel menebak sendiri — dan untuk NIK
   * 16 digit tebakannya selalu "angka": kolomnya tampil `3,31E+15` dan digit
   * terakhirnya benar-benar hilang. Server mengirim datanya sebagai JSON dan
   * berkasnya disusun di sini, tempat tipe tiap kolom bisa ditetapkan.
   */
  const handleExport = async (params: Record<string, string>) => {
    if (!token) return;
    try {
      const res = await ApiService.exportPemilih(token, { ...params, format: 'json' });
      const json = await res.json().catch(() => ({}));

      if (!res.ok || json?.status !== 'success') {
        showError(json.message || 'Ekspor ditolak server.', 'Gagal Mengekspor');
        return;
      }

      if (!json.data.jumlah) {
        showError('Tidak ada pemilih pada pilihan ini.', 'Tidak Ada Data');
        return;
      }

      const namaBerkas = await unduhExcelPemilih(json.data);
      showSuccess(
        'Ekspor Selesai',
        `Berkas ${namaBerkas} sudah diunduh — ${json.data.jumlah.toLocaleString('id-ID')} pemilih, NIK dan No. KK tersimpan sebagai teks.`,
      );
    } catch {
      showError('Gagal menyusun berkas Excel.', 'Gagal Mengekspor');
    }
  };

  // --- Perpindahan tahapan pendataan ---

  const jalankanAksiTahapan = async (
    aksi: () => Promise<Response>,
    judulGagal: string,
  ) => {
    if (!token) return;
    try {
      const res = await aksi();
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        showSuccess('Berhasil', json.message || 'Perubahan tahapan tersimpan.');
        fetchDpts();
        fetchDashboard(true);
      } else {
        showError(json.message || 'Perubahan tahapan ditolak.', judulGagal);
      }
    } catch {
      showError('Gagal menghubungi server.', judulGagal);
    }
  };

  const handleVerifikasiDp4 = () => {
    const lingkup = dptTpsFilter ? 'TPS yang sedang dipilih' : 'SELURUH TPS';
    showConfirm(
      'Verifikasi DP4 jadi DPS?',
      `Semua data DP4 pada ${lingkup} akan dinyatakan lolos verifikasi dan menjadi DPS. Data yang tidak memenuhi syarat sebaiknya ditandai TMS lebih dulu.`,
      () => jalankanAksiTahapan(
        () => ApiService.verifikasiDp4(token!, dptTpsFilter ? { tps_id: dptTpsFilter } : {}),
        'Gagal Verifikasi',
      ),
      'Verifikasi',
    );
  };

  const handleTetapkanDpt = () => {
    const lingkup = dptTpsFilter ? 'TPS yang sedang dipilih' : 'SELURUH TPS';
    showConfirm(
      'Tetapkan sebagai DPT?',
      `DPS dan DPTb pada ${lingkup} akan digabung menjadi DPT. Penetapan ditolak bila masih ada DP4 yang belum diverifikasi.`,
      () => jalankanAksiTahapan(
        () => ApiService.tetapkanDpt(token!, dptTpsFilter ? { tps_id: dptTpsFilter } : {}),
        'Gagal Menetapkan',
      ),
      'Tetapkan',
    );
  };

  const mintaAlasan = (
    title: string,
    message: string,
    saran: string[],
    onSubmit: (alasan: string) => void,
    pilihan?: string[],
  ) => {
    setPromptTitle(title);
    setPromptMessage(message);
    setPromptSaran(saran);
    setPromptPilihan(pilihan);
    setPromptCallback(() => onSubmit);
    setPromptOpen(true);
  };

  const handleTandaiTms = (nik: string, nama: string) => {
    mintaAlasan(
      'Tandai Tidak Memenuhi Syarat',
      `Mengapa ${nama} tidak memenuhi syarat? Alasan ini tersimpan bersama datanya dan bisa dibatalkan.`,
      [],
      (alasan) => jalankanAksiTahapan(() => ApiService.tandaiTms(token!, nik, alasan), 'Gagal Menandai TMS'),
      KETERANGAN_TMS,
    );
  };

  const handleBatalkanTms = (nik: string) => {
    showConfirm(
      'Batalkan penandaan TMS?',
      'Data akan dikembalikan ke DP4 dan ikut diverifikasi lagi.',
      () => jalankanAksiTahapan(() => ApiService.batalkanTms(token!, nik), 'Gagal Membatalkan'),
      'Kembalikan',
    );
  };

  const handleTandaiDpk = (nik: string, nama: string) => {
    mintaAlasan(
      'Pindahkan ke DPK',
      `Kasus khusus apa yang membuat ${nama} masuk DPK? Setelah dipindahkan, ia tidak lagi dihitung sebagai DPT.`,
      ['Menikah di bawah usia 17 tahun', 'Sudah menikah', 'Purnawirawan TNI/Polri'],
      (alasan) => jalankanAksiTahapan(() => ApiService.tandaiDpk(token!, nik, alasan), 'Gagal Memindahkan'),
    );
  };

  const handleBatalkanDpk = (nik: string) => {
    showConfirm(
      'Kembalikan ke DPT?',
      'Pemilih akan dihitung kembali sebagai DPT biasa.',
      () => jalankanAksiTahapan(() => ApiService.batalkanDpk(token!, nik), 'Gagal Mengembalikan'),
      'Kembalikan',
    );
  };

  const handleDeleteDpt = async (nik: string) => {
    showConfirm(
      'Hapus Pemilih?',
      'Apakah Anda yakin ingin menghapus pemilih ini dari database?',
      async () => {
        if (!token) return;
        try {
          const res = await ApiService.deleteDpt(token, nik);
          if (res.ok) {
            fetchDpts();
          } else {
            const json = await res.json().catch(() => ({}));
            showError(json.message || 'Gagal menghapus pemilih.', 'Gagal Menghapus');
          }
        } catch {
          showError('Gagal menghubungi server.', 'Gagal Menghapus');
        }
      },
      'Hapus',
      true
    );
  };

  const handleImportCsv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile || !token) return;
    setImportLoading(true);
    setImportStatus(null);

    try {
      const res = await ApiService.importCsv(token, importFile);
      const json = await res.json();
      if (res.ok) {
        setImportStatus({
          success: json.message,
          errors: json.errors && json.errors.length > 0 ? json.errors : undefined
        });
        setImportFile(null);
        fetchDpts();
      } else {
        setImportStatus({ errors: [json.message || 'Impor gagal.'] });
      }
    } catch {
      setImportStatus({ errors: ['Gagal menghubungi server.'] });
    }
    setImportLoading(false);
  };

  const handleCreateKpps = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    const jenisAkun = kppsFormAccountType;
    const dasar = { username: kppsFormUsername, password: kppsFormPassword };
    const payload =
      kppsFormAccountType === 'kpps'
        ? { ...dasar, role: 'kpps', tps_id: kppsFormTps, kpps_role: kppsFormRole }
        : kppsFormAccountType === 'pantarlih'
        // Pantarlih tidak terikat TPS dan tidak punya sub-peran.
        ? { ...dasar, role: 'pantarlih', tps_id: kppsFormTps }
        : { ...dasar, role: 'sekretariat', sekretariat_role: kppsFormSekretariatRole };

    try {
      const res = await ApiService.createKpps(token, payload);
      if (res.ok) {
        const savedUsername = kppsFormUsername;
        const savedSekretariatRole = kppsFormSekretariatRole;
        setIsKppsModalOpen(false);
        setKppsFormUsername('');
        setKppsFormPassword('');
        setKppsFormTps('');
        setKppsFormRole('full');
        setKppsFormAccountType('kpps');
        setKppsFormSekretariatRole('admin');
        fetchKppsUsers();

        if (jenisAkun === 'kpps') {
          showSuccess('Akun KPPS Dibuat', `Akun "${savedUsername}" berhasil disimpan dan siap digunakan di aplikasi mobile.`);
        } else if (jenisAkun === 'pantarlih') {
          showSuccess('Akun Pantarlih Dibuat', `Akun "${savedUsername}" berhasil disimpan. Ia hanya bisa mendata di TPS yang dipilih, dan hasilnya otomatis tercatat sebagai DPTb.`);
        } else {
          showSuccess(
            'Akun Sekretariat Dibuat',
            savedSekretariatRole === 'admin'
              ? `Akun "${savedUsername}" berhasil disimpan dengan hak akses penuh di panel web.`
              : `Akun "${savedUsername}" berhasil disimpan dengan hak lihat saja di panel web.`
          );
        }
      } else {
        const json = await res.json();
        const firstError = json.errors ? (Object.values(json.errors)[0] as string[])?.[0] : null;
        showError(firstError || json.message || 'Gagal membuat akun.');
      }
    } catch {
      showError('Gagal menghubungi server.');
    }
  };

  const handleResetKppsPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUser || !token) return;
    try {
      const res = await ApiService.resetKppsPassword(token, resetUser.id, resetPasswordVal);
      if (res.ok) {
        const targetUsername = resetUser.username;
        setIsResetModalOpen(false);
        setResetUser(null);
        setResetPasswordVal('');
        showSuccess('Password Direset', `Password baru untuk akun "${targetUsername}" berhasil disimpan.`);
      } else {
        const json = await res.json();
        showError(json.message || 'Gagal reset password.');
      }
    } catch {
      showError('Gagal menghubungi server.');
    }
  };

  const handleDeleteUser = async (id: number) => {
    showConfirm(
      'Hapus Akun KPPS?',
      'Apakah Anda yakin ingin menghapus akun KPPS ini?',
      async () => {
        if (!token) return;
        try {
          const res = await ApiService.deleteKpps(token, id);
          if (res.ok) {
            fetchKppsUsers();
          } else {
            const json = await res.json().catch(() => ({}));
            showError(json.message || 'Gagal menghapus akun KPPS.', 'Gagal Menghapus');
          }
        } catch {
          showError('Gagal menghubungi server.', 'Gagal Menghapus');
        }
      },
      'Hapus',
      true
    );
  };

  if (!token) {
    return (
      <Routes>
        <Route path="*" element={
          <LoginScreen 
            handleLogin={handleLogin}
            username={username}
            setUsername={setUsername}
            password={password}
            setPassword={setPassword}
            loginError={loginError}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
          />
        } />
      </Routes>
    );
  }

  return (
    <div className={`app-container${isSidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
      {/* Shown only on narrow screens, where the sidebar is hidden off-canvas. */}
      <header className="mobile-topbar">
        <button
          type="button"
          className="mobile-nav-toggle"
          onClick={() => setIsMobileNavOpen(true)}
          aria-label="Buka menu"
          aria-expanded={isMobileNavOpen}
        >
          <Icons.Menu />
        </button>
        <div className="mobile-brand">
          <img src="/logo.png" alt="" />
          <span>GENTARA</span>
        </div>
      </header>

      <div
        className={`nav-backdrop${isMobileNavOpen ? ' is-open' : ''}`}
        onClick={closeMobileNav}
        aria-hidden="true"
      />

      <Sidebar
        path={path}
        user={user}
        navigate={navigate}
        handleLogout={handleLogout}
        isCollapsed={isSidebarCollapsed}
        toggleCollapsed={toggleSidebarCollapsed}
        isFullscreen={isFullscreen}
        toggleFullscreen={toggleFullscreen}
        isPantarlih={isPantarlih}
        isMobileOpen={isMobileNavOpen}
        closeMobileNav={closeMobileNav}
      />

      {/* Main Content Area */}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to={isPantarlih ? '/pemilih' : '/dashboard'} replace />} />
          {/* Pantarlih tidak punya akses ke ringkasan; memuat halamannya hanya
              akan memicu 403 dari server. */}
          <Route path="/dashboard" element={isPantarlih ? <Navigate to="/pemilih" replace /> :
            <DashboardTab
              dashboardData={dashboardData}
              dashboardLoading={dashboardLoading}
              fetchDashboard={fetchDashboard}
              setSelectedTpsId={(id) => navigate(`/tps/${id}`)}
              setPage={(p) => navigate('/' + p)}
            />
          } />
          <Route path="/quick-count" element={isPantarlih ? <Navigate to="/pemilih" replace /> :
            <QuickCountTab
              dashboardData={dashboardData}
              dashboardLoading={dashboardLoading}
              fetchDashboard={fetchDashboard}
            />
          } />
          <Route path="/tps" element={
            <TpsTab
              tpsPageData={tpsPageData}
              tpsPageLoading={tpsPageLoading}
              setTpsPage={setTpsPage}
              setIsTpsModalOpen={setIsTpsModalOpen}
              setSelectedTpsId={(id) => navigate(`/tps/${id}`)}
              setPage={(p) => navigate('/' + p)}
              isAdmin={isAdmin}
            />
          } />
          <Route path="/tps/:id" element={
            <TpsDetailRoute
              fetchTpsDetail={fetchTpsDetail}
              tpsDetailData={tpsDetailData}
              navigate={navigate}
            />
          } />
          <Route path="/pemilih" element={
            <PemilihTab
              dptData={dptData}
              dptLoading={dptLoading}
              dptSearch={dptSearch}
              setDptSearch={setDptSearch}
              dptTpsFilter={dptTpsFilter}
              setDptTpsFilter={setDptTpsFilter}
              dptJenisFilter={dptJenisFilter}
              setDptJenisFilter={setDptJenisFilter}
              setDptPage={setDptPage}
              tpsList={tpsList}
              setIsImportModalOpen={setIsImportModalOpen}
              setIsDptModalOpen={setIsDptModalOpen}
              setEditingDpt={setEditingDpt}
              setDptFormNik={setDptFormNik}
              setDptFormNkk={setDptFormNkk}
              setDptFormNama={setDptFormNama}
              setDptFormTps={setDptFormTps}
              setDptFormJenis={setDptFormJenis}
              setDptFormUmur={setDptFormUmur}
              setDptFormStatusKawin={setDptFormStatusKawin}
              setDptFormJenisKelamin={setDptFormJenisKelamin}
              setDptFormAlamat={setDptFormAlamat}
              setDptFormRt={setDptFormRt}
              setDptFormRw={setDptFormRw}
              setDptFormPekerjaan={setDptFormPekerjaan}
              setDptFormDisabilitas={setDptFormDisabilitas}
              setDptFormKeterangan={setDptFormKeterangan}
              fetchQrCode={fetchQrCode}
              fetchEditingQr={fetchEditingQr}
              handleDeleteDpt={handleDeleteDpt}
              handleVerifikasiDp4={handleVerifikasiDp4}
              handleTetapkanDpt={handleTetapkanDpt}
              handleTandaiTms={handleTandaiTms}
              handleBatalkanTms={handleBatalkanTms}
              handleTandaiDpk={handleTandaiDpk}
              handleBatalkanDpk={handleBatalkanDpk}
              isPantarlih={isPantarlih}
              daftarRw={daftarRw}
              handleExport={handleExport}
              isAdmin={isAdmin}
            />
          } />
          <Route path="/keluarga" element={
            <KeluargaTab
              token={token}
              tpsList={tpsList}
              isPantarlih={isPantarlih}
              showSuccess={showSuccess}
              showError={showError}
            />
          } />
          {/* Rute lama diarahkan ke menu gabungan agar bookmark tetap berfungsi */}
          <Route path="/dpt" element={<Navigate to="/pemilih" replace />} />
          <Route path="/dpk" element={<Navigate to="/pemilih" replace />} />
          <Route path="/kpps" element={
            <KppsTab
              kppsUsers={kppsUsers}
              kppsLoading={kppsLoading}
              setKppsPage={setKppsPage}
              setIsKppsModalOpen={setIsKppsModalOpen}
              setResetUser={setResetUser}
              setResetPasswordVal={setResetPasswordVal}
              setIsResetModalOpen={setIsResetModalOpen}
              handleDeleteUser={handleDeleteUser}
              isAdmin={isAdmin}
              currentUserId={user?.id}
            />
          } />
          <Route path="/paslon" element={
            <PaslonTab
              paslons={paslons}
              loading={paslonLoading}
              setIsModalOpen={setIsPaslonModalOpen}
              setIsEditing={setIsPaslonEditing}
              setEditingPaslon={setEditingPaslon}
              setNomorUrut={setPaslonNomorUrut}
              setNamaKetua={setPaslonNamaKetua}
              setFoto={setPaslonFoto}
              handleDeletePaslon={handleDeletePaslon}
              isAdmin={isAdmin}
            />
          } />
          <Route path="*" element={<Navigate to={isPantarlih ? '/pemilih' : '/dashboard'} replace />} />
        </Routes>
      </main>

      <TpsModal
        isOpen={isTpsModalOpen}
        onClose={() => setIsTpsModalOpen(false)}
        tpsName={tpsName}
        setTpsName={setTpsName}
        tpsRegion={tpsRegion}
        setTpsRegion={setTpsRegion}
        onSubmit={handleCreateTps}
      />

      <DptModal
        isOpen={isDptModalOpen}
        onClose={() => setIsDptModalOpen(false)}
        editingDpt={editingDpt}
        dptFormNik={dptFormNik}
        setDptFormNik={setDptFormNik}
        dptFormNkk={dptFormNkk}
        setDptFormNkk={setDptFormNkk}
        dptFormNama={dptFormNama}
        setDptFormNama={setDptFormNama}
        dptFormTps={dptFormTps}
        setDptFormTps={setDptFormTps}
        dptFormJenis={dptFormJenis}
        isPantarlih={isPantarlih}
        setDptFormJenis={setDptFormJenis}
        dptFormUmur={dptFormUmur}
        setDptFormUmur={setDptFormUmur}
        dptFormStatusKawin={dptFormStatusKawin}
        setDptFormStatusKawin={setDptFormStatusKawin}
        dptFormJenisKelamin={dptFormJenisKelamin}
        setDptFormJenisKelamin={setDptFormJenisKelamin}
        dptFormAlamat={dptFormAlamat}
        setDptFormAlamat={setDptFormAlamat}
        dptFormRt={dptFormRt}
        setDptFormRt={setDptFormRt}
        dptFormRw={dptFormRw}
        setDptFormRw={setDptFormRw}
        dptFormPekerjaan={dptFormPekerjaan}
        setDptFormPekerjaan={setDptFormPekerjaan}
        dptFormDisabilitas={dptFormDisabilitas}
        setDptFormDisabilitas={setDptFormDisabilitas}
        dptFormKeterangan={dptFormKeterangan}
        setDptFormKeterangan={setDptFormKeterangan}
        tpsList={tpsList}
        editingQrCode={editingQrCode}
        downloadQrCode={downloadQrCode}
        onSubmit={handleSaveDpt}
      />

      <ImportCsvModal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          setImportStatus(null);
          setImportFile(null);
        }}
        importFile={importFile}
        setImportFile={setImportFile}
        importStatus={importStatus}
        importLoading={importLoading}
        onSubmit={handleImportCsv}
      />

      <KppsModal
        isOpen={isKppsModalOpen}
        onClose={() => setIsKppsModalOpen(false)}
        kppsFormUsername={kppsFormUsername}
        setKppsFormUsername={setKppsFormUsername}
        kppsFormPassword={kppsFormPassword}
        setKppsFormPassword={setKppsFormPassword}
        kppsFormTps={kppsFormTps}
        setKppsFormTps={setKppsFormTps}
        kppsFormRole={kppsFormRole}
        setKppsFormRole={setKppsFormRole}
        kppsFormAccountType={kppsFormAccountType}
        setKppsFormAccountType={setKppsFormAccountType}
        kppsFormSekretariatRole={kppsFormSekretariatRole}
        setKppsFormSekretariatRole={setKppsFormSekretariatRole}
        tpsList={tpsList}
        onSubmit={handleCreateKpps}
      />

      <ResetPasswordModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        resetUser={resetUser}
        resetPasswordVal={resetPasswordVal}
        setResetPasswordVal={setResetPasswordVal}
        onSubmit={handleResetKppsPassword}
      />

      <QrViewerModal
        isOpen={isQrModalOpen}
        onClose={() => {
          setIsQrModalOpen(false);
          setSelectedVoterQr(null);
        }}
        selectedVoterQr={selectedVoterQr}
        selectedVoterName={selectedVoterName}
        downloadQrCode={downloadQrCode}
      />

      <VoterSuccessModal
        newVoterSuccess={newVoterSuccess}
        onClose={() => setNewVoterSuccess(null)}
        downloadQrCode={downloadQrCode}
      />

      <PaslonModal
        isOpen={isPaslonModalOpen}
        onClose={() => setIsPaslonModalOpen(false)}
        isEditing={isPaslonEditing}
        nomorUrut={paslonNomorUrut}
        setNomorUrut={setPaslonNomorUrut}
        namaKetua={paslonNamaKetua}
        setNamaKetua={setPaslonNamaKetua}
        foto={paslonFoto}
        setFoto={setPaslonFoto}
        fotoLama={editingPaslon?.foto_url ?? null}
        onSubmit={handleSavePaslon}
      />

      <CustomPromptModal
        isOpen={promptOpen}
        title={promptTitle}
        message={promptMessage}
        saran={promptSaran}
        pilihan={promptPilihan}
        placeholder="Tulis alasan..."
        onCancel={() => setPromptOpen(false)}
        onSubmit={(alasan) => {
          setPromptOpen(false);
          promptCallback?.(alasan);
        }}
      />

      <CustomConfirmModal
        isOpen={confirmModalOpen}
        title={confirmModalTitle}
        message={confirmModalMessage}
        onCancel={() => setConfirmModalOpen(false)}
        onConfirm={() => {
          setConfirmModalOpen(false);
          if (confirmModalCallback) confirmModalCallback();
        }}
        btnText={confirmModalBtnText}
        isDanger={confirmModalDanger}
      />

      <CustomAlertModal
        isOpen={alertModalOpen}
        variant={alertModalVariant}
        title={alertModalTitle}
        message={alertModalMessage}
        onClose={() => setAlertModalOpen(false)}
        btnText={alertModalVariant === 'success' ? 'Selesai' : 'Tutup'}
      />
    </div>
  );
}
