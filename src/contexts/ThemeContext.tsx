'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'classic' | 'modern';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isModern: boolean;
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('modern');
  const [mounted, setMounted] = useState(false);

  // クライアントサイドでのみ実行
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('ui-theme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'classic' ? 'modern' : 'classic';
    setTheme(newTheme);
    localStorage.setItem('ui-theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isModern: theme === 'modern', mounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
