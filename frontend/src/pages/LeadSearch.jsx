import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Play, Eye, AlertOctagon, HelpCircle } from 'lucide-react';
import { useStartSearch } from '../hooks/useLeads';
import { searchService } from '../services/api';
import LeadDrawer from '../components/LeadDrawer';

export default function LeadSearch() {
  const startSearchMutation = useStartSearch();
  const [businessType, setBusinessType] = useState('');
  const [location, setLocation] = useState('');
  
  const [activeSearchId, setActiveSearchId] = useState(null);
  const [searchStatus, setSearchStatus] = useState(null);
  const [leadsList, setLeadsList] = useState([]);
  const [logs, setLogs] = useState([]);
  
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  
  // Setup credentials error state
  const [setupError, setSetupError] = useState(null);
  
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

        if (data.status === 'Scraping' && !logs.some(l => l.includes('Maps Actor'))) {
          newLogs.push(`${timestamp()} 📡 Spawning Apify Google Maps Actor for "${data.businessType}" in "${data.location}"...`);
          newLogs.push(`${timestamp()} 🌐 Scraper running in cloud workspace. Gathering coordinates, reviews, and website listings...`);
        }

        if (data.status === 'Auditing' && !logs.some(l => l.includes('Playwright Browser'))) {
          newLogs.push(`${timestamp()} 📥 Scrape completed. Found ${data.leadCount} businesses.`)
          newLogs.push(`${timestamp()} 🤖 Bootstrapping Playwright browser cluster...`);
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

        if (data.status === 'Analyzing' && !logs.some(l => l.includes('Groq LLM'))) {
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
    if (!businessType.trim() || !location.trim()) return;

    setSetupError(null);
    setLogs([]);
    setLeadsList([]);
    setSearchStatus('Pending');

    const t = `[${new Date().toLocaleTimeString()}]`;
    setLogs([
      `${t} 🚀 Dispatching LeadForge Scan Query...`,
      `${t} 🔎 Business Type: "${businessType}"`,
      `${t} 📍 Location: "${location}"`,
      `${t} 📬 Request received by backend queue.`
    ]);

    startSearchMutation.mutate(
      { businessType: businessType.trim(), location: location.trim() },
      {
        onSuccess: (res) => {
          // Check for API credentials warnings
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
          <div className="w-full md:flex-1 space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Business Category (Niche)</label>
            <select
              required
              disabled={!!activeSearchId}
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3.5 py-2 text-xs text-text font-semibold cursor-pointer select-none"
            >
              <option value="">Select Niche...</option>
              <option value="Gym">Gym</option>
              <option value="Cafe">Cafe</option>
              <option value="Salon">Salon</option>
              <option value="Dentist">Dentist</option>
              <option value="Real Estate">Real Estate</option>
              <option value="Restaurant">Restaurant</option>
            </select>
          </div>

          <div className="w-full md:flex-1 space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted">City / Location</label>
            <select
              required
              disabled={!!activeSearchId}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3.5 py-2 text-xs text-text font-semibold cursor-pointer select-none"
            >
              <option value="">Select City...</option>
              <option value="Bhopal">Bhopal</option>
              <option value="Indore">Indore</option>
              <option value="Gwalior">Gwalior</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={startSearchMutation.isPending || !!activeSearchId}
            className="w-full md:w-auto bg-primary hover:bg-primary-hover disabled:bg-primary/50 text-text font-bold text-xs px-5 py-2 rounded-lg flex items-center justify-center gap-2 h-9 transition-all"
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

      {/* 4. Live Search Preview Table */}
      {leadsList.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">Scan Stream Preview</h3>
            <p className="text-[10px] text-text-muted mt-0.5">Leads populated from current active scan job</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border text-text-muted uppercase font-bold tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Business Name</th>
                  <th className="py-2.5 px-3 hidden sm:table-cell">Phone</th>
                  <th className="py-2.5 px-3">Website</th>
                  <th className="py-2.5 px-3 text-center">Score</th>
                  <th className="py-2.5 px-3">Audit</th>
                  <th className="py-2.5 px-3">Opportunity</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30 text-text-secondary">
                {leadsList.map((lead, idx) => {
                  let oppBadge = 'bg-success/10 text-success border-success/20';
                  if (lead.opportunityLevel === 'Medium') oppBadge = 'bg-warning/10 text-warning border-warning/20';
                  if (lead.opportunityLevel === 'Low') oppBadge = 'bg-danger/10 text-danger border-danger/20';

                  let siteBadge = 'bg-success/10 text-success';
                  if (lead.websiteStatus === 'No Website') siteBadge = 'bg-danger/10 text-danger';
                  if (lead.websiteStatus === 'Offline') siteBadge = 'bg-danger/20 text-danger';
                  if (lead.websiteStatus === 'Slow' || lead.websiteStatus === 'Outdated' || lead.websiteStatus === 'Non Responsive') {
                    siteBadge = 'bg-warning/10 text-warning';
                  }

                  return (
                    <tr key={idx} className="hover:bg-elevated/20 transition-all">
                      <td className="py-2.5 px-3 font-bold text-text truncate max-w-[120px]">{lead.businessName}</td>
                      <td className="py-2.5 px-3 hidden sm:table-cell font-mono">{lead.phone || '-'}</td>
                      <td className="py-2.5 px-3 max-w-[120px] truncate">
                        {lead.website ? (
                          <a href={lead.website} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                            {lead.website}
                          </a>
                        ) : (
                          <span className="text-text-muted font-medium">None</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-text">{lead.leadScore}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${siteBadge}`}>
                          {lead.websiteStatus}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-bold ${oppBadge}`}>
                          {lead.opportunityLevel}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => setSelectedLeadId(lead._id)}
                          className="bg-elevated hover:bg-border/60 p-1 rounded text-text-secondary hover:text-text flex items-center justify-center ml-auto"
                          title="Open Dossier"
                        >
                          <Eye size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
