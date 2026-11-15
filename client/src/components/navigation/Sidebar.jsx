import React from 'react';
import {
  Heart,
  HeartPulse,
  LayoutDashboard,
  Pill,
  Users,
  Activity,
  Calendar,
  Bell,
  Settings,
  HelpCircle,
  Eye,
  Sparkles,
  PhoneCall,
  X,
} from 'lucide-react';
import { useViewMode } from '../../context/ViewModeContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { mockElderlyProfile } from '../../services/mockData.js';

export const Sidebar = ({ isOpen, onClose, currentTab, onSelectTab }) => {
  const { viewMode, toggleViewMode, isElderlyMode } = useViewMode();
  const { user } = useAuth();

  const isFamilyUser = user?.role === 'family';

  const navigationItems = [
    {
      id: 'overview',
      label: isFamilyUser ? 'Family Overview' : 'Caregiver Overview',
      icon: LayoutDashboard,
    },
    { id: 'family', label: 'Family Support Hub', icon: Heart },
    { id: 'medications', label: 'Medications & Pills', icon: Pill, badge: '1 Due' },
    { id: 'circle', label: 'Care Circle Team', icon: Users, badge: '4' },
    { id: 'vitals', label: 'Health Vitals & Logs', icon: Activity },
    { id: 'schedule', label: 'Daily Schedule', icon: Calendar },
    { id: 'notifications', label: 'Alerts & Notifications', icon: Bell },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-slate-200/80
          flex flex-col justify-between transition-transform duration-200 ease-in-out
          lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Brand & Senior Profile Switch */}
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary-700 text-white flex items-center justify-center shadow-md shadow-primary-700/20">
                <HeartPulse className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-slate-900">CareCircle</h1>
                <p className="text-xs text-primary-700 font-semibold tracking-wide uppercase">
                  Elderly Care Platform
                </p>
              </div>
            </div>
            {/* Mobile close button */}
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Active Senior Quick Badge */}
          <div className="p-3 bg-warm-50 rounded-xl border border-slate-200/80 flex items-center gap-3">
            <img
              src={mockElderlyProfile.avatar}
              alt={mockElderlyProfile.name}
              className="w-10 h-10 rounded-full object-cover border-2 border-primary-600"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Monitoring Senior
              </p>
              <p className="text-sm font-bold text-slate-900 truncate">
                {mockElderlyProfile.preferredName}
              </p>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
          </div>
        </div>

        {/* View Mode Mode Switcher Banner */}
        <div className="px-5 py-3 bg-primary-50/70 border-b border-primary-100/60">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-medium text-primary-900">
              <Eye className="w-4 h-4 text-primary-700" />
              <span>UI Display Mode</span>
            </div>
            <button
              type="button"
              onClick={toggleViewMode}
              className={`
                px-2.5 py-1 text-xs font-bold rounded-lg transition-all shadow-sm
                ${isElderlyMode
                  ? 'bg-primary-700 text-white shadow-primary-700/20'
                  : 'bg-white text-primary-800 border border-primary-200 hover:bg-primary-100'
                }
              `}
            >
              {isElderlyMode ? '👴 Elderly View' : '👨‍👩‍👧 Caregiver View'}
            </button>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectTab(item.id);
                  if (onClose) onClose();
                }}
                className={`
                  w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors
                  ${
                    isActive
                      ? 'bg-primary-700 text-white shadow-sm shadow-primary-700/20 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`
                      text-xs px-2 py-0.5 rounded-full font-bold
                      ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-amber-100 text-amber-900 border border-amber-200'
                      }
                    `}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Card & Support Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-white border border-slate-200/70">
            <div className="w-9 h-9 rounded-full bg-secondary-100 text-secondary-800 font-bold flex items-center justify-center text-sm">
              SV
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-800 truncate">Sarah Vance</p>
              <p className="text-xs text-slate-500 truncate">Primary Caregiver</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
