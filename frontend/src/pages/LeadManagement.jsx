import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Download, Trash2, Eye, Globe, Star, ShieldAlert, Phone, Filter, 
  ChevronLeft, ChevronRight, CheckSquare, Edit, Trash, AlertTriangle, 
  AlertCircle, MapPin, ChevronDown, Check, Flame, Zap, Snowflake, TrendingUp, MessageSquare, Sparkles
} from 'lucide-react';
import { useLeads, useDeleteLead, useBulkUpdateStatus, useBulkAddNote, useBulkDeleteLeads, useSearchHistory } from '../hooks/useLeads';
import LeadDrawer from '../components/LeadDrawer';

// Dropdown Options lists
const webPresenceOptions = [
  { value: '', label: 'All Web presence' },
  { value: 'true', label: 'Has Website' },
  { value: 'false', label: 'No Website' }
];

const priorityOptions = [
  { value: '', label: 'All Priorities' },
  { value: 'High', label: 'High Priority' },
  { value: 'Medium', label: 'Medium Priority' },
  { value: 'Low', label: 'Low Priority' }
];

const webStateOptions = [
  { value: '', label: 'All Web states' },
  { value: 'Responsive', label: 'Responsive' },
  { value: 'Non Responsive', label: 'Non Responsive' },
  { value: 'Slow', label: 'Slow' },
  { value: 'Outdated', label: 'Outdated' },
  { value: 'Offline', label: 'Offline' }
];

const statusOptions = [
  { value: '', label: 'All Pipelines' },
  { value: 'New', label: 'New' },
  { value: 'Contacted', label: 'Contacted' },
  { value: 'Follow Up', label: 'Follow Up' },
  { value: 'Interested', label: 'Interested' },
  { value: 'Closed', label: 'Closed' },
  { value: 'Rejected', label: 'Rejected' }
];

const categoryOptions = [
  { value: '', label: 'All Niches' },
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

const cityOptions = [
  { value: '', label: 'All Cities' },
  { value: 'Bhopal', label: 'Bhopal' },
  { value: 'Indore', label: 'Indore' },
  { value: 'Gwalior', label: 'Gwalior' }
];

const bulkStatusOptions = [
  { value: '', label: 'Status Update' },
  { value: 'New', label: 'New' },
  { value: 'Contacted', label: 'Contacted' },
  { value: 'Follow Up', label: 'Follow Up' },
  { value: 'Interested', label: 'Interested' },
  { value: 'Closed', label: 'Closed' },
  { value: 'Rejected', label: 'Rejected' }
];

/**
 * Compact Custom Select Component for Table Filter Bar & Bulk Actions
 */
function CustomFilterSelect({ value, onChange, options, disabled, widthClass = "min-w-[110px]" }) {
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

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  return (
    <div ref={containerRef} className="relative select-none text-[10px] font-bold">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`bg-card hover:bg-elevated/60 border border-border rounded px-2.5 py-1.5 text-text font-semibold flex items-center justify-between gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all ${widthClass} h-7 shadow-sm`}
      >
        <span>{selectedOption ? selectedOption.label : 'Select...'}</span>
        <ChevronDown size={10} className={`text-text-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-[30px] left-0 bg-[#141b2b] border border-border rounded shadow-2xl z-50 py-1 max-h-48 overflow-y-auto min-w-[140px] backdrop-blur-md bg-opacity-95 divide-y divide-border/20 animate-slide-up-subtle">
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-2.5 py-1.5 font-semibold flex items-center justify-between transition-all hover:bg-primary/10 hover:text-primary ${isSelected ? 'text-primary bg-primary/5' : 'text-text-secondary'}`}
              >
                <span>{option.label}</span>
                {isSelected && <Check size={10} className="text-primary" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function LeadManagement({ selectedSearchQueryId, setSelectedSearchQueryId }) {
  const [search, setSearch] = useState('');
  const [hasWebsite, setHasWebsite] = useState('');
  const [opportunityLevel, setOpportunityLevel] = useState('');
  const [websiteStatus, setWebsiteStatus] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const limit = 40;

  // Bulk selections
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  
  // Quick Filter State for Statistics Summary
  const [quickFilter, setQuickFilter] = useState(null);

  // Fetch search history query context to resolve search query name details
  const { data: historyResponse } = useSearchHistory();
  const activeSearchQuery = historyResponse?.data?.find(s => s._id === selectedSearchQueryId);

  // Reset page and quickFilter when main filters change
  useEffect(() => {
    setPage(1);
    setSelectedIds([]);
    setQuickFilter(null);
  }, [search, hasWebsite, opportunityLevel, websiteStatus, status, category, city]);

  // Reset page when quickFilter or selectedSearchQueryId changes
  useEffect(() => {
    setPage(1);
    setSelectedIds([]);
  }, [quickFilter, selectedSearchQueryId]);

  // Compile filters
  const filters = { page, limit };
  if (search.trim()) filters.search = search.trim();
  if (hasWebsite) filters.hasWebsite = hasWebsite;
  if (opportunityLevel) filters.opportunityLevel = opportunityLevel;
  if (websiteStatus) filters.websiteStatus = websiteStatus;
  if (status) filters.status = status;
  if (category) filters.category = category;
  if (city) filters.city = city;
  if (quickFilter) filters.quickFilter = quickFilter;
  if (selectedSearchQueryId) filters.searchQueryId = selectedSearchQueryId;

  const { data: leadsResponse, isLoading, error, refetch } = useLeads(filters);
  const deleteMutation = useDeleteLead();
  const bulkStatusMutation = useBulkUpdateStatus();
  const bulkNoteMutation = useBulkAddNote();
  const bulkDeleteMutation = useBulkDeleteLeads();

  const leads = leadsResponse?.data || [];
  const totalPages = leadsResponse?.totalPages || 1;
  const totalLeads = leadsResponse?.totalLeads || 0;

  // Use stats counts returned by the database server response
  const counts = leadsResponse?.stats || {
    hot: 0,
    warm: 0,
    cold: 0,
    needWebsite: 0,
    needReputation: 0,
    needSocial: 0,
    enriched: 0
  };

  // The backend already filters server-side for the active quickFilter
  const filteredLeads = leads;

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredLeads.map(l => l._id));
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
    if (selectedIds.length === 0 || !newStatus) return;
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
    const baseUrl = import.meta.env.VITE_API_URL || '';
    let path = '/api/export/excel';
    
    if (selectedIds.length > 0) {
      path += `?ids=${selectedIds.join(',')}`;
    } else {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (hasWebsite) params.append('hasWebsite', hasWebsite);
      if (opportunityLevel) params.append('opportunityLevel', opportunityLevel);
      if (websiteStatus) params.append('websiteStatus', websiteStatus);
      if (status) params.append('status', status);
      if (category) params.append('category', category);
      if (city) params.append('city', city);
      
      const queryString = params.toString();
      if (queryString) {
        path += `?${queryString}`;
      }
    }
    
    return baseUrl ? `${baseUrl}${path}` : path;
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
                ClientScout was unable to query your local database. This happens if the backend server is offline or MongoDB is not running.
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

      {/* 2. Premium Quick Stats Toggles */}
      {!error && (
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
      )}

      {/* 3. Responsive Filters Panel */}
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
            href={error || totalLeads === 0 ? '#' : getExcelExportLink()}
            onClick={(e) => {
              if (error) {
                e.preventDefault();
              } else if (totalLeads === 0) {
                e.preventDefault();
                alert('No leads are available to export with the current filters. Please run a scanner search or adjust your filters.');
              }
            }}
            target={error || totalLeads === 0 ? '_self' : '_blank'}
            rel="noreferrer"
            className={`font-bold text-xs px-4 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-sm ${
              error || totalLeads === 0
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

          <CustomFilterSelect
            value={hasWebsite}
            onChange={setHasWebsite}
            options={webPresenceOptions}
            disabled={!!error}
            widthClass="min-w-[130px]"
          />

          <CustomFilterSelect
            value={opportunityLevel}
            onChange={setOpportunityLevel}
            options={priorityOptions}
            disabled={!!error}
            widthClass="min-w-[110px]"
          />

          <CustomFilterSelect
            value={websiteStatus}
            onChange={setWebsiteStatus}
            options={webStateOptions}
            disabled={!!error}
            widthClass="min-w-[120px]"
          />

          <CustomFilterSelect
            value={status}
            onChange={setStatus}
            options={statusOptions}
            disabled={!!error}
            widthClass="min-w-[110px]"
          />

          <CustomFilterSelect
            value={category}
            onChange={setCategory}
            options={categoryOptions}
            disabled={!!error}
            widthClass="min-w-[130px]"
          />

          <CustomFilterSelect
            value={city}
            onChange={setCity}
            options={cityOptions}
            disabled={!!error}
            widthClass="min-w-[100px]"
          />

          {(hasWebsite || opportunityLevel || websiteStatus || status || category || city || search || quickFilter || selectedSearchQueryId) && (
            <button
              onClick={() => {
                setSearch('');
                setHasWebsite('');
                setOpportunityLevel('');
                setWebsiteStatus('');
                setStatus('');
                setCategory('');
                setCity('');
                setQuickFilter(null);
                setSelectedSearchQueryId(null);
              }}
              className="text-primary hover:underline ml-auto col-span-2 lg:col-auto text-right cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* 4. Lead Listings (Premium Card Grid View) */}
      {!error && (
        <div className="bg-card border border-border rounded-lg p-4">
          
          {/* Active Search Query Filter Alert Banner */}
          {selectedSearchQueryId && activeSearchQuery && (
            <div className="mb-4 bg-primary/10 border border-primary/20 rounded-lg p-3.5 flex items-center justify-between gap-3 text-xs text-text-secondary">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                <span>
                  Showing leads collected from scan:{" "}
                  <strong className="text-text capitalize">
                    "{activeSearchQuery.businessType} in {activeSearchQuery.location}"
                  </strong>{" "}
                  ({new Date(activeSearchQuery.createdAt).toLocaleDateString()})
                </span>
              </div>
              <button
                onClick={() => setSelectedSearchQueryId(null)}
                className="text-primary hover:underline font-bold uppercase tracking-wider text-[10px] cursor-pointer"
              >
                Clear Scan Filter
              </button>
            </div>
          )}

          {/* Listings Header with Lead Count and Select All */}
          <div className="flex items-center justify-between mb-4 border-b border-border/40 pb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary font-brand">Lead Directory</h3>
              <p className="text-[10px] text-text-muted mt-0.5">
                {isLoading ? 'Querying database...' : `Found ${totalLeads} prospects matching filters (${filteredLeads.length} shown on this page)`}
              </p>
            </div>

            {!isLoading && filteredLeads.length > 0 && (
              <div className="flex items-center gap-2 bg-background border border-border/50 rounded-lg px-3 py-1.5 cursor-pointer hover:bg-elevated/20 transition-all select-none">
                <input 
                  type="checkbox"
                  id="selectAllCards"
                  checked={filteredLeads.length > 0 && selectedIds.length === filteredLeads.length}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded bg-background border-border text-primary focus:ring-0 cursor-pointer"
                />
                <label htmlFor="selectAllCards" className="text-[10px] font-bold text-text-secondary cursor-pointer uppercase tracking-wider select-none">
                  Select All
                </label>
              </div>
            )}
          </div>
          
          {/* Grid Layout Container */}
          {isLoading ? (
            <div className="py-16 text-center text-text-muted/60 font-mono text-xs flex flex-col items-center justify-center gap-3">
              <span className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin"></span>
              <span>Loading lead database...</span>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="py-16 text-center text-text-muted/60 text-xs">
              No leads matching filter selection.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredLeads.map((lead) => {
                const isSelected = selectedIds.includes(lead._id);
                const cleanPhone = lead.phone ? lead.phone.replace(/\D/g, '') : '';
                const defaultMessage = `Hi ${lead.businessName}, I noticed a few technical issues with your online presence (such as your website audits and review metrics) and have drafted some suggestions. Would you be open to a quick call?`;
                const whatsappMsg = lead.whatsappPitch || defaultMessage;
                const whatsappUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappMsg)}` : '#';

                return (
                  <div 
                    key={lead._id}
                    onClick={() => setSelectedLeadId(lead._id)}
                    className={`group relative bg-[#18181B] border hover:bg-elevated/10 transition-all duration-300 rounded-xl p-5 flex flex-col justify-between gap-4 cursor-pointer overflow-hidden ${
                      isSelected 
                        ? 'border-primary bg-primary/5 shadow-[0_0_15px_rgba(37,99,235,0.1)]' 
                        : 'border-border/60 hover:border-primary/40 hover:shadow-[0_0_20px_rgba(24,24,27,0.8)]'
                    }`}
                  >
                    {/* Top gradient glow accent */}
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {/* Top Row: Checkbox, Score, and Priority Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleSelectRow(lead._id, e)}
                          className="w-4 h-4 rounded bg-background border-border text-primary focus:ring-primary/40 focus:ring-offset-background cursor-pointer"
                        />
                        <span className="text-[10px] text-text-muted font-bold font-mono tracking-wider">
                          SCORE: <span className="text-text font-bold text-xs">{lead.leadScore}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-full border text-[9px] font-extrabold uppercase tracking-wider ${getOppBadgeColor(lead.opportunityLevel)}`}>
                          {lead.opportunityLevel === 'High' ? '🔥 Hot' : lead.opportunityLevel === 'Medium' ? '⚡ Warm' : '❄️ Cold'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full border text-[9px] font-extrabold uppercase tracking-wider ${getStatusBadgeColor(lead.status)}`}>
                          {lead.status}
                        </span>
                      </div>
                    </div>

                    {/* Main Identity Info */}
                    <div className="space-y-1">
                      <h4 className="font-brand font-bold text-text text-base leading-snug group-hover:text-primary transition-colors duration-200 line-clamp-1">
                        {lead.businessName}
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                        <span>{lead.category}</span>
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
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (lead.googleMapsUrl) window.open(lead.googleMapsUrl, '_blank');
                        }}
                        className="flex items-start gap-2 text-text-muted hover:text-text transition-colors duration-150"
                      >
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

                      <button
                        onClick={() => setSelectedLeadId(lead._id)}
                        className="flex-1 border border-border/80 hover:bg-elevated hover:border-primary/50 text-text font-bold text-[10px] uppercase tracking-wider py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all duration-200 shadow-sm"
                      >
                        <Eye size={12} />
                        <span>Details</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Server-Side Pagination Bar */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border/40 pt-4 mt-3 select-none">
              <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider hidden sm:inline">
                Total: {totalLeads} prospects ({filteredLeads.length} shown)
              </span>
              <div className="flex items-center justify-between w-full sm:w-auto gap-4 text-xs font-semibold">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                  className="bg-card border border-border text-text hover:bg-elevated disabled:opacity-40 p-1 rounded transition-all cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-text-secondary font-mono text-xs">
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                  className="bg-card border border-border text-text hover:bg-elevated disabled:opacity-40 p-1 rounded transition-all cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. Floating Bulk Actions Bar (Responsive layout) */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 lg:left-72 lg:right-8 bg-elevated border border-border rounded-lg p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xl z-40 animate-slide-up select-none">
          <div className="flex items-center gap-2 text-xs font-bold text-text-secondary">
            <CheckSquare size={14} className="text-primary" />
            <span>{selectedIds.length} selected</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto justify-center sm:justify-end">
            <CustomFilterSelect
              value=""
              onChange={handleBulkStatusChange}
              options={bulkStatusOptions}
              widthClass="min-w-[130px]"
            />

            <button
              onClick={handleBulkAddNote}
              className="bg-card hover:bg-border/60 border border-border text-text font-bold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded h-7 transition-all flex items-center gap-1 cursor-pointer"
            >
              <span>Log Note</span>
            </button>

            <button
              onClick={handleBulkDelete}
              className="bg-danger/10 hover:bg-danger/20 border border-danger/20 text-danger font-bold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded h-7 transition-all flex items-center gap-1 cursor-pointer"
            >
              <span>Delete</span>
            </button>

            <button
              onClick={() => setSelectedIds([])}
              className="text-text-muted hover:text-text font-bold text-[9px] uppercase tracking-wider px-1.5 h-7 cursor-pointer"
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
