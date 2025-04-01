'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { HomeIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useLanguage } from '@/utils/language-context';

export default function Navigation() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <nav className="w-full bg-white py-4 border-b border-gray-200 shadow-md backdrop-blur-lg bg-opacity-90 fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-6 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
            <Image src="/images/logo.svg" alt="Typhoon Logo" width={32} height={32} className="mr-3" />
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">Typhoon</span>
            <span className="text-2xl font-bold text-gray-800 ml-2">Deep Research</span>
            <span className="ml-2 text-xs font-medium px-2 py-1 bg-indigo-100 text-indigo-600 rounded-full">experimental beta</span>
          </Link>
        </div>

        <div className="flex items-center space-x-6">
          <Link
            href="/"
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
            className={`flex items-center text-sm ${isActive('/how-it-works')
                ? 'text-indigo-600 font-medium'
                : 'text-gray-600 hover:text-indigo-600'
              }`}
          >
            <InformationCircleIcon className="h-5 w-5 mr-1" />
            <span>{t('navigation.howItWorks')}</span>
          </Link>

          <LanguageSwitcher />
        </div>
      </div>
    </nav>
  );
} 