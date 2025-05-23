'use client';

import { useState } from 'react';
import Image from 'next/image';
import { writeFinalReport } from '@/lib/deep-research';
import { mockWriteFinalReport } from '@/lib/mock-report';
import ResearchReport from '@/components/ResearchReport';

export default function TestReportPage() {
  const [report, setReport] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [useMock, setUseMock] = useState(false);

  // Sample data for testing
  const sampleLearnings = [
    {
      learning: "Thai language is written using the Thai script, which was derived from the Khmer script.",
      url: "https://en.wikipedia.org/wiki/Thai_language",
      title: "Thai language - Wikipedia"
    },
    {
      learning: "Thai is a tonal language with five tones: mid, low, falling, high, and rising.",
      url: "https://www.bbc.com/thai/thailand",
      title: "BBC Thai"
    },
    {
      learning: "The Thai language has 44 consonants and 15 vowel symbols that combine to form numerous vowel combinations.",
      url: "https://www.omniglot.com/writing/thai.htm",
      title: "Thai alphabet, pronunciation and language"
    },
    {
      learning: "Thai does not use spaces between words, but uses spaces for sentence breaks instead.",
      url: "https://www.learnthaiwithmod.com/2019/02/thai-writing-system/",
      title: "Thai Writing System"
    },
    {
      learning: "Thai has its own numerals, though Arabic numerals are also commonly used.",
      url: "https://www.thai-language.com/ref/numbers",
      title: "Thai Numbers"
    },
    {
      learning: "The Thai language belongs to the Tai-Kadai language family.",
      url: "https://www.ethnologue.com/language/tha",
      title: "Thai - Ethnologue"
    },
    {
      learning: "Thai has a complex system of pronouns that reflects the social status of speakers.",
      url: "https://www.thaiembassy.com/thailand/thai-language-basics",
      title: "Thai Language Basics"
    }
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="w-full bg-white shadow-md backdrop-blur-lg bg-opacity-80 sticky top-0 z-10 flex-none">
          <div className="container mx-auto px-6 py-5">
            <div className="flex items-center justify-center">
              <div className="flex items-center">
                <Image src="/images/logo.svg" alt="Typhoon Logo" width={32} height={32} className="mr-3" />
                <a href="http://opentyphoon.ai/" target="_blank" rel="noopener noreferrer" className="flex items-center hover:opacity-80 transition-opacity">
                  <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">Typhoon</span>
                  <span className="text-2xl font-bold text-gray-800 ml-2">Deep Research</span>
                </a>
              </div>
            </div>
          </div>
        </header>

        <h1 className="text-3xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
          Test Report Generation
        </h1>

        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Generate Test Report</h2>

          <div className="mb-6">
            <h3 className="text-md font-medium text-gray-900 mb-2">Sample Prompt:</h3>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700">{samplePrompt}</p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-md font-medium text-gray-900 mb-2">Sample Learnings:</h3>
            <div className="p-4 bg-gray-50 rounded-lg">
              <ul className="list-disc pl-5 text-gray-700">
                {sampleLearnings.map((learning, index) => (
                  <li key={index} className="mb-1">{learning.learning}</li>
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
              <span className="ml-2 text-gray-700">
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
            <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg">
              {error}
            </div>
          )}
        </div>

        {report && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Generated Report</h2>

            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700">
                <strong>Report Source:</strong> {useMock ? 'Mock Generator' : 'API Generator'}
              </p>
            </div>

            <div className="mt-8">
              <ResearchReport
                report={report}
                onNewResearch={() => setReport('')}
                learnings={sampleLearnings}
                prompt={samplePrompt}
                language="th"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 