import React, { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext(null);

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const colors = {
    light: {
      primary: '#1a56db',
      primaryDark: '#1e40af',
      secondary: '#6b7280',
      success: '#059669',
      warning: '#d97706',
      danger: '#dc2626',
      info: '#0891b2',
      bg: '#f8fafc',
      bgCard: '#ffffff',
      bgSidebar: '#1e293b',
      text: '#1e293b',
      textMuted: '#6b7280',
      textLight: '#94a3b8',
      border: '#e2e8f0',
      headerGradient: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e40af 100%)',
      cardShadow: '0 1px 3px rgba(0,0,0,0.1)',
      tableHover: '#f1f5f9'
    },
    dark: {
      primary: '#3b82f6',
      primaryDark: '#2563eb',
      secondary: '#9ca3af',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
      info: '#06b6d4',
      bg: '#0f172a',
      bgCard: '#1e293b',
      bgSidebar: '#0f172a',
      text: '#f1f5f9',
      textMuted: '#94a3b8',
      textLight: '#64748b',
      border: '#334155',
      headerGradient: 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #1e293b 100%)',
      cardShadow: '0 1px 3px rgba(0,0,0,0.3)',
      tableHover: '#334155'
    }
  };

  const currentColors = colors[theme];

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors: currentColors }}>
      {children}
    </ThemeContext.Provider>
  );
};
