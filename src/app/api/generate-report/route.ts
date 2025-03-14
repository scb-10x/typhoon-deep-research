import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { z } from 'zod';

import { languagePrompt, systemPrompt } from '@/lib/prompt';
import { trimPrompt } from '@/lib/ai/providers';
import { typhoon } from '@/lib/ai/typhoon-client';

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
      `The report should be well-structured with sections, include all relevant information from the learnings, and provide a conclusion that directly addresses the original query.`,
      `IMPORTANT: Format your response as a clean markdown document. Start directly with a # heading for the title that includes "Typhoon Deep Research". Do NOT include any preamble text like "Here is the report" or "Below is a comprehensive research report". Just start with the markdown content.`,
      languagePrompt(language),
    ].join('\n\n');

    // Use Typhoon API instead of OpenAI
    const result = await generateText({
      model: typhoon(process.env.AI_MODEL || 'gpt-4-turbo'),
      system: systemPrompt(),
      prompt: trimPrompt(reportPrompt),
      maxTokens: 4096,
    });

    // Clean up any potential preamble text
    let cleanReport = result.text;
    
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