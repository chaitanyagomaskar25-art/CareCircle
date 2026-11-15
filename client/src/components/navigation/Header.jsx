import React from 'react';
import {
  Menu,
  Bell,
  Sparkles,
  PhoneCall,
  Clock,
  Shield,
  Heart,
  PlusCircle,
  Eye,
} from 'lucide-react';
import { useViewMode } from '../../context/ViewModeContext.jsx';
import { mockElderlyProfile } from '../../services/mockData.js';
import Button from '../common/Button.jsx';
import StatusBadge from '../feedback/StatusBadge.jsx';

import NotificationBell from './NotificationBell.jsx';

export const Header = ({
  onOpenMobileMenu,
  onOpenLogModal,
  onOpenEmergencyModal,
  onOpenAllNotifications,
}) => {
  const { viewMode, toggleViewMode, isElderlyMode } = useViewMode();

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-3.5">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger & breadcrumb / date info */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            aria-label="Open mobile menu"
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="hidden sm:flex items-center gap-2.5 text-xs text-slate-500 bg-slate-50 border border-slate-200/70 px-3 py-1.5 rounded-xl">
            <Clock className="w-4 h-4 text-primary-700" />
            <span className="font-semibold text-slate-700">{formattedDate}</span>
            <span>•</span>
            <span>Oakridge Care Facility</span>
          </div>
        </div>

        {/* Right: Mode Toggle, Quick Actions & Profile */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Prominent Mode Switch Button */}
          <button
            type="button"
            onClick={toggleViewMode}
            className={`
              flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm
              ${isElderlyMode
                ? 'bg-amber-100 text-amber-950 border-2 border-amber-400 hover:bg-amber-200 ring-2 ring-amber-300/40'
                : 'bg-primary-50 text-primary-900 border border-primary-200 hover:bg-primary-100'
              }
            `}
          >
            <Eye className="w-4 h-4 text-primary-700" />
            <span>{isElderlyMode ? 'Switch to Caregiver View' : 'Switch to Elderly View'}</span>
          </button>

          {/* Quick Action: Log Med or Check-in */}
          {!isElderlyMode && (
            <Button
              variant="outline"
              size="sm"
              icon={PlusCircle}
              onClick={onOpenLogModal}
              className="hidden md:inline-flex"
            >
              Log Med
            </Button>
          )}

          {/* Emergency SOS Call button */}
          <Button
            variant="danger"
            size={isElderlyMode ? 'lg' : 'sm'}
            icon={PhoneCall}
            onClick={onOpenEmergencyModal}
            className="shadow-rose-600/20 font-bold"
          >
            {isElderlyMode ? 'EMERGENCY HELP' : 'SOS'}
          </Button>

          {/* Real-time Notifications Bell */}
          <NotificationBell onOpenAllNotifications={onOpenAllNotifications} />
        </div>
      </div>
    </header>
  );
};

export default Header;
