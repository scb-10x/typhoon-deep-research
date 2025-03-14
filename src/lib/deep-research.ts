import { z } from "zod";
import type { DeepPartial } from "../utils/json";
import { detectLanguage } from "@/utils/language-detection";

// Schema definitions
export const searchQueriesTypeSchema = z.object({
  queries: z.array(
    z.object({
      query: z.string(),
      researchGoal: z.string(),
    })
  ),
});

export const searchResultTypeSchema = z.object({
  learnings: z.array(
    z.object({
      learning: z.string(),
      url: z.string(),
      title: z.string().optional(),
    })
  ),
  followUpQueries: z.array(
    z.object({
      query: z.string(),
      reasoning: z.string(),
    })
  ),
});

// Type definitions
export type ResearchResult = {
  learnings: ProcessedSearchResult["learnings"];
  language?: string; // Add language to research result
};

export interface WriteFinalReportParams {
  prompt: string;
  learnings: ProcessedSearchResult["learnings"];
  language: string;
}

// Used for streaming response
export type SearchQuery = z.infer<typeof searchQueriesTypeSchema>["queries"][0];
export type PartialSearchQuery = DeepPartial<SearchQuery>;
export type ProcessedSearchResult = z.infer<typeof searchResultTypeSchema>;
export type PartialProcessedSearchResult = DeepPartial<ProcessedSearchResult>;

// Web search result interface
export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
}

export type ResearchStep =
  | {
      type: "generating_query";
      result: PartialSearchQuery;
      nodeId: string;
      parentNodeId?: string;
    }
  | { type: "generating_query_reasoning"; delta: string; nodeId: string }
  | {
      type: "generated_query";
      query: string;
      result: PartialSearchQuery;
      nodeId: string;
    }
  | { type: "searching"; query: string; nodeId: string }
  | { type: "search_complete"; results: WebSearchResult[]; nodeId: string }
  | {
      type: "processing_search_result";
      query: string;
      result: PartialProcessedSearchResult;
      nodeId: string;
    }
  | {
      type: "processing_search_result_reasoning";
      delta: string;
      nodeId: string;
    }
  | {
      type: "node_complete";
      result?: ProcessedSearchResult;
      nodeId: string;
    }
  | { type: "error"; message: string; nodeId: string }
  | { type: "complete"; learnings: ProcessedSearchResult["learnings"]; language?: string };

// take an user query, return a list of SERP queries
export async function generateSearchQueries({
  query,
  numQueries = 2,
  learnings,
  language,
  searchLanguage,
}: {
  query: string;
  language?: string;
  numQueries?: number;
  // optional, if provided, the research will continue from the last learning
  learnings?: Array<{learning: string; url: string; title?: string}>;
  /** Force the LLM to generate serp queries in a certain language */
  searchLanguage?: string;
}) {
  try {
    // Auto-detect language if not provided
    const detectedLanguage = language || detectLanguage(query);
    
    // Call the server-side API route with a simple await request
    const response = await fetch("/api/generate-queries", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        numQueries,
        learnings,
        language: detectedLanguage,
        searchLanguage: searchLanguage || detectedLanguage,
      }),
    });
 
    if (!response.ok) {
      throw new Error("Failed to generate search queries");
    }

    // Parse the JSON response
    const data = await response.json();

    // Return the result in the expected format
    return {
      partialResult: {
        getReader: () => ({
          read: async () => ({ done: true, value: undefined }),
        }),
      },
      finalResult: Promise.resolve(data),
      language: detectedLanguage,
    };
  } catch (error) {
    console.error("Error generating search queries:", error);
    throw error;
  }
}

// Process search results into learnings and follow-up queries
export async function processSearchResult({
  query,
  results,
  numLearnings = 5,
  numFollowUpQuestions = 1,
  language,
}: {
  query: string;
  results: WebSearchResult[];
  language?: string;
  numLearnings?: number;
  numFollowUpQuestions?: number;
}) {
  try {
    // Auto-detect language if not provided
    const detectedLanguage = language || detectLanguage(query);
    
    // Call the server-side API route with a simple await request
    const response = await fetch("/api/process-results", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        results,
        numLearnings,
        numFollowUpQuestions,
        language: detectedLanguage,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to process search results");
    }

    // Parse the JSON response
    const data = await response.json();

    // Return the result in the expected format
    return {
      partialResult: {
        getReader: () => ({
          read: async () => ({ done: true, value: undefined }),
        }),
      },
      finalResult: Promise.resolve(data),
      language: detectedLanguage,
    };
  } catch (error) {
    console.error("Error processing search results:", error);
    throw error;
  }
}

// Write the final research report
export async function writeFinalReport({
  prompt,
  learnings,
  language,
}: WriteFinalReportParams) {
  try {
    // Auto-detect language if not provided
    const detectedLanguage = language || detectLanguage(prompt);
    
    // Call the server-side API route with a simple await request
    const response = await fetch("/api/generate-report", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        learnings,
        language: detectedLanguage,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate research report");
    }

    // Parse the JSON response
    const data = await response.json();

    // Return the result in the expected format with the report text
    return {
      textStream: new ReadableStream({
        start(controller) {
          controller.enqueue(data.report);
          controller.close();
        },
      }),
      fullStream: new ReadableStream({
        start(controller) {
          controller.close();
        },
      }),
      text: Promise.resolve(data.report),
      language: detectedLanguage,
    };
  } catch (error) {
    console.error("Error generating research report:", error);
    throw error;
  }
}

// Helper function to generate child node IDs
function childNodeId(parentNodeId: string, currentIndex: number) {
  return `${parentNodeId}-${currentIndex}`;
}

// Helper function to perform web search
async function performWebSearch(query: string): Promise<WebSearchResult[]> {
  try {
    const response = await fetch("/api/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Search request failed");
    }

    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error("Web search error:", error);
    throw error;
  }
}

// Helper function to check if two learnings are the same
function areSameLearnings(a: { learning: string; url: string; title?: string }, b: { learning: string; url: string; title?: string }): boolean {
  return a.url === b.url && a.learning === b.learning;
}

// Helper function to convert string learnings to object learnings
function convertLearningsToObjects(learnings: string[]): Array<{learning: string; url: string; title?: string}> {
  return learnings.map(learning => ({
    learning,
    url: '', // Default empty URL
  }));
}

// Main deep research function
export async function deepResearch({
  query,
  breadth = 2,
  maxDepth = 2,
  languageCode,
  searchLanguageCode,
  learnings = [],
  onProgress,
  currentDepth = 0,
  nodeId = "0",
}: {
  query: string;
  breadth?: number;
  maxDepth?: number;
  /** The language of generated response */
  languageCode?: string;
  /** The language of SERP query */
  searchLanguageCode?: string;
  /** Accumulated learnings from all nodes visited so far */
  learnings?: Array<{learning: string; url: string; title?: string}> | string[];
  currentDepth?: number;
  /** Current node ID. Used for recursive calls */
  nodeId?: string;
  onProgress: (step: ResearchStep) => void;
}): Promise<ResearchResult> {
  // Convert string learnings to object learnings if needed
  const objectLearnings = Array.isArray(learnings) && learnings.length > 0 && typeof learnings[0] === 'string'
    ? convertLearningsToObjects(learnings as string[])
    : learnings as Array<{learning: string; url: string; title?: string}>;

  // If we've reached the maximum depth, return the current learnings
  if (currentDepth >= maxDepth) {
    onProgress({
      type: "complete",
      learnings: objectLearnings,
      language: languageCode,
    });
    return { learnings: objectLearnings, language: languageCode };
  }

  try {
    // Auto-detect language if not provided
    const detectedLanguage = languageCode || detectLanguage(query);
    
    // Generate search queries
    onProgress({
      type: "generating_query",
      result: {
        query: query,
        researchGoal: "Researching the query",
      },
      nodeId,
    });

    const queriesResponse = await generateSearchQueries({
      query,
      numQueries: breadth,
      learnings: objectLearnings,
      language: detectedLanguage,
      searchLanguage: searchLanguageCode || detectedLanguage,
    });

    const queries = await queriesResponse.finalResult;

    // Process each query in parallel
    const allLearnings = [...objectLearnings];
    
    // Create an array to store all the promises for parallel execution
    const queryPromises = queries.queries.map(async (searchQuery: SearchQuery, i: number) => {
      const childId = childNodeId(nodeId, i);

      onProgress({
        type: "generated_query",
        query: searchQuery.query,
        result: searchQuery,
        nodeId: childId,
      });

      // Perform web search using the API
      onProgress({
        type: "searching",
        query: searchQuery.query,
        nodeId: childId,
      });

      // Use the real search API instead of mock data
      const searchResults = await performWebSearch(searchQuery.query);

      onProgress({
        type: "search_complete",
        results: searchResults,
        nodeId: childId,
      });

      // Process search results
      onProgress({
        type: "processing_search_result",
        query: searchQuery.query,
        result: { learnings: [], followUpQueries: [] },
        nodeId: childId,
      });

      const processResponse = await processSearchResult({
        query: searchQuery.query,
        results: searchResults,
        language: detectedLanguage,
      });

      const processedResult = await processResponse.finalResult;

      onProgress({
        type: "node_complete",
        result: processedResult,
        nodeId: childId,
      });

      // Return the processed result and node info for follow-up processing
      return {
        learnings: processedResult.learnings,
        followUpQueries: processedResult.followUpQueries,
        childId
      };
    });

    // Wait for all parallel query processing to complete
    const results = await Promise.all(queryPromises);
    
    // Collect all learnings
    results.forEach(result => {
      allLearnings.push(...result.learnings);
    });

    // Process follow-up queries in parallel if we haven't reached max depth
    if (currentDepth + 1 < maxDepth) {
      const followUpPromises: Promise<ResearchResult>[] = [];
      
      // Collect all follow-up queries from all results
      results.forEach((result) => {
        result.followUpQueries.forEach((followUpQuery: { query: string, reasoning: string }, j: number) => {
          const followUpNodeId = `${result.childId}-${j}`;
          
          // Add promise for recursive processing
          followUpPromises.push(
            deepResearch({
              query: followUpQuery.query,
              breadth: Math.floor(breadth / 2),
              maxDepth,
              languageCode: detectedLanguage,
              searchLanguageCode: searchLanguageCode || detectedLanguage,
              learnings: allLearnings,
              onProgress,
              currentDepth: currentDepth + 1,
              nodeId: followUpNodeId,
            })
          );
        });
      });
      
      // Process follow-up queries in parallel with a concurrency limit
      const concurrencyLimit = 3; // Limit concurrent requests to avoid overwhelming the server
      const followUpResults: ResearchResult[] = [];
      
      // Process follow-up queries in batches to control concurrency
      for (let i = 0; i < followUpPromises.length; i += concurrencyLimit) {
        const batch = followUpPromises.slice(i, i + concurrencyLimit);
        const batchResults = await Promise.all(batch);
        followUpResults.push(...batchResults);
      }
      
      // Collect learnings from follow-up queries
      followUpResults.forEach(result => {
        // Avoid duplicates by checking if learning already exists
        result.learnings.forEach(learning => {
          if (!allLearnings.some(existingLearning => areSameLearnings(existingLearning, learning))) {
            allLearnings.push(learning);
          }
        });
      });
    }

    // Return all accumulated learnings
    onProgress({
      type: "complete",
      learnings: allLearnings,
      language: detectedLanguage,
    });

    return { learnings: allLearnings, language: detectedLanguage };
  } catch (error) {
    onProgress({
      type: "error",
      message: error instanceof Error ? error.message : String(error),
      nodeId,
    });
    throw error;
  }
}
