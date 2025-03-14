'use client';

import { useState } from 'react';
import { writeFinalReport } from '@/lib/deep-research';
import { mockWriteFinalReport } from '@/lib/mock-report';
import ResearchReport from '@/components/ResearchReport';
import { BeakerIcon } from '@heroicons/react/24/solid';

export default function TestReportPage() {
  const [report, setReport] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [useMock, setUseMock] = useState(false);

  // Sample data for testing
  const sampleLearnings = [
    "Thai language is written using the Thai script, which was derived from the Khmer script.",
    "Thai is a tonal language with five tones: mid, low, falling, high, and rising.",
    "The Thai language has 44 consonants and 15 vowel symbols that combine to form numerous vowel combinations.",
    "Thai does not use spaces between words, but uses spaces for sentence breaks instead.",
    "Thai has its own numerals, though Arabic numerals are also commonly used.",
    "The Thai language belongs to the Tai-Kadai language family.",
    "Thai has a complex system of pronouns that reflects the social status of speakers."
  ];

  const samplePrompt = "Tell me about the Thai language and its characteristics";

  const generateTestReport = async () => {
    setIsGenerating(true);
    setError('');
    
    try {
      let reportResponse;
      
      if (useMock) {
        // Use the mock report generator
        reportResponse = await mockWriteFinalReport({
          prompt: samplePrompt,
          learnings: sampleLearnings,
          language: 'th', // Test with Thai language
        });
      } else {
        // Use the real report generator
        reportResponse = await writeFinalReport({
          prompt: samplePrompt,
          learnings: sampleLearnings,
          language: 'th', // Test with Thai language
        });
      }
      
      // Get the report text
      const reportText = await reportResponse.text;
      setReport(reportText);
    } catch (error) {
      console.error('Error generating test report:', error);
      setError('Failed to generate report. See console for details.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-950 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="w-full bg-white dark:bg-gray-900 shadow-md backdrop-blur-lg bg-opacity-80 dark:bg-opacity-80 sticky top-0 z-10 flex-none">
          <div className="container mx-auto px-6 py-5">
            <div className="flex items-center justify-center">
              <div className="flex items-center">
                <BeakerIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400 mr-3" />
                <a href="http://opentyphoon.ai/" target="_blank" rel="noopener noreferrer" className="flex items-center hover:opacity-80 transition-opacity">
                  <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">Typhoon</span>
                  <span className="text-2xl font-bold text-gray-800 dark:text-white ml-2">Research</span>
                  <span className="ml-2 text-xs font-medium px-2 py-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 rounded-full">experiment version</span>
                </a>
              </div>
            </div>
          </div>
        </header>
        
        <h1 className="text-3xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
          Test Report Generation
        </h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Generate Test Report</h2>
          
          <div className="mb-6">
            <h3 className="text-md font-medium text-gray-900 dark:text-white mb-2">Sample Prompt:</h3>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-gray-700 dark:text-gray-300">{samplePrompt}</p>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-md font-medium text-gray-900 dark:text-white mb-2">Sample Learnings:</h3>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <ul className="list-disc pl-5 text-gray-700 dark:text-gray-300">
                {sampleLearnings.map((learning, index) => (
                  <li key={index} className="mb-1">{learning}</li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="mb-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={useMock}
                onChange={() => setUseMock(!useMock)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-gray-700 dark:text-gray-300">
                Use mock report generator (for debugging)
              </span>
            </label>
          </div>
          
          <button
            onClick={generateTestReport}
            disabled={isGenerating}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg transition-colors duration-200 flex items-center"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                <span>Generating...</span>
              </>
            ) : (
              <span>Generate Test Report</span>
            )}
          </button>
          
          {error && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
              {error}
            </div>
          )}
        </div>
        
        {report && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Generated Report</h2>
            
            <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Report Source:</strong> {useMock ? 'Mock Generator' : 'API Generator'}
              </p>
            </div>
            
            <ResearchReport 
              report={report} 
              onNewResearch={() => setReport('')}
              learnings={sampleLearnings}
              prompt={samplePrompt}
              language="th"
            />
          </div>
        )}
      </div>
    </div>
  );
} 