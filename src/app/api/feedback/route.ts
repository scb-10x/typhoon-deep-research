import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

import { languagePrompt, systemPrompt } from '@/lib/prompt';
import { typhoon } from '@/lib/ai/typhoon-client';
import { extractResultFromThinking, safeJsonParse } from '@/utils/ai-response';

// Define the request schema
const requestSchema = z.object({
  query: z.string(),
  language: z.string().default('English'),
  numQuestions: z.number().default(3),
});

export async function POST(request: Request) {
  try {
    // Parse and validate the request body
    const body = await request.json();
    const { query, language, numQuestions } = requestSchema.parse(body);

    // Define the response schema
    const responseSchema = z.object({
      questions: z
        .array(z.string())
        .describe(`Follow up questions to clarify the research direction`),
    });
    
    const jsonSchema = JSON.stringify(zodToJsonSchema(responseSchema));
    
    const prompt = [
      `Given the following query from the user, ask several follow up questions to clarify the research direction. Return a maximum of ${numQuestions} questions. Feel free to return less if the original query is clear, but always provide at least 1 question.`,
      `<query>${query}</query>`,
      `You MUST respond in JSON matching this JSON schema: ${jsonSchema}`,
      languagePrompt(language),
    ].join('\n\n');

    // Use Typhoon API instead of OpenAI
    const result = await generateText({
      model: typhoon((process.env.AI_REASONING_MODEL || process.env.AI_MODEL || 'typhoon-v2.1-12b-instruct')),
      system: systemPrompt(),
      prompt,
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
    console.error('Feedback API error:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
} 