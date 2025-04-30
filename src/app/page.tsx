'use client';

import { useState, useEffect } from 'react';
import type { MouseEvent } from 'react';
import { ChevronDownIcon, ChevronUpIcon, SparklesIcon } from '@heroicons/react/24/outline';
import ResearchForm from '@/components/ResearchForm';
import FeedbackQuestions from '@/components/FeedbackQuestions';
import ResearchProgress from '@/components/ResearchProgress';
import ResearchReport from '@/components/ResearchReport';
import { generateFeedback } from '@/lib/feedback';
import { deepResearch, writeFinalReport, type ResearchStep } from '@/lib/deep-research';
import { detectLanguage } from '@/utils/language-detection';
import { useLanguage } from '@/utils/language-context';
import AiDisclaimer from '@/components/AiDisclaimer';

// Define the learning type based on the ResearchStep
type Learning = {
  url: string;
  learning: string;
  title?: string;
};

type ResearchStage = 'query' | 'feedback' | 'researching' | 'generating-report' | 'report';

export default function HomePage() {
  const { t } = useLanguage();
  const [activeStage, setActiveStage] = useState<ResearchStage>('query');
  const [completedStages, setCompletedStages] = useState<ResearchStage[]>([]);
  const [query, setQuery] = useState('');
  const [questions, setQuestions] = useState<string[]>([]);
  const [report, setReport] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [researchSteps, setResearchSteps] = useState<ResearchStep[]>([]);
  const [reportProgress, setReportProgress] = useState(0);
  const [researchLearnings, setResearchLearnings] = useState<Learning[]>([]);
  const [sourceUrls, setSourceUrls] = useState<Record<string, string>>({});
  const [enhancedQueryText, setEnhancedQueryText] = useState('');
  const [detectedLanguage, setDetectedLanguage] = useState<string>('en');
  const [researchDuration, setResearchDuration] = useState<number | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    query: true,
    feedback: false,
    researching: false,
    report: false
  });
  const [researchStartTime, setResearchStartTime] = useState<number | null>(null);

  // Toggle section expansion with proper type
  const toggleSection = (section: string) => (event: MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Auto-redirect when research is complete
  useEffect(() => {
    if (researchSteps.length > 0) {
      const lastStep = researchSteps[researchSteps.length - 1];
      if (lastStep.type === 'complete') {
        // Store the learnings from the complete step
        if ('learnings' in lastStep && lastStep.learnings) {
          // Store the full learning objects
          // The type of learnings in the complete step is an array of objects with url and learning properties
          const typedLearnings = lastStep.learnings as unknown as Learning[];
          setResearchLearnings(typedLearnings);

          // Create a map of citation index to URL
          const urlMap: Record<string, string> = {};
          typedLearnings.forEach((learning, index) => {
            urlMap[(index + 1).toString()] = learning.url;
          });
          setSourceUrls(urlMap);
        }
      }
    }
  }, [researchSteps]);

  const handleQuerySubmit = async (researchQuery: string) => {
    setQuery(researchQuery);
    setIsLoading(true);

    try {
      // Detect language from the query using the utility function
      const detectedLang = detectLanguage(researchQuery);
      setDetectedLanguage(detectedLang);

      // Use the real feedback generation function with await
      const feedbackResponse = await generateFeedback({
        query: researchQuery,
        language: detectedLang,
        numQuestions: 2,
      });

      // Get the final result directly
      const feedbackResult = await feedbackResponse.finalResult;
      setQuestions(feedbackResult.questions);

      // Update stages
      setCompletedStages(prev => [...prev, 'query']);
      setActiveStage('feedback');

      // Auto-expand the feedback section
      setExpandedSections(prev => ({
        ...prev,
        query: false,
        feedback: true
      }));
    } catch (error) {
      console.error('Error generating feedback questions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedbackSubmit = async (responses: Record<string, string>) => {
    setIsLoading(true);
    setResearchSteps([]);
    setResearchLearnings([]);

    try {
      // Update stages
      setCompletedStages(prev => [...prev, 'feedback']);
      setActiveStage('researching');

      // Record the research start time
      const startTime = Date.now();
      setResearchStartTime(startTime);

      // Auto-expand the research section
      setExpandedSections(prev => ({
        ...prev,
        feedback: false,
        researching: true
      }));

      // Prepare the enhanced query with feedback responses
      const enhancedQuery = `
Original query: ${query}
Additional information:
${Object.entries(responses)
          .map(([key]) => {
            const index = parseInt(key.split('-')[1]);
            return `- ${questions[index]}: ${responses[key]}`;
          })
          .join('\n')}
`;

      // Store the enhanced query for later use in report regeneration
      setEnhancedQueryText(enhancedQuery);

      // Use the real deep research function
      const result = await deepResearch({
        query: enhancedQuery,
        currentDepth: 0,
        breadth: 2,
        maxDepth: process.env.MAX_DEPTH ? parseInt(process.env.MAX_DEPTH) : 2,
        languageCode: detectedLanguage,
        onProgress: (step) => {
          setResearchSteps(prev => [...prev, step]);
        }
      });

      // Store the learnings
      const typedLearnings = result.learnings as unknown as Learning[];
      setResearchLearnings(typedLearnings);

      // Set the stage to generating-report right before calling writeFinalReport
      setActiveStage('generating-report');
      setCompletedStages(prev => [...prev, 'researching']);

      // Start progress animation for report generation
      setReportProgress(0);
      const interval = setInterval(() => {
        setReportProgress(prev => {
          if (prev >= 95) {
            clearInterval(interval);
            return 95;
          }
          return prev + 5;
        });
      }, 100);

      // Auto-expand the research section to show report generation progress
      setExpandedSections(prev => ({
        ...prev,
        researching: true
      }));

      // Generate the final report with await
      const reportResponse = await writeFinalReport({
        prompt: enhancedQuery,
        learnings: result.learnings,
        language: detectedLanguage,
      });

      // Get the report text directly
      const reportText = await reportResponse.text;
      setReport(reportText);

      // Set progress to 100% and transition to report stage
      setReportProgress(100);

      // Calculate and set the research duration
      const endTime = Date.now();
      const duration = endTime - startTime;
      setResearchDuration(duration);

      setTimeout(() => {
        setCompletedStages(prev => [...prev, 'researching']);
        setActiveStage('report');

        // Auto-expand the report section
        setExpandedSections(prev => ({
          ...prev,
          researching: false,
          report: true
        }));
      }, 500);
    } catch (error) {
      console.error('Error conducting research:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // This function will be used when the "Start New Research" button is clicked
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const startNewResearch = () => {
    setActiveStage('query');
    setCompletedStages([]);
    setQuery('');
    setQuestions([]);
    setReport('');
    setResearchSteps([]);
    setReportProgress(0);
    setResearchLearnings([]);
    setSourceUrls({});
    setEnhancedQueryText('');
    setResearchDuration(null);
    setResearchStartTime(null);
    setExpandedSections({
      query: true,
      feedback: false,
      researching: false,
      report: false
    });
  };

  // Helper function to determine section status
  const getSectionStatus = (stage: ResearchStage) => {
    if (activeStage === stage) return 'active';
    if (activeStage === 'generating-report' && stage === 'researching') return 'active';
    if (completedStages.includes(stage)) return 'completed';
    return 'pending';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 relative overflow-hidden flex flex-col">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNjB2NjBIMHoiLz48cGF0aCBkPSJNMiAyaDU2djU2SDJ6IiBzdHJva2U9IiNkMWQ1ZGIiIHN0cm9rZS1vcGFjaXR5PSIuMiIgc3Ryb2tlLXdpZHRoPSIuNSIvPjwvZz48L3N2Zz4=')] opacity-[0.15]"></div>

        {/* Floating Orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-20 left-1/2 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header is now in the Navigation component */}

      <main className="container mx-auto px-6 py-10 max-w-5xl" id="deep-research-main">
        <div className="my-16 space-y-16">
          {/* Query Section */}
          <section id="query-section" className="rounded-xl border border-gray-200 shadow-sm overflow-hidden bg-white">
            <div
              className="p-4 cursor-pointer bg-gray-50 border-b border-gray-200 flex justify-between items-center"
              onClick={toggleSection('query')}
              id="query-section-header"
            >
              <div className="flex items-center">
                <div
                  className={`${completedStages.includes('query') ? 'bg-green-500' : activeStage === 'query' ? 'bg-blue-500' : 'bg-gray-300'
                    } h-5 w-5 rounded-full mr-3 transition-colors duration-200 flex items-center justify-center text-white text-xs`}
                >
                  {completedStages.includes('query') ? '✓' : '1'}
                </div>
                <h2 className="text-lg font-semibold text-gray-800">{t('sections.query')}</h2>
              </div>
              {expandedSections.query ? (
                <ChevronUpIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />
              ) : (
                <ChevronDownIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />
              )}
            </div>
            {expandedSections.query && (
              <div className="p-6" id="query-section-content">
                <ResearchForm onSubmit={handleQuerySubmit} isLoading={isLoading} />
              </div>
            )}
          </section>

          {/* Feedback Questions Section */}
          {(completedStages.includes('query') || activeStage === 'feedback' || completedStages.includes('feedback')) && (
            <section id="feedback-section" className="rounded-xl border border-gray-200 shadow-sm overflow-hidden bg-white">
              <div
                className="p-4 cursor-pointer bg-gray-50 border-b border-gray-200 flex justify-between items-center"
                onClick={toggleSection('feedback')}
                id="feedback-section-header"
              >
                <div className="flex items-center">
                  <div
                    className={`${completedStages.includes('feedback')
                      ? 'bg-green-500'
                      : activeStage === 'feedback'
                        ? 'bg-blue-500'
                        : 'bg-gray-300'
                      } h-5 w-5 rounded-full mr-3 transition-colors duration-200 flex items-center justify-center text-white text-xs`}
                  >
                    {completedStages.includes('feedback') ? '✓' : '2'}
                  </div>
                  <h2 className="text-lg font-semibold text-gray-800">{t('sections.feedback')}</h2>
                </div>
                {expandedSections.feedback ? (
                  <ChevronUpIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />
                )}
              </div>
              {expandedSections.feedback && (
                <div className="p-6" id="feedback-section-content">
                  <FeedbackQuestions questions={questions} onSubmit={handleFeedbackSubmit} isLoading={isLoading} />
                </div>
              )}
            </section>
          )}

          {/* Research Progress Section */}
          {(completedStages.includes('feedback') || activeStage === 'researching' || activeStage === 'generating-report') && (
            <section id="research-progress-section" className="rounded-xl border border-gray-200 shadow-sm overflow-hidden bg-white">
              <div
                className="p-4 cursor-pointer bg-gray-50 border-b border-gray-200 flex justify-between items-center"
                onClick={toggleSection('researching')}
                id="research-progress-section-header"
              >
                <div className="flex items-center">
                  <div
                    className={`${completedStages.includes('researching')
                      ? 'bg-green-500'
                      : activeStage === 'researching' || activeStage === 'generating-report'
                        ? 'bg-blue-500'
                        : 'bg-gray-300'
                      } h-5 w-5 rounded-full mr-3 transition-colors duration-200 flex items-center justify-center text-white text-xs`}
                  >
                    {completedStages.includes('researching') ? '✓' : '3'}
                  </div>
                  <h2 className="text-lg font-semibold text-gray-800">{t('sections.researching')}</h2>
                </div>
                {expandedSections.researching ? (
                  <ChevronUpIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />
                )}
              </div>
              {expandedSections.researching && (
                <div className="p-6" id="research-progress-section-content">
                  <ResearchProgress
                    query={query}
                    researchSteps={researchSteps}
                    researchStartTime={researchStartTime}
                  />
                </div>
              )}
            </section>
          )}

          {/* Research Report Section */}
          {(activeStage === 'report' || completedStages.includes('report')) && (
            <section id="report-section" className="rounded-xl border border-gray-200 shadow-sm overflow-hidden bg-white">
              <div
                className="p-4 cursor-pointer bg-gray-50 border-b border-gray-200 flex justify-between items-center"
                onClick={toggleSection('report')}
                id="report-section-header"
              >
                <div className="flex items-center">
                  <div
                    className={`${completedStages.includes('report') ? 'bg-green-500' : activeStage === 'report' ? 'bg-blue-500' : 'bg-gray-300'
                      } h-5 w-5 rounded-full mr-3 transition-colors duration-200 flex items-center justify-center text-white text-xs`}
                  >
                    {completedStages.includes('report') ? '✓' : '4'}
                  </div>
                  <h2 className="text-lg font-semibold text-gray-800">{t('sections.report')}</h2>
                </div>
                {expandedSections.report ? (
                  <ChevronUpIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />
                )}
              </div>
              {expandedSections.report && (
                <div className="p-6" id="report-section-content">
                  <ResearchReport
                    report={report}
                    sourceUrls={sourceUrls}
                    onNewResearch={startNewResearch}
                    researchDuration={researchDuration}
                    researchLearnings={researchLearnings}
                  />

                  <div className="mt-12" id="ai-disclaimer-container">
                    <AiDisclaimer />
                  </div>
                </div>
              )}
            </section>
          )}
        </div>
      </main>
    </div>
  );
}