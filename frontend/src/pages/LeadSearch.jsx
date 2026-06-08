import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, Play, Eye, AlertOctagon, HelpCircle, 
  ChevronDown, Check, Dumbbell, Coffee, Sparkles, 
  Stethoscope, Home, Utensils, Paintbrush, Wrench, 
  Zap, Flower, Shirt, Cake, Bed, Car, Scale, MapPin,
  Globe, Phone, Star, AlertTriangle, AlertCircle,
  Flame, Snowflake, TrendingUp, MessageSquare, Hash
} from 'lucide-react';
import { useStartSearch } from '../hooks/useLeads';
import { searchService } from '../services/api';
import LeadDrawer from '../components/LeadDrawer';

// Map of niches to their respective Lucide icons
const categoryIcons = {
  'Gym': Dumbbell,
  'Cafe': Coffee,
  'Salon': Sparkles,
  'Dentist': Stethoscope,
  'Real Estate': Home,
  'Restaurant': Utensils,
  'Interior Designer': Paintbrush,
  'Plumber': Wrench,
  'Electrician': Zap,
  'Spa': Flower,
  'Boutique': Shirt,
  'Bakery': Cake,
  'Hotel': Bed,
  'Car Service': Car,
  'Lawyer': Scale
};

const categories = [
  { value: 'Gym', label: 'Gym & Fitness' },
  { value: 'Cafe', label: 'Cafe & Coffee' },
  { value: 'Salon', label: 'Salon & Parlour' },
  { value: 'Dentist', label: 'Dentist & Dental' },
  { value: 'Real Estate', label: 'Real Estate' },
  { value: 'Restaurant', label: 'Restaurant & Dining' },
  { value: 'Interior Designer', label: 'Interior Designer' },
  { value: 'Plumber', label: 'Plumber & Piping' },
  { value: 'Electrician', label: 'Electrician & Power' },
  { value: 'Spa', label: 'Spa & Wellness' },
  { value: 'Boutique', label: 'Boutique & Fashion' },
  { value: 'Bakery', label: 'Bakery & Sweets' },
  { value: 'Hotel', label: 'Hotel & Lodging' },
  { value: 'Car Service', label: 'Car Repair & Service' },
  { value: 'Lawyer', label: 'Lawyer & Law Firm' }
];

const cities = [
  { value: 'Bhopal', label: 'Bhopal' },
  { value: 'Indore', label: 'Indore' },
  { value: 'Gwalior', label: 'Gwalior' }
];

/**
 * Beautiful Glassmorphic Custom Select Component
 */
function CustomSelect({ label, value, onChange, options, iconsMap, placeholder, disabled, icon: DefaultIcon }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);
  const SelectedIcon = selectedOption && iconsMap ? iconsMap[selectedOption.value] : null;

  return (
    <div ref={containerRef} className="w-full md:flex-1 space-y-1.5 relative select-none">
      <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted">{label}</label>
      
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-background hover:bg-elevated/40 border border-border rounded-lg px-3.5 py-2 text-xs text-text font-semibold flex items-center justify-between cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed h-9 shadow-sm"
      >
        <div className="flex items-center gap-2">
          {SelectedIcon ? (
            <SelectedIcon size={14} className="text-primary animate-pulse-subtle" />
          ) : DefaultIcon ? (
            <DefaultIcon size={14} className="text-text-secondary" />
          ) : null}
          <span className={selectedOption ? "text-text font-semibold" : "text-text-muted font-medium"}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown size={14} className={`text-text-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-[64px] left-0 right-0 bg-[#141b2b] border border-border rounded-lg shadow-2xl z-50 py-1 max-h-60 overflow-y-auto divide-y divide-border/20 backdrop-blur-md bg-opacity-95 animate-slide-up-subtle">
          {options.map((option) => {
            const OptionIcon = iconsMap ? iconsMap[option.value] : null;
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2.5 text-xs font-semibold flex items-center justify-between transition-all hover:bg-primary/10 hover:text-primary ${isSelected ? 'text-primary bg-primary/5' : 'text-text-secondary'}`}
              >
                <div className="flex items-center gap-2.5">
                  {OptionIcon && <OptionIcon size={14} className={isSelected ? "text-primary" : "text-text-muted"} />}
                  <span>{option.label}</span>
                </div>
                {isSelected && <Check size={12} className="text-primary" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function LeadSearch() {
  const startSearchMutation = useStartSearch();
  const [businessType, setBusinessType] = useState('');
  const [location, setLocation] = useState('');
  const [limit, setLimit] = useState(30);

  const limitOptions = [
    { value: 5, label: '5 Leads' },
    { value: 10, label: '10 Leads' },
    { value: 20, label: '20 Leads' },
    { value: 30, label: '30 Leads (Default)' },
    { value: 40, label: '40 Leads' },
    { value: 50, label: '50 Leads' }
  ];
  
  const [activeSearchId, setActiveSearchId] = useState(null);
  const [searchStatus, setSearchStatus] = useState(null);
  const [leadsList, setLeadsList] = useState([]);
  const [logs, setLogs] = useState([]);
  
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  
  // Setup credentials error state
  const [setupError, setSetupError] = useState(null);

  // Quick stats filter for live results preview
  const [quickFilter, setQuickFilter] = useState(null);

  const getOppBadgeColor = (level) => {
    if (level === 'High') return 'bg-success/10 text-success border-success/20';
    if (level === 'Medium') return 'bg-warning/10 text-warning border-warning/20';
    return 'bg-danger/10 text-danger border-danger/20';
  };

  const getStatusBadgeColor = (status) => {
    if (status === 'Closed') return 'bg-success/20 text-success border-success/30';
    if (status === 'Rejected') return 'bg-danger/20 text-danger border-danger/30';
    if (status === 'Interested' || status === 'Follow Up') return 'bg-warning/20 text-warning border-warning/30';
    if (status === 'Contacted') return 'bg-primary/20 text-primary border-primary/30';
    return 'bg-border/60 text-text-secondary border border-border';
  };

  const getWebsiteStatusColor = (status) => {
    if (status === 'Responsive') return 'bg-success/10 text-success';
    if (status === 'No Website') return 'bg-danger/10 text-danger';
    if (status === 'Offline') return 'bg-danger/20 text-danger';
    return 'bg-warning/10 text-warning';
  };

  // Calculate statistics counts dynamically on the streaming leadsList
  const counts = {
    hot: leadsList.filter(l => l.opportunityLevel === 'High').length,
    warm: leadsList.filter(l => l.opportunityLevel === 'Medium').length,
    cold: leadsList.filter(l => l.opportunityLevel === 'Low').length,
    needWebsite: leadsList.filter(l => !l.website || l.websiteStatus === 'No Website').length,
    needReputation: leadsList.filter(l => (l.rating || 0) < 4.0 || (l.reviewCount || 0) < 15).length,
    needSocial: leadsList.filter(l => !l.website || l.opportunityLevel === 'High').length,
    enriched: leadsList.filter(l => !!l.phone && !!l.website).length
  };

  const filteredLeads = leadsList.filter(lead => {
    if (quickFilter === 'hot') return lead.opportunityLevel === 'High';
    if (quickFilter === 'warm') return lead.opportunityLevel === 'Medium';
    if (quickFilter === 'cold') return lead.opportunityLevel === 'Low';
    if (quickFilter === 'needWebsite') return !lead.website || lead.websiteStatus === 'No Website';
    if (quickFilter === 'needReputation') return (lead.rating || 0) < 4.0 || (lead.reviewCount || 0) < 15;
    if (quickFilter === 'needSocial') return !lead.website || lead.opportunityLevel === 'High';
    if (quickFilter === 'enriched') return !!lead.phone && !!lead.website;
    return true;
  });
  
  const consoleEndRef = useRef(null);

  // Auto-scroll console logs
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Polling hook for background search status
  useEffect(() => {
    if (!activeSearchId) return;

    let pollInterval = setInterval(async () => {
      try {
        const response = await searchService.getStatus(activeSearchId);
        const data = response?.data;
        
        if (!data) return;

        setSearchStatus(data.status);
        setLeadsList(data.leads || []);

        const timestamp = () => `[${new Date().toLocaleTimeString()}]`;
        const newLogs = [];

        if (data.status === 'Scraping' && !logs.some(l => l.toLowerCase().includes('maps actor'))) {
          newLogs.push(`${timestamp()} 📡 Spawning Apify Google Maps Actor for "${data.businessType}" in "${data.location}"...`);
          newLogs.push(`${timestamp()} 🌐 Scraper running in cloud workspace. Gathering coordinates, reviews, and website listings...`);
        }

        if (data.status === 'Auditing' && !logs.some(l => l.toLowerCase().includes('crawler engine'))) {
          newLogs.push(`${timestamp()} 📥 Scrape completed. Found ${data.leadCount} businesses.`);
          newLogs.push(`${timestamp()} 🤖 Bootstrapping lightweight crawler engine...`);
          newLogs.push(`${timestamp()} 🔎 Commencing website audits: testing HTTPS, page responsive viewports, and FCP load speed...`);
        }

        data.leads.forEach(lead => {
          const hasLogged = logs.some(l => l.includes(lead.businessName));
          if (!hasLogged) {
            const auditInfo = lead.website 
              ? `Score: ${lead.websiteScore}/100 (${lead.websiteStatus}, ${(lead.audit?.responseTimeMs / 1000).toFixed(1) || '0'}s)`
              : 'No Website';
            newLogs.push(`${timestamp()} 🛠️ Audited: "${lead.businessName}" -> ${auditInfo}. Recommendation: ${lead.recommendedService}`);
          }
        });

        if (data.status === 'Analyzing' && !logs.some(l => l.toLowerCase().includes('groq'))) {
          newLogs.push(`${timestamp()} 🧠 Passing technical profiles to Groq AI LLM...`);
          newLogs.push(`${timestamp()} ✍️ Writing custom phone call scripts, WhatsApp outreach templates, and landing page audit proposals...`);
        }

        if (data.status === 'Completed') {
          newLogs.push(`${timestamp()} ✅ Scan completed successfully!`);
          newLogs.push(`${timestamp()} 💾 Persisted ${data.leads.length} leads to database.`);
          setLogs(prev => [...prev, ...newLogs]);
          clearInterval(pollInterval);
          setActiveSearchId(null);
          return;
        }

        if (data.status === 'Failed') {
          newLogs.push(`${timestamp()} ❌ Scan failed. Please check your API key tokens or try again.`);
          setLogs(prev => [...prev, ...newLogs]);
          clearInterval(pollInterval);
          setActiveSearchId(null);
          return;
        }

        if (newLogs.length > 0) {
          setLogs(prev => [...prev, ...newLogs]);
        }
      } catch (error) {
        console.error('Polling status failed:', error);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [activeSearchId, logs]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!businessType || !location) return;

    setSetupError(null);
    setLogs([]);
    setLeadsList([]);
    setQuickFilter(null);
    setSearchStatus('Pending');

    const t = `[${new Date().toLocaleTimeString()}]`;
    setLogs([
      `${t} 🚀 Dispatching ClientScout Scan Query...`,
      `${t} 🔎 Business Type: "${businessType}"`,
      `${t} 📍 Location: "${location}"`,
      `${t} 🔢 Limit: ${limit} leads`,
      `${t} 📬 Request received by backend queue.`
    ]);

    startSearchMutation.mutate(
      { businessType, location, limit },
      {
        onSuccess: (res) => {
          if (res.success && res.data?.searchId) {
            setActiveSearchId(res.data.searchId);
          }
        },
        onError: (err) => {
          setSearchStatus(null);
          setLogs([]);
          
          const errData = err.response?.data;
          if (errData && errData.code === 'MISSING_API_CREDENTIALS') {
            setSetupError(errData);
          } else {
            setSetupError({
              message: errData?.message || err.message,
              instructions: {
                apify: 'Please verify that the backend API server is running on port 5000 and the MongoDB database is started.'
              }
            });
          }
        }
      }
    );
  };

  const getStatusLabel = () => {
    if (searchStatus === 'Pending') return 'Queueing Scan...';
    if (searchStatus === 'Scraping') return 'Scraping Google Maps Profiles...';
    if (searchStatus === 'Auditing') return 'Auditing Website Layouts & SEO...';
    if (searchStatus === 'Analyzing') return 'Drafting AI Pitches...';
    return searchStatus;
  };

  return (
    <div className="space-y-6 select-none">
      
      {/* 1. API Credentials Setup Onboarding Block */}
      {setupError && (
        <div className="bg-card border border-danger/30 rounded-lg p-5 space-y-4">
          <div className="flex items-start gap-3 text-danger">
            <AlertOctagon className="flex-shrink-0 mt-0.5" size={18} />
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider">Missing API Credentials</h3>
              <p className="text-xs text-text-secondary mt-1 leading-relaxed">{setupError.message}</p>
            </div>
          </div>

          <div className="border-t border-border pt-3 space-y-3">
            <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
              <HelpCircle size={12} />
              Setup Guide Instructions
            </h4>
            <ol className="text-xs text-text-secondary space-y-2 list-decimal pl-4 leading-relaxed font-sans">
              <li>
                Navigate to the backend directory on your machine:
                <code className="block bg-background px-2.5 py-1 rounded text-text font-mono text-[10px] mt-1 border border-border">
                  cd backend
                </code>
              </li>
              <li>
                Create a <code className="text-text font-mono">.env</code> configuration file:
                <code className="block bg-background px-2.5 py-1 rounded text-text font-mono text-[10px] mt-1 border border-border">
                  copy .env.example .env
                </code>
              </li>
              <li>
                {setupError.instructions?.apify || 'Add your API tokens to the variables inside the .env file.'}
              </li>
              <li>
                Restart the backend developer server:
                <code className="block bg-background px-2.5 py-1 rounded text-text font-mono text-[10px] mt-1 border border-border">
                  npm run dev
                </code>
              </li>
            </ol>
          </div>
          
          <button 
            onClick={() => setSetupError(null)}
            className="border border-border hover:bg-elevated px-3 py-1.5 rounded text-xs font-bold transition-all text-text"
          >
            Acknowledge & Dismiss
          </button>
        </div>
      )}

      {/* 2. Scanner Settings Input Form */}
      <div className="bg-card border border-border rounded-lg p-5">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">Scanner Configuration</h3>
          <p className="text-[10px] text-text-muted mt-0.5">Specify search parameters to dispatch Map crawlers</p>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-4 mt-5 md:items-end">
          
          <CustomSelect
            label="Business Category (Niche)"
            value={businessType}
            onChange={setBusinessType}
            options={categories}
            iconsMap={categoryIcons}
            placeholder="Select Niche..."
            disabled={!!activeSearchId}
            icon={HelpCircle}
          />

          <CustomSelect
            label="City / Location"
            value={location}
            onChange={setLocation}
            options={cities}
            placeholder="Select City..."
            disabled={!!activeSearchId}
            icon={MapPin}
          />

          <CustomSelect
            label="Leads to Find"
            value={limit}
            onChange={setLimit}
            options={limitOptions}
            placeholder="Select limit..."
            disabled={!!activeSearchId}
            icon={Hash}
          />

          <button
            type="submit"
            disabled={startSearchMutation.isPending || !!activeSearchId || !businessType || !location}
            className="w-full md:w-auto bg-primary hover:bg-primary-hover disabled:bg-primary/50 text-text font-bold text-xs px-5 py-2 rounded-lg flex items-center justify-center gap-2 h-9 transition-all cursor-pointer"
          >
            {activeSearchId ? (
              <span className="w-3.5 h-3.5 rounded-full border border-text border-t-transparent animate-spin"></span>
            ) : (
              <Play size={12} />
            )}
            <span>{activeSearchId ? 'Scanning' : 'Find Leads'}</span>
          </button>
        </form>
      </div>

      {/* 3. Scraper Log Console */}
      {searchStatus && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="h-9 px-4 bg-background-secondary border-b border-border flex items-center justify-between font-mono text-[10px]">
            <div className="flex items-center gap-2 text-text-muted">
              <Terminal size={12} />
              <span>Diagnostic Shell Logs</span>
            </div>
            {activeSearchId && (
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse"></span>
                <span className="text-warning font-bold uppercase tracking-wider text-[9px]">{getStatusLabel()}</span>
              </div>
            )}
          </div>
          
          <div className="bg-[#0b0f19] p-4 h-52 overflow-y-auto font-mono text-[10px] text-text-secondary space-y-1.5 select-text leading-relaxed">
            {logs.map((log, idx) => (
              <div key={idx} className="whitespace-pre-wrap">{log}</div>
            ))}
            <div ref={consoleEndRef} />
          </div>
        </div>
      )}

      {/* 4. Live Search Preview (Premium Card Grid View with Real-time Stats) */}
      {leadsList.length > 0 && (
        <div className="space-y-4">
          {/* Quick Stats Toggles for Live Stream */}
          <div className="flex md:grid md:grid-cols-7 gap-1.5 md:gap-3 mb-2 select-none">
            {[
              { id: 'hot', label: 'Hot', icon: Flame, count: counts.hot, color: 'hover:border-success/30 text-success bg-success/5 border-success/20', activeColor: 'border-success text-success bg-success/10 shadow-[0_0_12px_rgba(34,197,94,0.15)]' },
              { id: 'warm', label: 'Warm', icon: Zap, count: counts.warm, color: 'hover:border-warning/30 text-warning bg-warning/5 border-warning/20', activeColor: 'border-warning text-warning bg-warning/10 shadow-[0_0_12px_rgba(245,158,11,0.15)]' },
              { id: 'cold', label: 'Cold', icon: Snowflake, count: counts.cold, color: 'hover:border-danger/30 text-danger bg-danger/5 border-danger/20', activeColor: 'border-danger text-danger bg-danger/10 shadow-[0_0_12px_rgba(239,68,68,0.15)]' },
              { id: 'needWebsite', label: 'No Website', icon: Globe, count: counts.needWebsite, color: 'hover:border-primary/30 text-primary bg-primary/5 border-primary/20', activeColor: 'border-primary text-primary bg-primary/10 shadow-[0_0_12px_rgba(37,99,235,0.15)]' },
              { id: 'needReputation', label: 'Reputation Help', icon: TrendingUp, count: counts.needReputation, color: 'hover:border-warning/30 text-warning bg-warning/5 border-warning/20', activeColor: 'border-warning text-warning bg-warning/10 shadow-[0_0_12px_rgba(245,158,11,0.15)]' },
              { id: 'needSocial', label: 'Social Media', icon: MessageSquare, count: counts.needSocial, color: 'hover:border-primary/30 text-text bg-elevated/40 border-border/40', activeColor: 'border-primary text-primary bg-primary/10 shadow-[0_0_12px_rgba(37,99,235,0.15)] border-primary' },
              { id: 'enriched', label: 'Enriched', icon: Sparkles, count: counts.enriched, color: 'hover:border-success/30 text-success bg-success/5 border-success/20', activeColor: 'border-success text-success bg-success/10 shadow-[0_0_12px_rgba(34,197,94,0.15)]' }
            ].map((item) => {
              const isActive = quickFilter === item.id;
              const IconComponent = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setQuickFilter(isActive ? null : item.id)}
                  className={`flex-1 min-w-0 flex flex-col items-center justify-center p-1.5 md:p-3 rounded-lg md:rounded-xl border text-center transition-all duration-300 cursor-pointer h-12 md:h-20 ${
                    isActive ? item.activeColor : `bg-[#18181B] border-border/50 hover:bg-elevated/10 ${item.color}`
                  }`}
                >
                  <IconComponent className="size-4 md:size-5 mb-0.5 md:mb-1.5" />
                  <span className="hidden md:block text-[10px] font-extrabold uppercase tracking-wider font-brand opacity-90 line-clamp-1">{item.label}</span>
                  <span className="text-[10px] md:text-xs font-mono font-bold mt-0.5 opacity-70 leading-none">{item.count}</span>
                </button>
              );
            })}
          </div>

          <div className="bg-card border border-border rounded-lg p-5">
            <div className="flex items-center justify-between mb-4 border-b border-border/40 pb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary font-brand">Scan Stream Preview</h3>
                <p className="text-[10px] text-text-muted mt-0.5">
                  Leads populated from current active scan job ({filteredLeads.length} matching filter)
                </p>
              </div>
              {quickFilter && (
                <button 
                  onClick={() => setQuickFilter(null)}
                  className="text-primary hover:underline text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                >
                  Clear Filter
                </button>
              )}
            </div>

            {filteredLeads.length === 0 ? (
              <div className="py-12 text-center text-text-muted/60 text-xs">
                No streaming leads match the selected filter.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredLeads.map((lead, idx) => {
                  const cleanPhone = lead.phone ? lead.phone.replace(/\D/g, '') : '';
                  const defaultMessage = `Hi ${lead.businessName}, I noticed a few technical issues with your online presence (such as your website audits and review metrics) and have drafted some suggestions. Would you be open to a quick call?`;
                  const whatsappMsg = lead.whatsappPitch || defaultMessage;
                  const whatsappUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappMsg)}` : '#';

                  return (
                    <div 
                      key={lead._id || idx}
                      onClick={() => lead._id && setSelectedLeadId(lead._id)}
                      className={`group relative bg-[#18181B] border hover:bg-elevated/10 transition-all duration-300 rounded-xl p-5 flex flex-col justify-between gap-4 overflow-hidden ${
                        lead._id 
                          ? 'cursor-pointer border-border/60 hover:border-primary/40 hover:shadow-[0_0_20px_rgba(24,24,27,0.8)]' 
                          : 'cursor-default border-border/40'
                      }`}
                    >
                      {/* Top gradient glow accent */}
                      {lead._id && (
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      )}
                      
                      {/* Top Row: Score and Priority Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] text-text-muted font-bold font-mono tracking-wider">
                          SCORE: <span className="text-text font-bold text-xs">{lead.leadScore}</span>
                        </span>

                        <span className={`px-2 py-0.5 rounded-full border text-[9px] font-extrabold uppercase tracking-wider ${getOppBadgeColor(lead.opportunityLevel)}`}>
                          {lead.opportunityLevel === 'High' ? '🔥 Hot' : lead.opportunityLevel === 'Medium' ? '⚡ Warm' : '❄️ Cold'}
                        </span>
                      </div>

                      {/* Main Identity Info */}
                      <div className="space-y-1">
                        <h4 className="font-brand font-bold text-text text-base leading-snug group-hover:text-primary transition-colors duration-200 line-clamp-1">
                          {lead.businessName}
                        </h4>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                          <span>{lead.category || 'Niche'}</span>
                          {lead.rating > 0 && (
                            <>
                              <span className="text-text-muted">•</span>
                              <div className="flex items-center gap-0.5 text-warning">
                                <Star size={10} fill="currentColor" className="stroke-current" />
                                <span>{lead.rating}</span>
                                <span className="text-text-muted font-normal">({lead.reviewCount})</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Details: Address, Phone, Website */}
                      <div className="space-y-2 text-xs text-text-secondary border-t border-border/30 pt-3">
                        <div className="flex items-start gap-2 text-text-muted">
                          <MapPin size={13} className="mt-0.5 flex-shrink-0 text-text-muted" />
                          <span className="line-clamp-1">{lead.address || 'No Address available'}</span>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2">
                          {lead.phone ? (
                            <a 
                              href={`tel:${lead.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1.5 font-mono text-[11px] text-text-secondary hover:text-primary transition-colors duration-150"
                            >
                              <Phone size={12} className="text-text-muted" />
                              <span>{lead.phone}</span>
                            </a>
                          ) : (
                            <div className="flex items-center gap-1.5 text-text-muted/50 font-mono text-[11px]">
                              <Phone size={12} className="opacity-40" />
                              <span>No Phone</span>
                            </div>
                          )}

                          {lead.website ? (
                            <a 
                              href={lead.website} 
                              target="_blank" 
                              rel="noreferrer" 
                              onClick={(e) => e.stopPropagation()}
                              className="text-primary hover:underline text-[11px] font-bold flex items-center gap-1"
                            >
                              <Globe size={12} />
                              <span className="truncate max-w-[120px]">{lead.website.replace(/^https?:\/\/(www\.)?/, '')}</span>
                            </a>
                          ) : (
                            <span className="text-[9px] text-danger bg-danger/10 px-2 py-0.5 rounded border border-danger/20 font-bold inline-flex items-center gap-0.5">
                              No Website
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Service Opportunity Tags */}
                      <div className="space-y-1.5 border-t border-border/30 pt-3">
                        <div className="text-[9px] font-bold text-text-muted uppercase tracking-wider font-mono">Service Needs</div>
                        <div className="flex flex-wrap gap-1">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${getWebsiteStatusColor(lead.websiteStatus)}`}>
                            {lead.websiteStatus === 'No Website' ? '🌐 Web Development' : `🌐 Audit: ${lead.websiteStatus}`}
                          </span>

                          {((lead.rating || 0) < 4.0 || (lead.reviewCount || 0) < 15) && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-warning/10 text-warning border border-warning/20">
                              📈 Reputation Help
                            </span>
                          )}

                          {(lead.opportunityLevel === 'High' || !lead.website) && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary/10 text-text border border-primary/20">
                              💬 Social Marketing
                            </span>
                          )}

                          {lead.recommendedService && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-success/10 text-success border border-success/20 truncate max-w-full" title={lead.recommendedService}>
                              ✨ {lead.recommendedService}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Outreach CTA Buttons */}
                      <div className="flex items-center gap-2 border-t border-border/30 pt-3 mt-1" onClick={(e) => e.stopPropagation()}>
                        {lead.phone ? (
                          <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 bg-[#25D366] hover:bg-[#20ba56] text-black font-bold text-[10px] uppercase tracking-wider py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all duration-200 shadow-sm"
                          >
                            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.705 1.459h.008c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                            <span>WhatsApp</span>
                          </a>
                        ) : (
                          <button
                            disabled
                            className="flex-1 bg-border/40 text-text-muted font-bold text-[10px] uppercase tracking-wider py-2 rounded-lg flex items-center justify-center gap-1.5 cursor-not-allowed opacity-50 border border-border/20"
                          >
                            <span>No Phone</span>
                          </button>
                        )}

                        {lead._id ? (
                          <button
                            onClick={() => setSelectedLeadId(lead._id)}
                            className="flex-1 border border-border/80 hover:bg-elevated hover:border-primary/50 text-text font-bold text-[10px] uppercase tracking-wider py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all duration-200 shadow-sm"
                          >
                            <Eye size={12} />
                            <span>Details</span>
                          </button>
                        ) : (
                          <button
                            disabled
                            className="flex-1 bg-border/40 text-text-muted font-bold text-[10px] uppercase tracking-wider py-2 rounded-lg flex items-center justify-center gap-1.5 cursor-not-allowed opacity-50 border border-border/20"
                          >
                            <span>Pending...</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Slide-over Lead Drawer */}
      {selectedLeadId && (
        <LeadDrawer
          leadId={selectedLeadId}
          onClose={() => setSelectedLeadId(null)}
        />
      )}
    </div>
  );
}
