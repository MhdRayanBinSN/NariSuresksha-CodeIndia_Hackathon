import { createContext, useContext, useState, ReactNode } from 'react';

interface DemoContextType {
  demoMode: boolean;
  toggleDemoMode: () => void;
  getDemoETA: () => number[];
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export const useDemo = () => {
  const context = useContext(DemoContext);
  if (context === undefined) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
};

interface DemoProviderProps {
  children: ReactNode;
}

export const DemoProvider = ({ children }: DemoProviderProps) => {
  const [demoMode, setDemoMode] = useState(() => {
    return localStorage.getItem('nari-suraksha-demo') === 'true';
  });

  const toggleDemoMode = () => {
    const newMode = !demoMode;
    setDemoMode(newMode);
    localStorage.setItem('nari-suraksha-demo', newMode.toString());
  };

  const getDemoETA = () => {
    return demoMode ? [0.5, 1, 2] : [15, 30, 45, 60];
  };

  const value = {
    demoMode,
    toggleDemoMode,
    getDemoETA,
  };

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
};
