'use client';

import { useState, useEffect } from 'react';
import type { MouseEvent } from 'react';
import { ChevronDownIcon, ChevronUpIcon, SparklesIcon, BeakerIcon } from '@heroicons/react/24/outline';
import ResearchForm from '@/components/ResearchForm';
import FeedbackQuestions from '@/components/FeedbackQuestions';
import ResearchProgress from '@/components/ResearchProgress';
import ResearchReport from '@/components/ResearchReport';
import { generateFeedback } from '@/lib/feedback';
import { deepResearch, writeFinalReport, type ResearchStep } from '@/lib/deep-research';
import { detectLanguage } from '@/utils/language-detection';

// Define the learning type based on the ResearchStep
type Learning = {
  url: string;
  learning: string;
  title?: string;
};

type ResearchStage = 'query' | 'feedback' | 'researching' | 'generating-report' | 'report';

export default function HomePage() {
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
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    query: true,
    feedback: false,
    researching: false,
    report: false
  });
  
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
      const language = detectLanguage(researchQuery);
      setDetectedLanguage(language);
      
      // Use the real feedback generation function with await
      const feedbackResponse = await generateFeedback({
        query: researchQuery,
        language,
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
        breadth: 2,
        maxDepth: 3,
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-950 relative overflow-hidden flex flex-col">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNjB2NjBIMHoiLz48cGF0aCBkPSJNMiAyaDU2djU2SDJ6IiBzdHJva2U9IiNkMWQ1ZGIiIHN0cm9rZS1vcGFjaXR5PSIuMiIgc3Ryb2tlLXdpZHRoPSIuNSIvPjwvZz48L3N2Zz4=')] opacity-[0.15] dark:opacity-[0.07]"></div>
        
        {/* Floating Orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-20 left-1/2 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob animation-delay-4000"></div>
      </div>

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
      
      <main className="container mx-auto px-6 py-12 relative flex-grow">
        <div className="max-w-4xl lg:max-w-5xl mx-auto">
          {/* Hero Section with Decorative Elements */}
          <div className="mb-12 text-center relative">
            {/* Decorative Lines */}
            <div className="absolute left-0 right-0 top-1/2 transform -translate-y-1/2 -z-10">
              <div className="h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent"></div>
              <div className="h-px mt-4 bg-gradient-to-r from-transparent via-purple-500/20 to-transparent"></div>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 relative inline-block">
              Typhoon Deep Research
              {/* Decorative Dots */}
              <span className="absolute -top-4 -right-4 w-3 h-3 bg-indigo-500 rounded-full opacity-50"></span>
              <span className="absolute -bottom-4 -left-4 w-3 h-3 bg-purple-500 rounded-full opacity-50"></span>
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto relative">
              Discover insights through AI-powered research that explores topics in depth and synthesizes findings into comprehensive reports.
            </p>
          </div>
          
          {/* Vertical Research Process */}
          <div className="space-y-6 relative">
            {/* Connecting Line */}
            <div className="absolute left-[39px] top-[72px] bottom-16 w-0.5 bg-gradient-to-b from-indigo-500 to-purple-500 z-0 hidden md:block"></div>
            
            {/* Query Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-lg relative z-10">
              <div 
                className={`p-5 flex justify-between items-center cursor-pointer ${
                  getSectionStatus('query') === 'active' 
                    ? 'bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30' 
                    : getSectionStatus('query') === 'completed'
                      ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30'
                      : 'bg-gray-50 dark:bg-gray-800'
                }`}
                onClick={toggleSection('query')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleSection('query')(e as unknown as MouseEvent<HTMLDivElement>);
                  }
                }}
              >
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 transition-all duration-300 ${
                    getSectionStatus('query') === 'active' 
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md' 
                      : getSectionStatus('query') === 'completed'
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}>
                    1
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Research Query</h2>
                </div>
                <div className="flex items-center">
                  {getSectionStatus('query') === 'completed' && (
                    <span className="text-sm font-medium text-green-600 dark:text-green-400 mr-3">Completed</span>
                  )}
                  {expandedSections.query ? (
                    <ChevronUpIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  )}
                </div>
              </div>
              
              <div className={`transition-all duration-300 ease-in-out ${
                expandedSections.query ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
              }`}>
                <div className="p-6 border-t border-gray-100 dark:border-gray-700">
                  {getSectionStatus('query') === 'completed' ? (
                    <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-600">
                      <h3 className="text-md font-medium text-gray-900 dark:text-white mb-2">Your Research Query:</h3>
                      <p className="text-gray-700 dark:text-gray-300">{query}</p>
                    </div>
                  ) : null}
                  <ResearchForm onSubmit={handleQuerySubmit} isLoading={isLoading} />
                </div>
              </div>
            </div>
            
            {/* Feedback Section */}
            <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-lg relative z-10 ${
              getSectionStatus('feedback') === 'pending' ? 'opacity-70' : ''
            }`}>
              <div 
                className={`p-5 flex justify-between items-center cursor-pointer ${
                  getSectionStatus('feedback') === 'active' 
                    ? 'bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30' 
                    : getSectionStatus('feedback') === 'completed'
                      ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30'
                      : 'bg-gray-50 dark:bg-gray-800'
                }`}
                onClick={getSectionStatus('feedback') !== 'pending' ? toggleSection('feedback') : undefined}
                role="button"
                tabIndex={getSectionStatus('feedback') !== 'pending' ? 0 : -1}
                onKeyDown={(e) => {
                  if (getSectionStatus('feedback') !== 'pending' && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    toggleSection('feedback')(e as unknown as MouseEvent<HTMLDivElement>);
                  }
                }}
              >
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 transition-all duration-300 ${
                    getSectionStatus('feedback') === 'active' 
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md' 
                      : getSectionStatus('feedback') === 'completed'
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}>
                    2
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Feedback Questions</h2>
                </div>
                <div className="flex items-center">
                  {getSectionStatus('feedback') === 'completed' && (
                    <span className="text-sm font-medium text-green-600 dark:text-green-400 mr-3">Completed</span>
                  )}
                  {getSectionStatus('feedback') !== 'pending' && (
                    expandedSections.feedback ? (
                      <ChevronUpIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    ) : (
                      <ChevronDownIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    )
                  )}
                </div>
              </div>
              
              <div className={`transition-all duration-300 ease-in-out ${
                expandedSections.feedback && getSectionStatus('feedback') !== 'pending' 
                  ? 'max-h-[1000px] opacity-100' 
                  : 'max-h-0 opacity-0 overflow-hidden'
              }`}>
                <div className="p-6 border-t border-gray-100 dark:border-gray-700">
                  <FeedbackQuestions 
                    questions={questions} 
                    onSubmit={handleFeedbackSubmit} 
                    isLoading={isLoading}
                  />
                </div>
              </div>
            </div>
            
            {/* Research Section */}
            <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-lg relative z-10 ${
              getSectionStatus('researching') === 'pending' ? 'opacity-70' : ''
            }`}>
              <div 
                className={`p-5 flex justify-between items-center cursor-pointer ${
                  getSectionStatus('researching') === 'active' 
                    ? 'bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30' 
                    : getSectionStatus('researching') === 'completed'
                      ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30'
                      : 'bg-gray-50 dark:bg-gray-800'
                }`}
                onClick={getSectionStatus('researching') !== 'pending' ? toggleSection('researching') : undefined}
                role="button"
                tabIndex={getSectionStatus('researching') !== 'pending' ? 0 : -1}
                onKeyDown={(e) => {
                  if (getSectionStatus('researching') !== 'pending' && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    toggleSection('researching')(e as unknown as MouseEvent<HTMLDivElement>);
                  }
                }}
              >
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 transition-all duration-300 ${
                    getSectionStatus('researching') === 'active' 
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md' 
                      : getSectionStatus('researching') === 'completed'
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}>
                    3
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {activeStage === 'generating-report' ? 'Research Process & Report Generation' : 'Research Process'}
                  </h2>
                </div>
                <div className="flex items-center">
                  {getSectionStatus('researching') === 'completed' && (
                    <span className="text-sm font-medium text-green-600 dark:text-green-400 mr-3">Completed</span>
                  )}
                  {getSectionStatus('researching') !== 'pending' && (
                    expandedSections.researching ? (
                      <ChevronUpIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    ) : (
                      <ChevronDownIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    )
                  )}
                </div>
              </div>
              
              <div className={`transition-all duration-300 ease-in-out ${
                expandedSections.researching && getSectionStatus('researching') !== 'pending' 
                  ? 'max-h-[2000px] opacity-100' 
                  : 'max-h-0 opacity-0 overflow-hidden'
              }`}>
                <div className="p-6 border-t border-gray-100 dark:border-gray-700">
                  {activeStage === 'generating-report' ? (
                    <div className="py-8">
                      <h2 className="text-2xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 mb-8">
                        Generating Research Report
                      </h2>
                      
                      <div className="mb-10 max-w-2xl mx-auto">
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Synthesizing research findings...</span>
                          <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">{reportProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                          <div 
                            className="h-2.5 rounded-full transition-all duration-300 ease-out bg-gradient-to-r from-indigo-500 to-purple-600"
                            style={{ width: `${reportProgress}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="flex justify-center mb-8">
                        <div className="w-16 h-16 relative">
                          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 animate-pulse opacity-30"></div>
                          <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <SparklesIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-center text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                        Please wait while we compile your comprehensive research report with key insights and findings...
                      </p>
                    </div>
                  ) : (
                    <ResearchProgress 
                      query={query} 
                      researchSteps={researchSteps}
                    />
                  )}
                </div>
              </div>
            </div>
            
            {/* Report Section */}
            <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-lg relative z-10 ${
              getSectionStatus('report') === 'pending' ? 'opacity-70' : ''
            }`}>
              <div 
                className={`p-5 flex justify-between items-center cursor-pointer ${
                  getSectionStatus('report') === 'active' 
                    ? 'bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30' 
                    : getSectionStatus('report') === 'completed'
                      ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30'
                      : 'bg-gray-50 dark:bg-gray-800'
                }`}
                onClick={getSectionStatus('report') !== 'pending' ? toggleSection('report') : undefined}
                role="button"
                tabIndex={getSectionStatus('report') !== 'pending' ? 0 : -1}
                onKeyDown={(e) => {
                  if (getSectionStatus('report') !== 'pending' && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    toggleSection('report')(e as unknown as MouseEvent<HTMLDivElement>);
                  }
                }}
              >
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 transition-all duration-300 ${
                    getSectionStatus('report') === 'active' 
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md' 
                      : getSectionStatus('report') === 'completed'
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}>
                    4
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Research Report</h2>
                </div>
                <div className="flex items-center">
                  {getSectionStatus('report') === 'completed' && (
                    <span className="text-sm font-medium text-green-600 dark:text-green-400 mr-3">Completed</span>
                  )}
                  {getSectionStatus('report') !== 'pending' && (
                    expandedSections.report ? (
                      <ChevronUpIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    ) : (
                      <ChevronDownIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    )
                  )}
                </div>
              </div>
              
              <div className={`transition-all duration-300 ease-in-out ${
                expandedSections.report && getSectionStatus('report') !== 'pending' 
                  ? 'max-h-[5000px] opacity-100' 
                  : 'max-h-0 opacity-0 overflow-hidden'
              }`}>
                <div className="p-6 border-t border-gray-100 dark:border-gray-700">
                  <ResearchReport 
                    report={report} 
                    onNewResearch={startNewResearch}
                    learnings={researchLearnings}
                    prompt={enhancedQueryText}
                    language={detectedLanguage}
                    sourceUrls={sourceUrls}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Start New Research Button (Fixed at bottom) */}
          {(completedStages.length > 0 || activeStage !== 'query') && (
            <div className="fixed bottom-6 right-6 z-20">
              <button
                onClick={startNewResearch}
                className="px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full shadow-lg transition-all duration-200 flex items-center transform hover:scale-105"
              >
                <SparklesIcon className="h-5 w-5 mr-2" />
                Start New Research
              </button>
            </div>
          )}
        </div>
      </main>
      
      {/* Footer */}
      <footer className="w-full bg-white dark:bg-gray-900 py-6 border-t border-gray-200 dark:border-gray-800 flex-none mt-auto">
        <div className="container mx-auto px-6 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Powered by <a href="http://opentyphoon.ai/" target="_blank" rel="noopener noreferrer" className="font-semibold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600 hover:underline">Typhoon Research</a>
          </p>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
