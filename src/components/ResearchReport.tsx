'use client';

import { useEffect, useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  ArrowPathIcon, 
  DocumentArrowDownIcon, 
  ShareIcon, 
  SparklesIcon,
  BookmarkIcon,
  ChevronUpIcon,
  PrinterIcon
} from '@heroicons/react/24/outline';
import { writeFinalReport } from '@/lib/deep-research';
import { languageCodeToName } from '@/utils/language-detection';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';

interface ResearchReportProps {
  report: string;
  onNewResearch: () => void;
  learnings: string[];
  prompt: string;
  language?: string;
}

export default function ResearchReport({ report, onNewResearch, learnings, prompt, language = 'en' }: ResearchReportProps) {
  const [copied, setCopied] = useState(false);
  const [currentReport, setCurrentReport] = useState(report);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showToc, setShowToc] = useState(true);
  const [headings, setHeadings] = useState<{id: string, text: string, level: number}[]>([]);
  const reportRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    setCurrentReport(report);
  }, [report]);

  // Extract headings for table of contents
  useEffect(() => {
    if (reportRef.current) {
      const headingElements = reportRef.current.querySelectorAll('h1, h2, h3');
      const extractedHeadings = Array.from(headingElements).map(heading => ({
        id: heading.id,
        text: heading.textContent || '',
        level: parseInt(heading.tagName.substring(1))
      }));
      setHeadings(extractedHeadings);
    }
  }, [currentReport]);

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
  
  const handlePrint = () => {
    window.print();
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
        language,
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
  
  // Get language name for display
  const getLanguageName = (code: string): string => {
    return languageCodeToName[code] || code;
  };

  // Scroll to heading
  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  return (
    <div className="print:bg-white">
      {/* Action Bar - Hidden when printing */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4 print:hidden">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          <BookmarkIcon className="h-6 w-6 mr-2 text-indigo-600 dark:text-indigo-400" />
          Research Report
        </h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleRegenerateReport}
            disabled={isRegenerating}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg transition-colors duration-200 flex items-center shadow-sm"
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
            onClick={handlePrint}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg transition-colors duration-200 flex items-center shadow-sm"
            aria-label="Print report"
          >
            <PrinterIcon className="h-5 w-5 mr-2" aria-hidden="true" />
            <span>Print</span>
          </button>
          <button
            onClick={handleCopyToClipboard}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg transition-colors duration-200 flex items-center shadow-sm"
            aria-label={copied ? "Copied to clipboard" : "Copy to clipboard"}
          >
            <ShareIcon className="h-5 w-5 mr-2" aria-hidden="true" />
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg transition-colors duration-200 flex items-center shadow-sm"
            aria-label="Download report as markdown"
          >
            <DocumentArrowDownIcon className="h-5 w-5 mr-2" aria-hidden="true" />
            <span>Download</span>
          </button>
          <button
            onClick={onNewResearch}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-200 flex items-center shadow-sm"
            aria-label="Start new research"
          >
            <ArrowPathIcon className="h-5 w-5 mr-2" aria-hidden="true" />
            <span>New Research</span>
          </button>
        </div>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Table of Contents - Hidden when printing if empty */}
        {headings.length > 0 && (
          <div className={`lg:w-1/4 print:hidden ${showToc ? 'block' : 'hidden'}`}>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 sticky top-24 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-white">Table of Contents</h3>
                <button 
                  onClick={() => setShowToc(!showToc)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <ChevronUpIcon className="h-5 w-5" />
                </button>
              </div>
              <nav>
                <ul className="space-y-1 text-sm">
                  {headings.map((heading, index) => (
                    <li key={index} className={`pl-${(heading.level - 1) * 4}`}>
                      <button
                        onClick={() => scrollToHeading(heading.id)}
                        className="text-left hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors w-full truncate py-1"
                      >
                        {heading.text}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </div>
        )}
        
        {/* Report Content */}
        <div className={headings.length > 0 && showToc ? "lg:w-3/4" : "w-full"}>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm print:shadow-none print:border-0">
            {/* Report Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-8 text-white print:bg-white print:text-black relative overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-black opacity-10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl"></div>
              
              <div className="relative">
                <h1 className="text-3xl md:text-4xl font-extrabold mb-4 print:text-black leading-tight">{reportTitle}</h1>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center text-indigo-100 print:text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Generated on {new Date().toLocaleDateString()}</span>
                  </div>
                  <span className="text-xs bg-indigo-700/50 px-3 py-1 rounded-full text-white print:bg-gray-200 print:text-gray-800 font-medium">
                    {getLanguageName(language)}
                  </span>
                  <span className="text-xs bg-purple-700/50 px-3 py-1 rounded-full text-white print:bg-gray-200 print:text-gray-800 font-medium">
                    Typhoon Research
                  </span>
                </div>
              </div>
            </div>
            
            {/* Report Content with Enhanced Markdown */}
            <div className="p-6 md:p-8" ref={reportRef}>
              <article className="prose dark:prose-invert lg:prose-lg xl:prose-xl max-w-none print:max-w-full prose-headings:font-bold prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-a:text-indigo-600 dark:prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-img:shadow-md">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw, rehypeSlug]}
                  components={{
                    h1: ({...props}) => <h1 className="text-3xl lg:text-4xl font-extrabold mt-10 mb-6 pb-2 border-b-0 text-gray-900 dark:text-white bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent" {...props} />,
                    h2: ({...props}) => <h2 className="text-2xl lg:text-3xl font-bold mt-8 mb-4 pb-2 border-b-0 relative pl-4 text-gray-800 dark:text-gray-100 before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-gradient-to-b before:from-indigo-500 before:to-purple-500 before:rounded-full" {...props} />,
                    h3: ({...props}) => <h3 className="text-xl lg:text-2xl font-semibold mt-6 mb-3 text-gray-800 dark:text-gray-100" {...props} />,
                    h4: ({...props}) => <h4 className="text-lg lg:text-xl font-medium mt-4 mb-2 text-gray-800 dark:text-gray-100" {...props} />,
                    p: ({...props}) => <p className="my-4 leading-relaxed text-base lg:text-lg" {...props} />,
                    ul: ({...props}) => <ul className="list-disc pl-6 my-6 space-y-3" {...props} />,
                    ol: ({...props}) => <ol className="list-decimal pl-6 my-6 space-y-3" {...props} />,
                    li: ({...props}) => <li className="pl-2" {...props} />,
                    blockquote: ({...props}) => (
                      <blockquote className="my-6 pl-6 py-1 border-l-4 border-indigo-500 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 rounded-r-lg italic text-gray-700 dark:text-gray-300" {...props} />
                    ),
                    a: ({...props}) => <a className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline transition-colors duration-200" {...props} />,
                    table: ({...props}) => (
                      <div className="my-8 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700" {...props} />
                      </div>
                    ),
                    th: ({...props}) => <th className="bg-gray-50 dark:bg-gray-800 px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400" {...props} />,
                    td: ({...props}) => <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800" {...props} />,
                    code: ({inline, ...props}: {inline?: boolean} & React.HTMLProps<HTMLElement>) => 
                      inline 
                        ? <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono text-indigo-600 dark:text-indigo-400" {...props} />
                        : (
                          <div className="relative my-6 rounded-lg overflow-hidden shadow-md">
                            <div className="bg-gray-800 dark:bg-black px-4 py-2 text-xs text-gray-200 flex justify-between items-center">
                              <span>Code</span>
                              <button 
                                onClick={() => {
                                  const code = props.children?.toString() || '';
                                  navigator.clipboard.writeText(code);
                                }}
                                className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-gray-200 transition-colors"
                              >
                                Copy
                              </button>
                            </div>
                            <code className="block bg-gray-50 dark:bg-gray-900 p-4 text-sm font-mono overflow-x-auto border-t border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-200" {...props} />
                          </div>
                        ),
                    img: ({...props}) => (
                      <div className="my-8 flex justify-center">
                        <img className="max-w-full h-auto rounded-lg shadow-lg" {...props} />
                      </div>
                    ),
                    hr: ({...props}) => <hr className="my-10 border-0 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent" {...props} />
                  }}
                >
                  {currentReport}
                </ReactMarkdown>
              </article>
            </div>
          </div>
        </div>
      </div>
      
      {/* Back to top button - Hidden when printing */}
      <button 
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-6 right-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-3 shadow-lg transition-all duration-200 print:hidden"
        aria-label="Back to top"
      >
        <ChevronUpIcon className="h-6 w-6" />
      </button>
      
      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            font-size: 12pt;
            color: black;
            background-color: white;
          }
          .prose {
            max-width: none !important;
          }
          .prose pre {
            white-space: pre-wrap;
          }
          .prose img {
            page-break-inside: avoid;
          }
          h1, h2, h3, h4, h5, h6 {
            page-break-after: avoid;
            page-break-inside: avoid;
          }
          table, figure {
            page-break-inside: avoid;
          }
          p {
            orphans: 3;
            widows: 3;
          }
        }
      `}</style>
    </div>
  );
} 