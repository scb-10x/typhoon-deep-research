'use client';

import { useEffect, useState, useRef } from 'react';
import { type ResearchStep } from '@/lib/deep-research';

interface ResearchProgressProps {
  query: string;
  researchSteps: ResearchStep[];
  researchStartTime?: number | null;
}

interface ResearchNode {
  id: string;
  query: string;
  status: 'pending' | 'searching' | 'processing' | 'complete' | 'error';
  children: ResearchNode[];
  learnings?: Array<{learning: string; url: string; title?: string}>;
  depth: number;
}

// Timer component to show elapsed time
function ResearchTimer({ startTime }: { startTime: number }) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Update elapsed time every second
    timerRef.current = setInterval(() => {
      setElapsedTime(Date.now() - startTime);
    }, 1000);

    // Clean up interval on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [startTime]);

  // Format elapsed time
  const formatElapsedTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    const formattedHours = hours.toString().padStart(2, '0');
    const formattedMinutes = (minutes % 60).toString().padStart(2, '0');
    const formattedSeconds = (seconds % 60).toString().padStart(2, '0');
    
    if (hours > 0) {
      return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
    } else {
      return `${formattedMinutes}:${formattedSeconds}`;
    }
  };

  return (
    <div className="text-sm font-medium text-indigo-600 dark:text-indigo-400 ml-2">
      Time elapsed: {formatElapsedTime(elapsedTime)}
    </div>
  );
}

export default function ResearchProgress({ query, researchSteps, researchStartTime }: ResearchProgressProps) {
  const [currentStep, setCurrentStep] = useState('Generating search queries...');
  const [researchTree, setResearchTree] = useState<ResearchNode>({
    id: '0',
    query,
    status: 'pending',
    children: [],
    depth: 0
  });
  
  // Process research steps to update the UI
  useEffect(() => {
    if (researchSteps.length === 0) return;
    
    // Get the latest step
    const latestStep = researchSteps[researchSteps.length - 1];
    
    // Update current step message based on latest step
    switch (latestStep.type) {
      case 'generating_query':
        setCurrentStep('Generating search queries...');
        break;
      case 'searching':
        setCurrentStep('Searching for information...');
        break;
      case 'search_complete':
        setCurrentStep('Processing search results...');
        break;
      case 'processing_search_result':
        setCurrentStep('Analyzing search results...');
        break;
      case 'node_complete':
        setCurrentStep('Synthesizing findings...');
        break;
      case 'complete':
        setCurrentStep('Research complete!');
        break;
      case 'error':
        setCurrentStep(`Error: ${latestStep.message || 'An unknown error occurred'}`);
        break;
      default:
        setCurrentStep('Researching...');
    }
    
    // Build the research tree from the steps
    const rootNode: ResearchNode = {
      id: '0',
      query,
      status: 'pending',
      children: [],
      depth: 0
    };
    
    const nodeMap = new Map<string, ResearchNode>();
    nodeMap.set('0', rootNode);
    
    // First pass: Create all nodes and establish parent-child relationships
    for (const step of researchSteps) {
      if (step.type === 'generated_query' && 'nodeId' in step) {
        // Calculate node depth based on ID segments
        const nodeSegments = step.nodeId.split('-');
        const depth = nodeSegments.length - 1;
        
        // Create a new node if it doesn't exist
        if (!nodeMap.has(step.nodeId)) {
          const newNode: ResearchNode = {
            id: step.nodeId,
            query: step.query,
            status: 'pending',
            children: [],
            depth
          };
          
          // Find or create parent nodes as needed
          const parentId = nodeSegments.slice(0, -1).join('-') || '0';
          
          // Ensure parent exists
          if (!nodeMap.has(parentId) && parentId !== '0') {
            // Create placeholder parent if it doesn't exist yet
            const parentDepth = depth - 1;
            const parentNode: ResearchNode = {
              id: parentId,
              query: `Follow-up research ${parentId}`,
              status: 'pending',
              children: [],
              depth: parentDepth
            };
            nodeMap.set(parentId, parentNode);
            
            // Connect to grandparent if needed
            const grandparentId = nodeSegments.slice(0, -2).join('-') || '0';
            const grandparent = nodeMap.get(grandparentId);
            if (grandparent) {
              grandparent.children.push(parentNode);
            }
          }
          
          // Connect to parent
          const parent = nodeMap.get(parentId);
          if (parent) {
            // Check if this node already exists as a child
            const existingChildIndex = parent.children.findIndex(child => child.id === step.nodeId);
            if (existingChildIndex === -1) {
              parent.children.push(newNode);
            }
          }
          
          // Add to node map
          nodeMap.set(step.nodeId, newNode);
        }
      }
    }
    
    // Second pass: Update node statuses and content
    for (const step of researchSteps) {
      if ('nodeId' in step && step.nodeId) {
        const node = nodeMap.get(step.nodeId);
        
        if (node) {
          // Update node status based on step type
          switch (step.type) {
            case 'generating_query':
              node.status = 'processing';
              break;
            case 'searching':
              node.status = 'searching';
              break;
            case 'processing_search_result':
              node.status = 'processing';
              // Add learnings if available
              if (step.result?.learnings && step.result.learnings.length > 0) {
                node.learnings = step.result.learnings as Array<{learning: string; url: string; title?: string}>;
              }
              break;
            case 'node_complete':
              node.status = 'complete';
              // Add learnings if available
              if (step.result?.learnings && step.result.learnings.length > 0) {
                node.learnings = step.result.learnings as Array<{learning: string; url: string; title?: string}>;
              }
              break;
            case 'error':
              node.status = 'error';
              break;
          }
        }
      } else if (step.type === 'complete') {
        // Research is complete
        const rootNode = nodeMap.get('0');
        if (rootNode) {
          rootNode.status = 'complete';
        }
      }
    }
    
    // Update the research tree
    setResearchTree(rootNode);
  }, [query, researchSteps]);
  
  const getStatusIcon = (status: ResearchNode['status']) => {
    switch (status) {
      case 'pending':
        return <div className="w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-600" aria-hidden="true"></div>;
      case 'searching':
        return (
          <div className="w-4 h-4 flex items-center justify-center" aria-label="Searching">
            <div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        );
      case 'processing':
        return (
          <div className="w-4 h-4 flex items-center justify-center" aria-label="Processing">
            <div className="w-3 h-3 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        );
      case 'complete':
        return (
          <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center" aria-label="Complete">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center" aria-label="Error">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
        );
    }
  };
  
  const getDepthColor = (depth: number) => {
    const colors = [
      'border-indigo-200 dark:border-indigo-800',
      'border-purple-200 dark:border-purple-800',
      'border-blue-200 dark:border-blue-800',
      'border-teal-200 dark:border-teal-800',
      'border-green-200 dark:border-green-800'
    ];
    return colors[depth % colors.length];
  };
  
  const renderNode = (node: ResearchNode, level = 0) => {
    const borderColor = getDepthColor(node.depth);
    
    return (
      <div key={node.id} className={`ml-4 ${node.depth > 0 ? 'mt-4' : ''}`}>
        <div className="flex items-start mb-2">
          <div className="mr-2 mt-1">{getStatusIcon(node.status)}</div>
          <div className="flex-1">
            <div className={`font-medium text-gray-800 dark:text-gray-200 ${node.depth > 0 ? 'text-sm' : ''}`}>
              {node.depth > 0 && (
                <span className="inline-block px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-xs rounded mr-2">
                  Depth {node.depth}
                </span>
              )}
              {node.query}
            </div>
            {node.learnings && node.learnings.length > 0 && (
              <div className={`mt-3 space-y-2 pl-4 border-l-2 ${borderColor}`}>
                {node.learnings.map((learning, i) => (
                  <div key={i} className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 rounded-md">
                    {typeof learning === 'string' ? learning : (
                      <>
                        {learning.learning}
                        {learning.url && (
                          <div className="mt-1">
                            <a 
                              href={learning.url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-blue-500 hover:underline text-xs flex items-center"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                              {learning.title || learning.url}
                            </a>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {node.children.length > 0 && (
          <div className="ml-6 mt-2 border-l border-gray-200 dark:border-gray-700 pl-4">
            {node.children.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Researching: {query}
      </h2>
      
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{currentStep}</span>
          {researchStartTime && <ResearchTimer startTime={researchStartTime} />}
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={100}>
          <div 
            className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2.5 rounded-full animate-progress-infinite"
            style={{ width: '40%' }}
          ></div>
        </div>
      </div>
      
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          Research Tree
          <span className="ml-2 text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-2 py-1 rounded-full">
            Showing all depths
          </span>
        </h3>
        <div className="overflow-auto max-h-[500px]">
          {renderNode(researchTree)}
        </div>
      </div>
      
      <p className="text-sm text-gray-500 dark:text-gray-400 italic text-center">
        Please wait while our AI conducts comprehensive research on your topic...
      </p>
    </div>
  );
} 