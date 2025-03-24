'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import en from '@/translations/en';
import th from '@/translations/th';

// Define available languages
export type LanguageCode = 'en' | 'th';

// Define translations type
export type Translations = typeof en;

// Create a map of language codes to translations
const translations: Record<LanguageCode, Translations> = {
  en,
  th,
};

// Define the context type
type LanguageContextType = {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string, section?: string) => string;
  translations: Translations;
};

// Create the context with default values
const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: () => '',
  translations: en,
});

// Create a provider component
export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize with English or the stored preference
  const [language, setLanguageState] = useState<LanguageCode>('en');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load the language preference from localStorage on mount
  useEffect(() => {
    const storedLanguage = localStorage.getItem('language') as LanguageCode;
    if (storedLanguage && (storedLanguage === 'en' || storedLanguage === 'th')) {
      setLanguageState(storedLanguage);
    } else {
      // Try to detect browser language
      const browserLang = navigator.language.split('-')[0];
      if (browserLang === 'th') {
        setLanguageState('th');
      }
    }
    setIsLoaded(true);
  }, []);

  // Update localStorage when language changes
  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
    // Update the html lang attribute
    document.documentElement.lang = lang;
  };

  // Translation function
  const t = (key: string, section = 'common'): string => {
    const keys = key.split('.');
    let currentSection = section;
    
    if (keys.length > 1) {
      currentSection = keys[0];
      key = keys[1];
    } else {
      key = keys[0];
    }

    try {
      // @ts-expect-error - Dynamic access to nested properties
      return translations[language][currentSection][key] || key;
    } catch {
      console.warn(`Translation missing: ${currentSection}.${key}`);
      return key;
    }
  };

  // Only render children after we've loaded the language preference
  if (!isLoaded) {
    return null;
  }

  return (
    <LanguageContext.Provider value={{ 
      language, 
      setLanguage, 
      t, 
      translations: translations[language] 
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook to use the language context
export const useLanguage = () => useContext(LanguageContext); 