import React, { useState } from 'react';
import { BarChart2, Search, Database, Menu, X, History } from 'lucide-react';
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

export default function Layout({ activeTab, setActiveTab, children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: config } = useAppConfig();

  const navItems = [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart2 },
    { id: 'search', name: 'Find Leads', icon: Search },
    { id: 'history', name: 'Scan History', icon: History },
    { id: 'database', name: 'Lead Database', icon: Database },
  ];

  const handleNavClick = (id) => {
    setActiveTab(id);
    setMobileMenuOpen(false); // Auto-close drawer on mobile
  };

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

        {/* Footer Connections Info */}
        <div className="p-4 border-t border-border bg-[#111113]/30 text-[10px] text-text-muted space-y-1.5 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
            <span>API Server: 5000</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
            <span>MongoDB: Connected</span>
          </div>
          {config?.developmentMode && (
            <div className="flex items-center gap-2 border-t border-border/40 pt-1.5 mt-1.5 text-warning font-bold uppercase tracking-wider text-[9px]">
              <span>Development Mode Active</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-[9px] text-text-secondary/70">
            <span className={`w-1.5 h-1.5 rounded-full ${config?.groqEnabled ? 'bg-success' : 'bg-danger/60'}`}></span>
            <span>Groq: {config?.groqEnabled ? 'Enabled' : 'Disabled'}</span>
          </div>
          <div className="flex items-center gap-2 text-[9px] text-text-secondary/70">
            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
            <span>Apify: Protected</span>
          </div>
        </div>
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
            
            <div className="p-4 border-t border-border bg-[#111113]/30 text-[10px] text-text-muted space-y-1.5 font-mono">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
                <span>API Server: Active</span>
              </div>
              {config?.developmentMode && (
                <div className="text-warning font-bold text-[9px] uppercase tracking-wider">
                  Development Mode Active
                </div>
              )}
              <div className="flex items-center gap-2 text-[9px]">
                <span className={`w-1.5 h-1.5 rounded-full ${config?.groqEnabled ? 'bg-success' : 'bg-danger/60'}`}></span>
                <span>Groq: {config?.groqEnabled ? 'Enabled' : 'Disabled'}</span>
              </div>
              <div className="flex items-center gap-2 text-[9px]">
                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                <span>Apify: Protected</span>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-background">
        
        {/* Desktop Header Title */}
        <header className="hidden lg:flex h-14 border-b border-border px-8 items-center justify-between bg-card/20 select-none">
          <h1 className="text-sm font-bold text-text uppercase tracking-wider">
            {activeTab === 'search' ? 'Scanner Controller' : activeTab === 'database' ? 'Lead Directory' : activeTab === 'history' ? 'Scan History' : 'Control Center'}
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
