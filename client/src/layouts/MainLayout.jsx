import React, { useState } from 'react';
import Sidebar from '../components/navigation/Sidebar.jsx';
import Header from '../components/navigation/Header.jsx';
import Footer from '../components/common/Footer.jsx';
import { useViewMode } from '../context/ViewModeContext.jsx';

export const MainLayout = ({
  children,
  currentTab,
  onSelectTab,
  onOpenLogModal,
  onOpenEmergencyModal,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isElderlyMode } = useViewMode();

  return (
    <div className="min-h-screen bg-warm-50 flex text-slate-800">
      {/* Sidebar navigation (hidden in Elderly Mode for zero distraction) */}
      {!isElderlyMode && (
        <Sidebar
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          currentTab={currentTab}
          onSelectTab={onSelectTab}
        />
      )}

      {/* Main Viewport Content */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all ${!isElderlyMode ? 'lg:pl-72' : ''}`}>
        <Header
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenLogModal={onOpenLogModal}
          onOpenEmergencyModal={onOpenEmergencyModal}
          onOpenAllNotifications={() => onSelectTab('notifications')}
        />

        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default MainLayout;
