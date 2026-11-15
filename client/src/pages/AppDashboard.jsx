import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, UserCheck } from 'lucide-react';
import MainLayout from '../layouts/MainLayout.jsx';
import CaregiverDashboard from './CaregiverDashboard.jsx';
import ElderlyDashboard from './ElderlyDashboard.jsx';
import FamilyDashboard from './FamilyDashboard.jsx';
import MedicationsView from './MedicationsView.jsx';
import CareCircleView from './CareCircleView.jsx';
import VitalsView from './VitalsView.jsx';
import ScheduleView from './ScheduleView.jsx';
import NotificationsView from './NotificationsView.jsx';
import MedicationModal from '../components/medications/MedicationModal.jsx';
import EmergencySOSModal from '../components/modals/EmergencySOSModal.jsx';
import { useViewMode } from '../context/ViewModeContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export const AppDashboard = () => {
  const navigate = useNavigate();
  const { isElderlyMode } = useViewMode();
  const { user, logout } = useAuth();
  const { info } = useToast();

  const [currentTab, setCurrentTab] = useState('overview');
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);

  const handleLogout = () => {
    logout();
    info('Logged Out', 'You have been safely signed out.');
    navigate('/');
  };

  const renderContent = () => {
    if (isElderlyMode) {
      return (
        <ElderlyDashboard
          onOpenEmergencyModal={() => setIsEmergencyModalOpen(true)}
        />
      );
    }

    if (currentTab === 'family' || (currentTab === 'overview' && user?.role === 'family')) {
      return (
        <FamilyDashboard
          onOpenEmergencyModal={() => setIsEmergencyModalOpen(true)}
        />
      );
    }

    switch (currentTab) {
      case 'medications':
        return <MedicationsView onOpenLogModal={() => setIsLogModalOpen(true)} />;
      case 'circle':
        return <CareCircleView onOpenEmergencyModal={() => setIsEmergencyModalOpen(true)} />;
      case 'vitals':
        return <VitalsView />;
      case 'schedule':
        return <ScheduleView />;
      case 'notifications':
        return <NotificationsView />;
      case 'overview':
      default:
        return (
          <CaregiverDashboard
            onOpenLogModal={() => setIsLogModalOpen(true)}
            onOpenEmergencyModal={() => setIsEmergencyModalOpen(true)}
          />
        );
    }
  };

  return (
    <MainLayout
      currentTab={currentTab}
      onSelectTab={setCurrentTab}
      onOpenLogModal={() => setIsLogModalOpen(true)}
      onOpenEmergencyModal={() => setIsEmergencyModalOpen(true)}
    >
      {/* User greeting and quick logout action toolbar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <UserCheck className="w-4 h-4 text-primary-700" />
          <span>
            Signed in as <strong className="text-slate-900">{user?.name || 'Grandma Eleanor'}</strong>{' '}
            ({user?.role ? `${user.role.toUpperCase()} ACCOUNT` : 'ACTIVE SESSION'})
          </span>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {renderContent()}

      <MedicationModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
      />

      <EmergencySOSModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
        isElderly={isElderlyMode}
      />
    </MainLayout>
  );
};

export default AppDashboard;
