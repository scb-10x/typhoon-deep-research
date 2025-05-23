'use client';

import { useState, useEffect } from 'react';
import { useLanguage, type LanguageCode } from '@/utils/language-context';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Languages available in the application
  const languages: { code: LanguageCode; name: string }[] = [
    { code: 'en', name: 'English' },
    { code: 'th', name: 'ภาษาไทย' },
  ];

  // Handle client-side rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything on the server
  if (!mounted) {
    return null;
  }

  return (
    <div className="relative" id="language-switcher-container">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="true"
        id="language-switcher-button"
      >
        <span>{language === 'en' ? 'English' : 'ภาษาไทย'}</span>
        <ChevronDownIcon className="h-4 w-4" />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="language-menu"
          id="language-dropdown-menu"
        >
          <div className="py-1" role="none">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code);
                  setIsOpen(false);
                }}
                className={`block w-full text-left px-4 py-2 text-sm ${language === lang.code
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-700 hover:bg-gray-50'
                  }`}
                role="menuitem"
                id={`language-option-${lang.code}`}
              >
                {lang.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 