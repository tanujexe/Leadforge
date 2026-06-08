import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import LeadSearch from './pages/LeadSearch.jsx';
import LeadManagement from './pages/LeadManagement.jsx';
import ScanHistory from './pages/ScanHistory.jsx';
import TeamManagement from './pages/TeamManagement.jsx';
import ManagementDashboard from './pages/ManagementDashboard.jsx';
import Login from './pages/Login.jsx';
import { authService } from './services/api';
import { UserCheck, LogOut, ShieldAlert } from 'lucide-react';

// Initialize React Query Client for browser state caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedSearchQueryId, setSelectedSearchQueryId] = useState(null);
  
  // User Authentication States
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkSession = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const userData = await authService.getMe();
      setUser(userData);
    } catch (err) {
      console.error("Session verification failed:", err);
      // Check if user is logged in but pending approval
      if (err.response?.status === 403 && err.response?.data?.error === 'PendingApproval') {
        setUser({ isPendingApproval: true });
      } else {
        localStorage.removeItem('token');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    // Redirect Admin to Dashboard or whatever they were doing
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  // Protect layout tabs: Reset to dashboard if unauthorized
  useEffect(() => {
    if (user && user.role !== 'Admin' && activeTab === 'team') {
      setActiveTab('dashboard');
    }
  }, [activeTab, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-xs font-semibold text-zinc-400 font-mono tracking-wider">Verifying session...</span>
      </div>
    );
  }

  // Pending approval screen
  if (user?.isPendingApproval) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center px-4 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-yellow-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="bg-zinc-900/40 border border-zinc-800 backdrop-blur-xl rounded-2xl p-8 max-w-md w-full shadow-2xl relative z-10 text-center animate-fade-in">
          <div className="mx-auto w-16 h-16 bg-yellow-500/10 border border-yellow-500/20 rounded-full flex items-center justify-center mb-6">
            <UserCheck className="w-8 h-8 text-yellow-500" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight mb-2">Registration Submitted</h1>
          <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
            Your account is currently pending administrator approval. Please contact your team administrator to gain access.
          </p>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-zinc-800 hover:bg-zinc-750 text-zinc-250 hover:text-zinc-100 rounded-xl border border-zinc-700/80 font-medium text-sm transition-all duration-150 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sign Out / Switch Account
          </button>
        </div>
      </div>
    );
  }

  // Login page if not authenticated
  if (!user) {
    return (
      <Login onLoginSuccess={handleLoginSuccess} />
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Layout 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={user} 
        onLogout={handleLogout}
      >
        {activeTab === 'dashboard' && (
          <Dashboard 
            setActiveTab={setActiveTab} 
            setSelectedSearchQueryId={setSelectedSearchQueryId} 
            user={user}
          />
        )}
        {activeTab === 'management' && (
          <ManagementDashboard user={user} />
        )}
        {activeTab === 'search' && (
          <LeadSearch user={user} />
        )}
        {activeTab === 'history' && (
          <ScanHistory 
            setActiveTab={setActiveTab} 
            setSelectedSearchQueryId={setSelectedSearchQueryId} 
            user={user}
          />
        )}
        {activeTab === 'database' && (
          <LeadManagement 
            selectedSearchQueryId={selectedSearchQueryId} 
            setSelectedSearchQueryId={setSelectedSearchQueryId} 
            user={user}
          />
        )}
        {activeTab === 'team' && user.role === 'Admin' && (
          <TeamManagement currentUser={user} />
        )}
      </Layout>
    </QueryClientProvider>
  );
}

