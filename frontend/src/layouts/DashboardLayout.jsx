import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate, useLocation } from 'react-router-dom';

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Projects', path: '/projects' },
    { label: 'Deployments', path: '/deployments' },
    { label: 'Monitoring', path: '/monitoring' },
    { label: 'Logs', path: '/logs' },
    { label: 'Settings', path: '/settings' },
  ];

  return (
    <div className="min-h-screen flex bg-[#1a1a1a] text-[#f5f5f5] font-mono selection:bg-white/10 selection:text-white">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-[#242424] border-r border-white/5 hidden md:flex flex-col">
        {/* Brand / Logo */}
        <div className="h-16 flex items-center px-6 border-b border-white/5 bg-[#202020]">
          <div className="w-8 h-8 rounded border border-white/20 bg-white/5 text-white font-bold text-sm flex items-center justify-center mr-3">
            IQ
          </div>
          <span className="font-bold text-lg tracking-wider text-white">DeployIQ</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-4 space-y-1.5">
          {navItems.map((item, idx) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <a
                key={idx}
                href={item.path}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(item.path);
                }}
                className={`flex items-center px-4 py-2.5 rounded-lg border transition-all duration-150 ${
                  isActive
                    ? 'bg-white/5 text-white border-white/20 font-semibold'
                    : 'text-gray-400 hover:text-white hover:bg-white/[0.02] border-transparent'
                }`}
              >
                <span className="text-xs mr-2 font-bold text-gray-600">{`0${idx + 1}.`}</span>
                <span className="text-xs">{item.label}</span>
              </a>
            );
          })}
        </nav>

        {/* User profile & Logout */}
        <div className="p-4 border-t border-white/5 bg-[#202020]">
          <div className="flex flex-col space-y-3 px-2">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded bg-[#1a1a1a] border border-white/10 flex items-center justify-center">
                <span className="text-xs font-bold text-white uppercase">
                  {user?.name ? user.name.slice(0, 2) : 'OP'}
                </span>
              </div>
              <div className="overflow-hidden">
                <div className="flex items-center space-x-1">
                  <p className="text-xs font-medium text-white truncate max-w-[120px]">{user?.name || 'Operator'}</p>
                  <span className="text-[9px] bg-white/10 px-1 py-0.5 rounded text-gray-400 font-bold uppercase shrink-0">
                    {user?.role || 'USER'}
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 truncate">{user?.email || 'operator@deployiq.edu'}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full text-left py-1.5 px-3 rounded border border-red-950/40 hover:border-red-900/60 bg-red-950/10 hover:bg-red-950/20 text-red-400 hover:text-red-300 text-[11px] transition-colors cursor-pointer flex items-center space-x-1"
            >
              <span>$ exit /logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-[#242424] border-b border-white/5 flex items-center justify-between px-4 md:px-8 shrink-0 z-10">
          <div className="md:hidden flex items-center">
            <div className="w-6 h-6 rounded bg-white/10 border border-white/20 mr-2 flex items-center justify-center font-bold text-xs text-white">
              IQ
            </div>
            <span className="font-bold text-sm tracking-wider">DeployIQ</span>
          </div>

          {/* Telemetry Status bar for DevOps aesthetic */}
          <div className="hidden md:flex items-center space-x-4 text-[10px] text-gray-500">
            <div className="flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]"></span>
              <span>NODE: online</span>
            </div>
            <span className="text-white/10">|</span>
            <span>CPU: 0.12%</span>
            <span className="text-white/10">|</span>
            <span>RAM: 2.1 GB / 8.0 GB</span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="md:hidden flex items-center space-x-2">
              <span className="text-xs text-gray-400 truncate max-w-[100px]">{user?.name}</span>
              <button 
                onClick={handleLogout}
                className="text-[10px] border border-red-950 px-2 py-0.5 rounded text-red-400 hover:bg-red-950/20"
              >
                Logout
              </button>
            </div>
            
            <span className="text-[11px] text-gray-500 font-mono hidden md:block">
              {`session: active_jwt`}
            </span>
          </div>
        </header>

        {/* Page Content viewport */}
        <div className="flex-1 overflow-auto p-4 md:p-8 bg-[#1a1a1a]">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
