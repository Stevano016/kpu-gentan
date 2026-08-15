import React, { useState, useEffect } from 'react';

// API Base URL
const API_URL = 'http://localhost:8000/api';

// Professional SVG Icons
const Icons = {
  Vote: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  Dashboard: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  Tps: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  Voters: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  Users: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  Logout: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  Plus: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  ),
  Search: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  Close: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Upload: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  ),
  Refresh: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.5" />
    </svg>
  )
};

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<any>(null);
  const [page, setPage] = useState<string>('dashboard'); // dashboard | dpt | kpps | tps | tps-detail
  
  // Auth Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Dashboard Data
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  // TPS Data
  const [tpsList, setTpsList] = useState<any[]>([]);
  const [selectedTpsId, setSelectedTpsId] = useState<number | null>(null);
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
  const [kppsUsers, setKppsUsers] = useState<any[]>([]);
  const [kppsLoading, setKppsLoading] = useState(false);
  const [isKppsModalOpen, setIsKppsModalOpen] = useState(false);
  const [kppsFormUsername, setKppsFormUsername] = useState('');
  const [kppsFormPassword, setKppsFormPassword] = useState('');
  const [kppsFormTps, setKppsFormTps] = useState('');
  const [kppsFormRole, setKppsFormRole] = useState('full'); // full | validasi

  // Password reset state
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetUser, setResetUser] = useState<any>(null);
  const [resetPasswordVal, setResetPasswordVal] = useState('');

  // QR Code viewer states
  const [selectedVoterQr, setSelectedVoterQr] = useState<string | null>(null);
  const [selectedVoterName, setSelectedVoterName] = useState<string>('');
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Fetch logged in profile
  useEffect(() => {
    if (token) {
      fetchProfile();
    }
  }, [token]);

  // Load section-specific data
  useEffect(() => {
    if (!token) return;
    if (page === 'dashboard') {
      fetchDashboard();
    } else if (page === 'tps') {
      fetchTpsList();
    } else if (page === 'dpt') {
      fetchDpts();
      fetchTpsList(); // For filter dropdown
    } else if (page === 'kpps') {
      fetchKppsUsers();
      fetchTpsList(); // For creation select
    }
  }, [page, token, dptSearch, dptTpsFilter, dptPage]);

  // Load single TPS detail if selected
  useEffect(() => {
    if (selectedTpsId && page === 'tps-detail') {
      fetchTpsDetail(selectedTpsId);
    }
  }, [selectedTpsId, page]);

  const getAuthHeader = () => ({
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json'
  });

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_URL}/me`, { headers: getAuthHeader() });
      const json = await res.json();
      if (res.ok) {
        setUser(json.user);
        if (json.user.role !== 'sekretariat') {
          // Reject if a KPPS user logs into the secretariat panel
          setLoginError('Akses Ditolak. Panel ini hanya untuk Sekretariat.');
          handleLogout();
        }
      } else {
        handleLogout();
      }
    } catch {
      handleLogout();
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const json = await res.json();
      if (res.ok) {
        if (json.user.role !== 'sekretariat') {
          setLoginError('Akses Ditolak. Hanya Sekretariat yang diizinkan masuk ke dashboard ini.');
          return;
        }
        localStorage.setItem('token', json.token);
        setToken(json.token);
        setUser(json.user);
        setPage('dashboard');
      } else {
        setLoginError(json.errors?.username?.[0] || json.message || 'Login gagal.');
      }
    } catch (err) {
      setLoginError('Gagal terhubung ke server.');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/logout`, { method: 'POST', headers: getAuthHeader() });
    } catch {}
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const fetchDashboard = async () => {
    setDashboardLoading(true);
    try {
      const res = await fetch(`${API_URL}/dashboard/summary`, { headers: getAuthHeader() });
      const json = await res.json();
      if (res.ok) {
        setDashboardData(json.data);
      }
    } catch {}
    setDashboardLoading(false);
  };

  const fetchTpsList = async () => {
    try {
      const res = await fetch(`${API_URL}/tps`, { headers: getAuthHeader() });
      const json = await res.json();
      if (res.ok) {
        setTpsList(json.data);
      }
    } catch {}
  };

  const fetchTpsDetail = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}/dashboard/tps/${id}`, { headers: getAuthHeader() });
      const json = await res.json();
      if (res.ok) {
        setTpsDetailData(json.data);
      }
    } catch {}
  };

  const fetchDpts = async () => {
    setDptLoading(true);
    try {
      let url = `${API_URL}/dpt?page=${dptPage}`;
      if (dptSearch) url += `&search=${dptSearch}`;
      if (dptTpsFilter) url += `&tps_id=${dptTpsFilter}`;
      
      const res = await fetch(url, { headers: getAuthHeader() });
      const json = await res.json();
      if (res.ok) {
        setDptData(json.data);
      }
    } catch {}
    setDptLoading(false);
  };

  const fetchQrCode = async (nik: string, name: string) => {
    try {
      const res = await fetch(`${API_URL}/dpt/${nik}/qrcode`, { headers: getAuthHeader() });
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
    const link = document.createElement('a');
    link.href = base64Data;
    link.download = `QR-${name.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fetchEditingQr = async (nik: string) => {
    setEditingQrCode(null);
    try {
      const res = await fetch(`${API_URL}/dpt/${nik}/qrcode`, { headers: getAuthHeader() });
      const json = await res.json();
      if (res.ok) {
        setEditingQrCode(json.qrcode);
      }
    } catch {}
  };

  const fetchKppsUsers = async () => {
    setKppsLoading(true);
    try {
      const res = await fetch(`${API_URL}/users`, { headers: getAuthHeader() });
      const json = await res.json();
      if (res.ok) {
        setKppsUsers(json.data);
      }
    } catch {}
    setKppsLoading(false);
  };

  // CRUD handlers
  const handleCreateTps = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/tps`, {
        method: 'POST',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama: tpsName, wilayah: tpsRegion })
      });
      if (res.ok) {
        setIsTpsModalOpen(false);
        setTpsName('');
        setTpsRegion('');
        fetchTpsList();
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
    const url = editingDpt ? `${API_URL}/dpt/${editingDpt.nik}` : `${API_URL}/dpt`;
    const method = editingDpt ? 'PUT' : 'POST';
    const payload = editingDpt 
      ? { nama: dptFormNama, tps_id: dptFormTps } 
      : { nik: dptFormNik, nama: dptFormNama, tps_id: dptFormTps };

    try {
      const res = await fetch(url, {
        method,
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setIsDptModalOpen(false);
        const savedNik = dptFormNik;
        const savedNama = dptFormNama;
        const isEditing = editingDpt !== null;

        setEditingDpt(null);
        setDptFormNik('');
        setDptFormNama('');
        setDptFormTps('');
        fetchDpts();

        if (!isEditing) {
          // Fetch QR Code for newly added voter to display success dialog
          try {
            const qrRes = await fetch(`${API_URL}/dpt/${savedNik}/qrcode`, { headers: getAuthHeader() });
            const qrJson = await qrRes.json();
            if (qrRes.ok) {
              setNewVoterSuccess({
                nik: savedNik,
                nama: savedNama,
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
    if (!confirm('Apakah Anda yakin ingin menghapus pemilih ini?')) return;
    try {
      const res = await fetch(`${API_URL}/dpt/${nik}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });
      if (res.ok) {
        fetchDpts();
      }
    } catch {
      alert('Gagal menghubungi server.');
    }
  };

  const handleImportCsv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) return;
    setImportLoading(true);
    setImportStatus(null);
    
    const formData = new FormData();
    formData.append('file', importFile);

    try {
      const res = await fetch(`${API_URL}/dpt/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // No content-type headers, fetch sets multipart/form-data boundary automatically
        },
        body: formData
      });
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
    try {
      const res = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: kppsFormUsername,
          password: kppsFormPassword,
          tps_id: kppsFormTps,
          kpps_role: kppsFormRole
        })
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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUser) return;
    try {
      const res = await fetch(`${API_URL}/users/${resetUser.id}/reset-password`, {
        method: 'POST',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: resetPasswordVal })
      });
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
    if (!confirm('Apakah Anda yakin ingin menghapus akun KPPS ini?')) return;
    try {
      const res = await fetch(`${API_URL}/users/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });
      if (res.ok) {
        fetchKppsUsers();
      }
    } catch {
      alert('Gagal menghubungi server.');
    }
  };

  if (!token) {
    return (
      <div className="login-wrapper">
        <div className="login-card">
          <div className="login-logo">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
            </svg>
            <h1>KPPS GENTAN</h1>
            <p>Panel Sekretariat</p>
          </div>

          <form onSubmit={handleLogin}>
            {loginError && (
              <div style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', marginBottom: '20px', fontWeight: '500' }}>
                {loginError}
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                className="form-control"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Masukkan username"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Masukkan password"
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
              Masuk
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Icons.Vote />
          <span>KPPS GENTAN</span>
        </div>

        <nav style={{ flexGrow: 1 }}>
          <ul className="sidebar-menu">
            <li className={`menu-item ${page === 'dashboard' ? 'active' : ''}`}>
              <button onClick={() => setPage('dashboard')}>
                <Icons.Dashboard />
                <span>Dashboard Monitor</span>
              </button>
            </li>
            <li className={`menu-item ${page === 'tps' || page === 'tps-detail' ? 'active' : ''}`}>
              <button onClick={() => setPage('tps')}>
                <Icons.Tps />
                <span>TPS & Monitoring</span>
              </button>
            </li>
            <li className={`menu-item ${page === 'dpt' ? 'active' : ''}`}>
              <button onClick={() => setPage('dpt')}>
                <Icons.Voters />
                <span>Data Pemilih (DPT)</span>
              </button>
            </li>
            <li className={`menu-item ${page === 'kpps' ? 'active' : ''}`}>
              <button onClick={() => setPage('kpps')}>
                <Icons.Users />
                <span>Akun KPPS</span>
              </button>
            </li>
          </ul>
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="avatar">
              {user?.username?.substring(0, 2).toUpperCase() || 'S'}
            </div>
            <div className="user-info">
              <span className="username">{user?.username}</span>
              <span className="role-badge">{user?.role}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="btn-logout">
            <Icons.Logout />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        
        {/* PAGE 1: DASHBOARD */}
        {page === 'dashboard' && (
          <div>
            <div className="section-header">
              <div>
                <h1 className="section-title">Dashboard Umum</h1>
                <p className="section-desc">Statistik real-time kehadiran pemilih dan quick count suara.</p>
              </div>
              <button onClick={fetchDashboard} disabled={dashboardLoading} className="btn btn-secondary">
                <Icons.Refresh />
                <span>Segarkan</span>
              </button>
            </div>

            {dashboardLoading && <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '16px' }}>Memuat data...</div>}

            {dashboardData && (
              <>
                {/* Aggregate Widgets */}
                <div className="grid-cols-4">
                  <div className="card">
                    <div className="card-title">Total DPT (Voters)</div>
                    <div className="card-value">{dashboardData.stats.total_dpt}</div>
                    <div className="card-subtext">Dari {dashboardData.stats.total_tps} TPS terdaftar</div>
                  </div>
                  <div className="card">
                    <div className="card-title">Kehadiran (Check-In)</div>
                    <div className="card-value">{dashboardData.stats.total_hadir}</div>
                    <div className="card-subtext">{dashboardData.stats.persentase_kehadiran}% Kehadiran</div>
                  </div>
                  <div className="card">
                    <div className="card-title">TPS Sudah Kirim QC</div>
                    <div className="card-value">{dashboardData.stats.tps_sudah_lapor_qc}</div>
                    <div className="card-subtext">Dari {dashboardData.stats.total_tps} total TPS</div>
                  </div>
                  <div className="card">
                    <div className="card-title">TPS Belum Kirim QC</div>
                    <div className="card-value">{dashboardData.stats.tps_belum_lapor_qc}</div>
                    <div className="card-subtext">Menunggu submit final KPPS</div>
                  </div>
                </div>

                <div className="grid-cols-2">
                  {/* Quick Count Aggregates */}
                  <div className="card">
                    <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '20px' }}>Agregat Quick Count</h2>
                    <div className="quickcount-stats">
                      <div>
                        <div className="quickcount-row">
                          <span>Kandidat 01</span>
                          <span>{dashboardData.quick_count_aggregates.kandidat_1} suara</span>
                        </div>
                        <div className="quickcount-bar-container">
                          <div 
                            className="quickcount-bar" 
                            style={{ 
                              width: `${dashboardData.quick_count_aggregates.total_suara_masuk > 0 ? (dashboardData.quick_count_aggregates.kandidat_1 / dashboardData.quick_count_aggregates.total_suara_masuk) * 100 : 0}%`,
                              backgroundColor: 'oklch(0.60 0.15 200)'
                            }} 
                          />
                        </div>
                      </div>
                      <div>
                        <div className="quickcount-row">
                          <span>Kandidat 02</span>
                          <span>{dashboardData.quick_count_aggregates.kandidat_2} suara</span>
                        </div>
                        <div className="quickcount-bar-container">
                          <div 
                            className="quickcount-bar" 
                            style={{ 
                              width: `${dashboardData.quick_count_aggregates.total_suara_masuk > 0 ? (dashboardData.quick_count_aggregates.kandidat_2 / dashboardData.quick_count_aggregates.total_suara_masuk) * 100 : 0}%`,
                              backgroundColor: 'oklch(0.60 0.15 30)'
                            }} 
                          />
                        </div>
                      </div>
                      <div>
                        <div className="quickcount-row">
                          <span>Kandidat 03</span>
                          <span>{dashboardData.quick_count_aggregates.kandidat_3} suara</span>
                        </div>
                        <div className="quickcount-bar-container">
                          <div 
                            className="quickcount-bar" 
                            style={{ 
                              width: `${dashboardData.quick_count_aggregates.total_suara_masuk > 0 ? (dashboardData.quick_count_aggregates.kandidat_3 / dashboardData.quick_count_aggregates.total_suara_masuk) * 100 : 0}%`,
                              backgroundColor: 'oklch(0.60 0.15 120)'
                            }} 
                          />
                        </div>
                      </div>
                      <div style={{ marginTop: '12px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                        <div className="quickcount-row" style={{ backgroundColor: 'transparent', padding: '4px 0' }}>
                          <span>Suara Tidak Sah</span>
                          <span>{dashboardData.quick_count_aggregates.suara_tidak_sah} suara</span>
                        </div>
                        <div className="quickcount-row" style={{ backgroundColor: 'transparent', padding: '4px 0', fontWeight: '700', fontSize: '1rem' }}>
                          <span>Total Suara Masuk</span>
                          <span>{dashboardData.quick_count_aggregates.total_suara_masuk} suara</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Attendance Monitor */}
                  <div className="card">
                    <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '20px' }}>Persentase Kehadiran Wilayah</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80%' }}>
                      <div style={{ position: 'relative', width: '160px', height: '160px', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
                        <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                          <path
                            style={{ stroke: 'var(--border)', fill: 'none', strokeWidth: '3.8' }}
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            style={{ stroke: 'var(--primary)', fill: 'none', strokeWidth: '3.8', strokeDasharray: `${dashboardData.stats.persentase_kehadiran}, 100` }}
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <span style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text)' }}>{dashboardData.stats.persentase_kehadiran}%</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>Kehadiran DPT</span>
                        </div>
                      </div>
                      <div style={{ marginTop: '24px', display: 'flex', gap: '24px', fontSize: '0.875rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--primary)' }}></span>
                          <span>Hadir: {dashboardData.stats.total_hadir}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--border)' }}></span>
                          <span>Belum Hadir: {dashboardData.stats.total_dpt - dashboardData.stats.total_hadir}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dashboard TPS Reporting Table */}
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '16px' }}>Status Laporan per TPS</h3>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Nama TPS</th>
                        <th>Wilayah</th>
                        <th>Total DPT</th>
                        <th>Hadir (Check-In)</th>
                        <th>% Kehadiran</th>
                        <th>Status Quick Count</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData.tps_list.map((t: any) => (
                        <tr key={t.id}>
                          <td style={{ fontWeight: '600' }}>{t.nama}</td>
                          <td>{t.wilayah}</td>
                          <td>{t.total_dpt}</td>
                          <td>{t.hadir}</td>
                          <td>
                            {t.total_dpt > 0 ? `${roundVal((t.hadir / t.total_dpt) * 100)}%` : '0%'}
                          </td>
                          <td>
                            {t.quick_count_status === 'final' ? (
                              <span className="badge badge-success">Final (Terkunci)</span>
                            ) : t.quick_count_status === 'draft' ? (
                              <span className="badge badge-warning">Draft (Belum Submit)</span>
                            ) : (
                              <span className="badge badge-danger">Belum Input</span>
                            )}
                          </td>
                          <td>
                            <button 
                              onClick={() => {
                                setSelectedTpsId(t.id);
                                setPage('tps-detail');
                              }} 
                              className="btn btn-secondary" 
                              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                            >
                              Detail Monitor
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* PAGE 2: TPS LIST */}
        {page === 'tps' && (
          <div>
            <div className="section-header">
              <div>
                <h1 className="section-title">Tempat Pemungutan Suara (TPS)</h1>
                <p className="section-desc">Daftar wilayah TPS dan manajemen alur rekapitulasi.</p>
              </div>
              <button onClick={() => setIsTpsModalOpen(true)} className="btn btn-primary">
                <Icons.Plus />
                <span>Tambah TPS</span>
              </button>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nama TPS</th>
                    <th>Wilayah / Alamat</th>
                    <th>Jumlah Pemilih (DPT)</th>
                    <th>Kehadiran (Hadir)</th>
                    <th>% Kehadiran</th>
                    <th>Jumlah Akun KPPS</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {tpsList.map((t: any) => (
                    <tr key={t.id}>
                      <td>{t.id}</td>
                      <td style={{ fontWeight: '600' }}>{t.nama}</td>
                      <td>{t.wilayah}</td>
                      <td>{t.dpt_count ?? t.total_dpt}</td>
                      <td>{t.hadir_count ?? 0}</td>
                      <td>
                        {t.dpt_count > 0 ? `${roundVal(((t.hadir_count ?? 0) / t.dpt_count) * 100)}%` : '0%'}
                      </td>
                      <td>{t.users_count}</td>
                      <td>
                        <button
                          onClick={() => {
                            setSelectedTpsId(t.id);
                            setPage('tps-detail');
                          }}
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                        >
                          Lihat Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                  {tpsList.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada data TPS.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PAGE 2B: TPS DETAIL */}
        {page === 'tps-detail' && tpsDetailData && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <button onClick={() => setPage('dashboard')} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', marginBottom: '16px' }}>
                &larr; Kembali ke Dashboard
              </button>
              <h1 className="section-title">{tpsDetailData.tps.nama}</h1>
              <p className="section-desc">Wilayah: {tpsDetailData.tps.wilayah}</p>
            </div>

            <div className="grid-cols-4">
              <div className="card">
                <div className="card-title">Total DPT</div>
                <div className="card-value">{tpsDetailData.stats.total_dpt}</div>
              </div>
              <div className="card">
                <div className="card-title">Check-in Hadir</div>
                <div className="card-value" style={{ color: 'var(--success)' }}>{tpsDetailData.stats.hadir}</div>
              </div>
              <div className="card">
                <div className="card-title">Belum Hadir</div>
                <div className="card-value" style={{ color: 'var(--text-muted)' }}>{tpsDetailData.stats.tidak_hadir}</div>
              </div>
              <div className="card">
                <div className="card-title">Persentase Kehadiran</div>
                <div className="card-value">{tpsDetailData.stats.persentase_kehadiran}%</div>
              </div>
            </div>

            <div className="detail-grid">
              {/* Voter list log */}
              <div className="card">
                <h3 style={{ fontWeight: '700', marginBottom: '16px' }}>Log Kehadiran Pemilih</h3>
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>NIK</th>
                        <th>Nama Pemilih</th>
                        <th>Status</th>
                        <th>Waktu Check-in</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tpsDetailData.voters.map((v: any) => (
                        <tr key={v.nik}>
                          <td>{v.nik}</td>
                          <td style={{ fontWeight: '500' }}>{v.nama}</td>
                          <td>
                            {v.status_hadir ? (
                              <span className="badge badge-success">Hadir</span>
                            ) : (
                              <span className="badge badge-danger">Belum Hadir</span>
                            )}
                          </td>
                          <td style={{ color: 'var(--text-muted)' }}>
                            {v.waktu_checkin ? new Date(v.waktu_checkin).toLocaleString('id-ID') : '-'}
                          </td>
                        </tr>
                      ))}
                      {tpsDetailData.voters.length === 0 && (
                        <tr>
                          <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Tidak ada data pemilih terdaftar di TPS ini.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Quick Count and Device logs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="card">
                  <h3 style={{ fontWeight: '700', marginBottom: '16px' }}>Hasil Quick Count TPS</h3>
                  {tpsDetailData.quick_count ? (
                    <div className="quickcount-stats">
                      <div className="quickcount-row">
                        <span>Kandidat 01</span>
                        <span>{tpsDetailData.quick_count.kandidat_1} suara</span>
                      </div>
                      <div className="quickcount-row">
                        <span>Kandidat 02</span>
                        <span>{tpsDetailData.quick_count.kandidat_2} suara</span>
                      </div>
                      <div className="quickcount-row">
                        <span>Kandidat 03</span>
                        <span>{tpsDetailData.quick_count.kandidat_3} suara</span>
                      </div>
                      <div className="quickcount-row" style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                        <span>Suara Tidak Sah</span>
                        <span>{tpsDetailData.quick_count.suara_tidak_sah} suara</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Status Laporan:</span>
                        {tpsDetailData.quick_count.status === 'final' ? (
                          <span className="badge badge-success">Final (LOCKED)</span>
                        ) : (
                          <span className="badge badge-warning">Draft</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>KPPS belum menginput data Quick Count.</div>
                  )}
                </div>

                <div className="card">
                  <h3 style={{ fontWeight: '700', marginBottom: '16px' }}>Log Sinkronisasi Device KPPS</h3>
                  <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {tpsDetailData.recent_syncs.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {tpsDetailData.recent_syncs.map((log: any) => (
                          <div key={log.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px', fontSize: '0.8rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600' }}>
                              <span style={{ color: 'var(--primary)' }}>
                                {log.action === 'voter_checkin' ? 'Kehadiran Sync' : 'Quick Count Sync'}
                              </span>
                              <span style={{ color: 'var(--text-muted)' }}>
                                {new Date(log.waktu_sync).toLocaleTimeString('id-ID')}
                              </span>
                            </div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>
                              Device ID: {log.device_id.substring(0, 12)}...
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '10px 0', fontSize: '0.875rem' }}>Belum ada log sync.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PAGE 3: DPT LIST */}
        {page === 'dpt' && (
          <div>
            <div className="section-header">
              <div>
                <h1 className="section-title">Daftar Pemilih Tetap (DPT)</h1>
                <p className="section-desc">Kelola dan impor seluruh pemilih wilayah Gentan.</p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setIsImportModalOpen(true)} className="btn btn-secondary">
                  <Icons.Upload />
                  <span>Impor CSV Bulk</span>
                </button>
                <button onClick={() => {
                  setEditingDpt(null);
                  setDptFormNik('');
                  setDptFormNama('');
                  setDptFormTps('');
                  setIsDptModalOpen(true);
                }} className="btn btn-primary">
                  <Icons.Plus />
                  <span>Tambah Pemilih</span>
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', backgroundColor: 'var(--surface)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexGrow: 1, border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', gap: '8px', alignItems: 'center', backgroundColor: 'var(--background)' }}>
                <Icons.Search />
                <input
                  type="text"
                  placeholder="Cari berdasarkan NIK atau Nama Pemilih..."
                  style={{ border: 'none', outline: 'none', background: 'none', width: '100%', fontSize: '0.875rem' }}
                  value={dptSearch}
                  onChange={e => {
                    setDptSearch(e.target.value);
                    setDptPage(1);
                  }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Filter TPS:</label>
                <select
                  className="form-control"
                  style={{ width: '180px', padding: '8px 12px' }}
                  value={dptTpsFilter}
                  onChange={e => {
                    setDptTpsFilter(e.target.value);
                    setDptPage(1);
                  }}
                >
                  <option value="">Semua TPS</option>
                  {tpsList.map(t => (
                    <option key={t.id} value={t.id}>{t.nama}</option>
                  ))}
                </select>
              </div>
            </div>

            {dptLoading && <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '16px' }}>Memuat data pemilih...</div>}

            {dptData && (
              <>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>NIK</th>
                        <th>Nama Pemilih</th>
                        <th>TPS Terdaftar</th>
                        <th>Kehadiran</th>
                        <th>Waktu Check-in</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dptData.data.map((v: any) => (
                        <tr key={v.nik}>
                          <td style={{ fontFamily: 'monospace', fontWeight: '500' }}>{v.nik}</td>
                          <td style={{ fontWeight: '600' }}>{v.nama}</td>
                          <td>{v.tps?.nama || `TPS ID: ${v.tps_id}`}</td>
                          <td>
                            {v.status_hadir ? (
                              <span className="badge badge-success">Hadir</span>
                            ) : (
                              <span className="badge badge-danger">Belum Hadir</span>
                            )}
                          </td>
                          <td style={{ color: 'var(--text-muted)' }}>
                            {v.waktu_checkin ? new Date(v.waktu_checkin).toLocaleString('id-ID') : '-'}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                onClick={() => fetchQrCode(v.nik, v.nama)}
                                className="btn btn-secondary"
                                style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--primary)' }}
                              >
                                Lihat QR
                              </button>
                              <button
                                  onClick={() => {
                                    setEditingDpt(v);
                                    setDptFormNik(v.nik);
                                    setDptFormNama(v.nama);
                                    setDptFormTps(String(v.tps_id));
                                    setIsDptModalOpen(true);
                                    fetchEditingQr(v.nik);
                                  }}
                                  className="btn btn-secondary"
                                  style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteDpt(v.nik)}
                                  className="btn btn-secondary"
                                  style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--danger)' }}
                                >
                                  Hapus
                                </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {dptData.data.length === 0 && (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Tidak ditemukan data pemilih.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="pagination">
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    Menampilkan Halaman {dptData.current_page} dari {dptData.last_page} ({dptData.total} pemilih)
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      disabled={dptData.current_page === 1}
                      onClick={() => setDptPage(prev => Math.max(1, prev - 1))}
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    >
                      Sebelumnya
                    </button>
                    <button
                      disabled={dptData.current_page === dptData.last_page}
                      onClick={() => setDptPage(prev => Math.min(dptData.last_page, prev + 1))}
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    >
                      Selanjutnya
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* PAGE 4: KPPS ACCOUNTS */}
        {page === 'kpps' && (
          <div>
            <div className="section-header">
              <div>
                <h1 className="section-title">Manajemen Akun KPPS</h1>
                <p className="section-desc">Provision akun KPPS (1 akun per TPS) untuk log in di aplikasi Android lapangan.</p>
              </div>
              <button onClick={() => setIsKppsModalOpen(true)} className="btn btn-primary">
                <Icons.Plus />
                <span>Buat Akun KPPS</span>
              </button>
            </div>

            {kppsLoading && <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '16px' }}>Memuat data...</div>}

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Hak Akses / Peran</th>
                    <th>Asosiasi TPS</th>
                    <th>Dibuat Tanggal</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {kppsUsers.map((u: any) => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: '600' }}>{u.username}</td>
                      <td>
                        {u.kpps_role === 'validasi' ? (
                          <span className="badge badge-secondary" style={{ backgroundColor: 'oklch(0.92 0.02 240)', color: 'oklch(0.40 0.10 240)' }}>Hanya Validasi</span>
                        ) : (
                          <span className="badge badge-success" style={{ backgroundColor: 'oklch(0.92 0.05 160)', color: 'oklch(0.35 0.15 160)' }}>Validasi & Quick Count</span>
                        )}
                      </td>
                      <td>{u.tps?.nama || 'Tidak Terhubung'}</td>
                      <td>{new Date(u.created_at).toLocaleString('id-ID')}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => {
                              setResetUser(u);
                              setResetPasswordVal('');
                              setIsResetModalOpen(true);
                            }}
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                          >
                            Reset Password
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--danger)' }}
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {kppsUsers.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada akun KPPS terdaftar.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* MODAL 1: ADD TPS */}
      {isTpsModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Tambah TPS Baru</h2>
              <button onClick={() => setIsTpsModalOpen(false)} className="modal-close"><Icons.Close /></button>
            </div>
            <form onSubmit={handleCreateTps}>
              <div className="form-group">
                <label className="form-label">Nama TPS</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="Contoh: TPS 04"
                  value={tpsName}
                  onChange={e => setTpsName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Wilayah / Alamat</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="Contoh: Gentan RT 04 / RW 01"
                  value={tpsRegion}
                  onChange={e => setTpsRegion(e.target.value)}
                />
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setIsTpsModalOpen(false)} className="btn btn-secondary">Batal</button>
                <button type="submit" className="btn btn-primary">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD/EDIT DPT */}
      {isDptModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">{editingDpt ? 'Edit Data Pemilih' : 'Tambah Pemilih Baru'}</h2>
              <button onClick={() => setIsDptModalOpen(false)} className="modal-close"><Icons.Close /></button>
            </div>
            <form onSubmit={handleSaveDpt}>
              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '240px' }}>
                  <div className="form-group">
                    <label className="form-label">NIK (16 Digit)</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      maxLength={16}
                      minLength={16}
                      disabled={!!editingDpt}
                      placeholder="Masukkan 16 digit NIK"
                      value={dptFormNik}
                      onChange={e => setDptFormNik(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nama Lengkap</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="Masukkan nama lengkap pemilih"
                      value={dptFormNama}
                      onChange={e => setDptFormNama(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Alokasi TPS</label>
                    <select
                      className="form-control"
                      required
                      value={dptFormTps}
                      onChange={e => setDptFormTps(e.target.value)}
                    >
                      <option value="">Pilih TPS...</option>
                      {tpsList.map(t => (
                        <option key={t.id} value={t.id}>{t.nama} ({t.wilayah})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {editingDpt && (
                  <div style={{ width: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderLeft: '1px solid var(--border)', paddingLeft: '24px' }}>
                    <label className="form-label" style={{ textAlign: 'center', width: '100%', fontWeight: '600', marginBottom: '12px' }}>QR Code Pemilih</label>
                    {editingQrCode ? (
                      <>
                        <img src={editingQrCode} alt="Voter QR" style={{ width: '140px', height: '140px', display: 'block', marginBottom: '12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '4px' }} />
                        <button 
                          type="button" 
                          onClick={() => downloadQrCode(editingQrCode, dptFormNama)}
                          className="btn btn-secondary" 
                          style={{ fontSize: '0.75rem', width: '100%', padding: '6px 8px', color: 'var(--primary)' }}
                        >
                          Unduh QR
                        </button>
                      </>
                    ) : (
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Memuat QR...</p>
                    )}
                  </div>
                )}
              </div>
              <div className="modal-footer" style={{ marginTop: '24px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                <button type="button" onClick={() => setIsDptModalOpen(false)} className="btn btn-secondary">Batal</button>
                <button type="submit" className="btn btn-primary">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: IMPORT DPT CSV */}
      {isImportModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '600px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Bulk Import DPT via CSV</h2>
              <button onClick={() => {
                setIsImportModalOpen(false);
                setImportStatus(null);
                setImportFile(null);
              }} className="modal-close"><Icons.Close /></button>
            </div>
            <form onSubmit={handleImportCsv}>
              <div style={{ backgroundColor: 'var(--surface-alt)', padding: '16px', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                <p style={{ fontWeight: '700', marginBottom: '8px' }}>Aturan Format File CSV:</p>
                <ul style={{ marginLeft: '16px' }}>
                  <li>File harus memiliki baris header di awal.</li>
                  <li>Wajib memuat kolom: <strong>NIK</strong> dan <strong>NAMA_LGKP</strong> (atau <strong>Nama</strong>).</li>
                  <li>Mendukung pemetaan kolom opsional seperti <strong>NO_TPS</strong> atau <strong>TPS</strong>.</li>
                  <li>Jika kolom TPS tidak ditemukan, sistem otomatis mengidentifikasinya dari nama berkas (contoh: <code>tps_02.csv</code> akan otomatis masuk ke TPS 02) atau default ke <strong>TPS 01</strong>.</li>
                  <li><strong>NIK</strong> harus bernilai tepat 16 digit angka.</li>
                </ul>
              </div>

              <div className="form-group">
                <label className="form-label">Pilih File CSV</label>
                <input
                  type="file"
                  accept=".csv,.txt"
                  className="form-control"
                  required
                  onChange={e => setImportFile(e.target.files?.[0] || null)}
                />
              </div>

              {importStatus && (
                <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '20px', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', ... (importStatus.success ? { backgroundColor: 'var(--success-light)', color: 'var(--success)' } : { backgroundColor: 'var(--danger-light)', color: 'var(--danger)' }) }}>
                  {importStatus.success && <p style={{ fontWeight: '700' }}>{importStatus.success}</p>}
                  {importStatus.errors && importStatus.errors.length > 0 && (
                    <div>
                      <p style={{ fontWeight: '700' }}>Detail Log Masalah / Error:</p>
                      <ul style={{ marginLeft: '12px', marginTop: '4px' }}>
                        {importStatus.errors.map((err, i) => <li key={i}>{err}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div className="modal-footer">
                <button type="button" onClick={() => {
                  setIsImportModalOpen(false);
                  setImportStatus(null);
                  setImportFile(null);
                }} className="btn btn-secondary" disabled={importLoading}>Tutup</button>
                <button type="submit" className="btn btn-primary" disabled={!importFile || importLoading}>
                  {importLoading ? 'Memproses...' : 'Mulai Unggah & Impor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: CREATE KPPS USER */}
      {isKppsModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Buat Akun KPPS Baru</h2>
              <button onClick={() => setIsKppsModalOpen(false)} className="modal-close"><Icons.Close /></button>
            </div>
            <form onSubmit={handleCreateKpps}>
              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="Contoh: kpps04"
                  value={kppsFormUsername}
                  onChange={e => setKppsFormUsername(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-control"
                  required
                  minLength={6}
                  placeholder="Minimal 6 karakter"
                  value={kppsFormPassword}
                  onChange={e => setKppsFormPassword(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Asosiasi TPS</label>
                <select
                  className="form-control"
                  required
                  value={kppsFormTps}
                  onChange={e => setKppsFormTps(e.target.value)}
                >
                  <option value="">Pilih TPS...</option>
                  {tpsList.map(t => (
                    <option key={t.id} value={t.id}>{t.nama} ({t.wilayah})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Hak Akses / Peran</label>
                <select
                  className="form-control"
                  required
                  value={kppsFormRole}
                  onChange={e => setKppsFormRole(e.target.value)}
                >
                  <option value="full">Validasi & Quick Count (Akses Penuh)</option>
                  <option value="validasi">Hanya Validasi Kehadiran (Check-in)</option>
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setIsKppsModalOpen(false)} className="btn btn-secondary">Batal</button>
                <button type="submit" className="btn btn-primary">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: RESET PASSWORD */}
      {isResetModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Reset Password</h2>
              <button onClick={() => setIsResetModalOpen(false)} className="modal-close"><Icons.Close /></button>
            </div>
            <form onSubmit={handleResetPassword}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Ganti password untuk akun KPPS: <strong>{resetUser?.username}</strong>
              </p>
              <div className="form-group">
                <label className="form-label">Password Baru</label>
                <input
                  type="password"
                  className="form-control"
                  required
                  minLength={6}
                  placeholder="Masukkan password baru (min 6 karakter)"
                  value={resetPasswordVal}
                  onChange={e => setResetPasswordVal(e.target.value)}
                />
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setIsResetModalOpen(false)} className="btn btn-secondary">Batal</button>
                <button type="submit" className="btn btn-primary">Simpan Password</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL 6: VIEW/PRINT QR CODE */}
      {isQrModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ textAlign: 'center', maxWidth: '360px' }}>
            <div className="modal-header">
              <h2 className="modal-title">QR Code Pemilih</h2>
              <button onClick={() => {
                setIsQrModalOpen(false);
                setSelectedVoterQr(null);
              }} className="modal-close"><Icons.Close /></button>
            </div>
            <div style={{ marginTop: '16px', marginBottom: '24px' }}>
              <p style={{ fontWeight: '600', marginBottom: '16px' }}>{selectedVoterName}</p>
              {selectedVoterQr ? (
                <img src={selectedVoterQr} alt="QR Code Pemilih" style={{ width: '220px', height: '220px', display: 'block', margin: '0 auto' }} />
              ) : (
                <p>Memuat...</p>
              )}
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '16px' }}>
                QR Code ini unik dan hanya dapat digunakan sekali untuk memvalidasi kehadiran di TPS.
              </p>
            </div>
            <div className="modal-footer" style={{ justifyContent: 'center', gap: '8px' }}>
              <button 
                type="button" 
                onClick={() => downloadQrCode(selectedVoterQr!, selectedVoterName)} 
                className="btn btn-secondary"
              >
                Unduh Gambar QR
              </button>
              <button 
                type="button" 
                onClick={() => {
                  const win = window.open();
                  if (win) {
                    win.document.write(`<div style="text-align:center;font-family:sans-serif;padding:40px;"><h2>KPPS GENTAN - KARTU PEMILIH</h2><h3>${selectedVoterName}</h3><img src="${selectedVoterQr}" style="width:300px;height:300px;margin-top:20px;"/><p style="margin-top:20px;font-size:14px;color:#666;">Harap bawa kode QR ini saat datang ke TPS untuk check-in.</p></div>`);
                    win.print();
                    win.close();
                  }
                }} 
                className="btn btn-primary"
              >
                Cetak Kartu QR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 7: ADD DPT SUCCESS AND QR DISPLAY */}
      {newVoterSuccess && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ textAlign: 'center', maxWidth: '380px' }}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ color: 'var(--success)' }}>Pemilih Ditambahkan</h2>
              <button onClick={() => setNewVoterSuccess(null)} className="modal-close"><Icons.Close /></button>
            </div>
            <div style={{ marginTop: '16px', marginBottom: '24px' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Pemilih baru telah berhasil didaftarkan ke database.
              </p>
              <div style={{ marginTop: '16px', padding: '16px', backgroundColor: 'var(--surface-alt)', borderRadius: 'var(--radius-md)' }}>
                <p style={{ fontWeight: '700', fontSize: '1.05rem', color: 'var(--text)' }}>{newVoterSuccess.nama}</p>
                <p style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--text-muted)', marginTop: '4px' }}>NIK: {newVoterSuccess.nik}</p>
              </div>
              <div style={{ marginTop: '20px' }}>
                <img 
                  src={newVoterSuccess.qrcode} 
                  alt="QR Code Baru" 
                  style={{ width: '180px', height: '180px', display: 'block', margin: '0 auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '6px' }} 
                />
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '16px' }}>
                Harap cetak atau unduh QR Code ini untuk diserahkan kepada pemilih sebagai kartu check-in TPS.
              </p>
            </div>
            <div className="modal-footer" style={{ justifyContent: 'center', gap: '8px' }}>
              <button 
                type="button" 
                onClick={() => downloadQrCode(newVoterSuccess.qrcode, newVoterSuccess.nama)} 
                className="btn btn-secondary"
              >
                Unduh Gambar QR
              </button>
              <button 
                type="button" 
                onClick={() => {
                  const win = window.open();
                  if (win) {
                    win.document.write(`<div style="text-align:center;font-family:sans-serif;padding:40px;"><h2>KPPS GENTAN - KARTU PEMILIH</h2><h3>${newVoterSuccess.nama}</h3><img src="${newVoterSuccess.qrcode}" style="width:300px;height:300px;margin-top:20px;"/><p style="margin-top:20px;font-size:14px;color:#666;">Harap bawa kode QR ini saat datang ke TPS untuk check-in.</p></div>`);
                    win.print();
                    win.close();
                  }
                }} 
                className="btn btn-primary"
              >
                Cetak Kartu QR
              </button>
            </div>
            <div style={{ marginTop: '12px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
              <button type="button" onClick={() => setNewVoterSuccess(null)} className="btn btn-secondary" style={{ width: '100%' }}>Selesai & Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Utility rounding
function roundVal(v: number) {
  return Math.round(v * 100) / 100;
}
