import React from 'react';
import { Icons } from './Icons';

interface SidebarProps {
  path: string;
  user: any;
  navigate: (path: string) => void;
  handleLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  path,
  user,
  navigate,
  handleLogout,
}) => {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img src="/logo.png" alt="Gentara Logo" />
        <span>GENTARA</span>
      </div>

      <nav style={{ flexGrow: 1 }}>
        <ul className="sidebar-menu">
          <li className={`menu-item ${path === '/' || path === '/dashboard' ? 'active' : ''}`}>
            <button onClick={() => navigate('/dashboard')}>
              <Icons.Dashboard />
              <span>Dashboard Monitor</span>
            </button>
          </li>
          <li className={`menu-item ${path.startsWith('/tps') ? 'active' : ''}`}>
            <button onClick={() => navigate('/tps')}>
              <Icons.Tps />
              <span>TPS & Monitoring</span>
            </button>
          </li>
          <li className={`menu-item ${path === '/dpt' ? 'active' : ''}`}>
            <button onClick={() => navigate('/dpt')}>
              <Icons.Voters />
              <span>Data Pemilih (DPT)</span>
            </button>
          </li>
          <li className={`menu-item ${path === '/dpk' ? 'active' : ''}`}>
            <button onClick={() => navigate('/dpk')}>
              <Icons.Voters />
              <span>Pemilih Khusus (DPK)</span>
            </button>
          </li>
          <li className={`menu-item ${path === '/kpps' ? 'active' : ''}`}>
            <button onClick={() => navigate('/kpps')}>
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
  );
};
