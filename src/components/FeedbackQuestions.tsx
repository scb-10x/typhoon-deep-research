'use client';

import { useState } from 'react';
import { useLanguage } from '@/utils/language-context';

interface FeedbackQuestionsProps {
  questions: string[];
  onSubmit: (responses: Record<string, string>) => void;
  isLoading: boolean;
}

export default function FeedbackQuestions({ 
  questions, 
  onSubmit, 
  isLoading 
}: FeedbackQuestionsProps) {
  const { t } = useLanguage();
  const [responses, setResponses] = useState<Record<string, string>>(
    questions.reduce((acc, _, index) => {
      acc[`question-${index}`] = '';
      return acc;
    }, {} as Record<string, string>)
  );
  
  const handleChange = (index: number, value: string) => {
    setResponses(prev => ({
      ...prev,
      [`question-${index}`]: value
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(responses);
  };
  
  const isFormComplete = Object.values(responses).every(response => response.trim() !== '');
  
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        {t('feedbackQuestions.title')}
      </h2>
      
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        {t('feedbackQuestions.subtitle')}
      </p>
      
      <form onSubmit={handleSubmit}>
        {questions.map((question, index) => (
          <div key={index} className="mb-6">
            <label 
              htmlFor={`question-${index}`} 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              {question}
            </label>
            <textarea
              id={`question-${index}`}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Your answer..."
              value={responses[`question-${index}`]}
              onChange={(e) => handleChange(index, e.target.value)}
              required
              aria-required="true"
            />
          </div>
        ))}
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading || !isFormComplete}
            className={`px-6 py-3 rounded-lg text-white font-medium ${
              isLoading || !isFormComplete
                ? 'bg-indigo-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700'
            } transition-colors duration-200 flex items-center`}
            aria-disabled={isLoading || !isFormComplete}
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
              <span>{t('feedbackQuestions.submit')}</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 