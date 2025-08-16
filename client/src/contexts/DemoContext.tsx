import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface DemoContextType {
  demoMode: boolean;
  setDemoMode: (enabled: boolean) => void;
  getDemoETA: () => number[];
  createDemoTrip: (data: any) => Promise<string>;
  updateDemoUserProfile: (updates: any) => Promise<void>;
  getDemoUser: () => any;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export const useDemo = () => {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemo must be used within DemoProvider');
  }
  return context;
};

export const DemoProvider = ({ children }: { children: ReactNode }) => {
  const [demoMode, setDemoMode] = useState<boolean>(false);

  useEffect(() => {
    // Check if user is in demo mode
    const demoUser = localStorage.getItem('demo-user');
    setDemoMode(!!demoUser);
  }, []);

  const getDemoETA = () => {
    return demoMode ? [0.1, 0.5, 1, 2] : [5, 10, 15, 30, 45, 60];
  };

  const createDemoTrip = async (tripData: any): Promise<string> => {
    if (!demoMode) {
      throw new Error('Not in demo mode');
    }

    const tripId = 'demo-trip-' + Date.now();
    const trip = {
      id: tripId,
      ...tripData,
      startedAt: new Date().toISOString(),
      active: true,
    };

    // Store trip in localStorage
    const existingTrips = JSON.parse(localStorage.getItem('demo-trips') || '[]');
    existingTrips.push(trip);
    localStorage.setItem('demo-trips', JSON.stringify(existingTrips));

    return tripId;
  };

  const updateDemoUserProfile = async (updates: any): Promise<void> => {
    if (!demoMode) {
      throw new Error('Not in demo mode');
    }

    const demoUser = JSON.parse(localStorage.getItem('demo-user') || '{}');
    const updatedUser = { ...demoUser, ...updates };
    localStorage.setItem('demo-user', JSON.stringify(updatedUser));
  };

  const getDemoUser = () => {
    if (!demoMode) return null;
    return JSON.parse(localStorage.getItem('demo-user') || 'null');
  };

  return (
    <DemoContext.Provider value={{
      demoMode,
      setDemoMode,
      getDemoETA,
      createDemoTrip,
      updateDemoUserProfile,
      getDemoUser,
    }}>
      {children}
    </DemoContext.Provider>
  );
};