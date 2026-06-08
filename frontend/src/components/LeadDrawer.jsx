import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Calendar, Phone, Globe, MapPin, AlertCircle, RefreshCw, Clock, UserCheck, Edit2, Trash2 } from 'lucide-react';
import { 
  useLead, 
  useUpdateLeadStatus, 
  useAddLeadNote, 
  useManuallyAuditLead, 
  useManuallyRegenerateAI, 
  useManuallyGenerateAI,
  useLogCall,
  useAssignLead,
  useLeadActivity,
  useUpdateActivity,
  useDeleteActivity
} from '../hooks/useLeads';
import { authService } from '../services/api';

export default function LeadDrawer({ leadId, onClose, user }) {
  const { data: leadResponse, isLoading, error } = useLead(leadId);
  const updateStatusMutation = useUpdateLeadStatus();
  const addNoteMutation = useAddLeadNote();
  const auditMutation = useManuallyAuditLead();
  const generateAiMutation = useManuallyGenerateAI();
  const regenerateAiMutation = useManuallyRegenerateAI();
  const logCallMutation = useLogCall();
  const assignMutation = useAssignLead();
  const updateActivityMutation = useUpdateActivity();
  const deleteActivityMutation = useDeleteActivity();
  const { data: activityResponse, isLoading: isActivityLoading } = useLeadActivity(leadId);

  const [activePitchTab, setActivePitchTab] = useState('call');
  const [noteText, setNoteText] = useState('');
  const [copyFeedback, setCopyFeedback] = useState(false);
  
  // Call Logger States
  const [callOutcome, setCallOutcome] = useState('Spoke with Owner');
  const [callDetails, setCallDetails] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');

  // Team Assignment State
  const [teamMembers, setTeamMembers] = useState([]);
  const [isAssigning, setIsAssigning] = useState(false);

  // Edit Logs States
  const [editingLogId, setEditingLogId] = useState(null);
  const [editOutcome, setEditOutcome] = useState('');
  const [editFollowUpDate, setEditFollowUpDate] = useState('');
  const [editDetails, setEditDetails] = useState('');

  const lead = leadResponse?.data;

  // Compute ownership-gated modifier checks
  const isOwner = lead ? (!lead.owner || lead.owner._id === user?.id || lead.owner === user?.id) : true;
  const isAssigned = lead?.assignedTo ? (lead.assignedTo._id === user?.id || lead.assignedTo === user?.id) : false;
  const hasEditPermission = user?.role === 'Admin' || isOwner || isAssigned;
  
  // Final access capability
  const canModifyThisLead = (user?.role === 'Admin' || user?.permissions?.canEditLeads) && hasEditPermission;
  const isReadOnly = lead?.owner && !canModifyThisLead;
  const canScan = user?.role === 'Admin' || user?.permissions?.canScan;

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Load team members for lead assignment
  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const response = await authService.getUsers();
        const approvedUsers = (response || []).filter(u => u.isApproved);
        setTeamMembers(approvedUsers);
      } catch (err) {
        console.error('Failed to load team members:', err);
      }
    };
    if (user && leadId) {
      fetchTeam();
    }
  }, [user, leadId]);

  if (!leadId) return null;

  const handleStatusChange = (e) => {
    if (!canModifyThisLead) return;
    updateStatusMutation.mutate({ id: leadId, status: e.target.value });
  };

  const handleAssignChange = (e) => {
    if (!canModifyThisLead) return;
    const targetUserId = e.target.value;
    if (!targetUserId) return;
    
    setIsAssigning(true);
    assignMutation.mutate({ id: leadId, userId: targetUserId }, {
      onSuccess: () => {
        setIsAssigning(false);
      },
      onError: (err) => {
        setIsAssigning(false);
        alert(err.response?.data?.message || err.message);
      }
    });
  };

  const handleLogCallSubmit = (e) => {
    e.preventDefault();
    if (!canModifyThisLead || logCallMutation.isPending) return;
    
    logCallMutation.mutate({
      id: leadId,
      callOutcome,
      details: callDetails.trim() || `Call logged. Outcome: ${callOutcome}`,
      followUpDate: followUpDate || null
    }, {
      onSuccess: () => {
        setCallDetails('');
        setFollowUpDate('');
      },
      onError: (err) => {
        alert(err.response?.data?.message || err.message);
      }
    });
  };

  const handleAddNoteSubmit = (e) => {
    e.preventDefault();
    if (!noteText.trim() || !canModifyThisLead) return;
    addNoteMutation.mutate({ id: leadId, content: noteText.trim() }, {
      onSuccess: () => {
        setNoteText('');
      }
    });
  };

  const handleCopyPitch = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const handleAuditClick = (force = false) => {
    if (!canScan || auditMutation.isPending) return;
    auditMutation.mutate({ id: leadId, force });
  };

  const handleGenerateAiClick = () => {
    if (!canScan || generateAiMutation.isPending) return;
    generateAiMutation.mutate(leadId);
  };

  const handleRegenAiClick = () => {
    if (!canScan || regenerateAiMutation.isPending) return;
    regenerateAiMutation.mutate(leadId);
  };

  // Activity Log Gated Permission Check
  const canModifyThisLog = (log) => {
    if (!['AddNote', 'CallLog'].includes(log.actionType)) return false;
    const authorId = log.userId?._id || log.userId;
    return user?.role === 'Admin' || (authorId && authorId === user?.id);
  };

  const startEditing = (log) => {
    setEditingLogId(log._id);
    setEditOutcome(log.callOutcome || 'Spoke with Owner');
    setEditFollowUpDate(log.followUpDate ? new Date(log.followUpDate).toISOString().split('T')[0] : '');
    
    let rawText = log.details;
    if (log.actionType === 'AddNote') {
      rawText = log.details.replace(/^Note logged: "/, '').replace(/"$/, '').replace(/^Note added by .*?: "/, '').replace(/"$/, '');
    }
    setEditDetails(rawText);
  };

  const cancelEditing = () => {
    setEditingLogId(null);
    setEditOutcome('');
    setEditFollowUpDate('');
    setEditDetails('');
  };

  const handleEditSubmit = (e, logId, actionType) => {
    e.preventDefault();
    
    const payload = {};
    if (actionType === 'AddNote') {
      payload.details = editDetails.trim();
    } else {
      payload.details = editDetails.trim();
      payload.callOutcome = editOutcome;
      payload.followUpDate = editFollowUpDate || null;
    }

    updateActivityMutation.mutate({
      id: leadId,
      logId,
      data: payload
    }, {
      onSuccess: () => {
        cancelEditing();
      },
      onError: (err) => {
        alert(err.response?.data?.message || err.message);
      }
    });
  };

  const handleDeleteLog = (logId) => {
    if (!window.confirm('Are you sure you want to permanently delete this log entry? Lead call statistics will automatically sync.')) {
      return;
    }
    
    deleteActivityMutation.mutate({
      id: leadId,
      logId
    }, {
      onError: (err) => {
        alert(err.response?.data?.message || err.message);
      }
    });
  };

  const getOpportunityColor = (level) => {
    if (level === 'High') return 'bg-success/10 text-success border-success/30';
    if (level === 'Medium') return 'bg-warning/10 text-warning border-warning/30';
    return 'bg-danger/10 text-danger border-danger/30';
  };

  const getWebsiteStatusColor = (status) => {
    if (status === 'Responsive') return 'bg-success/10 text-success';
    if (status === 'No Website') return 'bg-danger/10 text-danger';
    if (status === 'Offline') return 'bg-danger/20 text-danger';
    return 'bg-warning/10 text-warning';
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end select-none">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/85 backdrop-blur-sm animate-fade-in cursor-pointer" 
        onClick={onClose}
      />

      {/* Drawer Container (Full-width on mobile, 600px on desktop) */}
      <div className="relative w-full md:w-[600px] h-full bg-card border-l border-border shadow-2xl flex flex-col z-10 animate-slide-in-right">
        
        {/* Drawer Header */}
        <div className="h-14 px-6 border-b border-border flex items-center justify-between bg-card/90">
          <div className="flex items-center gap-3">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getOpportunityColor(lead?.opportunityLevel)}`}>
              {lead?.opportunityLevel || 'Low'} Opportunity
            </span>
            <span className="text-xs font-mono text-text-secondary">Lead Score: {lead?.leadScore}/100</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-elevated rounded text-text-secondary hover:text-text transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Lock Banner for Read-Only State */}
        {isReadOnly && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-2.5 text-amber-500 text-xs flex items-center gap-2 font-medium">
            <AlertCircle size={14} className="flex-shrink-0" />
            <span>Read-Only: This lead is owned by {lead?.owner?.name || 'another member'}. Only the owner or an admin can modify.</span>
          </div>
        )}

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="h-48 flex items-center justify-center flex-col gap-2">
              <span className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin"></span>
              <span className="text-xs text-text-muted font-mono">Querying lead dossier...</span>
            </div>
          ) : error ? (
            <div className="p-4 bg-danger/10 border border-danger/30 rounded-lg text-danger text-xs flex gap-2">
              <AlertCircle size={16} />
              <span>Failed to fetch lead details: {error.message}</span>
            </div>
          ) : (
            <>
              {/* Business Identity */}
              <div>
                <h2 className="text-xl font-bold tracking-tight text-text leading-tight">{lead.businessName}</h2>
                <p className="text-xs text-text-secondary mt-1 font-semibold uppercase tracking-wider">{lead.category}</p>
                
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-start gap-2.5 text-text-secondary">
                    <MapPin size={14} className="mt-0.5 flex-shrink-0 text-text-muted" />
                    <span>{lead.address}</span>
                  </div>
                  {lead.phone && (
                    <div className="flex items-center gap-2.5 text-text-secondary">
                      <Phone size={14} className="flex-shrink-0 text-text-muted" />
                      <span>{lead.phone}</span>
                    </div>
                  )}
                  {lead.website && (
                    <div className="flex items-center gap-2.5 text-text-secondary">
                      <Globe size={14} className="flex-shrink-0 text-text-muted" />
                      <a 
                        href={lead.website} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-primary hover:underline flex items-center gap-1 font-medium"
                      >
                        {lead.website}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-xs font-semibold text-text-secondary pt-1 font-mono">
                    <span>Google Maps URL:</span>
                    <a 
                      href={lead.googleMapsUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="bg-elevated hover:bg-border/60 px-2 py-0.5 rounded border border-border text-text font-bold"
                    >
                      View Profile
                    </a>
                  </div>
                </div>
              </div>

              {/* Status & Assignment Section */}
              <div className="grid grid-cols-2 gap-3 bg-background/40 border border-border p-4 rounded-lg">
                <div>
                  <label className="block text-[10px] text-text-muted font-bold uppercase tracking-wider mb-1">Outreach Status</label>
                  <select
                    value={lead.status}
                    disabled={!canModifyThisLead}
                    onChange={handleStatusChange}
                    className="w-full bg-elevated border border-border text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-primary focus:border-primary text-text select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Follow Up">Follow Up</option>
                    <option value="Interested">Interested</option>
                    <option value="Closed">Closed</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-[10px] text-text-muted font-bold uppercase tracking-wider mb-1">Assigned Agent</label>
                  <select
                    value={lead.assignedTo?._id || lead.assignedTo || ''}
                    disabled={!canModifyThisLead || isAssigning}
                    onChange={handleAssignChange}
                    className="w-full bg-elevated border border-border text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-primary focus:border-primary text-text select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Unassigned</option>
                    {teamMembers.map((member) => (
                      <option key={member._id} value={member._id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Technical Website Audit Details */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Technical Audit</h3>
                  {lead.website && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAuditClick(false)}
                        disabled={auditMutation.isPending || !canScan}
                        className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1 transition-all disabled:text-text-muted disabled:cursor-not-allowed cursor-pointer"
                        title="Run cached audit or query state"
                      >
                        <RefreshCw size={10} className={auditMutation.isPending && !auditMutation.variables?.force ? 'animate-spin' : ''} />
                        <span>Run Audit</span>
                      </button>
                      <span className="text-text-muted text-[9px] select-none">|</span>
                      <button
                        onClick={() => handleAuditClick(true)}
                        disabled={auditMutation.isPending || !canScan}
                        className="text-[10px] font-bold text-warning hover:underline flex items-center gap-1 transition-all disabled:text-text-muted disabled:cursor-not-allowed cursor-pointer"
                        title="Bypass 7-day cache and crawl website using Playwright"
                      >
                        <RefreshCw size={10} className={auditMutation.isPending && auditMutation.variables?.force ? 'animate-spin' : ''} />
                        <span>Force Re-Audit</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Audit Error Alert Banner */}
                {auditMutation.isError && (
                  <div className="p-3 bg-danger/10 border border-danger/20 rounded text-danger text-xs flex gap-2">
                    <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                    <span>Audit failed: {auditMutation.error.response?.data?.message || auditMutation.error.message}</span>
                  </div>
                )}
                
                <div className="bg-card border border-border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Audit Score</span>
                      <div className="text-xl font-extrabold text-text mt-0.5">{lead.websiteScore}/100</div>
                      {lead.lastAuditAt && (
                        <div className="text-[9px] text-text-muted font-mono mt-1 font-semibold">
                          Last Audited: {new Date(lead.lastAuditAt).toLocaleString()}
                        </div>
                      )}
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${getWebsiteStatusColor(lead.websiteStatus)}`}>
                      {lead.websiteStatus}
                    </span>
                  </div>

                  {/* Indicators */}
                  {lead.audit && (
                    <div className="grid grid-cols-2 gap-2 text-xs border-t border-border pt-3">
                      <div className="flex justify-between items-center bg-background/20 p-2 rounded border border-border/40">
                        <span className="text-text-muted font-medium">HTTPS Status:</span>
                        <span className={`font-semibold ${lead.audit.isHttps ? 'text-success' : 'text-danger'}`}>
                          {lead.audit.isHttps ? 'Secure' : 'Insecure'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center bg-background/20 p-2 rounded border border-border/40">
                        <span className="text-text-muted font-medium">Viewport Responsive:</span>
                        <span className={`font-semibold ${lead.audit.isMobileResponsive ? 'text-success' : 'text-danger'}`}>
                          {lead.audit.isMobileResponsive ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center bg-background/20 p-2 rounded border border-border/40 col-span-2">
                        <span className="text-text-muted font-medium">FCP Response Load Time:</span>
                        <span className="font-mono font-bold text-text">
                          {lead.audit.responseTimeMs ? `${(lead.audit.responseTimeMs / 1000).toFixed(2)}s` : 'Unknown'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Issue Checklist */}
                  {lead.audit?.issues && lead.audit.issues.length > 0 && (
                    <div className="space-y-1.5 border-t border-border pt-3">
                      <span className="text-[10px] font-bold text-danger uppercase tracking-wider flex items-center gap-1.5">
                        <AlertCircle size={12} />
                        Technical Warnings ({lead.audit.issues.length})
                      </span>
                      <ul className="text-xs text-text-secondary space-y-1 pl-4 list-disc">
                        {lead.audit.issues.map((issue, idx) => (
                          <li key={idx}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* AI Strategy Overview */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">AI Intelligence</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleGenerateAiClick}
                      disabled={generateAiMutation.isPending || regenerateAiMutation.isPending || !canScan}
                      className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1 transition-all disabled:text-text-muted disabled:cursor-not-allowed cursor-pointer"
                      title="Run cached Groq AI summary and pitches generation"
                    >
                      <RefreshCw size={10} className={generateAiMutation.isPending ? 'animate-spin' : ''} />
                      <span>Generate AI</span>
                    </button>
                    {lead.aiSummary && lead.aiSummary.trim() !== '' && (
                      <>
                        <span className="text-text-muted text-[9px] select-none">|</span>
                        <button
                          onClick={handleRegenAiClick}
                          disabled={generateAiMutation.isPending || regenerateAiMutation.isPending || !canScan}
                          className="text-[10px] font-bold text-warning hover:underline flex items-center gap-1 transition-all disabled:text-text-muted disabled:cursor-not-allowed cursor-pointer"
                          title="Force regenerate pitches and summary via Groq"
                        >
                          <RefreshCw size={10} className={regenerateAiMutation.isPending ? 'animate-spin' : ''} />
                          <span>Regenerate AI</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* AI Generation Error Alert Banner */}
                {generateAiMutation.isError && (
                  <div className="p-3 bg-danger/10 border border-danger/20 rounded text-danger text-xs flex gap-2">
                    <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                    <span>AI generation failed: {generateAiMutation.error.response?.data?.message || generateAiMutation.error.message}</span>
                  </div>
                )}

                {/* AI Regeneration Error Alert Banner */}
                {regenerateAiMutation.isError && (
                  <div className="p-3 bg-danger/10 border border-danger/20 rounded text-danger text-xs flex gap-2">
                    <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                    <span>AI regeneration failed: {regenerateAiMutation.error.response?.data?.message || regenerateAiMutation.error.message}</span>
                  </div>
                )}
                
                <div className="bg-card border border-border rounded-lg p-4 space-y-3">
                  <div>
                    <span className="text-[9px] text-primary font-bold uppercase tracking-wider font-mono">Recommended service proposal</span>
                    <p className="text-sm font-bold text-text mt-0.5">{lead.recommendedService}</p>
                  </div>
                  <div className="border-t border-border pt-3">
                    <span className="text-[9px] text-primary font-bold uppercase tracking-wider font-mono">Profile summary</span>
                    <p className="text-xs text-text-secondary leading-relaxed mt-1">{lead.aiSummary || 'Summary pending...'}</p>
                  </div>
                  <div className="border-t border-border pt-3">
                    <span className="text-[9px] text-primary font-bold uppercase tracking-wider font-mono">Opportunity analysis justification</span>
                    <p className="text-xs text-text-secondary leading-relaxed mt-1">{lead.aiReason || 'Analysis logic pending...'}</p>
                  </div>
                </div>
              </div>

              {/* Pitch Deck Generator Panel */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">AI Sales Outreach</h3>
                  <button 
                    onClick={() => {
                      let text = '';
                      if (activePitchTab === 'call') text = lead.callPitch;
                      else if (activePitchTab === 'whatsapp') text = lead.whatsappPitch;
                      else if (activePitchTab === 'email') text = lead.emailPitch;
                      else if (activePitchTab === 'meeting') text = lead.meetingPitch;
                      handleCopyPitch(text);
                    }}
                    className="flex items-center gap-1 text-[10px] text-primary hover:text-primary-hover font-semibold cursor-pointer"
                  >
                    {copyFeedback ? (
                      <>
                        <Check size={12} className="text-success" />
                        <span className="text-success">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span>Copy Clipboard</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="border border-border rounded-lg overflow-hidden bg-card flex flex-col">
                  {/* Pitch Tab Toggles */}
                  <div className="flex border-b border-border bg-[#111113]/30">
                    {['call', 'whatsapp', 'email', 'meeting'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActivePitchTab(tab)}
                        className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                          activePitchTab === tab
                            ? 'border-primary text-text bg-card'
                            : 'border-transparent text-text-secondary hover:text-text hover:bg-background/20'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  {/* Pitch Contents */}
                  <div className="p-4 bg-[#111113]/10">
                    <pre className="text-xs font-mono text-text-secondary whitespace-pre-wrap leading-relaxed select-text min-h-[100px] max-h-[220px] overflow-y-auto">
                      {activePitchTab === 'call' && (lead.callPitch || 'Call pitch unavailable.')}
                      {activePitchTab === 'whatsapp' && (lead.whatsappPitch || 'WhatsApp message unavailable.')}
                      {activePitchTab === 'email' && (lead.emailPitch || 'Email outreach template unavailable.')}
                      {activePitchTab === 'meeting' && (lead.meetingPitch || 'Meeting proposal details unavailable.')}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Log Outreach Call Logger Panel */}
              <div className="bg-card border border-border rounded-lg p-4 space-y-3.5">
                <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                  <Phone size={12} className="text-primary" />
                  Log Outreach Call
                </h3>
                
                <form onSubmit={handleLogCallSubmit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] text-text-muted font-bold uppercase tracking-wider mb-1">Call Outcome</label>
                      <select
                        value={callOutcome}
                        disabled={!canModifyThisLead || logCallMutation.isPending}
                        onChange={(e) => setCallOutcome(e.target.value)}
                        className="w-full bg-background border border-border text-xs rounded-lg px-2.5 py-1.5 text-text cursor-pointer disabled:opacity-50"
                      >
                        <option value="Spoke with Owner">Spoke with Owner</option>
                        <option value="Left Voicemail">Left Voicemail</option>
                        <option value="Busy / No Answer">Busy / No Answer</option>
                        <option value="Gatekeeper Blocked">Gatekeeper Blocked</option>
                        <option value="Callback Scheduled">Callback Scheduled</option>
                        <option value="Wrong Number">Wrong Number</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] text-text-muted font-bold uppercase tracking-wider mb-1">Schedule Follow-up (Optional)</label>
                      <input
                        type="date"
                        value={followUpDate}
                        disabled={!canModifyThisLead || logCallMutation.isPending}
                        onChange={(e) => setFollowUpDate(e.target.value)}
                        className="w-full bg-background border border-border text-xs rounded-lg px-2.5 py-1.5 text-text disabled:opacity-50"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-[9px] text-text-muted font-bold uppercase tracking-wider mb-1">Call Summary & Notes</label>
                    <textarea
                      value={callDetails}
                      disabled={!canModifyThisLead || logCallMutation.isPending}
                      onChange={(e) => setCallDetails(e.target.value)}
                      placeholder="Summarize the outcome, client objections, or next actions..."
                      rows="2"
                      className="w-full bg-background border border-border text-xs rounded-lg p-2 text-text placeholder-text-muted/50 disabled:opacity-50"
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={!canModifyThisLead || logCallMutation.isPending}
                    className="w-full bg-primary hover:bg-primary-hover py-2 rounded-lg text-text font-bold text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Phone size={12} />
                    <span>{logCallMutation.isPending ? 'Logging Call...' : 'Log Call & Update Status'}</span>
                  </button>
                </form>
              </div>

              {/* Notes Timeline Logs */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Add Dossier Note</h3>
                
                {/* Note entry Form */}
                <form onSubmit={handleAddNoteSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={noteText}
                    disabled={!canModifyThisLead}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder={canModifyThisLead ? "Log client details, pricing discussions, manual remarks..." : "You do not have permission to add notes"}
                    className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-text placeholder-text-muted/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <button 
                    type="submit" 
                    disabled={addNoteMutation.isPending || !canModifyThisLead}
                    className="bg-primary hover:bg-primary-hover px-3 py-1.5 rounded-lg text-text font-bold text-xs flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <span>Log</span>
                  </button>
                </form>
              </div>

              {/* Complete Chronological Activity History */}
              <div className="space-y-3 border-t border-border pt-4">
                <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                  <Clock size={12} className="text-text-muted" />
                  Activity History
                </h3>
                
                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                  {isActivityLoading ? (
                    <div className="py-6 text-center text-xs text-text-muted font-mono animate-pulse">Loading activity logs...</div>
                  ) : activityResponse?.data && activityResponse.data.length > 0 ? (
                    <div className="relative pl-4 border-l border-border/85 space-y-4 ml-2 mt-2">
                      {activityResponse.data.map((log) => (
                        <div key={log._id} className="relative select-text">
                          {/* Bullet Marker */}
                          <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-border bg-card" />
                          
                          <div className="bg-background/20 border border-border/40 p-3 rounded-lg text-xs space-y-1.5">
                            <div className="flex items-center justify-between text-[10px] text-text-muted">
                              <span className="font-bold flex items-center gap-1">
                                {log.userId?.picture ? (
                                  <img src={log.userId.picture} className="w-3.5 h-3.5 rounded-full object-cover" alt="" />
                                ) : (
                                  <span className="w-3.5 h-3.5 rounded-full bg-primary/10 flex items-center justify-center text-[7px] text-primary font-bold">
                                    {log.userId?.name ? log.userId.name.slice(0, 2).toUpperCase() : 'SYS'}
                                  </span>
                                )}
                                <span>{log.userId?.name || 'System / Scan Worker'}</span>
                              </span>
                              <span className="font-mono text-[9px]">{new Date(log.timestamp).toLocaleString()}</span>
                            </div>

                            {/* Activity Log Editor Gating */}
                            {editingLogId === log._id ? (
                              log.actionType === 'AddNote' ? (
                                <form onSubmit={(e) => handleEditSubmit(e, log._id, 'AddNote')} className="space-y-2 mt-1">
                                  <textarea
                                    value={editDetails}
                                    onChange={(e) => setEditDetails(e.target.value)}
                                    className="w-full bg-background border border-border text-xs rounded-lg p-2 text-text"
                                    rows="2"
                                  />
                                  <div className="flex gap-2 justify-end">
                                    <button 
                                      type="button" 
                                      onClick={cancelEditing}
                                      className="px-2 py-1 bg-elevated hover:bg-border text-[10px] font-bold text-text-secondary hover:text-text rounded cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                    <button 
                                      type="submit" 
                                      disabled={updateActivityMutation.isPending}
                                      className="px-2 py-1 bg-primary hover:bg-primary-hover text-[10px] font-bold text-text rounded cursor-pointer"
                                    >
                                      {updateActivityMutation.isPending ? 'Saving...' : 'Save'}
                                    </button>
                                  </div>
                                </form>
                              ) : (
                                <form onSubmit={(e) => handleEditSubmit(e, log._id, 'CallLog')} className="space-y-2 mt-1">
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="block text-[8px] text-text-muted font-bold uppercase tracking-wider mb-0.5">Outcome</label>
                                      <select
                                        value={editOutcome}
                                        onChange={(e) => setEditOutcome(e.target.value)}
                                        className="w-full bg-background border border-border text-[10px] rounded px-2 py-1 text-text cursor-pointer"
                                      >
                                        <option value="Spoke with Owner">Spoke with Owner</option>
                                        <option value="Left Voicemail">Left Voicemail</option>
                                        <option value="Busy / No Answer">Busy / No Answer</option>
                                        <option value="Gatekeeper Blocked">Gatekeeper Blocked</option>
                                        <option value="Callback Scheduled">Callback Scheduled</option>
                                        <option value="Wrong Number">Wrong Number</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-[8px] text-text-muted font-bold uppercase tracking-wider mb-0.5">Follow-Up Date</label>
                                      <input
                                        type="date"
                                        value={editFollowUpDate}
                                        onChange={(e) => setEditFollowUpDate(e.target.value)}
                                        className="w-full bg-background border border-border text-[10px] rounded px-2 py-1 text-text"
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-[8px] text-text-muted font-bold uppercase tracking-wider mb-0.5">Summary</label>
                                    <textarea
                                      value={editDetails}
                                      onChange={(e) => setEditDetails(e.target.value)}
                                      className="w-full bg-background border border-border text-xs rounded-lg p-2 text-text"
                                      rows="2"
                                    />
                                  </div>
                                  <div className="flex gap-2 justify-end">
                                    <button 
                                      type="button" 
                                      onClick={cancelEditing}
                                      className="px-2 py-1 bg-elevated hover:bg-border text-[10px] font-bold text-text-secondary hover:text-text rounded cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                    <button 
                                      type="submit" 
                                      disabled={updateActivityMutation.isPending}
                                      className="px-2 py-1 bg-primary hover:bg-primary-hover text-[10px] font-bold text-text rounded cursor-pointer"
                                    >
                                      {updateActivityMutation.isPending ? 'Saving...' : 'Save'}
                                    </button>
                                  </div>
                                </form>
                              )
                            ) : (
                              <div className="flex justify-between items-start">
                                <p className="text-text-secondary leading-normal font-sans font-medium">{log.details}</p>
                                
                                {canModifyThisLog(log) && !editingLogId && (
                                  <div className="flex items-center gap-1.5 ml-2">
                                    <button
                                      onClick={() => startEditing(log)}
                                      className="p-1 hover:bg-elevated text-text-muted hover:text-primary rounded transition-all cursor-pointer"
                                      title="Edit Log"
                                    >
                                      <Edit2 size={11} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteLog(log._id)}
                                      disabled={deleteActivityMutation.isPending}
                                      className="p-1 hover:bg-elevated text-text-muted hover:text-danger rounded transition-all cursor-pointer"
                                      title="Delete Log"
                                    >
                                      <Trash2 size={11} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {(log.callOutcome || log.followUpDate) && !editingLogId && (
                              <div className="flex flex-wrap gap-1.5 text-[9px] font-mono mt-1">
                                {log.callOutcome && (
                                  <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold">
                                    Outcome: {log.callOutcome}
                                  </span>
                                )}
                                {log.followUpDate && (
                                  <span className="bg-warning/10 text-warning px-1.5 py-0.5 rounded font-bold">
                                    Follow Up: {new Date(log.followUpDate).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[10px] font-bold text-text-muted/60 text-center py-6 bg-background/10 rounded border border-dashed border-border/40 uppercase tracking-wider">
                      No activities logged yet.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
