'use client';

import { useState } from 'react';
import { useLanguage } from '@/utils/language-context';

interface ResearchFormProps {
  onSubmit: (query: string) => void;
  isLoading: boolean;
}

export default function ResearchForm({ onSubmit, isLoading }: ResearchFormProps) {
  const { t, translations } = useLanguage();
  const [query, setQuery] = useState('');

  // Get example queries from translations
  const exampleQueries = translations.researchForm.exampleQueries as string[];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSubmit(query.trim());
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {t('researchForm.placeholder')}
      </h2>

      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label
            htmlFor="query"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            {t('sections.query')}
          </label>
          <textarea
            id="query"
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900"
            placeholder={t('researchForm.placeholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            required
            aria-required="true"
          />
          <p className="mt-2 text-sm font-medium text-gray-700">
            {t('researchForm.examples')}
          </p>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            {exampleQueries.map((example, index) => (
              <div
                key={index}
                className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700 cursor-pointer hover:bg-indigo-50 hover:text-indigo-700 transition-colors border border-gray-200 shadow-sm flex items-center"
                onClick={() => setQuery(example)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-2 text-indigo-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {example}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className={`px-6 py-3 rounded-lg text-white font-medium ${isLoading || !query.trim()
                ? 'bg-indigo-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700'
              } transition-colors duration-200 flex items-center`}
            aria-disabled={isLoading || !query.trim()}
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Processing...</span>
              </>
            ) : (
              <span>{t('researchForm.submit')}</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 