import React from 'react';
import { HeartPulse, ShieldAlert, Activity, Wifi } from 'lucide-react';
import { StatusBadge } from '../feedback/StatusBadge.jsx';

export const Header = ({ isHealthy = true, environment = 'development' }) => {
  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-slate-900">SeniSync</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  v1.0
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Intelligent Elderly Care & Medication Management Platform
              </p>
            </div>
          </div>

          {/* Quick status bar */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              <span>Env: <strong className="text-slate-700 capitalize">{environment}</strong></span>
            </div>
            <StatusBadge
              status={isHealthy ? 'healthy' : 'error'}
              label={isHealthy ? 'API Connected' : 'API Offline'}
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
