import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import LeadSearch from './pages/LeadSearch.jsx';
import LeadManagement from './pages/LeadManagement.jsx';

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

  return (
    <QueryClientProvider client={queryClient}>
      <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
        {activeTab === 'dashboard' && (
          <Dashboard setActiveTab={setActiveTab} />
        )}
        {activeTab === 'search' && (
          <LeadSearch />
        )}
        {activeTab === 'database' && (
          <LeadManagement />
        )}
      </Layout>
    </QueryClientProvider>
  );
}
