"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  DocumentArrowDownIcon,
  ShareIcon,
  SparklesIcon,
  BookmarkIcon,
  ChevronUpIcon,
  PrinterIcon,
} from "@heroicons/react/24/outline";
import { writeFinalReport, type ResearchStep } from "@/lib/deep-research";
import { languageCodeToName } from "@/utils/language-detection";
import { useLanguage } from "@/utils/language-context";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";

// Citation component to properly render citation numbers
const Citation = ({ num, url }: { num: string; url?: string }) => {
  const content = (
    <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300 rounded-full">
      [{num}]
    </span>
  );

  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="no-underline"
      >
        {content}
      </a>
    );
  }

  return content;
};

interface ResearchReportProps {
  report: string;
  onNewResearch?: () => void;
  learnings?: Array<{ learning: string; url: string; title?: string }>;
  researchLearnings?: Array<{ learning: string; url: string; title?: string }>;
  prompt?: string;
  enhancedQueryText?: string;
  language?: string;
  sourceUrls?: Record<string, string>; // Map of citation numbers to URLs
  researchDuration?: number | null; // Duration of research in milliseconds
  researchStartTime?: number | null;
  researchSteps?: ResearchStep[]; // Using the proper ResearchStep type
}

export default function ResearchReport({
  report,
  onNewResearch = () => {},
  learnings = [],
  researchLearnings,
  prompt = "",
  enhancedQueryText,
  language = "en",
  sourceUrls = {},
  researchDuration = null,
  researchStartTime,
  researchSteps,
}: ResearchReportProps) {
  // These props are received but not directly used in this component
  // They are kept for compatibility with the page.tsx component
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = { researchStartTime, researchSteps };
  
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [currentReport, setCurrentReport] = useState(report);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showToc, setShowToc] = useState(true);
  const [headings, setHeadings] = useState<
    { id: string; text: string; level: number }[]
  >([]);
  const [extractedSourceUrls, setExtractedSourceUrls] =
    useState<Record<string, string>>(sourceUrls);
  const reportRef = useRef<HTMLDivElement>(null);

  // Use researchLearnings if provided, otherwise use learnings
  const actualLearnings = researchLearnings || learnings;
  // Use enhancedQueryText if provided, otherwise use prompt
  const actualPrompt = enhancedQueryText || prompt;

  useEffect(() => {
    setCurrentReport(report);

    // Extract source URLs from the report if they exist
    // Match various possible headings for the sources section (Sources, References, แหล่งข้อมูล, etc.)
    const sourcesHeadingPatterns1 = [
      "# Sources",
      "# SOURCES",
      "# References",
      "# REFERENCES",
      "# แหล่งข้อมูล", // Thai
      "# อ้างอิง", // Thai alternative
      "# 参考文献", // Japanese
      "# 来源", // Chinese
      "# 출처", // Korean
      "# Quellen", // German
      "# Fuentes", // Spanish
      "# Sources citées", // French
      "# Fonti", // Italian
      "# Источники", // Russian
      "# مصادر", // Arabic
      "# Źródła", // Polish
      "# Bronnen", // Dutch
      "# Fontes", // Portuguese
      "# Kilder", // Danish/Norwegian
      "# Källor", // Swedish
    ];

    const sourcesHeadingPatterns2 = sourcesHeadingPatterns1.map(
      (pattern) => "#" + pattern
    );
    const sourcesHeadingPatterns3 = sourcesHeadingPatterns1.map(
      (pattern) => "##" + pattern
    );
    const sourcesHeadingPatterns = [
      ...sourcesHeadingPatterns1,
      ...sourcesHeadingPatterns2,
      ...sourcesHeadingPatterns3,
    ];
    // Create a regex pattern that matches any of the source heading patterns
    const sourcesHeadingRegexPattern = sourcesHeadingPatterns
      .map((pattern) => pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) // Escape regex special chars
      .join("|");

    const sourcesRegex = new RegExp(
      `(?:${sourcesHeadingRegexPattern})\\s+([\\s\\S]+)$`,
      "i"
    );
    const sourcesMatch = report.match(sourcesRegex);

    if (sourcesMatch && sourcesMatch[1]) {
      const sourceLines = sourcesMatch[1].trim().split("\n");
      const extractedUrls: Record<string, string> = {};

      sourceLines.forEach((line) => {
        // Match lines like "[1] https://example.com" or "[1] https://example.com - Source title"
        const urlMatch = line.match(/\[(\d+)\]\s+(https?:\/\/[^\s]+)/);
        if (urlMatch) {
          extractedUrls[urlMatch[1]] = urlMatch[2];
        }
      });

      // Merge with provided sourceUrls, with extracted URLs taking precedence
      setExtractedSourceUrls({ ...sourceUrls, ...extractedUrls });
    } else {
      setExtractedSourceUrls(sourceUrls);
    }
  }, [report, sourceUrls]);

  // Extract headings for table of contents
  useEffect(() => {
    if (reportRef.current) {
      const headingElements = reportRef.current.querySelectorAll("h1, h2, h3");
      const extractedHeadings = Array.from(headingElements).map((heading) => ({
        id: heading.id,
        text: heading.textContent || "",
        level: parseInt(heading.tagName.substring(1)),
      }));
      setHeadings(extractedHeadings);
    }
  }, [currentReport]);

  const handleDownload = () => {
    // Create a blob from the report text
    const blob = new Blob([currentReport], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);

    // Create a temporary link element and trigger download
    const a = document.createElement("a");
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
    if (!reportRef.current) return;
    
    const reportText = reportRef.current.innerText;
    
    navigator.clipboard
      .writeText(reportText)
      .then(() => {
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
        }, 2000);
      })
      .catch((err) => {
        console.error("Failed to copy report: ", err);
      });
  };

  const handleRegenerateReport = async () => {
    if (!actualLearnings || actualLearnings.length === 0) return;

    setIsRegenerating(true);

    try {
      // Generate a new report with the same learnings
      const reportResponse = await writeFinalReport({
        prompt: actualPrompt,
        learnings: actualLearnings,
        language,
      });

      // Get the report text
      const newReportText = await reportResponse.text;
      setCurrentReport(newReportText);
    } catch (error) {
      console.error("Error regenerating report:", error);
    } finally {
      setIsRegenerating(false);
    }
  };

  // Extract title from the report (assuming first line is a heading)
  const reportTitle = currentReport.split("\n")[0].replace(/^#+ /, "");

  // Get language name for display
  const getLanguageName = (code: string): string => {
    return languageCodeToName[code] || code;
  };

  // Scroll to heading
  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Format duration into a readable string
  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="print:bg-white">
      {/* Action Bar - Hidden when printing */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <BookmarkIcon className="h-6 w-6 mr-2 text-indigo-600 dark:text-indigo-400" />
            {t('researchReport.title')}
          </h2>
          {researchDuration && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t('researchReport.completedIn')} {formatDuration(researchDuration)}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleRegenerateReport}
            disabled={isRegenerating}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg transition-colors duration-200 flex items-center shadow-sm"
            aria-label={t('researchReport.regenerateReport')}
          >
            {isRegenerating ? (
              <>
                <div
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"
                  aria-hidden="true"
                ></div>
                <span>{t('researchReport.regenerating')}</span>
              </>
            ) : (
              <>
                <SparklesIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                <span>{t('researchReport.regenerate')}</span>
              </>
            )}
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg transition-colors duration-200 flex items-center shadow-sm"
            aria-label={t('researchReport.printReport')}
          >
            <PrinterIcon className="h-5 w-5 mr-2" aria-hidden="true" />
            <span>{t('researchReport.print')}</span>
          </button>
          <button
            onClick={handleCopyToClipboard}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ShareIcon className="h-5 w-5 mr-2" />
            {t('researchReport.copyReport')}
          </button>
          <button
            onClick={handleDownload}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
            {t('researchReport.downloadMarkdown')}
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Table of Contents - Hidden when printing if empty */}
        {headings.length > 0 && (
          <div
            className={`lg:w-1/4 print:hidden ${showToc ? "block" : "hidden"}`}
          >
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 sticky top-24 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {t('researchReport.tableOfContents')}
                </h3>
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
                <h1 className="text-3xl md:text-4xl font-extrabold mb-4 print:text-black leading-tight">
                  {reportTitle}
                </h1>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center text-indigo-100 print:text-gray-600">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span>{t('researchReport.generatedOn')} {new Date().toLocaleDateString()}</span>
                  </div>
                  <span className="text-xs bg-indigo-700/50 px-3 py-1 rounded-full text-white print:bg-gray-200 print:text-gray-800 font-medium">
                    {getLanguageName(language)}
                  </span>
                  <span className="text-xs bg-purple-700/50 px-3 py-1 rounded-full text-white print:bg-gray-200 print:text-gray-800 font-medium">
                    {t('researchReport.typhoonResearch')}
                  </span>
                </div>
              </div>
            </div>

            {/* Report Content with Enhanced Markdown */}
            <div className="p-6 md:p-8" ref={reportRef}>
              <article className="prose dark:prose-invert lg:prose-lg xl:prose-xl max-w-none print:max-w-full prose-headings:font-bold prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-a:text-indigo-600 dark:prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-img:shadow-md overflow-hidden">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw, rehypeSlug]}
                  components={{
                    h1: ({ children, ...props }) => {
                      // Check if this is the Sources heading in any language
                      const sourcesHeadingPatterns = [
                        "sources",
                        "references",
                        "แหล่งข้อมูล", // Thai
                        "อ้างอิง", // Thai alternative
                        "参考文献", // Japanese
                        "来源", // Chinese
                        "출처", // Korean
                        "quellen", // German
                        "fuentes", // Spanish
                        "sources citées", // French
                        "fonti", // Italian
                        "источники", // Russian
                        "مصادر", // Arabic
                        "źródła", // Polish
                        "bronnen", // Dutch
                        "fontes", // Portuguese
                        "kilder", // Danish/Norwegian
                        "källor", // Swedish
                      ];

                      if (
                        typeof children === "string" &&
                        sourcesHeadingPatterns.some((pattern) =>
                          children.toLowerCase().includes(pattern)
                        )
                      ) {
                        return (
                          <div className="mt-12 pt-6 border-t-2 border-gray-200 dark:border-gray-700">
                            <h1
                              className="text-2xl lg:text-3xl font-bold text-gray-800 dark:text-gray-100 break-words"
                              {...props}
                            >
                              {children}
                            </h1>
                          </div>
                        );
                      }
                      return (
                        <h1
                          className="text-3xl lg:text-4xl font-extrabold mt-10 mb-6 pb-2 border-b-0 text-gray-900 dark:text-white bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent break-words"
                          {...props}
                        />
                      );
                    },
                    h2: ({ ...props }) => (
                      <h2
                        className="text-2xl lg:text-3xl font-bold mt-8 mb-4 pb-2 border-b-0 relative pl-4 text-gray-800 dark:text-gray-100 before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-gradient-to-b before:from-indigo-500 before:to-purple-500 before:rounded-full break-words"
                        {...props}
                      />
                    ),
                    h3: ({ ...props }) => (
                      <h3
                        className="text-xl lg:text-2xl font-semibold mt-6 mb-3 text-gray-800 dark:text-gray-100 break-words"
                        {...props}
                      />
                    ),
                    h4: ({ ...props }) => (
                      <h4
                        className="text-lg lg:text-xl font-medium mt-4 mb-2 text-gray-800 dark:text-gray-100 break-words"
                        {...props}
                      />
                    ),
                    p: ({ children, ...props }) => {
                      // Process children to handle citations regardless of type
                      const processChildren = (children: React.ReactNode): React.ReactNode[] | React.ReactNode => {
                        // If children is a string, process it for citations
                        if (typeof children === "string") {
                          // Process string with citations
                          const parts: React.ReactNode[] = [];
                          let lastIndex = 0;
                          const regex = /\[(\d+)\]/g;
                          let match;

                          while ((match = regex.exec(children)) !== null) {
                            // Add text before the citation
                            if (match.index > lastIndex) {
                              parts.push(
                                children.substring(lastIndex, match.index)
                              );
                            }

                            // Add the citation component
                            parts.push(
                              <Citation
                                key={`citation-${match.index}`}
                                num={match[1]}
                                url={extractedSourceUrls[match[1]]}
                              />
                            );

                            lastIndex = match.index + match[0].length;
                          }

                          // Add any remaining text
                          if (lastIndex < children.length) {
                            parts.push(children.substring(lastIndex));
                          }

                          return parts;
                        }
                        
                        // If children is an array, process each child
                        if (Array.isArray(children)) {
                          return children.map((child) => {
                            if (typeof child === "string") {
                              return processChildren(child);
                            }
                            return child;
                          });
                        }
                        
                        // If children is an object (React element), return it as is
                        return children;
                      };

                      return (
                        <p
                          className="my-4 leading-relaxed text-base lg:text-lg break-words"
                          {...props}
                        >
                          {processChildren(children)}
                        </p>
                      );
                    },
                    ul: ({ ...props }) => (
                      <ul
                        className="list-disc pl-6 my-6 space-y-3"
                        {...props}
                      />
                    ),
                    ol: ({ ...props }) => (
                      <ol
                        className="list-decimal pl-6 my-6 space-y-3"
                        {...props}
                      />
                    ),
                    li: ({ children, ...props }) => {
                      // Process children to handle citations regardless of type
                      const processChildren = (children: React.ReactNode): React.ReactNode[] | React.ReactNode => {
                        // If children is a string, process it for citations
                        if (typeof children === "string") {
                          // Process string with citations
                          const parts: React.ReactNode[] = [];
                          let lastIndex = 0;
                          const regex = /\[(\d+)\]/g;
                          let match;

                          while ((match = regex.exec(children)) !== null) {
                            // Add text before the citation
                            if (match.index > lastIndex) {
                              parts.push(
                                children.substring(lastIndex, match.index)
                              );
                            }

                            // Add the citation component
                            parts.push(
                              <Citation
                                key={`citation-${match.index}`}
                                num={match[1]}
                                url={extractedSourceUrls[match[1]]}
                              />
                            );

                            lastIndex = match.index + match[0].length;
                          }

                          // Add any remaining text
                          if (lastIndex < children.length) {
                            parts.push(children.substring(lastIndex));
                          }

                          return parts;
                        }
                        
                        // If children is an array, process each child
                        if (Array.isArray(children)) {
                          return children.map((child) => {
                            if (typeof child === "string") {
                              return processChildren(child);
                            }
                            return child;
                          });
                        }
                        
                        // If children is an object (React element), return it as is
                        return children;
                      };

                      return (
                        <li className="pl-2 break-words" {...props}>
                          {processChildren(children)}
                        </li>
                      );
                    },
                    blockquote: ({ ...props }) => (
                      <blockquote
                        className="my-6 pl-6 py-1 border-l-4 border-indigo-500 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 rounded-r-lg italic text-gray-700 dark:text-gray-300 break-words"
                        {...props}
                      />
                    ),
                    a: ({ ...props }) => (
                      <a
                        className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline transition-colors duration-200 break-words"
                        target="_blank"
                        rel="noopener"
                        {...props}
                      />
                    ),
                    table: ({ ...props }) => (
                      <div className="my-8 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm max-w-full">
                        <table
                          className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 table-auto"
                          {...props}
                        />
                      </div>
                    ),
                    th: ({ ...props }) => (
                      <th
                        className="bg-gray-50 dark:bg-gray-800 px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 break-words"
                        {...props}
                      />
                    ),
                    td: ({ ...props }) => (
                      <td
                        className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800 break-words"
                        {...props}
                      />
                    ),
                    code: ({
                      inline,
                      ...props
                    }: { inline?: boolean } & React.HTMLProps<HTMLElement>) =>
                      inline ? (
                        <code
                          className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono text-indigo-600 dark:text-indigo-400 break-words"
                          {...props}
                        />
                      ) : (
                        <div className="relative my-6 rounded-lg overflow-hidden shadow-md">
                          <div className="bg-gray-800 dark:bg-black px-4 py-2 text-xs text-gray-200 flex justify-between items-center">
                            <span>Code</span>
                            <button
                              onClick={() => {
                                const code = props.children?.toString() || "";
                                navigator.clipboard.writeText(code);
                              }}
                              className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-gray-200 transition-colors"
                            >
                              Copy
                            </button>
                          </div>
                          <code
                            className="block bg-gray-50 dark:bg-gray-900 p-4 text-sm font-mono overflow-x-auto border-t border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words"
                            {...props}
                          />
                        </div>
                      ),
                    img: ({ ...props }) => (
                      <div className="my-8 flex justify-center">
                        <img
                          className="max-w-full h-auto rounded-lg shadow-lg"
                          {...props}
                        />
                      </div>
                    ),
                    hr: ({ ...props }) => (
                      <hr
                        className="my-10 border-0 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent"
                        {...props}
                      />
                    ),
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
        onClick={scrollToTop}
        className="fixed bottom-20 right-6 bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 rounded-full p-3 shadow-lg transition-all duration-200 print:hidden flex items-center justify-center border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
        aria-label={t('researchReport.backToTop')}
      >
        <ChevronUpIcon className="h-6 w-6" />
      </button>

      {/* Start New Research Button - Below Back to top button */}
      <button
        onClick={onNewResearch}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full p-3 shadow-lg transition-all duration-200 print:hidden flex items-center justify-center"
        aria-label={t('researchReport.startNew')}
      >
        <SparklesIcon className="h-6 w-6" />
      </button>

      {/* Floating TOC toggle button - Only visible on desktop when TOC is hidden */}
      {headings.length > 0 && !showToc && (
        <button
          onClick={() => setShowToc(true)}
          className="fixed bottom-20 right-6 bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 rounded-full p-3 shadow-lg transition-all duration-200 print:hidden hidden lg:flex items-center justify-center border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
          aria-label={t('researchReport.showTableOfContents')}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h7"
            />
          </svg>
        </button>
      )}

      {/* Mobile TOC toggle button */}
      {headings.length > 0 && (
        <button
          onClick={() => setShowToc(!showToc)}
          className="fixed bottom-6 left-6 bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 rounded-full p-3 shadow-lg transition-all duration-200 print:hidden lg:hidden flex items-center justify-center border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
          aria-label={showToc ? t('researchReport.hideTableOfContents') : t('researchReport.showTableOfContents')}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h7"
            />
          </svg>
        </button>
      )}

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
          h1,
          h2,
          h3,
          h4,
          h5,
          h6 {
            page-break-after: avoid;
            page-break-inside: avoid;
          }
          table,
          figure {
            page-break-inside: avoid;
          }
          p {
            orphans: 3;
            widows: 3;
          }
        }

        /* Fix for markdown overflow */
        .prose {
          word-wrap: break-word;
          overflow-wrap: break-word;
        }

        .prose pre {
          overflow-x: auto;
          white-space: pre-wrap;
          word-wrap: break-word;
        }

        .prose table {
          table-layout: fixed;
          width: 100%;
        }

        .prose td,
        .prose th {
          overflow-wrap: break-word;
          word-wrap: break-word;
          hyphens: auto;
        }

        /* Fix for citation rendering */
        .prose p a[href^="#citation"],
        .prose li a[href^="#citation"] {
          text-decoration: none;
          background-color: rgba(79, 70, 229, 0.1);
          color: rgb(79, 70, 229);
          border-radius: 9999px;
          padding: 0.1rem 0.5rem;
          font-size: 0.75rem;
          font-weight: 500;
          white-space: nowrap;
        }

        /* Dark mode for citations */
        .dark .prose p a[href^="#citation"],
        .dark .prose li a[href^="#citation"] {
          background-color: rgba(79, 70, 229, 0.2);
          color: rgb(129, 140, 248);
        }
      `}</style>

      {copied && (
        <div className="fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-md">
          {t('researchReport.reportCopied')}
        </div>
      )}
    </div>
  );
}
