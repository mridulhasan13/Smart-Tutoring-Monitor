
import React, { useState } from 'react';
import { View } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeView: View;
  setView: (view: View, studentId?: string) => void;
  onLogout: () => void;
  profile?: { name?: string; email?: string; avatarUrl?: string };
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, setView, onLogout, profile }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const menuItems: { id: View; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-layer-group' },
    { id: 'students', label: 'Students', icon: 'fa-user-graduate' },
    { id: 'sessions', label: 'Session Logs', icon: 'fa-clock-rotate-left' },
    { id: 'payments', label: 'Finance', icon: 'fa-file-invoice-dollar' },
    { id: 'communications', label: 'Comms Center', icon: 'fa-paper-plane' },
    { id: 'insights', label: 'AI Insights', icon: 'fa-brain' },
    { id: 'logs', label: 'Security Logs', icon: 'fa-shield-halved' },
    { id: 'settings', label: 'Settings', icon: 'fa-cog' },
  ];

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col md:flex-row bg-[#f8fafc] dark:bg-[#020617] transition-colors duration-300">

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#020617] text-white shadow-lg sticky top-0 z-50 pt-[env(safe-area-inset-top,1rem)]">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-3 -ml-2 relative z-50 active:scale-95 transition-transform"
          aria-label="Toggle Menu"
        >
          <i className={`fas ${isSidebarOpen ? 'fa-times' : 'fa-bars-staggered'} text-xl`}></i>
        </button>
        <div
          onClick={() => {
            setView('dashboard');
            setIsSidebarOpen(false);
          }}
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity active:scale-95"
        >
          <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
          <h1 className={`text-xl font-bold tracking-tight transition-opacity duration-300 ${isSidebarOpen ? 'opacity-0' : 'opacity-100'}`}>Smart Tutoring Monitor</h1>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden animate-in fade-in duration-300"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar - NOW SCROLLABLE FOR MOBILE ACCESSIBILITY */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 transition duration-300 ease-in-out
        w-64 bg-[#020617] text-slate-100 flex flex-col h-[100dvh] shrink-0 shadow-xl md:shadow-none
        overflow-y-auto custom-scrollbar
      `}>
        <div
          className="p-8 block shrink-0 cursor-pointer group"
          onClick={() => {
            setView('dashboard');
            setIsSidebarOpen(false);
          }}
        >
          <h1 className="text-xl font-black text-white flex items-center gap-3 tracking-tighter uppercase group-hover:text-blue-400 transition-colors">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain transition-transform group-hover:scale-110" />
            Smart Tutoring Monitor
          </h1>
          <div className="h-px w-full bg-slate-800 mt-6 opacity-30"></div>
        </div>

        <nav className="px-4 space-y-1.5 mt-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setView(item.id);
                setIsSidebarOpen(false);
              }}
              className={`
                w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all
                ${activeView === item.id ? 'bg-blue-600/20 text-blue-400 shadow-sm' : 'hover:bg-white/5 text-slate-400'}
              `}
            >
              <i className={`fas ${item.icon} w-5 text-center`}></i>
              <span className="text-sm font-semibold tracking-wide">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6 shrink-0 mt-auto">
          <div className="p-4 bg-slate-800/30 border border-slate-700/30 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold uppercase overflow-hidden border border-white/10 shadow-inner">
              {profile?.avatarUrl ? (
                <img src={profile.avatarUrl} alt="Me" className="w-full h-full object-cover" />
              ) : (
                profile?.name?.charAt(0) || profile?.email?.charAt(0) || 'U'
              )}
            </div>
            <div className="overflow-hidden text-left flex-1">
              <p className="text-sm font-bold text-white truncate leading-tight">
                {profile?.name || 'Admin Portal'}
              </p>
              <p className="text-[10px] text-slate-500 truncate mt-0.5">{profile?.email}</p>
              <button
                onClick={onLogout}
                className="text-[10px] text-slate-500 hover:text-blue-400 transition-colors uppercase font-black tracking-widest mt-2 flex items-center gap-1"
              >
                <i className="fas fa-power-off text-[8px]"></i>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area - Independently Scrollable */}
      <main className="flex-1 overflow-y-auto h-full md:ml-64 bg-[#f8fafc] dark:bg-[#020617] transition-colors duration-300 overscroll-none">
        <div className="p-6 md:p-12 max-w-7xl mx-auto min-h-full pb-[env(safe-area-inset-bottom,2rem)]">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
