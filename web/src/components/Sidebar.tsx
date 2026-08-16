import React from 'react';
import { Icons } from './Icons';

interface SidebarProps {
  path: string;
  user: any;
  navigate: (path: string) => void;
  handleLogout: () => void;
  isCollapsed: boolean;
  toggleCollapsed: () => void;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  path,
  user,
  navigate,
  handleLogout,
  isCollapsed,
  toggleCollapsed,
  isFullscreen,
  toggleFullscreen,
}) => {
  return (
    <aside className="sidebar">
      <div className="sidebar-head">
        <div className="sidebar-brand">
          <img src="/logo.png" alt="Gentara Logo" />
          <span>GENTARA</span>
        </div>
        <button
          type="button"
          className="sidebar-toggle"
          onClick={toggleCollapsed}
          title={isCollapsed ? 'Perlebar menu' : 'Ciutkan menu (layar penuh)'}
          aria-label={isCollapsed ? 'Perlebar menu' : 'Ciutkan menu'}
          aria-expanded={!isCollapsed}
        >
          <Icons.Menu />
        </button>
      </div>

      <nav style={{ flexGrow: 1 }}>
        <ul className="sidebar-menu">
          <li className={`menu-item ${path === '/' || path === '/dashboard' ? 'active' : ''}`}>
            <button onClick={() => navigate('/dashboard')} title="Dashboard Monitor">
              <Icons.Dashboard />
              <span>Dashboard Monitor</span>
            </button>
          </li>
          <li className={`menu-item ${path.startsWith('/tps') ? 'active' : ''}`}>
            <button onClick={() => navigate('/tps')} title="TPS & Monitoring">
              <Icons.Tps />
              <span>TPS & Monitoring</span>
            </button>
          </li>
          <li className={`menu-item ${path === '/pemilih' ? 'active' : ''}`}>
            <button onClick={() => navigate('/pemilih')} title="Data Pemilih (DPT & DPK)">
              <Icons.Voters />
              <span>Data Pemilih</span>
            </button>
          </li>
          <li className={`menu-item ${path === '/kpps' ? 'active' : ''}`}>
            <button onClick={() => navigate('/kpps')} title="Manajemen Akun">
              <Icons.Users />
              <span>Manajemen Akun</span>
            </button>
          </li>
          <li className={`menu-item ${path === '/paslon' ? 'active' : ''}`}>
            <button onClick={() => navigate('/paslon')} title="Pasangan Calon (Paslon)">
              <Icons.Users />
              <span>Pasangan Calon (Paslon)</span>
            </button>
          </li>
        </ul>
      </nav>

      <div className="sidebar-footer">
        <button
          type="button"
          onClick={toggleFullscreen}
          className="btn-fullscreen"
          title={isFullscreen ? 'Keluar dari layar penuh' : 'Layar penuh (F11)'}
          aria-label={isFullscreen ? 'Keluar dari layar penuh' : 'Layar penuh'}
        >
          {isFullscreen ? <Icons.FullscreenExit /> : <Icons.Fullscreen />}
          <span>{isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}</span>
        </button>

        <div className="user-profile" title={`${user?.username || ''} — ${user?.role || ''}`}>
          <div className="avatar">
            {user?.username?.substring(0, 2).toUpperCase() || 'S'}
          </div>
          <div className="user-info">
            <span className="username">{user?.username}</span>
            <span className="role-badge">
              {user?.role === 'sekretariat' && user?.sekretariat_role === 'viewer'
                ? 'Sekretariat — Lihat Saja'
                : user?.role === 'sekretariat'
                  ? 'Admin Sekretariat'
                  : user?.role}
            </span>
          </div>
        </div>
        <button onClick={handleLogout} className="btn-logout" title="Keluar">
          <Icons.Logout />
          <span>Keluar</span>
        </button>

        <div className="app-watermark" title="Support by KKN-7 USH 2026">
          <span className="watermark-full">Support by KKN-7 USH 2026</span>
          <span className="watermark-short">KKN-7</span>
        </div>
      </div>
    </aside>
  );
};
