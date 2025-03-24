import { NextResponse } from 'next/server';
import { tavily } from '@tavily/core';
import type { WebSearchResult } from '@/lib/deep-research';

// Initialize Tavily client
const client = tavily({ apiKey: process.env.TAVILY_API_KEY });

interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
}

// This is a simple mock implementation of a web search API
// In a production app, you would integrate with a real search API like Google, Bing, or DuckDuckGo
export async function POST(request: Request) {
  try {
    const { query } = await request.json();
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }
    
    // Perform search using Tavily
    const searchResults = await client.search(query, {
      search_depth: "basic",
      include_answer: true,
      include_domains: [],
      max_results: 5,
    });
    
    // Transform Tavily results to match our WebSearchResult interface
    const results: WebSearchResult[] = (searchResults.results as TavilySearchResult[]).map(result => ({
      title: result.title,
      url: result.url,
      snippet: result.content,
    }));
    
    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
} 