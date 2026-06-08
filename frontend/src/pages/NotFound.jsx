import React from 'react';
import { FileQuestion, ArrowLeft } from 'lucide-react';

export default function NotFound({ setActiveTab }) {
  const handleGoHome = () => {
    setActiveTab('dashboard');
    window.history.pushState(null, '', '/dashboard');
  };

  return (
    <div className="min-h-[70vh] flex flex-col justify-center items-center px-4 relative overflow-hidden select-none">
      {/* Background ambient light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="text-center relative z-10 animate-fade-in max-w-md">
        <div className="mx-auto w-16 h-16 bg-blue-600/10 border border-blue-500/20 rounded-full flex items-center justify-center mb-6">
          <FileQuestion className="w-8 h-8 text-blue-500" />
        </div>

        <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-tr from-blue-500 to-indigo-400 leading-none tracking-tighter mb-4">
          404
        </h1>

        <h2 className="text-xl font-bold text-zinc-100 tracking-tight mb-2">
          Page Not Found
        </h2>
        
        <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
          The intelligence center or resource you are trying to access does not exist or has been relocated.
        </p>

        <button
          onClick={handleGoHome}
          className="mx-auto flex items-center justify-center gap-2 py-3 px-5 bg-primary hover:bg-primary/90 active:scale-95 text-text font-semibold rounded-xl text-sm transition-all duration-150 cursor-pointer shadow-lg shadow-blue-600/15"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
