import { useState, useEffect } from "react";

export default function Header({ username, updatedAt }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  // Format date nicely
  const formattedDate = updatedAt 
    ? new Date(updatedAt).toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : '';

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-700/50">
      {/* Left Side - Title & Username */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl lg:text-4xl text-white font-bold tracking-tight">
            Instagram Analytics
          </h1>
          <div className="hidden sm:block px-3 py-1 bg-orange-500/20 border border-orange-500/30 rounded-full">
            <span className="text-orange-400 text-xs font-semibold uppercase tracking-wide">
              Live
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-slate-300">
          <span className="text-lg">@{username}</span>
          <span className="text-slate-500">•</span>
          <span className="text-sm text-slate-400">
            Brand Analytics Dashboard
          </span>
        </div>
      </div>

      {/* Right Side - Last Updated */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl px-4 py-3">
        <p className="text-xs text-slate-400 mb-1">Last Synced</p>
        <p className="text-sm font-medium text-white">
          {formattedDate || 'Just now'}
        </p>
      </div>
    </div>
  );
}