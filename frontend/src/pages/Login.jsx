import React, { useState } from 'react';
import { auth, googleProvider, isFirebaseConfigured } from '../config/firebase';
import { signInWithPopup } from 'firebase/auth';
import { authService } from '../services/api';
import { Shield, Sparkles, Key, AlertTriangle, UserCheck, ArrowRight, LogOut } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pendingUser, setPendingUser] = useState(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!isFirebaseConfigured) {
        throw new Error("Firebase client is not configured. Please use Developer Mock login.");
      }
      
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      
      const data = await authService.login(idToken);
      
      localStorage.setItem('token', data.token);
      
      if (data.user.role !== 'Admin' && !data.user.isApproved) {
        setPendingUser(data.user);
      } else {
        onLoginSuccess(data.user);
      }
    } catch (err) {
      console.error("Authentication Error:", err);
      setError(err.response?.data?.message || err.message || "An unexpected authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleMockSignIn = async (email, name, role = 'User') => {
    setLoading(true);
    setError(null);
    try {
      // Create a mock token JSON payload
      const mockPayload = JSON.stringify({
        email,
        name,
        picture: `https://api.dicebear.com/7.x/adventurer/svg?seed=${name}`
      });

      const data = await authService.login(mockPayload);
      localStorage.setItem('token', data.token);

      if (data.user.role !== 'Admin' && !data.user.isApproved) {
        setPendingUser(data.user);
      } else {
        onLoginSuccess(data.user);
      }
    } catch (err) {
      console.error("Mock Authentication Error:", err);
      setError(err.response?.data?.message || err.message || "Mock login failed. Ensure your backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOutPending = () => {
    localStorage.removeItem('token');
    setPendingUser(null);
  };

  // If the user's account is pending approval, show the gate screen
  if (pendingUser) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center px-4 relative overflow-hidden">
        {/* Background ambient light */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-yellow-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="bg-zinc-900/40 border border-zinc-800 backdrop-blur-xl rounded-2xl p-8 max-w-md w-full shadow-2xl relative z-10 text-center animate-fade-in">
          <div className="mx-auto w-16 h-16 bg-yellow-500/10 border border-yellow-500/20 rounded-full flex items-center justify-center mb-6">
            <UserCheck className="w-8 h-8 text-yellow-500" />
          </div>

          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight mb-2">
            Registration Submitted
          </h1>
          
          <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
            Welcome to ClientScout, <span className="font-semibold text-zinc-200">{pendingUser.name}</span>. Your account (<span className="text-zinc-300 font-mono text-xs">{pendingUser.email}</span>) is currently pending administrator approval.
          </p>

          <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-4 mb-6 text-left text-xs text-zinc-400 space-y-2">
            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-1.5 shrink-0" />
              <span>Your request has been logged to the system.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-1.5 shrink-0" />
              <span>Contact your team administrator to enable your profile permissions (Scan, Edit, Export).</span>
            </div>
          </div>

          <button
            onClick={handleSignOutPending}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-zinc-800 hover:bg-zinc-750 active:bg-zinc-800 text-zinc-250 hover:text-zinc-100 rounded-xl border border-zinc-700/80 font-medium text-sm transition-all duration-150 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Switch Account / Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Brand Header */}
      <div className="flex items-center gap-2.5 mb-8 relative z-10 animate-fade-in">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Shield className="w-5.5 h-5.5 text-white" />
        </div>
        <div>
          <span className="text-xl font-bold tracking-tight text-white bg-clip-text bg-gradient-to-r from-zinc-50 to-zinc-200">
            ClientScout
          </span>
          <span className="text-xs text-blue-500 block font-semibold tracking-widest uppercase">
            Lead Intel Engine
          </span>
        </div>
      </div>

      <div className="bg-zinc-900/40 border border-zinc-800 backdrop-blur-xl rounded-2xl p-8 max-w-md w-full shadow-2xl relative z-10 animate-slide-up">
        {/* Title */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-100">
            Sign in to your account
          </h2>
          <p className="text-zinc-400 text-sm mt-1">
            Access lead databases, run scans, and export pitches.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2.5 text-xs text-red-400">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Auth Button */}
        {isFirebaseConfigured ? (
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-zinc-100 active:bg-zinc-200 text-zinc-900 font-semibold rounded-xl text-sm transition-all duration-150 cursor-pointer shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.927h6.6c-.29 1.5-1.14 2.77-2.4 3.61v3h3.86c2.26-2.09 3.685-5.17 3.685-8.467z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-4v3.1A11.972 11.972 0 0 0 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.27 14.29a7.18 7.18 0 0 1 0-4.58v-3.1h-4v3.1a11.996 11.996 0 0 0 0 9.16l4-3.1H5.27z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.29 2.67 1.27 6.61l4 3.1c.95-2.85 3.6-4.96 6.73-4.96z"
              />
            </svg>
            {loading ? 'Connecting...' : 'Sign in with Google'}
          </button>
        ) : (
          <div className="space-y-4">
            {/* Warning Banner */}
            <div className="p-3.5 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-start gap-2.5 text-xs text-yellow-400">
              <AlertTriangle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Config Variables Missing</span>
                Firebase authentication variables are not set in your client `.env`. Starting in local offline bypass mode.
              </div>
            </div>

            {/* Developer Mock Panels */}
            <div className="border border-zinc-800 bg-zinc-950/50 rounded-xl p-4">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-3">
                Developer Mock Portal
              </span>
              
              <div className="space-y-2.5">
                <button
                  onClick={() => handleMockSignIn('admin@clientscout.app', 'Dev Lead (Admin)', 'Admin')}
                  disabled={loading}
                  className="w-full flex items-center justify-between py-2.5 px-3.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-lg text-xs font-semibold border border-blue-500/20 transition-all duration-150 cursor-pointer text-left"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Login as Admin (Full Control)</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleMockSignIn('team@clientscout.app', 'Team Scout', 'User')}
                  disabled={loading}
                  className="w-full flex items-center justify-between py-2.5 px-3.5 bg-zinc-800/80 hover:bg-zinc-850 text-zinc-300 rounded-lg text-xs font-semibold border border-zinc-700/60 transition-all duration-150 cursor-pointer text-left"
                >
                  <div className="flex items-center gap-2">
                    <Key className="w-3.5 h-3.5" />
                    <span>Login as New Team User (Pending)</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 pt-4 border-t border-zinc-800/60 text-center">
          <span className="text-[10px] text-zinc-500 font-medium">
            Protected by ClientScout Cryptographic Signatures
          </span>
        </div>
      </div>
    </div>
  );
}
