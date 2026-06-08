import React, { useState, useEffect } from 'react';
import { useLeads, useSearchHistory } from '../hooks/useLeads';
import { ChevronRight, History, Cpu, Users, Search, ChevronDown, ChevronUp } from 'lucide-react';

export default function ScanHistory({ setActiveTab, setSelectedSearchQueryId }) {
  const { data: historyResponse, isLoading, error } = useSearchHistory();
  const { data: leadsResponse } = useLeads({});
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleCount, setVisibleCount] = useState(10);

  // Reset visible count when search term changes
  useEffect(() => {
    setVisibleCount(10);
  }, [searchTerm]);

  const searches = historyResponse?.data || [];

  // Calculate high-level summary cards for the history page
  const totalScans = searches.length;
  const totalCredits = searches.reduce((acc, curr) => acc + (curr.creditsUsed || 0), 0);
  const totalLeadsCollected = leadsResponse?.totalLeads || 0;

  const formatDuration = (ms) => {
    if (!ms) return 'N/A';
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
  };

  const formatCredits = (credits) => {
    if (credits === undefined || credits === null) return 'N/A';
    if (credits === 0) return '0.000 (Cached/Demo)';
    return `${credits.toFixed(3)} CU`;
  };

  // Filter history list based on search term (Niche or Location)
  const filteredSearches = searches.filter(search => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      (search.businessType || '').toLowerCase().includes(term) ||
      (search.location || '').toLowerCase().includes(term)
    );
  });

  const handleOpenSearchLeads = (searchId) => {
    setSelectedSearchQueryId(searchId);
    setActiveTab('database');
  };

  return (
    <div className="space-y-6 select-none relative pb-10">
      
      {/* 1. History Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-lg text-primary">
            <History size={20} />
          </div>
          <div>
            <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Total Scans Run</h4>
            <div className="text-xl font-bold text-text mt-0.5">{isLoading ? '...' : totalScans}</div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
          <div className="p-3 bg-success/10 rounded-lg text-success">
            <Cpu size={20} />
          </div>
          <div>
            <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Total Credits Used</h4>
            <div className="text-xl font-bold text-text mt-0.5">
              {isLoading ? '...' : `${totalCredits.toFixed(3)} CU`}
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
          <div className="p-3 bg-warning/10 rounded-lg text-warning">
            <Users size={20} />
          </div>
          <div>
            <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Total Leads Gathered</h4>
            <div className="text-xl font-bold text-text mt-0.5">{isLoading ? '...' : totalLeadsCollected}</div>
          </div>
        </div>
      </div>

      {/* 2. Main History List Panel */}
      <div className="bg-card border border-border rounded-lg p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border/40 pb-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">Search Queries History Log</h3>
            <p className="text-[10px] text-text-muted mt-0.5">Detailed records of maps scraper operations</p>
          </div>
          
          <div className="relative w-full sm:w-64">
            <Search size={12} className="absolute left-2.5 top-2 text-text-secondary/60" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search history by Niche or City..."
              className="w-full bg-background border border-border rounded pl-8 pr-3 py-1 text-xs text-text placeholder-text-muted/50 font-medium h-7"
            />
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border text-text-muted uppercase font-bold tracking-wider text-[10px]">
                <th className="py-3 px-4">Business Query</th>
                <th className="py-3 px-4">City/Location</th>
                <th className="py-3 px-4 text-center">Leads Found / Limit</th>
                <th className="py-3 px-4 text-center">Credits Used</th>
                <th className="py-3 px-4 text-center">Duration</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-text-secondary">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-text-muted/60 font-mono">
                    <span className="inline-block w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin mr-2"></span>
                    Loading historical search records...
                  </td>
                </tr>
              ) : filteredSearches.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-text-muted/60">
                    {searchTerm ? 'No history logs match your search term.' : 'No scans run yet. Run a search to collect leads.'}
                  </td>
                </tr>
              ) : (
                filteredSearches.slice(0, visibleCount).map((search) => {
                  let badgeColor = 'bg-primary/10 text-primary border-primary/20';
                  if (search.status === 'Completed') badgeColor = 'bg-success/10 text-success border-success/20';
                  if (search.status === 'Failed') badgeColor = 'bg-danger/10 text-danger border-danger/20';
                  if (search.status === 'Scraping' || search.status === 'Auditing' || search.status === 'Analyzing') {
                    badgeColor = 'bg-warning/10 text-warning border-warning/20 animate-pulse';
                  }

                  return (
                    <tr key={search._id} className="hover:bg-elevated/40 transition-all">
                      <td className="py-3 px-4 font-bold text-text capitalize">{search.businessType}</td>
                      <td className="py-3 px-4 capitalize">{search.location}</td>
                      <td className="py-3 px-4 text-center font-bold text-text">
                        {search.leadCount} <span className="text-text-muted font-normal text-[10px]">/ {search.limit || 30}</span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-[11px] text-text-secondary">{formatCredits(search.creditsUsed)}</td>
                      <td className="py-3 px-4 text-center font-mono text-[11px] text-text-secondary">{formatDuration(search.durationMs)}</td>
                      <td className="py-3 px-4 font-mono text-text-muted">{new Date(search.createdAt).toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider ${badgeColor}`}>
                          {search.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {search.leadCount > 0 ? (
                          <button 
                            onClick={() => handleOpenSearchLeads(search._id)}
                            className="text-primary hover:text-primary-hover font-bold flex items-center gap-0.5 justify-end ml-auto text-xs cursor-pointer"
                          >
                            <span>Open Leads</span>
                            <ChevronRight size={12} />
                          </button>
                        ) : (
                          <span className="text-text-muted text-xs opacity-50 select-none">No Leads</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="block md:hidden space-y-3.5">
          {isLoading ? (
            <div className="py-12 text-center text-text-muted/60 font-mono">
              <span className="inline-block w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin mr-2"></span>
              Loading historical search records...
            </div>
          ) : filteredSearches.length === 0 ? (
            <div className="py-12 text-center text-text-muted/60">
              {searchTerm ? 'No history logs match your search term.' : 'No scans run yet. Run a search to collect leads.'}
            </div>
          ) : (
            filteredSearches.slice(0, visibleCount).map((search) => {
              let badgeColor = 'bg-primary/10 text-primary border-primary/20';
              if (search.status === 'Completed') badgeColor = 'bg-success/10 text-success border-success/20';
              if (search.status === 'Failed') badgeColor = 'bg-danger/10 text-danger border-danger/20';
              if (search.status === 'Scraping' || search.status === 'Auditing' || search.status === 'Analyzing') {
                badgeColor = 'bg-warning/10 text-warning border-warning/20 animate-pulse';
              }

              return (
                <div key={search._id} className="bg-[#18181B] border border-border/60 rounded-xl p-4 space-y-3 hover:border-primary/40 transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-text capitalize text-xs">{search.businessType}</h4>
                      <p className="text-[10px] text-text-muted mt-0.5 capitalize">{search.location}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider ${badgeColor}`}>
                      {search.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 border-t border-border/20 pt-2.5 text-[10px] text-text-secondary font-mono">
                    <div>
                      <span className="text-[9px] text-text-muted block uppercase tracking-wider font-sans font-bold">Leads</span>
                      <span className="font-bold text-text">{search.leadCount} / {search.limit || 30}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-text-muted block uppercase tracking-wider font-sans font-bold">Credits</span>
                      <span>{formatCredits(search.creditsUsed)}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-text-muted block uppercase tracking-wider font-sans font-bold">Duration</span>
                      <span className="truncate">{formatDuration(search.durationMs)}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center border-t border-border/20 pt-2.5">
                    <span className="text-[9px] font-mono text-text-muted">{new Date(search.createdAt).toLocaleString()}</span>
                    {search.leadCount > 0 ? (
                      <button 
                        onClick={() => handleOpenSearchLeads(search._id)}
                        className="text-primary hover:text-primary-hover font-bold flex items-center gap-0.5 text-[11px] cursor-pointer"
                      >
                        <span>Open Leads</span>
                        <ChevronRight size={10} />
                      </button>
                    ) : (
                      <span className="text-text-muted text-[10px] opacity-50 select-none">No Leads</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Show More / Show Less Pagination Buttons */}
        {filteredSearches.length > 10 && (
          <div className="flex justify-center gap-3 pt-4 border-t border-border/40">
            {visibleCount > 10 && (
              <button
                onClick={() => setVisibleCount(10)}
                className="px-4 py-2 bg-[#18181B] hover:bg-elevated/60 border border-border text-text font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <span>Show Less</span>
                <ChevronUp size={12} className="text-text-secondary" />
              </button>
            )}
            {filteredSearches.length > visibleCount && (
              <button
                onClick={() => setVisibleCount(prev => prev + 10)}
                className="px-4 py-2 bg-[#18181B] hover:bg-elevated/60 border border-border text-text font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <span>Show More</span>
                <ChevronDown size={12} className="text-text-secondary" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
