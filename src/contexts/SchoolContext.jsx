import React, { createContext, useContext, useState } from 'react';

const SchoolContext = createContext(null);

function getStoredSchool() {
  try {
    const stored = localStorage.getItem('selectedSchool');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    localStorage.removeItem('selectedSchool');
  }
  return null;
}

export function SchoolProvider({ children }) {
  const [selectedSchool, setSelectedSchool] = useState(getStoredSchool);

  const selectSchool = (school) => {
    setSelectedSchool(school);
    localStorage.setItem('selectedSchool', JSON.stringify(school));
  };

  const clearSchool = () => {
    setSelectedSchool(null);
    localStorage.removeItem('selectedSchool');
  };

  const value = {
    selectedSchool,
    selectSchool,
    clearSchool,
    loading: false,
  };

  return <SchoolContext.Provider value={value}>{children}</SchoolContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSchool() {
  const ctx = useContext(SchoolContext);
  if (!ctx) throw new Error('useSchool must be used within <SchoolProvider>');
  return ctx;
}
