'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { detectLanguage, testThaiDetection } from '@/utils/language-detection';

export default function TestThaiPage() {
  const [inputText, setInputText] = useState('');
  const [detectedLanguage, setDetectedLanguage] = useState('');
  const [testResults, setTestResults] = useState<string[]>([]);

  const handleDetect = () => {
    const detected = detectLanguage(inputText);
    setDetectedLanguage(detected);
  };

  const runTests = () => {
    // Capture console.log output
    const originalLog = console.log;
    const logs: string[] = [];

    console.log = (...args) => {
      logs.push(args.join(' '));
      originalLog(...args);
    };

    // Run the tests
    testThaiDetection();

    // Restore console.log
    console.log = originalLog;

    // Update state with test results
    setTestResults(logs);
  };

  useEffect(() => {
    // Run tests on page load
    runTests();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col">
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

      <div className="p-8 flex-grow">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
            Thai Language Detection Test
          </h1>

          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Test Your Text</h2>

            <div className="mb-4">
              <label htmlFor="text-input" className="block text-sm font-medium text-gray-700 mb-2">
                Enter text to detect language:
              </label>
              <textarea
                id="text-input"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                rows={4}
                placeholder="Type or paste text here..."
              />
            </div>

            <button
              onClick={handleDetect}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-200"
            >
              Detect Language
            </button>

            {detectedLanguage && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700">
                  Detected Language: <span className="font-semibold text-indigo-600">{detectedLanguage}</span>
                </p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Automated Test Results</h2>

            <div className="bg-gray-50 rounded-lg p-4 overflow-auto max-h-96">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                {testResults.map((line, index) => (
                  <div key={index} className={line.includes('PASS') ? 'text-green-600' : line.includes('FAIL') ? 'text-red-600' : ''}>
                    {line}
                  </div>
                ))}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 