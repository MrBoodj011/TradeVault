import React, { useState, useEffect } from 'react';
import { LayoutDashboard, PlusCircle, History, ExternalLink, ShieldAlert, ArrowUpRight, Play, Sun, Moon } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMockMode: boolean;
}

export default function Sidebar({ activeTab, setActiveTab, isMockMode }: SidebarProps) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const saved = localStorage.getItem('tradevault_theme') as 'dark' | 'light';
    if (saved) {
      setTheme(saved);
      if (saved === 'light') {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      } else {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      }
    } else {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('tradevault_theme', next);
    if (next === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'rapid-session', label: 'Rapid Backtest', icon: Play },
    { id: 'new-trade', label: 'New Trade', icon: PlusCircle },
    { id: 'history', label: 'Trade History', icon: History },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-[#09090b] border-r border-zinc-200 dark:border-zinc-800 flex flex-col justify-between h-screen sticky top-0 text-zinc-700 dark:text-zinc-300 transition-colors">
      {/* Brand Header */}
      <div>
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black font-bold shadow-md shadow-amber-500/20">
              TV
            </div>
            <div>
              <h1 className="font-semibold text-lg text-zinc-900 dark:text-white tracking-wider">TradeVault</h1>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium tracking-widest uppercase">Manual Backtest</p>
            </div>
          </div>
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-1.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        {/* Demo Mode Badge */}
        {isMockMode && (
          <div className="mx-4 mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
            <div className="text-[11px] leading-tight text-amber-300">
              <span className="font-semibold">Demo Mode:</span> LocalStorage active. Configure Supabase variables to persist.
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="p-4 space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-sm border border-zinc-200 dark:border-zinc-700/50'
                    : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/80 hover:text-zinc-900 dark:hover:text-zinc-100 text-zinc-500 dark:text-zinc-400'
                }`}
              >
                <Icon className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-amber-500 dark:text-amber-400' : 'text-zinc-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Quick Tools Section */}
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40">
        <h2 className="px-3 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-3">Quick Tools</h2>
        <div className="space-y-2">
          <a
            href="https://app.fxreplay.com/en-US/signup?aff=homepage"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 group"
          >
            <div className="flex items-center gap-2">
              <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 group-hover:text-amber-500 dark:group-hover:text-amber-400" />
              <span>FXReplay Signup</span>
            </div>
            <ExternalLink className="w-3 h-3 text-zinc-400" />
          </a>
          <a
            href="https://temp-mail.org/en/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 group"
          >
            <div className="flex items-center gap-2">
              <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 group-hover:text-amber-500 dark:group-hover:text-amber-400" />
              <span>Temp Mail</span>
            </div>
            <ExternalLink className="w-3 h-3 text-zinc-400" />
          </a>
        </div>
      </div>
    </aside>
  );
}
