import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Phone, 
  Briefcase, 
  Trophy, 
  Calendar, 
  RefreshCw, 
  Clock, 
  UserCheck, 
  ChevronRight,
  TrendingUp,
  Activity,
  Flame,
  Award
} from 'lucide-react';
import { managementService } from '../services/api';
import LeadDrawer from '../components/LeadDrawer';

export default function ManagementDashboard({ user }) {
  const [selectedLeadId, setSelectedLeadId] = useState(null);

  // Fetch KPI statistics and status breakdown
  const { 
    data: analyticsData, 
    refetch: refetchAnalytics, 
    isLoading: isAnalyticsLoading,
    isRefetching: isRefetchingAnalytics 
  } = useQuery({
    queryKey: ['managementAnalytics'],
    queryFn: managementService.getAnalytics,
    refetchInterval: 30000 // auto-refresh every 30s for real-time CRM updates
  });

  // Fetch team member productivity and performance ranking
  const { 
    data: productivityData, 
    refetch: refetchProductivity, 
    isLoading: isProductivityLoading,
    isRefetching: isRefetchingProductivity 
  } = useQuery({
    queryKey: ['managementProductivity'],
    queryFn: managementService.getProductivity,
    refetchInterval: 30000
  });

  // Fetch global activity timeline log
  const { 
    data: timelineData, 
    refetch: refetchTimeline, 
    isLoading: isTimelineLoading,
    isRefetching: isRefetchingTimeline 
  } = useQuery({
    queryKey: ['managementTimeline'],
    queryFn: managementService.getTimeline,
    refetchInterval: 30000
  });

  // Fetch follow-up calendar agenda
  const { 
    data: scheduleData, 
    refetch: refetchSchedule, 
    isLoading: isScheduleLoading,
    isRefetching: isRefetchingSchedule 
  } = useQuery({
    queryKey: ['managementSchedule'],
    queryFn: managementService.getSchedule,
    refetchInterval: 30000
  });

  const isRefetching = isRefetchingAnalytics || isRefetchingProductivity || isRefetchingTimeline || isRefetchingSchedule;
  const isLoading = isAnalyticsLoading || isProductivityLoading || isTimelineLoading || isScheduleLoading;

  const handleRefresh = () => {
    refetchAnalytics();
    refetchProductivity();
    refetchTimeline();
    refetchSchedule();
  };

  // Extract analytics stats
  const stats = analyticsData?.stats || { totalCalls: 0, activeLeads: 0, closedDeals: 0, pendingFollowUps: 0 };
  const statusBreakdown = analyticsData?.statusBreakdown || { new: 0, contacted: 0, followUp: 0, interested: 0, closed: 0, rejected: 0 };
  const teamPerformance = productivityData?.performance || [];
  const globalTimeline = timelineData?.data || [];
  const followUpAgenda = scheduleData?.data || [];

  // Calculate total leads in pipeline for percentage tracking
  const totalLeads = Object.values(statusBreakdown).reduce((acc, curr) => acc + curr, 0);

  const getActionColor = (actionType) => {
    switch (actionType) {
      case 'CallLog': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'StatusChange': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'AddNote': return 'bg-warning/10 text-warning border-warning/20';
      case 'Create': return 'bg-success/10 text-success border-success/20';
      case 'Assign': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'Audited':
      case 'AIRegenerated': return 'bg-pink-500/10 text-pink-400 border-pink-500/20';
      default: return 'bg-zinc-500/10 text-text-secondary border-border/20';
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'New': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Contacted': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'Follow Up': return 'bg-warning/10 text-warning border-warning/20';
      case 'Interested': return 'bg-success/10 text-success border-success/20';
      case 'Closed': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default: return 'bg-danger/10 text-danger border-danger/20';
    }
  };

  const getPercentage = (value) => {
    if (!totalLeads) return '0%';
    return `${Math.round((value / totalLeads) * 100)}%`;
  };

  return (
    <div className="space-y-6 select-none animate-fade-in">
      {/* Title & Actions Banner */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text font-display flex items-center gap-2">
            <Activity className="text-primary w-5 h-5" />
            CRM Management Command Center
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">Real-time organizational performance, call logs tracking, and team productivity rankings.</p>
        </div>
        <button 
          onClick={handleRefresh}
          disabled={isRefetching}
          className="self-start sm:self-center flex items-center gap-1.5 px-3 py-1.5 bg-elevated hover:bg-border text-xs font-semibold text-text rounded-lg border border-border/60 transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={12} className={isRefetching ? 'animate-spin' : ''} />
          <span>{isRefetching ? 'Refreshed' : 'Refresh Metrics'}</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Calls Logged */}
        <div className="bg-card border border-border/80 rounded-xl p-4 flex items-center justify-between hover:border-primary/40 transition-all group">
          <div className="space-y-1">
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Outreach Calls</span>
            <div className="text-2xl font-extrabold text-text font-mono group-hover:text-primary transition-colors">
              {stats.totalCalls}
            </div>
            <span className="text-[9px] text-text-secondary block font-medium">Logged calls by team</span>
          </div>
          <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-text transition-all">
            <Phone size={18} />
          </div>
        </div>

        {/* Active Pipeline */}
        <div className="bg-card border border-border/80 rounded-xl p-4 flex items-center justify-between hover:border-indigo-500/40 transition-all group">
          <div className="space-y-1">
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Active Pipeline</span>
            <div className="text-2xl font-extrabold text-text font-mono group-hover:text-indigo-400 transition-colors">
              {stats.activeLeads}
            </div>
            <span className="text-[9px] text-text-secondary block font-medium">Leads in active stages</span>
          </div>
          <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-text transition-all">
            <Briefcase size={18} />
          </div>
        </div>

        {/* Deals Closed */}
        <div className="bg-card border border-border/80 rounded-xl p-4 flex items-center justify-between hover:border-emerald-500/40 transition-all group">
          <div className="space-y-1">
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Sales Closed</span>
            <div className="text-2xl font-extrabold text-text font-mono group-hover:text-emerald-400 transition-colors">
              {stats.closedDeals}
            </div>
            <span className="text-[9px] text-text-secondary block font-medium">Contracts successfully signed</span>
          </div>
          <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-text transition-all">
            <Trophy size={18} />
          </div>
        </div>

        {/* Pending Followups */}
        <div className="bg-card border border-border/80 rounded-xl p-4 flex items-center justify-between hover:border-warning/40 transition-all group">
          <div className="space-y-1">
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Follow-Up Agenda</span>
            <div className="text-2xl font-extrabold text-text font-mono group-hover:text-warning transition-colors">
              {stats.pendingFollowUps}
            </div>
            <span className="text-[9px] text-text-secondary block font-medium">Scheduled callbacks pending</span>
          </div>
          <div className="w-10 h-10 bg-warning/10 border border-warning/20 rounded-xl flex items-center justify-center text-warning group-hover:bg-warning group-hover:text-text transition-all">
            <Calendar size={18} />
          </div>
        </div>
      </div>

      {/* Main CRM Core Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Side: Agenda Calendar & Timeline History (3 Cols) */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Follow-up Agenda Calendar widget */}
          <div className="bg-card border border-border/80 rounded-xl p-5 space-y-4">
            <h2 className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-1.5 border-b border-border/50 pb-2">
              <Calendar size={14} className="text-warning" />
              Follow-up Agenda / Schedule
            </h2>

            <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
              {isLoading ? (
                <div className="py-8 text-center text-xs text-text-muted font-mono animate-pulse">Querying callbacks schedule...</div>
              ) : followUpAgenda.length > 0 ? (
                followUpAgenda.map((item) => (
                  <div 
                    key={item._id}
                    className="flex justify-between items-center bg-background/30 border border-border/50 hover:border-border p-3 rounded-lg text-xs transition-all"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-text hover:underline cursor-pointer" onClick={() => setSelectedLeadId(item._id)}>
                          {item.businessName}
                        </span>
                        <span className="text-[9px] text-text-secondary bg-elevated border border-border px-1.5 py-0.5 rounded font-mono">
                          {item.category}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3 text-[10px] text-text-secondary">
                        <span className="flex items-center gap-1">
                          <Clock size={10} className="text-text-muted" />
                          <span className="font-bold text-warning">
                            {new Date(item.followUpDate).toLocaleDateString()}
                          </span>
                        </span>
                        <span>•</span>
                        <span>
                          Agent: <span className="font-bold text-text">{item.assignedTo?.name || 'Unassigned'}</span>
                        </span>
                      </div>
                    </div>

                    <button 
                      onClick={() => setSelectedLeadId(item._id)}
                      className="flex items-center gap-0.5 px-2.5 py-1 bg-elevated hover:bg-border text-[10px] font-bold text-text-secondary hover:text-text rounded-md border border-border/60 transition-all cursor-pointer"
                    >
                      <span>Inspect</span>
                      <ChevronRight size={12} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-[10px] font-bold text-text-muted/65 text-center py-8 bg-background/10 rounded border border-dashed border-border/40 uppercase tracking-wider">
                  No upcoming follow-ups scheduled.
                </div>
              )}
            </div>
          </div>

          {/* Global CRM Timeline Logs activity stream */}
          <div className="bg-card border border-border/80 rounded-xl p-5 space-y-4">
            <h2 className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-1.5 border-b border-border/50 pb-2">
              <Clock size={14} className="text-primary" />
              Global Activity Stream
            </h2>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
              {isLoading ? (
                <div className="py-8 text-center text-xs text-text-muted font-mono animate-pulse">Curation of logs history...</div>
              ) : globalTimeline.length > 0 ? (
                <div className="relative pl-4 border-l border-border/80 space-y-4 ml-2 mt-2">
                  {globalTimeline.map((log) => {
                    return (
                      <div key={log._id} className="relative select-text">
                        {/* Timeline Circle Bullet */}
                        <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-border bg-card" />
                        
                        <div className="bg-background/25 border border-border/40 hover:border-border/60 p-3.5 rounded-lg text-xs space-y-2 transition-all">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10px] text-text-muted">
                            <span className="font-bold flex items-center gap-1">
                              {log.userId?.picture ? (
                                <img src={log.userId.picture} className="w-4 h-4 rounded-full object-cover" alt="" />
                              ) : (
                                <span className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center text-[7px] text-primary font-bold">
                                  {log.userId?.name ? log.userId.name.slice(0,2).toUpperCase() : 'SYS'}
                                </span>
                              )}
                              <span className="text-text-secondary">{log.userId?.name || 'System / Scan Worker'}</span>
                            </span>
                            <span className="font-mono text-[9px]">{new Date(log.timestamp).toLocaleString()}</span>
                          </div>
                          
                          <p className="text-text leading-normal font-sans font-medium">{log.details}</p>

                          {log.leadId && (
                            <div className="flex items-center justify-between bg-background/40 border border-border/40 p-2 rounded-md mt-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-text-secondary hover:underline cursor-pointer" onClick={() => setSelectedLeadId(log.leadId._id)}>
                                  {log.leadId.businessName}
                                </span>
                                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${getStatusBadgeColor(log.leadId.status)}`}>
                                  {log.leadId.status}
                                </span>
                              </div>
                              <button
                                onClick={() => setSelectedLeadId(log.leadId._id)}
                                className="text-[9px] font-bold text-primary hover:underline flex items-center gap-0.5 cursor-pointer"
                              >
                                <span>Inspect</span>
                                <ChevronRight size={10} />
                              </button>
                            </div>
                          )}

                          {(log.callOutcome || log.followUpDate) && (
                            <div className="flex flex-wrap gap-1.5 text-[9px] font-mono mt-1 pt-1.5 border-t border-border/10">
                              {log.callOutcome && (
                                <span className="bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/10 font-bold">
                                  Outcome: {log.callOutcome}
                                </span>
                              )}
                              {log.followUpDate && (
                                <span className="bg-warning/10 text-warning px-1.5 py-0.5 rounded border border-warning/10 font-bold">
                                  Callback Scheduled: {new Date(log.followUpDate).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-[10px] font-bold text-text-muted/60 text-center py-8 bg-background/10 rounded border border-dashed border-border/40 uppercase tracking-wider">
                  No records stored yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Leaderboard & Stage Breakdown (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Team Leaderboard productivity widget */}
          <div className="bg-card border border-border/80 rounded-xl p-5 space-y-4">
            <h2 className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-1.5 border-b border-border/50 pb-2">
              <Trophy size={14} className="text-emerald-500" />
              Team Productivity Leaderboard
            </h2>

            <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
              {isLoading ? (
                <div className="py-8 text-center text-xs text-text-muted font-mono animate-pulse">Running rankings calculations...</div>
              ) : teamPerformance.length > 0 ? (
                teamPerformance.map((member, index) => {
                  const isTopRank = index === 0;
                  return (
                    <div 
                      key={member.id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                        isTopRank 
                          ? 'bg-[#EAB308]/5 border-[#EAB308]/20 hover:border-[#EAB308]/40 shadow-sm'
                          : 'bg-background/25 border-border/50 hover:border-border'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          {member.picture ? (
                            <img src={member.picture} className="w-8 h-8 rounded-full border border-border object-cover" alt="" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs font-mono">
                              {member.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          {isTopRank && (
                            <div className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 bg-[#EAB308] border-2 border-background rounded-full flex items-center justify-center text-black shadow-lg">
                              <Award size={10} className="stroke-[2.5]" />
                            </div>
                          )}
                        </div>

                        <div className="space-y-0.5">
                          <h4 className="text-xs font-bold text-text flex items-center gap-1.5">
                            {member.name}
                            {isTopRank && <span className="text-[8px] bg-[#EAB308]/10 text-[#EAB308] px-1 py-0.2 rounded font-mono font-black uppercase">Top Agent</span>}
                          </h4>
                          <p className="text-[10px] text-text-muted font-medium">{member.role}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-right">
                        <div className="space-y-0.5 font-mono">
                          <div className="text-xs font-extrabold text-text flex items-center justify-end gap-1">
                            <Trophy size={10} className="text-[#EAB308]" />
                            <span>{member.closedCount} Closes</span>
                          </div>
                          <div className="text-[9px] text-text-secondary flex items-center justify-end gap-1">
                            <Phone size={8} />
                            <span>{member.callsCount} Calls</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-[10px] font-bold text-text-muted/60 text-center py-6 bg-background/10 rounded border border-dashed border-border/40 uppercase tracking-wider">
                  No active team statistics.
                </div>
              )}
            </div>
          </div>

          {/* Sales Pipeline breakdown stage progress metrics */}
          <div className="bg-card border border-border/80 rounded-xl p-5 space-y-4">
            <h2 className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-1.5 border-b border-border/50 pb-2">
              <TrendingUp size={14} className="text-primary" />
              Pipeline Stage Distribution
            </h2>

            <div className="space-y-3.5">
              {[
                { stage: 'New', count: statusBreakdown.new, color: 'bg-blue-500', barColor: 'bg-blue-500/20' },
                { stage: 'Contacted', count: statusBreakdown.contacted, color: 'bg-indigo-500', barColor: 'bg-indigo-500/20' },
                { stage: 'Follow Up', count: statusBreakdown.followUp, color: 'bg-warning', barColor: 'bg-warning/20' },
                { stage: 'Interested', count: statusBreakdown.interested, color: 'bg-success', barColor: 'bg-success/20' },
                { stage: 'Closed', count: statusBreakdown.closed, color: 'bg-emerald-500', barColor: 'bg-emerald-500/20' },
                { stage: 'Rejected', count: statusBreakdown.rejected, color: 'bg-danger', barColor: 'bg-danger/20' },
              ].map((stageItem) => {
                const percentage = getPercentage(stageItem.count);
                return (
                  <div key={stageItem.stage} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-text flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${stageItem.color}`}></span>
                        {stageItem.stage}
                      </span>
                      <span className="text-[10px] font-mono text-text-secondary">
                        <span className="text-text font-extrabold">{stageItem.count}</span> ({percentage})
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className={`w-full h-1.5 rounded-full ${stageItem.barColor} overflow-hidden`}>
                      <div 
                        className={`h-full rounded-full ${stageItem.color} transition-all duration-500`}
                        style={{ width: percentage }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-background/30 border border-border/50 rounded-lg p-3 text-[10px] text-text-secondary font-mono flex items-center justify-between">
              <span>Total Leads Ingested:</span>
              <span className="text-text font-black">{totalLeads} Records</span>
            </div>
          </div>

        </div>

      </div>

      {/* Selected Lead Drawer Integration */}
      {selectedLeadId && (
        <LeadDrawer 
          leadId={selectedLeadId} 
          onClose={() => {
            setSelectedLeadId(null);
            handleRefresh();
          }} 
          user={user} 
        />
      )}
    </div>
  );
}
