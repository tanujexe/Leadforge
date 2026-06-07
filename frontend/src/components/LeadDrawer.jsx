import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Calendar, Phone, Globe, MapPin, AlertCircle, Send, RefreshCw, Eye } from 'lucide-react';
import { useLead, useUpdateLeadStatus, useAddLeadNote, useManuallyAuditLead, useManuallyRegenerateAI, useManuallyGenerateAI } from '../hooks/useLeads';

export default function LeadDrawer({ leadId, onClose }) {
  const { data: leadResponse, isLoading, error } = useLead(leadId);
  const updateStatusMutation = useUpdateLeadStatus();
  const addNoteMutation = useAddLeadNote();
  const auditMutation = useManuallyAuditLead();
  const generateAiMutation = useManuallyGenerateAI();
  const regenerateAiMutation = useManuallyRegenerateAI();

  const [activePitchTab, setActivePitchTab] = useState('call');
  const [noteText, setNoteText] = useState('');
  const [copyFeedback, setCopyFeedback] = useState(false);

  const lead = leadResponse?.data;

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!leadId) return null;

  const handleStatusChange = (e) => {
    updateStatusMutation.mutate({ id: leadId, status: e.target.value });
  };

  const handleAddNoteSubmit = (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
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
    if (auditMutation.isPending) return;
    auditMutation.mutate({ id: leadId, force });
  };

  const handleGenerateAiClick = () => {
    if (generateAiMutation.isPending) return;
    generateAiMutation.mutate(leadId);
  };

  const handleRegenAiClick = () => {
    if (regenerateAiMutation.isPending) return;
    regenerateAiMutation.mutate(leadId);
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
            className="p-1 hover:bg-elevated rounded text-text-secondary hover:text-text transition-all"
          >
            <X size={18} />
          </button>
        </div>

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

              {/* Status Select Box */}
              <div className="bg-background/40 border border-border p-3.5 rounded-lg flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Outreach status</span>
                  <span className="text-xs font-semibold text-text-secondary">Pipeline Placement</span>
                </div>
                <select
                  value={lead.status}
                  onChange={handleStatusChange}
                  className="bg-elevated border border-border text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-primary focus:border-primary text-text select-none cursor-pointer"
                >
                  <option value="New">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Follow Up">Follow Up</option>
                  <option value="Interested">Interested</option>
                  <option value="Closed">Closed</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              {/* Technical Website Audit Details */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Technical Audit</h3>
                  {lead.website && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAuditClick(false)}
                        disabled={auditMutation.isPending}
                        className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1 transition-all disabled:text-text-muted"
                        title="Run cached audit or query state"
                      >
                        <RefreshCw size={10} className={auditMutation.isPending && !auditMutation.variables?.force ? 'animate-spin' : ''} />
                        <span>Run Audit</span>
                      </button>
                      <span className="text-text-muted text-[9px] select-none">|</span>
                      <button
                        onClick={() => handleAuditClick(true)}
                        disabled={auditMutation.isPending}
                        className="text-[10px] font-bold text-warning hover:underline flex items-center gap-1 transition-all disabled:text-text-muted"
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
                      disabled={generateAiMutation.isPending || regenerateAiMutation.isPending}
                      className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1 transition-all disabled:text-text-muted"
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
                          disabled={generateAiMutation.isPending || regenerateAiMutation.isPending}
                          className="text-[10px] font-bold text-warning hover:underline flex items-center gap-1 transition-all disabled:text-text-muted"
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
                    className="flex items-center gap-1 text-[10px] text-primary hover:text-primary-hover font-semibold"
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
                        className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider border-b-2 transition-all ${
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

              {/* Notes Timeline Logs */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Dossier Notes</h3>
                
                {/* Note entry Form */}
                <form onSubmit={handleAddNoteSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Log client call details or follow ups..."
                    className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-text placeholder-text-muted/50"
                  />
                  <button 
                    type="submit" 
                    disabled={addNoteMutation.isPending}
                    className="bg-primary hover:bg-primary-hover px-3 py-1.5 rounded-lg text-text font-bold text-xs flex items-center gap-1 transition-all"
                  >
                    <span>Log</span>
                  </button>
                </form>

                {/* Timeline */}
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                  {lead.notes && lead.notes.length > 0 ? (
                    lead.notes.map((note) => (
                      <div key={note._id} className="bg-background/20 border border-border/40 p-2.5 rounded text-xs space-y-1">
                        <div className="flex items-center gap-1 text-[10px] text-text-muted font-bold font-mono">
                          <Calendar size={10} />
                          <span>{new Date(note.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-text-secondary leading-normal font-sans select-text">{note.content}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-[10px] font-bold text-text-muted/60 text-center py-4 bg-background/10 rounded border border-dashed border-border/40 uppercase tracking-wider">
                      Timeline empty.
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
