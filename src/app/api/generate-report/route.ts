import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { z } from 'zod';

import { languagePrompt, systemPrompt } from '@/lib/prompt';
import { trimPrompt } from '@/lib/ai/providers';
import { typhoon } from '@/lib/ai/typhoon-client';
import { extractResultFromThinking } from '@/utils/ai-response';

// Define the request schema
const requestSchema = z.object({
  prompt: z.string(),
  learnings: z.array(z.string()),
  language: z.string().default('English'),
});

export async function POST(request: Request) {
  try {
    // Parse and validate the request body
    const body = await request.json();
    const { prompt, learnings, language } = requestSchema.parse(body);

    const formattedLearnings = learnings
      .map((learning, i) => `${i + 1}. ${learning}`)
      .join('\n');

    const reportPrompt = [
      `Based on the following research query and learnings, write a comprehensive research report. The report should synthesize the learnings into a coherent narrative, highlighting key insights, patterns, and conclusions.`,
      `<query>${prompt}</query>`,
      `<learnings>\n${formattedLearnings}\n</learnings>`,
      
      `IMPORTANT CONSTRAINTS AND GUIDELINES:`,
      
      `1. USER ALIGNMENT (HIGHEST PRIORITY): Ensure the report directly addresses the user's original query. Focus on providing practical, actionable insights that are relevant to the user's needs. Organize information in a way that prioritizes what would be most valuable to someone asking this specific question. Begin with a brief prelude that helps orient the user to the topic and sets expectations for what they'll learn.`,
      
      `2. FACTUAL ACCURACY: Never make up facts or information. Only use information that is explicitly provided in the learnings. If you're uncertain about something, acknowledge the limitation rather than inventing details.`,
      
      `3. CITATIONS: Use numbered citations like "[1]" to reference specific learnings. Each citation number should correspond to the index of the source in the learnings list. DO NOT include URLs in the report text - only use the citation numbers. Include citations whenever you present specific facts, statistics, or direct information from the learnings.`,
      
      `4. BALANCED PERSPECTIVE: Present multiple viewpoints when the learnings contain different perspectives on a topic. Avoid bias and present information objectively.`,
      
      `5. STRUCTURE: The report should be well-structured with clear sections including:
         - A brief prelude/introduction that orients the user to the topic
         - An executive summary that outlines the key findings
         - Main body sections organized by themes or topics
         - A conclusion that directly addresses the original query
         - If appropriate, a "Limitations" section acknowledging any gaps in the research`,
      
      `FORMAT REQUIREMENTS:
         - Return ONLY plain markdown text. DO NOT include any JSON, XML, or other structured data formats in your response.
         - Start with a # heading for the title.
         - The prelude should come immediately after the title, before diving into the executive summary and main content.
         - At the end of the report, include a "Sources" section that lists all the sources used, with their corresponding numbers.
         - Example of a source citation in the text: "According to recent studies [1], the impact of climate change..."
         - Example of the Sources section at the end:
           # Sources
           [1] Study on climate change impacts on coastal regions
           [2] Analysis of rising sea levels in the Pacific
         `,
      
      languagePrompt(language),
    ].join('\n\n');

    // Use Typhoon API instead of OpenAI
    const result = await generateText({
      model: typhoon(process.env.AI_REASONING_MODEL || process.env.AI_MODEL || 'gpt-4-turbo'),
      system: systemPrompt(),
      prompt: trimPrompt(reportPrompt),
      maxTokens: 4096,
    });

    // Extract the result from thinking if present
    let cleanReport = extractResultFromThinking(result.text);
    
    // Remove common preamble patterns
    const preamblePatterns = [
      /^Here is .*?(?=# )/i,
      /^Below is .*?(?=# )/i,
      /^I've prepared .*?(?=# )/i,
      /^This is .*?(?=# )/i,
      /^The following .*?(?=# )/i,
    ];
    
    for (const pattern of preamblePatterns) {
      cleanReport = cleanReport.replace(pattern, '');
    }
    
    // Ensure the report starts with a markdown heading
    if (!cleanReport.trim().startsWith('#')) {
      cleanReport = `# Typhoon Deep Research\n\n${cleanReport}`;
    }
    
    // For the report, we don't need to parse JSON, just return the text
    return NextResponse.json({ report: cleanReport.trim() });
  } catch (error) {
    console.error('Generate Report API error:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
} 