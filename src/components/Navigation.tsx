'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { HomeIcon, InformationCircleIcon, CodeBracketIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useLanguage } from '@/utils/language-context';

export default function Navigation() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [showGithubButton, setShowGithubButton] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check if current date is after the specified date
  useEffect(() => {
    const releaseDate = new Date('2025-05-08T17:00:01Z');

    const checkDate = () => {
      const currentDate = new Date();
      setShowGithubButton(currentDate >= releaseDate);
    };

    // Check initially
    checkDate();

    // Set up interval to check periodically (every minute)
    const interval = setInterval(checkDate, 60000);

    // Clean up interval on unmount
    return () => clearInterval(interval);
  }, []);

  const isActive = (path: string) => {
    return pathname === path;
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <nav className="w-full bg-white py-4 border-b border-gray-200 shadow-md backdrop-blur-lg bg-opacity-90 fixed top-0 left-0 right-0 z-50" id="main-navigation">
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="flex items-center hover:opacity-80 transition-opacity" id="nav-logo-link">
            <Image src="/images/logo.svg" alt="Typhoon Logo" width={32} height={32} className="mr-3" id="nav-logo-image" />
            <span className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">Typhoon</span>
            <span className="text-xl md:text-2xl font-bold text-gray-800 ml-2 hidden sm:inline">Deep Research</span>
            <div className="bg-yellow-400 text-xs font-semibold px-2 py-0.5 rounded text-yellow-800 ml-2">DEMO</div>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          <Link
            href="/"
            id="nav-home-link"
            className={`flex items-center text-sm ${isActive('/')
              ? 'text-indigo-600 font-medium'
              : 'text-gray-600 hover:text-indigo-600'
              }`}
          >
            <HomeIcon className="h-5 w-5 mr-1" />
            <span>{t('navigation.home')}</span>
          </Link>

          <Link
            href="/how-it-works"
            id="nav-how-it-works-link"
            className={`flex items-center text-sm ${isActive('/how-it-works')
              ? 'text-indigo-600 font-medium'
              : 'text-gray-600 hover:text-indigo-600'
              }`}
          >
            <InformationCircleIcon className="h-5 w-5 mr-1" />
            <span>{t('navigation.howItWorks')}</span>
          </Link>

          {showGithubButton && (
            <a
              href="https://github.com/scb-10x/typhoon-deep-research2"
              target="_blank"
              rel="noopener noreferrer"
              id="nav-github-link"
              className="flex items-center text-sm text-gray-600 hover:text-indigo-600"
            >
              <CodeBracketIcon className="h-5 w-5 mr-1" />
              <span>Source Code</span>
            </a>
          )}

          <LanguageSwitcher />
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center">
          <button 
            onClick={toggleMobileMenu}
            className="text-gray-600 hover:text-indigo-600 focus:outline-none"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? 
              <XMarkIcon className="h-6 w-6" /> : 
              <Bars3Icon className="h-6 w-6" />
            }
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white py-4 px-6 shadow-lg absolute w-full">
          <div className="flex flex-col space-y-4">
            <Link
              href="/"
              id="mobile-nav-home-link"
              className={`flex items-center text-sm ${isActive('/')
                ? 'text-indigo-600 font-medium'
                : 'text-gray-600 hover:text-indigo-600'
                }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <HomeIcon className="h-5 w-5 mr-1" />
              <span>{t('navigation.home')}</span>
            </Link>

            <Link
              href="/how-it-works"
              id="mobile-nav-how-it-works-link"
              className={`flex items-center text-sm ${isActive('/how-it-works')
                ? 'text-indigo-600 font-medium'
                : 'text-gray-600 hover:text-indigo-600'
                }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <InformationCircleIcon className="h-5 w-5 mr-1" />
              <span>{t('navigation.howItWorks')}</span>
            </Link>

            {showGithubButton && (
              <a
                href="https://github.com/scb-10x/typhoon-deep-research2"
                target="_blank"
                rel="noopener noreferrer"
                id="mobile-nav-github-link"
                className="flex items-center text-sm text-gray-600 hover:text-indigo-600"
              >
                <CodeBracketIcon className="h-5 w-5 mr-1" />
                <span>Source Code</span>
              </a>
            )}

            <div className="py-2">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
} 