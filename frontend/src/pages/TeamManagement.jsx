import React, { useState, useEffect } from 'react';
import { authService, leadService } from '../services/api';
import { 
  Users, Trash2, Shield, UserCheck, Check, 
  RotateCcw, Trash, AlertCircle, ShieldAlert, Sparkles,
  Key, ArrowDownUp, RefreshCw, ChevronLeft, ChevronRight
} from 'lucide-react';

export default function TeamManagement({ currentUser }) {
  // Team state
  const [users, setUsers] = useState([]);
  const [teamLoading, setTeamLoading] = useState(true);
  const [teamError, setTeamError] = useState(null);
  
  // Trash state
  const [trashLeads, setTrashLeads] = useState([]);
  const [trashLoading, setTrashLoading] = useState(true);
  const [trashError, setTrashError] = useState(null);
  const [trashPage, setTrashPage] = useState(1);
  const [trashTotalPages, setTrashTotalPages] = useState(1);
  const [selectedTrashIds, setSelectedTrashIds] = useState([]);
  
  // Save notification toast state
  const [toastMessage, setToastMessage] = useState(null);
  
  // Active Tab: 'users' or 'trash'
  const [activeSubTab, setActiveSubTab] = useState('users');

  const fetchUsers = async () => {
    setTeamLoading(true);
    setTeamError(null);
    try {
      const data = await authService.getUsers();
      setUsers(data);
    } catch (err) {
      console.error("Fetch users error:", err);
      setTeamError("Failed to retrieve team members list.");
    } finally {
      setTeamLoading(false);
    }
  };

  const fetchTrash = async () => {
    setTrashLoading(true);
    setTrashError(null);
    try {
      const data = await leadService.getTrash({ page: trashPage, limit: 10 });
      setTrashLeads(data.data || []);
      setTrashTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error("Fetch trash error:", err);
      setTrashError("Failed to retrieve soft-deleted leads directory.");
    } finally {
      setTrashLoading(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'users') {
      fetchUsers();
    } else {
      fetchTrash();
    }
  }, [activeSubTab, trashPage]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Instant update logic for user settings
  const handleUserUpdate = async (userId, field, value) => {
    // Optimistically update the UI
    setUsers(prev => prev.map(u => u._id === userId ? { ...u, [field]: value } : u));
    
    try {
      const payload = { [field]: value };
      await authService.updateUser(userId, payload);
      showToast("User settings updated successfully.");
    } catch (err) {
      console.error("Update user error:", err);
      // Revert optimistic update
      fetchUsers();
      alert(err.response?.data?.message || "Could not update user privileges.");
    }
  };

  // Permission toggles (canScan, canEditLeads, etc.)
  const handlePermissionToggle = async (userId, field, currentValue) => {
    handleUserUpdate(userId, field, !currentValue);
  };

  // Trash operations
  const handleRestore = async (id) => {
    try {
      await leadService.restore(id);
      showToast("Lead restored successfully.");
      setSelectedTrashIds(prev => prev.filter(trashId => trashId !== id));
      fetchTrash();
    } catch (err) {
      console.error("Restore lead error:", err);
      alert("Could not restore lead.");
    }
  };

  const handlePurge = async (id, name) => {
    if (window.confirm(`Are you sure you want to permanently delete "${name}"? This action CANNOT be undone.`)) {
      try {
        await leadService.purge(id);
        showToast("Lead permanently deleted.");
        setSelectedTrashIds(prev => prev.filter(trashId => trashId !== id));
        fetchTrash();
      } catch (err) {
        console.error("Purge lead error:", err);
        alert("Could not purge lead.");
      }
    }
  };

  // Bulk operations
  const handleSelectAllTrash = () => {
    if (selectedTrashIds.length === trashLeads.length) {
      setSelectedTrashIds([]);
    } else {
      setSelectedTrashIds(trashLeads.map(l => l._id));
    }
  };

  const handleSelectTrashRow = (id) => {
    if (selectedTrashIds.includes(id)) {
      setSelectedTrashIds(prev => prev.filter(item => item !== id));
    } else {
      setSelectedTrashIds(prev => [...prev, id]);
    }
  };

  const handleBulkRestore = async () => {
    if (selectedTrashIds.length === 0) return;
    try {
      const res = await leadService.bulkRestore(selectedTrashIds);
      showToast(`Restored ${res.restoredCount} leads successfully.`);
      setSelectedTrashIds([]);
      fetchTrash();
    } catch (err) {
      console.error("Bulk restore error:", err);
      alert("Bulk restore failed.");
    }
  };

  const handleBulkPurge = async () => {
    if (selectedTrashIds.length === 0) return;
    if (window.confirm(`Are you sure you want to permanently delete the ${selectedTrashIds.length} selected leads? This action cannot be undone.`)) {
      try {
        const res = await leadService.bulkPurge(selectedTrashIds);
        showToast(`Permanently deleted ${res.purgedCount} leads.`);
        setSelectedTrashIds([]);
        fetchTrash();
      } catch (err) {
        console.error("Bulk purge error:", err);
        alert("Bulk purge failed.");
      }
    }
  };

  return (
    <div className="space-y-6 select-none relative">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-zinc-900 border border-success/30 shadow-2xl p-3 px-5 rounded-xl z-50 flex items-center gap-2.5 animate-slide-up text-xs font-semibold text-zinc-150">
          <span className="w-2 h-2 rounded-full bg-success animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Tabs Switcher */}
      <div className="flex border-b border-border gap-6">
        <button
          onClick={() => setActiveSubTab('users')}
          className={`flex items-center gap-2 pb-3.5 text-xs font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'users' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-text-secondary hover:text-text'
          }`}
        >
          <Users size={16} />
          Team Members
        </button>
        <button
          onClick={() => setActiveSubTab('trash')}
          className={`flex items-center gap-2 pb-3.5 text-xs font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'trash' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-text-secondary hover:text-text'
          }`}
        >
          <Trash2 size={16} />
          Trash Recovery ({trashLeads.length})
        </button>
      </div>

      {/* SUBTAB 1: Team Accounts Management */}
      {activeSubTab === 'users' && (
        <div className="space-y-5 animate-fade-in">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-text">Team Roles & Access Control</h2>
              <p className="text-[11px] text-text-muted mt-0.5">Toggle approval status, assign privileges, and manage credit consumption limits.</p>
            </div>
            <button 
              onClick={fetchUsers}
              className="p-1.5 hover:bg-elevated rounded border border-border text-text-secondary hover:text-text transition-all cursor-pointer"
            >
              <RefreshCw size={14} className={teamLoading ? 'animate-spin' : ''} />
            </button>
          </div>

          {teamError && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{teamError}</span>
            </div>
          )}

          {teamLoading && users.length === 0 ? (
            <div className="space-y-3">
              {[1, 2, 3].map(n => (
                <div key={n} className="h-16 w-full bg-card/40 border border-border/40 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="border border-border/50 bg-card/25 rounded-2xl p-8 text-center text-xs text-text-muted">
              No registered user accounts found.
            </div>
          ) : (
            <div className="overflow-x-auto border border-border bg-card rounded-xl">
              <table className="min-w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-zinc-900/30 text-text-secondary select-none font-bold uppercase tracking-wider">
                    <th className="p-4">Member Info</th>
                    <th className="p-4">Approve</th>
                    <th className="p-4">Role</th>
                    <th className="p-4 text-center">Scan</th>
                    <th className="p-4 text-center">Edit</th>
                    <th className="p-4 text-center">Delete</th>
                    <th className="p-4 text-center">Export</th>
                    <th className="p-4">Daily Scan Limit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {users.map((member) => {
                    const isSelf = currentUser?.id === member._id;
                    return (
                      <tr key={member._id} className="hover:bg-zinc-900/10 transition-colors">
                        {/* Member Details */}
                        <td className="p-4 flex items-center gap-3">
                          {member.picture ? (
                            <img src={member.picture} alt={member.name} className="w-9 h-9 rounded-full border border-border" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-xs">
                              {member.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-text flex items-center gap-1.5">
                              {member.name}
                              {isSelf && <span className="text-[9px] bg-primary/15 text-primary border border-primary/20 rounded px-1 font-mono uppercase tracking-wide">You</span>}
                            </span>
                            <span className="text-[10px] text-text-secondary block font-mono mt-0.5">{member.email}</span>
                          </div>
                        </td>

                        {/* Approved Switch */}
                        <td className="p-4">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={member.isApproved} 
                              disabled={isSelf}
                              onChange={(e) => handleUserUpdate(member._id, 'isApproved', e.target.checked)}
                              className="sr-only peer" 
                            />
                            <div className="w-8 h-4 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-3 after:w-3.5 after:transition-all peer-checked:bg-success peer-checked:after:bg-zinc-950 peer-checked:after:border-transparent disabled:opacity-50" />
                          </label>
                        </td>

                        {/* Role Select */}
                        <td className="p-4">
                          <select
                            value={member.role}
                            disabled={isSelf}
                            onChange={(e) => handleUserUpdate(member._id, 'role', e.target.value)}
                            className="bg-zinc-950 border border-border rounded-lg p-1 px-2.5 font-semibold text-xs text-text hover:border-zinc-700 transition-colors focus:outline-none focus:border-primary disabled:opacity-50 cursor-pointer"
                          >
                            <option value="User">User</option>
                            <option value="Admin">Admin</option>
                          </select>
                        </td>

                        {/* Permission Checkboxes */}
                        {/* 1. Can Scan */}
                        <td className="p-4 text-center">
                          <input 
                            type="checkbox" 
                            checked={member.canScan || member.role === 'Admin'} 
                            disabled={member.role === 'Admin'} 
                            onChange={() => handlePermissionToggle(member._id, 'canScan', member.canScan)}
                            className="w-4 h-4 accent-primary rounded border-zinc-700 bg-zinc-950 text-white cursor-pointer disabled:opacity-50" 
                          />
                        </td>
                        
                        {/* 2. Can Edit */}
                        <td className="p-4 text-center">
                          <input 
                            type="checkbox" 
                            checked={member.canEditLeads || member.role === 'Admin'} 
                            disabled={member.role === 'Admin'} 
                            onChange={() => handlePermissionToggle(member._id, 'canEditLeads', member.canEditLeads)}
                            className="w-4 h-4 accent-primary rounded border-zinc-700 bg-zinc-950 text-white cursor-pointer disabled:opacity-50" 
                          />
                        </td>

                        {/* 3. Can Delete */}
                        <td className="p-4 text-center">
                          <input 
                            type="checkbox" 
                            checked={member.canDeleteLeads || member.role === 'Admin'} 
                            disabled={member.role === 'Admin'} 
                            onChange={() => handlePermissionToggle(member._id, 'canDeleteLeads', member.canDeleteLeads)}
                            className="w-4 h-4 accent-primary rounded border-zinc-700 bg-zinc-950 text-white cursor-pointer disabled:opacity-50" 
                          />
                        </td>

                        {/* 4. Can Export */}
                        <td className="p-4 text-center">
                          <input 
                            type="checkbox" 
                            checked={member.canExport || member.role === 'Admin'} 
                            disabled={member.role === 'Admin'} 
                            onChange={() => handlePermissionToggle(member._id, 'canExport', member.canExport)}
                            className="w-4 h-4 accent-primary rounded border-zinc-700 bg-zinc-950 text-white cursor-pointer disabled:opacity-50" 
                          />
                        </td>

                        {/* Daily Limit */}
                        <td className="p-4">
                          <div className="flex items-center gap-1.5">
                            <input 
                              type="number" 
                              min="0" 
                              max="10000"
                              value={member.dailyScanLimit}
                              disabled={member.role === 'Admin'}
                              onBlur={(e) => handleUserUpdate(member._id, 'dailyScanLimit', Number(e.target.value))}
                              onChange={(e) => {
                                const val = e.target.value;
                                setUsers(prev => prev.map(u => u._id === member._id ? { ...u, dailyScanLimit: val } : u));
                              }}
                              className="w-16 bg-zinc-950 border border-border rounded-lg p-1 text-center font-mono text-xs focus:outline-none focus:border-primary disabled:opacity-30 disabled:pointer-events-none" 
                            />
                            <span className="text-[10px] text-text-secondary font-mono">/ day</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: Trash Recovery */}
      {activeSubTab === 'trash' && (
        <div className="space-y-5 animate-fade-in">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-text">Trash Recovery</h2>
              <p className="text-[11px] text-text-muted mt-0.5">Leads deleted from ClientScout are archived here. Restore them back to directories or purge them permanently.</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={fetchTrash}
                className="p-1.5 hover:bg-elevated rounded border border-border text-text-secondary hover:text-text transition-all cursor-pointer"
              >
                <RefreshCw size={14} className={trashLoading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Bulk Action Controls */}
          {selectedTrashIds.length > 0 && (
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 px-4 flex items-center justify-between animate-slide-up text-xs font-semibold">
              <div className="flex items-center gap-2">
                <Check size={14} className="text-primary" />
                <span className="text-zinc-200">Selected <span className="text-primary font-bold">{selectedTrashIds.length}</span> soft-deleted leads</span>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  onClick={handleBulkRestore}
                  className="flex items-center gap-1.5 py-1 px-3 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors cursor-pointer"
                >
                  <RotateCcw size={13} />
                  Restore Selected
                </button>
                <button
                  onClick={handleBulkPurge}
                  className="flex items-center gap-1.5 py-1 px-3 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors cursor-pointer"
                >
                  <Trash size={13} />
                  Purge Permanently
                </button>
              </div>
            </div>
          )}

          {trashError && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{trashError}</span>
            </div>
          )}

          {trashLoading && trashLeads.length === 0 ? (
            <div className="space-y-3">
              {[1, 2, 3].map(n => (
                <div key={n} className="h-16 w-full bg-card/40 border border-border/40 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : trashLeads.length === 0 ? (
            <div className="border border-border/50 bg-card/25 rounded-2xl p-8 text-center text-xs text-text-muted">
              Trash bin is empty. No soft-deleted leads are currently archived.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto border border-border bg-card rounded-xl">
                <table className="min-w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-zinc-900/30 text-text-secondary select-none font-bold uppercase tracking-wider">
                      <th className="p-4 w-10">
                        <input 
                          type="checkbox" 
                          checked={selectedTrashIds.length === trashLeads.length}
                          onChange={handleSelectAllTrash}
                          className="w-4 h-4 accent-primary rounded cursor-pointer" 
                        />
                      </th>
                      <th className="p-4">Business Name</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Address</th>
                      <th className="p-4">Deleted On</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {trashLeads.map((lead) => {
                      const isSelected = selectedTrashIds.includes(lead._id);
                      return (
                        <tr 
                          key={lead._id} 
                          className={`hover:bg-zinc-900/10 transition-colors ${isSelected ? 'bg-primary/5' : ''}`}
                        >
                          <td className="p-4">
                            <input 
                              type="checkbox" 
                              checked={isSelected}
                              onChange={() => handleSelectTrashRow(lead._id)}
                              className="w-4 h-4 accent-primary rounded cursor-pointer" 
                            />
                          </td>
                          <td className="p-4 font-bold text-text">{lead.businessName}</td>
                          <td className="p-4 text-text-secondary">{lead.category}</td>
                          <td className="p-4 text-text-secondary truncate max-w-xs">{lead.address}</td>
                          <td className="p-4 text-text-secondary font-mono">
                            {new Date(lead.updatedAt).toLocaleDateString(undefined, { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                          </td>
                          <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => handleRestore(lead._id)}
                              title="Restore Lead"
                              className="p-1.5 hover:bg-primary/10 text-primary rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center"
                            >
                              <RotateCcw size={14} />
                            </button>
                            <button
                              onClick={() => handlePurge(lead._id, lead.businessName)}
                              title="Purge Permanently"
                              className="p-1.5 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center"
                            >
                              <Trash size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              {trashTotalPages > 1 && (
                <div className="flex justify-between items-center text-xs font-semibold select-none pt-2">
                  <span className="text-text-secondary">
                    Page <span className="text-text">{trashPage}</span> of <span className="text-text">{trashTotalPages}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setTrashPage(prev => Math.max(prev - 1, 1))}
                      disabled={trashPage === 1}
                      className="p-1.5 bg-card border border-border hover:bg-elevated rounded-lg transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={() => setTrashPage(prev => Math.min(prev + 1, trashTotalPages))}
                      disabled={trashPage === trashTotalPages}
                      className="p-1.5 bg-card border border-border hover:bg-elevated rounded-lg transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
