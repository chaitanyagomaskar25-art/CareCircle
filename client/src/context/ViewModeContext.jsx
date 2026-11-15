import React, { createContext, useContext, useState, useEffect } from 'react';

const ViewModeContext = createContext(null);

export const ViewModeProvider = ({ children }) => {
  // Check localStorage for saved preference or default to 'caregiver'
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('carecircle_view_mode') || 'caregiver'; // 'caregiver' | 'elderly'
  });

  useEffect(() => {
    localStorage.setItem('carecircle_view_mode', viewMode);
  }, [viewMode]);

  const toggleViewMode = () => {
    setViewMode((prev) => (prev === 'caregiver' ? 'elderly' : 'caregiver'));
  };

  return (
    <ViewModeContext.Provider value={{ viewMode, setViewMode, toggleViewMode, isElderlyMode: viewMode === 'elderly' }}>
      {children}
    </ViewModeContext.Provider>
  );
};

export const useViewMode = () => {
  const context = useContext(ViewModeContext);
  if (!context) {
    throw new Error('useViewMode must be used within a ViewModeProvider');
  }
  return context;
};

export default ViewModeContext;
