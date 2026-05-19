import React from 'react';

export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen flex bg-[#09090b] text-white font-sans selection:bg-blue-500/30">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 glass-panel border-r border-white/[0.05] hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-white/[0.05]">
          <div className="w-8 h-8 rounded bg-gradient-to-tr from-blue-500 to-emerald-400 mr-3 shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
          <span className="font-bold text-xl tracking-tight">DeployIQ</span>
        </div>
        <nav className="flex-1 py-6 px-4 space-y-2">
          {['Dashboard', 'Deployments', 'Services', 'Monitoring', 'Settings'].map((item, idx) => (
            <a
              key={idx}
              href="#"
              className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${
                idx === 0 
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                  : 'text-gray-400 hover:text-white hover:bg-white/[0.02]'
              }`}
            >
              <span className="font-medium text-sm">{item}</span>
            </a>
          ))}
        </nav>
        <div className="p-4 border-t border-white/[0.05]">
          <div className="flex items-center space-x-3 px-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 p-[2px]">
              <div className="w-full h-full bg-[#09090b] rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-white">AD</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium">Admin User</p>
              <p className="text-xs text-gray-500">admin@deployiq.edu</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Navbar for Mobile/Global Actions */}
        <header className="h-16 glass-panel border-b border-white/[0.05] flex items-center justify-between px-4 md:px-8 shrink-0 shadow-sm z-10">
          <div className="md:hidden flex items-center">
            <div className="w-6 h-6 rounded bg-gradient-to-tr from-blue-500 to-emerald-400 mr-2"></div>
            <span className="font-bold">DeployIQ</span>
          </div>
          <div className="hidden md:block"></div>
          <div className="flex items-center space-x-4">
            <button className="text-gray-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
