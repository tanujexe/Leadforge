import React from 'react';
import { BarChart2, ShieldAlert, Globe, Star, Users, CheckCircle, ChevronRight } from 'lucide-react';
import { useLeads, useSearchHistory } from '../hooks/useLeads';
import MetricCard from '../components/MetricCard';

export default function Dashboard({ setActiveTab, setSelectedSearchQueryId }) {
  const { data: leadsResponse, isLoading: leadsLoading } = useLeads({});
  const { data: historyResponse, isLoading: historyLoading } = useSearchHistory();

  const leads = leadsResponse?.data || [];
  const searches = historyResponse?.data || [];

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

  // Calculate Metrics database-wide
  const totalLeads = leadsResponse?.totalLeads || 0;
  const noWebsiteLeads = leadsResponse?.stats?.needWebsite || 0;
  const websiteLeads = Math.max(0, totalLeads - noWebsiteLeads);
  const highOppLeads = leadsResponse?.stats?.hot || 0;

  const statusCounts = {
    New: leadsResponse?.stats?.statusCounts?.new || 0,
    Contacted: leadsResponse?.stats?.statusCounts?.contacted || 0,
    'Follow Up': leadsResponse?.stats?.statusCounts?.followUp || 0,
    Interested: leadsResponse?.stats?.statusCounts?.interested || 0,
    Closed: leadsResponse?.stats?.statusCounts?.closed || 0,
    Rejected: leadsResponse?.stats?.statusCounts?.rejected || 0,
  };

  const contactedLeads = Math.max(0, totalLeads - statusCounts.New);
  const closedLeads = statusCounts.Closed;

  const getOpportunityCount = (level) => {
    if (level === 'High') return leadsResponse?.stats?.hot || 0;
    if (level === 'Medium') return leadsResponse?.stats?.warm || 0;
    if (level === 'Low') return leadsResponse?.stats?.cold || 0;
    return 0;
  };

  return (
    <div className="space-y-6 select-none">
      
      {/* Metrics Grid (Responsive columns: 2 on mobile, 3 on tablet, 6 on desktop) */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <MetricCard
          title="Total Leads"
          value={leadsLoading ? '...' : totalLeads}
          icon={Users}
          description="Prospect list size"
          colorClass="text-primary"
        />
        <MetricCard
          title="No Website"
          value={leadsLoading ? '...' : noWebsiteLeads}
          icon={ShieldAlert}
          description="Dev prospects"
          colorClass="text-danger"
        />
        <MetricCard
          title="With Website"
          value={leadsLoading ? '...' : websiteLeads}
          icon={Globe}
          description="Redesign prospects"
          colorClass="text-primary"
        />
        <MetricCard
          title="High Priority"
          value={leadsLoading ? '...' : highOppLeads}
          icon={Star}
          description="Opportunity score > 70"
          colorClass="text-warning"
        />
        <MetricCard
          title="Contacted"
          value={leadsLoading ? '...' : contactedLeads}
          icon={BarChart2}
          description="Leads in progress"
          colorClass="text-primary"
        />
        <MetricCard
          title="Closed Deals"
          value={leadsLoading ? '...' : closedLeads}
          icon={CheckCircle}
          description="Successfully closed"
          colorClass="text-success"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Pipeline Funnel Section */}
        <div className="bg-card border border-border rounded-lg p-5 lg:col-span-2 space-y-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">Pipeline Placement Funnel</h3>
            <p className="text-[10px] text-text-muted mt-0.5">Active leads state distributions</p>
          </div>

          <div className="space-y-3 pt-2">
            {Object.entries(statusCounts).map(([status, count]) => {
              const percentage = totalLeads > 0 ? (count / totalLeads) * 100 : 0;
              let barColor = 'bg-primary';
              if (status === 'Closed') barColor = 'bg-success';
              if (status === 'Rejected') barColor = 'bg-danger/60';
              if (status === 'Interested') barColor = 'bg-warning';

              return (
                <div key={status} className="space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-semibold text-text-secondary">
                    <span>{status}</span>
                    <span>{count} leads ({percentage.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full bg-[#111113] rounded-full h-1.5 border border-border/20">
                    <div 
                      className={`${barColor} h-1.5 rounded-full transition-all duration-500`} 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority distribution Section */}
        <div className="bg-card border border-border rounded-lg p-5 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">Opportunity Breakdown</h3>
            <p className="text-[10px] text-text-muted mt-0.5">Priority parameters breakdown</p>
          </div>

          <div className="space-y-3 pt-2">
            {['High', 'Medium', 'Low'].map((level) => {
              const count = getOpportunityCount(level);
              const pct = totalLeads > 0 ? (count / totalLeads) * 100 : 0;
              let dotColor = 'bg-success';
              if (level === 'Medium') dotColor = 'bg-warning';
              if (level === 'Low') dotColor = 'bg-danger';

              return (
                <div key={level} className="flex items-center justify-between border-b border-border/40 pb-2.5 last:border-b-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${dotColor}`}></span>
                    <span className="text-xs font-semibold text-text-secondary">{level} Priority</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-text">{count} leads</div>
                    <div className="text-[9px] text-text-muted font-mono">{pct.toFixed(0)}% of list</div>
                  </div>
                </div>
              );
            })}
          </div>

          <button 
            onClick={() => setActiveTab('search')}
            className="w-full border border-primary text-primary hover:bg-primary/5 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all mt-4"
          >
            <span>Scan Cities</span>
            <ChevronRight size={12} />
          </button>
        </div>
      </div>

      {/* Recent Searches Log */}
      <div className="bg-card border border-border rounded-lg p-5">
        <div className="mb-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">Search Queries Log</h3>
          <p className="text-[10px] text-text-muted mt-0.5 font-medium">History log of maps crawls run on local host</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border text-text-muted uppercase font-bold tracking-wider text-[10px]">
                <th className="py-2.5 px-4">Business Query</th>
                <th className="py-2.5 px-4">City/Location</th>
                <th className="py-2.5 px-4 text-center">Leads Found</th>
                <th className="py-2.5 px-4 text-center">Credits Used</th>
                <th className="py-2.5 px-4 text-center">Duration</th>
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-text-secondary">
              {historyLoading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-text-muted/60 font-mono">
                    <span className="inline-block w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin mr-2"></span>
                    Querying logs...
                  </td>
                </tr>
              ) : searches.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-text-muted/60">
                    No lead scans run yet. Run a search to collect real leads.
                  </td>
                </tr>
              ) : (
                searches.slice(0, 5).map((search) => {
                  let badgeColor = 'bg-primary/10 text-primary border-primary/20';
                  if (search.status === 'Completed') badgeColor = 'bg-success/10 text-success border-success/20';
                  if (search.status === 'Failed') badgeColor = 'bg-danger/10 text-danger border-danger/20';
                  if (search.status === 'Scraping' || search.status === 'Auditing' || search.status === 'Analyzing') {
                    badgeColor = 'bg-warning/10 text-warning border-warning/20 animate-pulse';
                  }

                  return (
                    <tr key={search._id} className="hover:bg-elevated/40 transition-all">
                      <td className="py-2.5 px-4 font-bold text-text capitalize">{search.businessType}</td>
                      <td className="py-2.5 px-4 capitalize">{search.location}</td>
                      <td className="py-2.5 px-4 text-center font-bold text-text">
                        {search.leadCount} <span className="text-text-muted font-normal text-[10px]">/ {search.limit || 30}</span>
                      </td>
                      <td className="py-2.5 px-4 text-center font-mono text-[11px] text-text-secondary">{formatCredits(search.creditsUsed)}</td>
                      <td className="py-2.5 px-4 text-center font-mono text-[11px] text-text-secondary">{formatDuration(search.durationMs)}</td>
                      <td className="py-2.5 px-4 font-mono text-text-muted">{new Date(search.createdAt).toLocaleString()}</td>
                      <td className="py-2.5 px-4">
                        <span className={`px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider ${badgeColor}`}>
                          {search.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button 
                          onClick={() => {
                            setSelectedSearchQueryId(search._id);
                            setActiveTab('database');
                          }}
                          className="text-primary hover:text-primary-hover font-bold flex items-center gap-0.5 justify-end ml-auto text-xs cursor-pointer"
                        >
                          <span>Open List</span>
                          <ChevronRight size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
