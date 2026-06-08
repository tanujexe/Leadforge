import React, { useState } from 'react';
import { BarChart2, Search, Database, Menu, X, History, Shield, LogOut, Activity } from 'lucide-react';
import { useAppConfig } from '../hooks/useLeads';

const LogoIcon = ({ className = "w-9 h-9" }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M 14.5 7.5 A 5 5 0 1 0 14.5 14.5 M 14.5 14.5 L 19.5 19.5" 
      stroke="currentColor" 
      strokeWidth="2.2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <text 
      x="10.8" 
      y="11.2" 
      fill="#3B82F6" 
      fontFamily="Outfit, 'Space Grotesk', Inter, system-ui, sans-serif" 
      fontSize="7.5" 
      fontWeight="900" 
      textAnchor="middle" 
      dominantBaseline="central"
    >S</text>
  </svg>
);

export default function Layout({ activeTab, setActiveTab, user = { name: 'Scout Admin', role: 'Admin', email: 'dev@clientscout.app' }, onLogout, children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: config } = useAppConfig();

  const navItems = [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart2 },
    { id: 'management', name: 'Management CRM', icon: Activity },
    { id: 'search', name: 'Find Leads', icon: Search },
    { id: 'history', name: 'Scan History', icon: History },
    { id: 'database', name: 'Lead Database', icon: Database },
  ];

  // Dynamically add Team & Trash tab for Admin users
  if (user?.role === 'Admin') {
    navItems.push({ id: 'team', name: 'Team & Trash', icon: Shield });
  }

  const handleNavClick = (id) => {
    setActiveTab(id);
    setMobileMenuOpen(false); // Auto-close drawer on mobile
  };

  const renderProfileFooter = () => (
    <div className="p-4 border-t border-border bg-[#111113]/10 flex flex-col gap-2.5">
      <div className="flex items-center gap-3">
        {user?.picture ? (
          <img 
            src={user.picture} 
            alt={user.name} 
            className="w-8 h-8 rounded-full border border-border object-cover" 
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary font-extrabold text-xs font-brand">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'CS'}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-bold text-text truncate font-brand leading-none">
            {user?.name || 'Scout User'}
          </h4>
          <span className="text-[9px] text-text-muted font-semibold tracking-wider mt-0.5 inline-block">
            {user?.role === 'Admin' ? 'Admin Access' : 'Scout Pro'}
          </span>
        </div>
        <button 
          onClick={onLogout} 
          title="Log Out"
          className="p-1.5 hover:bg-red-500/10 text-text-secondary hover:text-red-400 rounded-lg transition-colors cursor-pointer"
        >
          <LogOut size={14} />
        </button>
      </div>
      
      {/* Show scan limits/quotas for users */}
      {user?.role !== 'Admin' && (
        <div className="bg-zinc-950/40 border border-zinc-800/80 rounded-lg p-1.5 px-2.5 text-[9px] text-zinc-400 flex items-center justify-between font-mono">
          <span>Scans Today:</span>
          <span className="font-bold text-zinc-200">
            {user?.dailyScansUsed || 0} / {user?.dailyScanLimit || 5}
          </span>
        </div>
      )}
      
      <div className="flex justify-between items-center text-[9px] text-text-muted font-mono pt-1 border-t border-border/10">
        <span>Version 1.0.0</span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
          <span>Online</span>
        </span>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-screen bg-background text-text overflow-hidden font-sans flex-col lg:flex-row">
      
      {/* Mobile Header (Hidden on Desktop) */}
      <header className="h-16 lg:hidden border-b border-border bg-card px-4 flex items-center justify-between select-none">
        <div className="flex items-center gap-3">
          <LogoIcon className="w-8 h-8" />
          <span className="font-display font-black tracking-widest uppercase text-base text-[#F8FAFC]">CLIENT<span className="text-[#3B82F6]">SCOUT</span></span>
        </div>
        
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 hover:bg-elevated rounded border border-border text-text-secondary hover:text-text transition-all"
        >
          {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </header>

      {/* Desktop Sidebar (Hidden on Mobile) */}
      <aside className="hidden lg:flex w-64 bg-card border-r border-border flex-col justify-between select-none">
        <div>
          {/* Logo Header */}
          <div className="h-20 px-6 border-b border-border flex items-center gap-3.5">
            <LogoIcon className="w-9 h-9" />
            <div className="flex flex-col justify-center">
              <span className="font-display font-black tracking-widest uppercase text-[17px] text-[#F8FAFC] leading-none">CLIENT<span className="text-[#3B82F6]">SCOUT</span></span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? 'bg-primary text-text shadow-sm'
                      : 'text-text-secondary hover:bg-elevated hover:text-text'
                  }`}
                >
                  <Icon size={16} />
                  {item.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Account Profile Info */}
        {renderProfileFooter()}
      </aside>

      {/* Mobile Drawer Navigation (Overlay menu) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div 
            className="fixed inset-0 bg-background/85 backdrop-blur-sm animate-fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-64 bg-card border-r border-border h-full flex flex-col justify-between z-10 animate-slide-in-left select-none">
            <div>
              <div className="h-16 px-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <LogoIcon className="w-8 h-8" />
                  <span className="font-display font-black tracking-widest uppercase text-base text-[#F8FAFC]">CLIENT<span className="text-[#3B82F6]">SCOUT</span></span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1.5 hover:bg-elevated rounded border border-border/40 text-text-secondary hover:text-text transition-all">
                  <X size={16} />
                </button>
              </div>

              <nav className="p-4 space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all ${
                        isActive
                          ? 'bg-primary text-text shadow-md'
                          : 'text-text-secondary hover:bg-elevated hover:text-text'
                      }`}
                    >
                      <Icon size={16} />
                      {item.name}
                    </button>
                  );
                })}
              </nav>
            </div>
            
            {/* Footer Account Profile Info */}
            {renderProfileFooter()}
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-background">
        
        {/* Desktop Header Title */}
        <header className="hidden lg:flex h-14 border-b border-border px-8 items-center justify-between bg-card/20 select-none">
          <h1 className="text-sm font-bold text-text uppercase tracking-wider">
            {activeTab === 'search' ? 'Scanner Controller' : activeTab === 'database' ? 'Lead Directory' : activeTab === 'history' ? 'Scan History' : activeTab === 'management' ? 'Management Dashboard' : activeTab === 'team' ? 'Team Control Panel' : 'Control Center'}
          </h1>
          <div className="flex items-center gap-4 text-xs font-mono text-text-muted">
            <span>Server Status: Active</span>
          </div>
        </header>
        
        {/* Child Pages Panel */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

