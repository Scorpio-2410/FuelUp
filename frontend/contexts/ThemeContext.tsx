// Manages the theme of the app
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TimeBasedTheme, ThemeMode, getCurrentTheme, getThemeByTime } from '../constants/TimeBasedTheme';

interface ThemeContextType {
  theme: TimeBasedTheme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  isAuto: boolean;
  toggleAuto: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>('auto');
  const [theme, setTheme] = useState<TimeBasedTheme>(getCurrentTheme('auto'));

  const isAuto = mode === 'auto';

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    setTheme(getCurrentTheme(newMode));
  };

  const toggleAuto = () => {
    if (mode === 'auto') {
      // Switch to manual mode based on current time
      const timeBasedMode = getThemeByTime();
      setMode(timeBasedMode);
    } else {
      setMode('auto');
    }
  };

  // Update theme when time changes (every minute)
  useEffect(() => {
    if (isAuto) {
      const updateTheme = () => {
        setTheme(getCurrentTheme('auto'));
      };

      // Update immediately
      updateTheme();

      // Update every minute
      const interval = setInterval(updateTheme, 60000);

      return () => clearInterval(interval);
    }
  }, [isAuto]);

  const contextValue: ThemeContextType = {
    theme,
    mode,
    setMode,
    isAuto,
    toggleAuto,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
