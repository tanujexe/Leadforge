import React, { useState, useEffect } from 'react';
import { Search, Download, Trash2, Eye, Globe, Star, ShieldAlert, Phone, Filter, ChevronLeft, ChevronRight, CheckSquare, Edit, Trash, AlertTriangle, AlertCircle, MapPin } from 'lucide-react';
import { useLeads, useDeleteLead, useBulkUpdateStatus, useBulkAddNote, useBulkDeleteLeads } from '../hooks/useLeads';
import LeadDrawer from '../components/LeadDrawer';

export default function LeadManagement() {
  const [search, setSearch] = useState('');
  const [hasWebsite, setHasWebsite] = useState('');
  const [opportunityLevel, setOpportunityLevel] = useState('');
  const [websiteStatus, setWebsiteStatus] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const limit = 50;

  // Bulk selections
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedLeadId, setSelectedLeadId] = useState(null);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
    setSelectedIds([]);
  }, [search, hasWebsite, opportunityLevel, websiteStatus, status, category, city]);

  // Compile filters
  const filters = { page, limit };
  if (search.trim()) filters.search = search.trim();
  if (hasWebsite) filters.hasWebsite = hasWebsite;
  if (opportunityLevel) filters.opportunityLevel = opportunityLevel;
  if (websiteStatus) filters.websiteStatus = websiteStatus;
  if (status) filters.status = status;
  if (category) filters.category = category;
  if (city) filters.city = city;

  const { data: leadsResponse, isLoading, error, refetch } = useLeads(filters);
  const deleteMutation = useDeleteLead();
  const bulkStatusMutation = useBulkUpdateStatus();
  const bulkNoteMutation = useBulkAddNote();
  const bulkDeleteMutation = useBulkDeleteLeads();

  const leads = leadsResponse?.data || [];
  const totalPages = leadsResponse?.totalPages || 1;
  const totalLeads = leadsResponse?.totalLeads || 0;

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(leads.map(l => l._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id, e) => {
    e.stopPropagation(); // Prevent opening drawer
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(item => item !== id));
    } else {
      setSelectedIds(prev => [...prev, id]);
    }
  };

  const handleDeleteLead = (id, name, e) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete lead "${name}"? This action cannot be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleBulkStatusChange = (newStatus) => {
    if (selectedIds.length === 0) return;
    bulkStatusMutation.mutate(
      { ids: selectedIds, status: newStatus },
      {
        onSuccess: () => {
          setSelectedIds([]);
        }
      }
    );
  };

  const handleBulkAddNote = () => {
    if (selectedIds.length === 0) return;
    const content = window.prompt(`Log identical notes to all ${selectedIds.length} selected leads:`);
    if (!content || !content.trim()) return;

    bulkNoteMutation.mutate(
      { ids: selectedIds, content: content.trim() },
      {
        onSuccess: () => {
          setSelectedIds([]);
        }
      }
    );
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Are you sure you want to delete all ${selectedIds.length} selected leads? This action cannot be undone.`)) {
      bulkDeleteMutation.mutate(selectedIds, {
        onSuccess: () => {
          setSelectedIds([]);
        }
      });
    }
  };

  const getExcelExportLink = () => {
    if (selectedIds.length > 0) {
      return `/api/export/excel?ids=${selectedIds.join(',')}`;
    }
    return '/api/export/excel';
  };

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
    return 'bg-border/60 text-text-secondary border border-border'; // New
  };

  const getWebsiteStatusColor = (status) => {
    if (status === 'Responsive') return 'bg-success/10 text-success';
    if (status === 'No Website') return 'bg-danger/10 text-danger';
    if (status === 'Offline') return 'bg-danger/20 text-danger';
    return 'bg-warning/10 text-warning';
  };

  return (
    <div className="space-y-4 select-none relative pb-20">
      
      {/* 1. Database Connection & System Errors Handling Banner */}
      {error && (
        <div className="bg-card border border-danger/30 rounded-lg p-5 space-y-3">
          <div className="flex items-start gap-3 text-danger">
            <AlertTriangle className="flex-shrink-0 mt-0.5" size={18} />
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider">Database Link Connection Lost</h3>
              <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                LeadForge AI was unable to query your local database. This happens if the backend server is offline or MongoDB is not running.
              </p>
            </div>
          </div>

          <div className="border-t border-border pt-3 space-y-2 text-xs text-text-secondary">
            <p className="font-bold">Troubleshooting steps:</p>
            <ul className="list-disc pl-4 space-y-1 font-mono text-[10px] text-text-muted">
              <li>Ensure MongoDB Service is running: "net start MongoDB" (Windows Powershell)</li>
              <li>Verify backend API server is started: "npm run dev" inside backend/</li>
              <li>Check API host port (defaults to localhost:5000)</li>
            </ul>
            <button
              onClick={() => refetch()}
              className="mt-2 bg-danger hover:bg-danger/90 text-text font-bold px-3 py-1.5 rounded text-[10px] uppercase tracking-wider transition-all"
            >
              Retry Connection
            </button>
          </div>
        </div>
      )}

      {/* 2. Responsive Filters Panel */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search text field */}
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-2.5 text-text-secondary/60" />
            <input
              type="text"
              value={search}
              disabled={!!error}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by business name, category, phone..."
              className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-1.5 text-xs text-text placeholder-text-muted/50 font-medium"
            />
          </div>

          {/* Export link */}
          <a
            href={error ? '#' : getExcelExportLink()}
            onClick={(e) => error && e.preventDefault()}
            target="_blank"
            rel="noreferrer"
            className={`font-bold text-xs px-4 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-sm ${
              error 
                ? 'bg-border text-text-muted cursor-not-allowed opacity-50' 
                : 'bg-success hover:bg-success/90 text-background'
            }`}
          >
            <Download size={14} />
            <span>{selectedIds.length > 0 ? `Export Selected (${selectedIds.length})` : 'Export Lead Sheets'}</span>
          </a>
        </div>

        {/* Filters Selectors Row (Responsive wrapping grid) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:flex lg:flex-wrap gap-2 items-center text-[10px] font-bold text-text-secondary bg-background/30 p-2.5 rounded border border-border/40">
          <div className="col-span-2 lg:col-auto flex items-center gap-1.5 mr-2">
            <Filter size={12} className="text-primary" />
            <span>Refine Directory:</span>
          </div>

          <select
            value={hasWebsite}
            disabled={!!error}
            onChange={(e) => setHasWebsite(e.target.value)}
            className="bg-card border border-border rounded px-2.5 py-1 text-text focus:ring-0 cursor-pointer text-[10px] font-semibold"
          >
            <option value="">All Web presence</option>
            <option value="true">Has Website</option>
            <option value="false">No Website</option>
          </select>

          <select
            value={opportunityLevel}
            disabled={!!error}
            onChange={(e) => setOpportunityLevel(e.target.value)}
            className="bg-card border border-border rounded px-2.5 py-1 text-text focus:ring-0 cursor-pointer text-[10px] font-semibold"
          >
            <option value="">All Priorities</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>

          <select
            value={websiteStatus}
            disabled={!!error}
            onChange={(e) => setWebsiteStatus(e.target.value)}
            className="bg-card border border-border rounded px-2.5 py-1 text-text focus:ring-0 cursor-pointer text-[10px] font-semibold"
          >
            <option value="">All Web states</option>
            <option value="Responsive">Responsive</option>
            <option value="Non Responsive">Non Responsive</option>
            <option value="Slow">Slow</option>
            <option value="Outdated">Outdated</option>
            <option value="Offline">Offline</option>
          </select>

          <select
            value={status}
            disabled={!!error}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-card border border-border rounded px-2.5 py-1 text-text focus:ring-0 cursor-pointer text-[10px] font-semibold"
          >
            <option value="">All Pipelines</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Follow Up">Follow Up</option>
            <option value="Interested">Interested</option>
            <option value="Closed">Closed</option>
            <option value="Rejected">Rejected</option>
          </select>

          <select
            value={category}
            disabled={!!error}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-card border border-border rounded px-2.5 py-1 text-text focus:ring-0 cursor-pointer text-[10px] font-semibold"
          >
            <option value="">All Niches</option>
            <option value="Gym">Gym</option>
            <option value="Cafe">Cafe</option>
            <option value="Salon">Salon</option>
            <option value="Dentist">Dentist</option>
            <option value="Real Estate">Real Estate</option>
            <option value="Restaurant">Restaurant</option>
          </select>

          <select
            value={city}
            disabled={!!error}
            onChange={(e) => setCity(e.target.value)}
            className="bg-card border border-border rounded px-2.5 py-1 text-text focus:ring-0 cursor-pointer text-[10px] font-semibold"
          >
            <option value="">All Cities</option>
            <option value="Bhopal">Bhopal</option>
            <option value="Indore">Indore</option>
            <option value="Gwalior">Gwalior</option>
          </select>

          {(hasWebsite || opportunityLevel || websiteStatus || status || category || city || search) && (
            <button
              onClick={() => {
                setSearch('');
                setHasWebsite('');
                setOpportunityLevel('');
                setWebsiteStatus('');
                setStatus('');
                setCategory('');
                setCity('');
              }}
              className="text-primary hover:underline ml-auto col-span-2 lg:col-auto text-right"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* 3. Lead Listings (Table on Desktop, Cards on Mobile) */}
      {!error && (
        <div className="bg-card border border-border rounded-lg p-4">
          
          {/* A. DESKTOP VIEW: High-Density Table Layout (Visible on medium screens and up) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border text-text-muted uppercase font-bold tracking-wider text-[9px] select-none">
                  <th className="py-2.5 px-3 w-8">
                    <input 
                      type="checkbox"
                      checked={leads.length > 0 && selectedIds.length === leads.length}
                      onChange={handleSelectAll}
                      className="rounded bg-background border-border text-primary focus:ring-0 cursor-pointer"
                    />
                  </th>
                  <th className="py-2.5 px-3">Business Name</th>
                  <th className="py-2.5 px-3">Contact</th>
                  <th className="py-2.5 px-3">Website URL</th>
                  <th className="py-2.5 px-3 text-center">Score</th>
                  <th className="py-2.5 px-3">Audit Category</th>
                  <th className="py-2.5 px-3">Opportunity</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-text-secondary">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-text-muted/60 font-mono">
                      <span className="inline-block w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin mr-2"></span>
                      Loading lead database...
                    </td>
                  </tr>
                ) : leads.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-text-muted/60">
                      No leads matching filter selection.
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => {
                    const isRowSelected = selectedIds.includes(lead._id);
                    return (
                      <tr 
                        key={lead._id} 
                        className={`hover:bg-elevated/40 transition-all cursor-pointer ${isRowSelected ? 'bg-primary/5' : ''}`}
                        onClick={() => setSelectedLeadId(lead._id)}
                      >
                        <td className="py-3 px-3 w-8" onClick={(e) => e.stopPropagation()}>
                          <input 
                            type="checkbox"
                            checked={isRowSelected}
                            onChange={(e) => handleSelectRow(lead._id, e)}
                            className="rounded bg-background border-border text-primary focus:ring-0 cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-3 font-bold text-text text-xs">
                          <div>{lead.businessName}</div>
                          <div className="text-text-muted text-[10px] font-medium mt-0.5 truncate max-w-[150px]">{lead.address}</div>
                        </td>
                        <td className="py-3 px-3 space-y-0.5">
                          {lead.phone ? (
                            <span className="font-mono text-text-secondary">{lead.phone}</span>
                          ) : (
                            <span className="text-[9px] text-text-muted/60 font-mono">No Phone</span>
                          )}
                          <div className="flex items-center gap-1 text-[9px] text-warning">
                            <Star size={9} fill="currentColor" />
                            <span className="font-bold text-text">{lead.rating}</span>
                            <span className="text-text-muted">({lead.reviewCount})</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 max-w-[140px] truncate" onClick={(e) => e.stopPropagation()}>
                          {lead.website ? (
                            <a href={lead.website} target="_blank" rel="noreferrer" className="text-primary hover:underline font-semibold text-xs flex items-center gap-1">
                              <Globe size={11} className="flex-shrink-0" />
                              <span className="truncate">{lead.website.replace(/^https?:\/\/(www\.)?/, '')}</span>
                            </a>
                          ) : (
                            <span className="text-[9px] text-danger bg-danger/10 px-1.5 py-0.5 rounded font-bold">No Website</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center text-text font-bold text-xs">{lead.leadScore}</td>
                        <td className="py-3 px-3">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${getWebsiteStatusColor(lead.websiteStatus)}`}>
                            {lead.websiteStatus}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold ${getOppBadgeColor(lead.opportunityLevel)}`}>
                            {lead.opportunityLevel}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold ${getStatusBadgeColor(lead.status)}`}>
                            {lead.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setSelectedLeadId(lead._id)}
                              className="bg-elevated hover:bg-border/60 p-1 rounded text-text-secondary hover:text-text"
                            >
                              <Eye size={12} />
                            </button>
                            <button
                              onClick={(e) => handleDeleteLead(lead._id, lead.businessName, e)}
                              className="bg-elevated hover:bg-danger/20 p-1 rounded text-text-secondary hover:text-danger"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* B. MOBILE VIEW: Responsive Cards Layout (Visible on small screens only) */}
          <div className="block md:hidden space-y-3">
            {isLoading ? (
              <div className="py-12 text-center text-text-muted/60 font-mono text-xs">
                <span className="inline-block w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin mr-2"></span>
                Loading leads...
              </div>
            ) : leads.length === 0 ? (
              <div className="py-12 text-center text-text-muted/60 text-xs">
                No leads matching filter selection.
              </div>
            ) : (
              leads.map((lead) => {
                const isSelected = selectedIds.includes(lead._id);
                return (
                  <div 
                    key={lead._id}
                    onClick={() => setSelectedLeadId(lead._id)}
                    className={`bg-elevated/20 border rounded-lg p-4 space-y-3 transition-all relative ${
                      isSelected ? 'border-primary/40 bg-primary/5' : 'border-border'
                    }`}
                  >
                    {/* Top row: Checkbox, Name, and Actions */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div onClick={(e) => e.stopPropagation()}>
                          <input 
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => handleSelectRow(lead._id, e)}
                            className="rounded bg-background border-border text-primary focus:ring-0 cursor-pointer"
                          />
                        </div>
                        <div>
                          <h4 className="font-bold text-text text-sm leading-snug">{lead.businessName}</h4>
                          <span className="text-[10px] text-text-muted font-semibold uppercase tracking-wider">{lead.category}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedLeadId(lead._id)}
                          className="p-1 hover:bg-elevated rounded text-text-secondary hover:text-text"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={(e) => handleDeleteLead(lead._id, lead.businessName, e)}
                          className="p-1 hover:bg-danger/20 rounded text-text-secondary hover:text-danger"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Middle details row: Address & Contact */}
                    <div className="text-xs text-text-secondary space-y-1 border-t border-border/40 pt-2.5">
                      <p className="flex items-start gap-1.5 text-text-muted">
                        <MapPin size={12} className="mt-0.5 flex-shrink-0" />
                        <span className="truncate">{lead.address}</span>
                      </p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                        {lead.phone && (
                          <div className="flex items-center gap-1 font-mono">
                            <Phone size={10} />
                            <span>{lead.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-warning">
                          <Star size={10} fill="currentColor" />
                          <span>{lead.rating} ({lead.reviewCount})</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Row: Website, Priority score, Status badges */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-2.5">
                      <div onClick={(e) => e.stopPropagation()}>
                        {lead.website ? (
                          <a href={lead.website} target="_blank" rel="noreferrer" className="text-primary hover:underline text-[10px] font-bold flex items-center gap-0.5">
                            <Globe size={10} />
                            <span>Visit website</span>
                          </a>
                        ) : (
                          <span className="text-[9px] text-danger bg-danger/10 px-1.5 py-0.5 rounded font-bold inline-flex items-center gap-0.5">
                            <ShieldAlert size={9} />
                            <span>No Website</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-extrabold text-text bg-elevated px-1.5 py-0.5 rounded border border-border">
                          {lead.leadScore} Score
                        </span>
                        <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold ${getOppBadgeColor(lead.opportunityLevel)}`}>
                          {lead.opportunityLevel}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold ${getStatusBadgeColor(lead.status)}`}>
                          {lead.status}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Server-Side Pagination Bar */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border/40 pt-4 mt-3 select-none">
              <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider hidden sm:inline">
                Total: {totalLeads} prospects ({leads.length} shown)
              </span>
              <div className="flex items-center justify-between w-full sm:w-auto gap-4 text-xs font-semibold">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                  className="bg-card border border-border text-text hover:bg-elevated disabled:opacity-40 p-1 rounded transition-all"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-text-secondary font-mono text-xs">
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                  className="bg-card border border-border text-text hover:bg-elevated disabled:opacity-40 p-1 rounded transition-all"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Floating Bulk Actions Bar (Responsive layout) */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 lg:left-72 lg:right-8 bg-elevated border border-border rounded-lg p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xl z-40 animate-slide-up select-none">
          <div className="flex items-center gap-2 text-xs font-bold text-text-secondary">
            <CheckSquare size={14} className="text-primary" />
            <span>{selectedIds.length} selected</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto justify-center sm:justify-end">
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleBulkStatusChange(e.target.value);
                  e.target.value = '';
                }
              }}
              className="bg-card border border-border rounded text-[10px] font-bold uppercase tracking-wider px-2 py-1 focus:ring-0 text-text cursor-pointer h-7"
            >
              <option value="">Status Update</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Follow Up">Follow Up</option>
              <option value="Interested">Interested</option>
              <option value="Closed">Closed</option>
              <option value="Rejected">Rejected</option>
            </select>

            <button
              onClick={handleBulkAddNote}
              className="bg-card hover:bg-border/60 border border-border text-text font-bold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded h-7 transition-all flex items-center gap-1"
            >
              <span>Log Note</span>
            </button>

            <button
              onClick={handleBulkDelete}
              className="bg-danger/10 hover:bg-danger/20 border border-danger/20 text-danger font-bold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded h-7 transition-all flex items-center gap-1"
            >
              <span>Delete</span>
            </button>

            <button
              onClick={() => setSelectedIds([])}
              className="text-text-muted hover:text-text font-bold text-[9px] uppercase tracking-wider px-1.5 h-7"
            >
              Deselect
            </button>
          </div>
        </div>
      )}

      {/* Lead Drawer slide-over */}
      {selectedLeadId && (
        <LeadDrawer
          leadId={selectedLeadId}
          onClose={() => setSelectedLeadId(null)}
        />
      )}
    </div>
  );
}
