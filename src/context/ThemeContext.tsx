import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { storage } from '../utils/storage';

export interface Colors {
  primary: string;
  background: string;
  card: string;
  text: string;
  border: string;
  notification: string;
  tint: string;
  tabIconDefault: string;
  tabIconSelected: string;
  cardBackground: string;
  subtitle: string;
  inputBackground: string;
  inputBorder: string;
  success: string;
  warning: string;
  error: string;
}

export interface Theme {
  dark: boolean;
  colors: Colors;
}

export const lightTheme: Theme = {
  dark: false,
  colors: {
    primary: '#14b8a6',
    background: '#f8fafc',
    card: '#ffffff',
    text: '#1e293b',
    border: '#e2e8f0',
    notification: '#f97316',
    tint: '#14b8a6',
    tabIconDefault: '#64748b',
    tabIconSelected: '#14b8a6',
    cardBackground: '#ffffff',
    subtitle: '#64748b',
    inputBackground: '#ffffff',
    inputBorder: '#e2e8f0',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
  },
};

export const darkTheme: Theme = {
  dark: true,
  colors: {
    primary: '#14b8a6',
    background: '#0f172a',
    card: '#1e293b',
    text: '#f1f5f9',
    border: '#334155',
    notification: '#f97316',
    tint: '#14b8a6',
    tabIconDefault: '#64748b',
    tabIconSelected: '#14b8a6',
    cardBackground: '#1e293b',
    subtitle: '#94a3b8',
    inputBackground: '#334155',
    inputBorder: '#475569',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
  },
};

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await storage.getItem<boolean>('isDarkTheme');
      if (savedTheme !== null) {
        setIsDark(savedTheme);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const toggleTheme = async () => {
    try {
      const newTheme = !isDark;
      setIsDark(newTheme);
      await storage.setItem('isDarkTheme', newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const theme = isDark ? darkTheme : lightTheme;

  const value: ThemeContextType = {
    theme,
    isDark,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
