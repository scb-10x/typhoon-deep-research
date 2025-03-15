import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

import { languagePrompt, systemPrompt } from '@/lib/prompt';
import { trimPrompt } from '@/lib/ai/providers';
import { typhoon } from '@/lib/ai/typhoon-client';
import { extractResultFromThinking, safeJsonParse } from '@/utils/ai-response';

// Define the request schema
const requestSchema = z.object({
  query: z.string(),
  results: z.array(
    z.object({
      title: z.string(),
      url: z.string(),
      snippet: z.string(),
    })
  ),
  numLearnings: z.number().default(5),
  numFollowUpQuestions: z.number().default(1),
  language: z.string().default('English'),
});

export async function POST(request: Request) {
  try {
    // Parse and validate the request body
    const body = await request.json();
    const { query, results, numLearnings, numFollowUpQuestions, language } = requestSchema.parse(body);

    // Define the response schema
    const responseSchema = z.object({
      learnings: z
        .array(
          z.object({
            learning: z.string().describe('A complete, detailed sentence describing a key insight from the search results.'),
            url: z.string().describe('The source URL from which this learning was extracted.'),
            title: z.string().optional().describe('The title of the source page (optional).'),
          })
        )
        .describe(
          `Key learnings from the search results, each with its source URL.`,
        ),
      followUpQueries: z
        .array(
          z.object({
            query: z.string().describe('The follow-up search query.'),
            reasoning: z
              .string()
              .describe(
                'Why this follow-up query would be useful for the research.',
              ),
          }),
        )
        .describe('Follow-up queries that would help continue the research.'),
    });
    
    const jsonSchema = JSON.stringify(zodToJsonSchema(responseSchema));

    const resultsText = results
      .map(
        (result, i) =>
          `[${i + 1}] ${result.title}\nURL: ${result.url}\n${result.snippet}`,
      )
      .join('\n\n');

    const prompt = [
      `Given the following search query and results, extract ${numLearnings} key learnings and suggest ${numFollowUpQuestions} follow-up search queries. The learnings should be detailed in the level that experts would interested in.`,
      `<query>${query}</query>`,
      `<results>${resultsText}</results>`,
      `For each learning, include the URL of the source from which it was extracted. Each learning should be a complete, detailed sentence with specific information.`,
      `You MUST respond in JSON matching this JSON schema: ${jsonSchema}`,
      languagePrompt(language),
    ].join('\n\n');

    // Use Typhoon API instead of OpenAI
    const result = await generateText({
      model: typhoon(process.env.AI_MODEL || 'gpt-4-turbo'),
      system: systemPrompt(),
      prompt: trimPrompt(prompt),
      maxTokens: 4096,
    });

    // Extract the result from thinking if present
    const cleanResult = extractResultFromThinking(result.text);

    // Parse the JSON response with retry capability
    try {
      const jsonResponse = await safeJsonParse(cleanResult, jsonSchema, 2);
      return NextResponse.json(jsonResponse);
    } catch (parseError) {
      console.error('Failed to parse JSON response after retries:', parseError);
      return NextResponse.json(
        { error: 'Failed to parse AI response', details: cleanResult },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Process Results API error:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
} 