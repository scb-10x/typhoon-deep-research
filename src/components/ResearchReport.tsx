'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ArrowPathIcon, DocumentArrowDownIcon, ShareIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { writeFinalReport } from '@/lib/deep-research';

interface ResearchReportProps {
  report: string;
  onNewResearch: () => void;
  learnings: string[];
  prompt: string;
}

export default function ResearchReport({ report, onNewResearch, learnings, prompt }: ResearchReportProps) {
  const [copied, setCopied] = useState(false);
  const [currentReport, setCurrentReport] = useState(report);
  const [isRegenerating, setIsRegenerating] = useState(false);
  
  const handleDownload = () => {
    // Create a blob from the report text
    const blob = new Blob([currentReport], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary link element and trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = `research-report-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(currentReport)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        console.error('Failed to copy text: ', err);
      });
  };
  
  const handleRegenerateReport = async () => {
    if (!learnings || learnings.length === 0) return;
    
    setIsRegenerating(true);
    
    try {
      // Generate a new report with the same learnings
      const reportResponse = await writeFinalReport({
        prompt,
        learnings,
        language: 'English',
      });
      
      // Get the report text
      const newReportText = await reportResponse.text;
      setCurrentReport(newReportText);
    } catch (error) {
      console.error('Error regenerating report:', error);
    } finally {
      setIsRegenerating(false);
    }
  };
  
  // Extract title from the report (assuming first line is a heading)
  const reportTitle = currentReport.split('\n')[0].replace(/^#+ /, '');
  
  return (
    <div>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Research Report
        </h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleRegenerateReport}
            disabled={isRegenerating}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg transition-colors duration-200 flex items-center"
            aria-label="Regenerate report"
          >
            {isRegenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" aria-hidden="true"></div>
                <span>Regenerating...</span>
              </>
            ) : (
              <>
                <SparklesIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                <span>Regenerate</span>
              </>
            )}
          </button>
          <button
            onClick={handleCopyToClipboard}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg transition-colors duration-200 flex items-center"
            aria-label={copied ? "Copied to clipboard" : "Copy to clipboard"}
          >
            <ShareIcon className="h-5 w-5 mr-2" aria-hidden="true" />
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg transition-colors duration-200 flex items-center"
            aria-label="Download report as markdown"
          >
            <DocumentArrowDownIcon className="h-5 w-5 mr-2" aria-hidden="true" />
            <span>Download</span>
          </button>
          <button
            onClick={onNewResearch}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-200 flex items-center"
            aria-label="Start new research"
          >
            <ArrowPathIcon className="h-5 w-5 mr-2" aria-hidden="true" />
            <span>New Research</span>
          </button>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm">
        {/* Report Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">{reportTitle}</h1>
          <p className="text-indigo-100">Generated on {new Date().toLocaleDateString()}</p>
        </div>
        
        {/* Report Content - Simple Markdown */}
        <div className="p-6 md:p-8">
          <article className="prose dark:prose-invert lg:prose-lg max-w-none">
            <ReactMarkdown>
              {currentReport}
            </ReactMarkdown>
          </article>
        </div>
      </div>
    </div>
  );
} 