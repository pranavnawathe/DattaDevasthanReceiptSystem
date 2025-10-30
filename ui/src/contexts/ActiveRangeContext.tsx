import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { RangeItem } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'https://lfg5incxn1.execute-api.ap-south-1.amazonaws.com';

interface ActiveRangeContextType {
  activeRange: RangeItem | null;
  loading: boolean;
  error: string | null;
  setActiveRange: (range: RangeItem | null) => void;
  refreshActiveRange: () => Promise<void>;
  clearActiveRange: () => void;
}

const ActiveRangeContext = createContext<ActiveRangeContextType | undefined>(undefined);

interface ActiveRangeProviderProps {
  children: ReactNode;
}

const STORAGE_KEY = 'temple_active_range';

export function ActiveRangeProvider({ children }: ActiveRangeProviderProps) {
  const [activeRange, setActiveRangeState] = useState<RangeItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load active range from localStorage on mount
  useEffect(() => {
    const storedRange = localStorage.getItem(STORAGE_KEY);
    if (storedRange) {
      try {
        const range = JSON.parse(storedRange);
        setActiveRangeState(range);
      } catch (err) {
        console.error('Failed to parse stored range:', err);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  // Fetch the currently active range from the backend
  const refreshActiveRange = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/ranges?status=active&year=${new Date().getFullYear()}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch active ranges: ${response.status}`);
      }
      const data = await response.json();

      if (data.success && data.ranges && data.ranges.length > 0) {
        // Use the first active range found
        const range = data.ranges[0];
        setActiveRangeState(range);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(range));
      } else {
        // No active range found
        setActiveRangeState(null);
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch active range';
      setError(message);
      console.error('Error fetching active range:', err);
    } finally {
      setLoading(false);
    }
  };

  // Set active range and persist to localStorage
  const setActiveRange = (range: RangeItem | null) => {
    setActiveRangeState(range);
    if (range) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(range));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  // Clear active range
  const clearActiveRange = () => {
    setActiveRangeState(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <ActiveRangeContext.Provider
      value={{
        activeRange,
        loading,
        error,
        setActiveRange,
        refreshActiveRange,
        clearActiveRange,
      }}
    >
      {children}
    </ActiveRangeContext.Provider>
  );
}

export function useActiveRange() {
  const context = useContext(ActiveRangeContext);
  if (context === undefined) {
    throw new Error('useActiveRange must be used within an ActiveRangeProvider');
  }
  return context;
}
