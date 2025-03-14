import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

import { languagePrompt, systemPrompt } from '@/lib/prompt';
import { trimPrompt } from '@/lib/ai/providers';

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
        .array(z.string())
        .describe(
          `Key learnings from the search results. Each learning should be a complete, detailed sentence.`,
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
      `Given the following search query and results, extract ${numLearnings} key learnings and suggest ${numFollowUpQuestions} follow-up search queries.`,
      `<query>${query}</query>`,
      `<results>${resultsText}</results>`,
      `You MUST respond in JSON matching this JSON schema: ${jsonSchema}`,
      languagePrompt(language),
    ].join('\n\n');

    // Use OpenAI on the server side with await instead of streaming
    const result = await generateText({
      model: openai(process.env.AI_MODEL || 'gpt-4-turbo'),
      system: systemPrompt(),
      prompt: trimPrompt(prompt),
    });

    // Parse the JSON response
    try {
      const jsonResponse = JSON.parse(result.text);
      return NextResponse.json(jsonResponse);
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      return NextResponse.json(
        { error: 'Failed to parse AI response', details: result.text },
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