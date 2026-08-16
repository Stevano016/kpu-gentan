import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom';
import { ApiService } from './services/api';

// Shared Layouts & Modals
import { LoginScreen } from './components/LoginScreen';
import { Sidebar } from './components/Sidebar';
import { TpsModal } from './components/modals/TpsModal';
import { DptModal } from './components/modals/DptModal';
import { ImportCsvModal } from './components/modals/ImportCsvModal';
import { KppsModal } from './components/modals/KppsModal';
import { ResetPasswordModal } from './components/modals/ResetPasswordModal';
import { QrViewerModal } from './components/modals/QrViewerModal';
import { VoterSuccessModal } from './components/modals/VoterSuccessModal';
import { CustomConfirmModal } from './components/CustomConfirmModal';

// Screen Tabs
import DashboardTab from './components/tabs/DashboardTab';
import TpsTab from './components/tabs/TpsTab';
import TpsDetailTab from './components/tabs/TpsDetailTab';
import DptTab from './components/tabs/DptTab';
import DpkTab from './components/tabs/DpkTab';
import KppsTab from './components/tabs/KppsTab';

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
  const [dptPage, setDptPage] = useState(1);
  const [dptLoading, setDptLoading] = useState(false);
  
  // DPT Form Modal
  const [isDptModalOpen, setIsDptModalOpen] = useState(false);
  const [editingDpt, setEditingDpt] = useState<any>(null);
  const [dptFormNik, setDptFormNik] = useState('');
  const [dptFormNama, setDptFormNama] = useState('');
  const [dptFormTps, setDptFormTps] = useState('');
  
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

  // QR Code viewer states
  const [selectedVoterQr, setSelectedVoterQr] = useState<string | null>(null);
  const [selectedVoterName, setSelectedVoterName] = useState<string>('');
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const showConfirm = (title: string, message: string, onConfirm: () => void, btnText = 'Ya', danger = false) => {
    setConfirmModalTitle(title);
    setConfirmModalMessage(message);
    setConfirmModalCallback(() => onConfirm);
    setConfirmModalBtnText(btnText);
    setConfirmModalDanger(danger);
    setConfirmModalOpen(true);
  };

  // Fetch logged in profile
  useEffect(() => {
    if (token) {
      fetchProfile();
    }
  }, [token]);

  // Load section-specific data based on URL path
  useEffect(() => {
    if (!token) return;
    if (path === '/' || path === '/dashboard') {
      fetchDashboard();
    } else if (path === '/tps') {
      fetchTpsPageData();
    } else if (path === '/dpt' || path === '/dpk') {
      fetchDpts();
      fetchTpsList();
    } else if (path === '/kpps') {
      fetchKppsUsers();
      fetchTpsList();
    }
  }, [path, token, dptSearch, dptTpsFilter, dptPage, tpsPage, kppsPage]);

  // Real-time updates via WebSocket
  useEffect(() => {
    if (!token) return;
    const wsHost = window.location.hostname || 'localhost';
    const ws = new WebSocket(`ws://${wsHost}:8080`);

    ws.onopen = () => {
      console.log('Terhubung ke WebSocket Server untuk real-time update.');
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        console.log('Menerima WebSocket broadcast:', payload);
        
        if (payload.event === 'checkin' || payload.event === 'quick-count' || payload.event === 'update') {
          if (path === '/' || path === '/dashboard') {
            fetchDashboard();
          } else if (path === '/tps') {
            fetchTpsPageData();
          } else if (path.startsWith('/tps/')) {
            const parts = path.split('/');
            const tpsId = parseInt(parts[parts.length - 1], 10);
            if (!isNaN(tpsId)) {
              fetchTpsDetail(tpsId);
            }
          } else if (path === '/dpt' || path === '/dpk') {
            fetchDpts();
          }
        }
      } catch (err) {
        console.error('Gagal memproses data WebSocket:', err);
      }
    };

    ws.onerror = () => {
      console.warn('Koneksi WebSocket gagal. Mencoba kembali...');
    };

    ws.onclose = () => {
      console.log('Koneksi WebSocket terputus.');
    };

    return () => {
      ws.close();
    };
  }, [path, token]);

  const fetchProfile = async () => {
    try {
      const res = await ApiService.getProfile(token!);
      const json = await res.json();
      if (res.ok) {
        setUser(json.user);
        if (json.user.role !== 'sekretariat') {
          setLoginError('Akses Ditolak. Panel ini hanya untuk Sekretariat.');
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
        if (json.user.role !== 'sekretariat') {
          setLoginError('Akses Ditolak. Hanya Sekretariat yang diizinkan masuk ke dashboard ini.');
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

  const fetchDashboard = async () => {
    if (!token) return;
    setDashboardLoading(true);
    try {
      const res = await ApiService.getDashboardSummary(token);
      const json = await res.json();
      if (res.ok) {
        setDashboardData(json.data);
      }
    } catch {}
    setDashboardLoading(false);
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
      const type = path.includes('/dpk') ? 'dpk' : 'dpt';
      const res = await ApiService.getDpts(token, dptPage, dptSearch, dptTpsFilter, type);
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
        alert('Gagal mengambil QR Code.');
      }
    } catch {
      alert('Gagal menghubungi server.');
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
        setIsTpsModalOpen(false);
        setTpsName('');
        setTpsRegion('');
        fetchTpsPageData();
      } else {
        const json = await res.json();
        alert(json.errors?.nama?.[0] || json.message || 'Gagal membuat TPS.');
      }
    } catch {
      alert('Gagal menghubungi server.');
    }
  };

  const handleSaveDpt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    const payload = editingDpt 
      ? { nama: dptFormNama, tps_id: dptFormTps, jenis_pemilih: editingDpt.jenis_pemilih } 
      : { nik: dptFormNik, nama: dptFormNama, tps_id: dptFormTps, jenis_pemilih: path.includes('/dpk') ? 'dpk' : 'dpt' };

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
        setDptFormNama('');
        setDptFormTps('');
        fetchDpts();

        if (!isEditing) {
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
            }
          } catch {}
        }
      } else {
        const json = await res.json();
        alert(json.message || 'Gagal menyimpan data.');
      }
    } catch {
      alert('Gagal menghubungi server.');
    }
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
          }
        } catch {
          alert('Gagal menghubungi server.');
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
    try {
      const res = await ApiService.createKpps(token, {
        username: kppsFormUsername,
        password: kppsFormPassword,
        tps_id: kppsFormTps,
        kpps_role: kppsFormRole
      });
      if (res.ok) {
        setIsKppsModalOpen(false);
        setKppsFormUsername('');
        setKppsFormPassword('');
        setKppsFormTps('');
        setKppsFormRole('full');
        fetchKppsUsers();
      } else {
        const json = await res.json();
        alert(json.message || 'Gagal membuat akun KPPS.');
      }
    } catch {
      alert('Gagal menghubungi server.');
    }
  };

  const handleResetKppsPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUser || !token) return;
    try {
      const res = await ApiService.resetKppsPassword(token, resetUser.id, resetPasswordVal);
      if (res.ok) {
        setIsResetModalOpen(false);
        setResetUser(null);
        setResetPasswordVal('');
        alert('Password berhasil direset.');
      } else {
        const json = await res.json();
        alert(json.message || 'Gagal reset password.');
      }
    } catch {
      alert('Gagal menghubungi server.');
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
          }
        } catch {
          alert('Gagal menghubungi server.');
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
    <div className="app-container">
      <Sidebar
        path={path}
        user={user}
        navigate={navigate}
        handleLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={
            <DashboardTab
              dashboardData={dashboardData}
              dashboardLoading={dashboardLoading}
              fetchDashboard={fetchDashboard}
              setSelectedTpsId={(id) => navigate(`/tps/${id}`)}
              setPage={(p) => navigate('/' + p)}
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
            />
          } />
          <Route path="/tps/:id" element={
            <TpsDetailRoute
              fetchTpsDetail={fetchTpsDetail}
              tpsDetailData={tpsDetailData}
              navigate={navigate}
            />
          } />
          <Route path="/dpt" element={
            <DptTab
              dptData={dptData}
              dptLoading={dptLoading}
              dptSearch={dptSearch}
              setDptSearch={setDptSearch}
              dptTpsFilter={dptTpsFilter}
              setDptTpsFilter={setDptTpsFilter}
              setDptPage={setDptPage}
              tpsList={tpsList}
              setIsImportModalOpen={setIsImportModalOpen}
              setIsDptModalOpen={setIsDptModalOpen}
              setEditingDpt={setEditingDpt}
              setDptFormNik={setDptFormNik}
              setDptFormNama={setDptFormNama}
              setDptFormTps={setDptFormTps}
              fetchQrCode={fetchQrCode}
              fetchEditingQr={fetchEditingQr}
              handleDeleteDpt={handleDeleteDpt}
            />
          } />
          <Route path="/dpk" element={
            <DpkTab
              dptData={dptData}
              dptLoading={dptLoading}
              dptSearch={dptSearch}
              setDptSearch={setDptSearch}
              dptTpsFilter={dptTpsFilter}
              setDptTpsFilter={setDptTpsFilter}
              setDptPage={setDptPage}
              tpsList={tpsList}
              setIsDptModalOpen={setIsDptModalOpen}
              setEditingDpt={setEditingDpt}
              setDptFormNik={setDptFormNik}
              setDptFormNama={setDptFormNama}
              setDptFormTps={setDptFormTps}
              fetchQrCode={fetchQrCode}
              fetchEditingQr={fetchEditingQr}
              handleDeleteDpt={handleDeleteDpt}
            />
          } />
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
            />
          } />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
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
        dptFormNama={dptFormNama}
        setDptFormNama={setDptFormNama}
        dptFormTps={dptFormTps}
        setDptFormTps={setDptFormTps}
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
    </div>
  );
}
