'use client';

import { useState } from 'react';

interface ResearchFormProps {
  onSubmit: (query: string) => void;
  isLoading: boolean;
}

export default function ResearchForm({ onSubmit, isLoading }: ResearchFormProps) {
  const [query, setQuery] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSubmit(query.trim());
    }
  };
  
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        What would you like to research?
      </h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label 
            htmlFor="query" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Research Query
          </label>
          <textarea
            id="query"
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Enter your research topic or question here..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            required
            aria-required="true"
          />
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Be as specific or as broad as you need. Our AI will ask follow-up questions to clarify.
          </p>
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className={`px-6 py-3 rounded-lg text-white font-medium ${
              isLoading || !query.trim()
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
              <span>Continue</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 