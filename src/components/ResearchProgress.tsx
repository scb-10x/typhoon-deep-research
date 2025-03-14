'use client';

import { useEffect, useState } from 'react';
import { type ResearchStep } from '@/lib/deep-research';

interface ResearchProgressProps {
  query: string;
  researchSteps: ResearchStep[];
}

interface ResearchNode {
  id: string;
  query: string;
  status: 'pending' | 'searching' | 'processing' | 'complete' | 'error';
  children: ResearchNode[];
  learnings?: string[];
  depth: number;
}

export default function ResearchProgress({ query, researchSteps }: ResearchProgressProps) {
  const [progress, setProgress] = useState(0);
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
    
    // Calculate global progress based on all steps
    const calculateGlobalProgress = () => {
      // Count completed nodes and total expected nodes
      const nodeIds = new Set<string>();
      let completedNodes = 0;
      let totalNodes = 0;
      
      // Track unique node IDs and their states
      for (const step of researchSteps) {
        if ('nodeId' in step && step.nodeId) {
          nodeIds.add(step.nodeId);
        }
        
        // Count completed nodes
        if (step.type === 'node_complete') {
          completedNodes++;
        }
        
        // Count generated queries to estimate total nodes
        if (step.type === 'generated_query') {
          totalNodes++;
        }
      }
      
      // Check if research is complete
      if (latestStep.type === 'complete') {
        return 100;
      }
      
      // If no nodes yet, base progress on step types
      if (totalNodes === 0) {
        switch (latestStep.type) {
          case 'generating_query':
            return 10;
          case 'searching':
            return 20;
          case 'search_complete':
            return 30;
          case 'processing_search_result':
            return 40;
          default:
            return 5;
        }
      }
      
      // Calculate progress based on completed nodes vs total nodes
      // Add 10% for starting and reserve 10% for final completion
      const baseProgress = 10;
      const maxProgress = 90;
      const nodeProgress = totalNodes > 0 ? (completedNodes / totalNodes) * (maxProgress - baseProgress) : 0;
      
      return Math.min(Math.round(baseProgress + nodeProgress), maxProgress);
    };
    
    const globalProgress = calculateGlobalProgress();
    setProgress(globalProgress);
    
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
                node.learnings = step.result.learnings.filter(Boolean) as string[];
              }
              break;
            case 'node_complete':
              node.status = 'complete';
              // Add learnings if available
              if (step.result?.learnings && step.result.learnings.length > 0) {
                node.learnings = step.result.learnings;
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
              <div className={`mt-2 pl-4 border-l-2 ${borderColor}`}>
                {node.learnings.map((learning, i) => (
                  <div key={i} className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                    • {learning}
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
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <div 
            className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500 ease-out" 
            style={{ width: `${progress}%` }}
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