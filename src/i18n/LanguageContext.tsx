import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, ThemeMode } from '../types';
import { translations } from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  direction: 'rtl' | 'ltr';
  t: (key: keyof typeof translations['ar']) => string;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('lifex_lang') as Language) || 'ar';
  });

  const [theme, setThemeState] = useState<ThemeMode>(() => {
    return (localStorage.getItem('lifex_theme') as ThemeMode) || 'dark';
  });

  const direction = language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    localStorage.setItem('lifex_lang', language);
    document.documentElement.dir = direction;
    document.documentElement.lang = language;
  }, [language, direction]);

  useEffect(() => {
    localStorage.setItem('lifex_theme', theme);
    if (theme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.remove('contrast-mode');
    } else if (theme === 'contrast') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.add('contrast-mode');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('contrast-mode');
    }
  }, [theme]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
  };

  const t = (key: keyof typeof translations['ar']): string => {
    const langDict = translations[language] || translations.ar;
    return langDict[key] || translations.ar[key] || (key as string);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, direction, t, theme, setTheme }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
