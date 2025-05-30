import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme } from '../theme/theme';

export interface Theme {
  mode: 'light' | 'dark';
  background: string;
  text: string;
  primary: string;
  accent: string;
  borderColor: string;
  cardBackground: string;
  danger: string;
  textMuted: string;
  disabled: string;
  // Add buttonText here if it's part of the theme object, otherwise it's derived or static
  buttonText?: string; // Making it optional as it's not consistently defined in all theme uses
}

interface ThemeContextProps {
  theme: Theme;
  toggleTheme: () => void;
}

const defaultThemeContextValue: ThemeContextProps = {
    theme: lightTheme,
    toggleTheme: () => {
        console.log("ThemeProvider not yet initialized or toggleTheme not implemented");
    },
};

export const ThemeContext = createContext<ThemeContextProps>(defaultThemeContextValue);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [currentThemeMode, setCurrentThemeMode] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedThemeMode = await AsyncStorage.getItem('themeMode');
        if (savedThemeMode === 'dark' || savedThemeMode === 'light') {
          setCurrentThemeMode(savedThemeMode);
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
      }
    };
    loadThemePreference();
  }, []);

  const toggleTheme = async () => {
    const newThemeMode = currentThemeMode === 'light' ? 'dark' : 'light';
    setCurrentThemeMode(newThemeMode);
    try {
      await AsyncStorage.setItem('themeMode', newThemeMode);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  const themeToProvide = currentThemeMode === 'light' ? lightTheme : darkTheme;

  // Ensure the theme object's mode property is consistent with the currentThemeMode state.
  // This is a safeguard. In theme.ts, mode is already set.
  if (themeToProvide.mode !== currentThemeMode) {
      console.warn(`Theme object mode (${themeToProvide.mode}) does not match currentThemeMode (${currentThemeMode}). Ensure theme objects in theme.ts include the 'mode' property correctly.`);
      // Optionally, force consistency: (Not ideal, better to fix theme.ts)
      // themeToProvide.mode = currentThemeMode;
  }


  return (
    <ThemeContext.Provider value={{ theme: themeToProvide as Theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
