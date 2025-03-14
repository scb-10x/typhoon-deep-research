import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

import { languagePrompt, systemPrompt } from '@/lib/prompt';

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

    // Use OpenAI on the server side with await instead of streaming
    const result = await generateText({
      model: openai(process.env.AI_MODEL || 'gpt-4-turbo'),
      system: systemPrompt(),
      prompt,
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
    console.error('Feedback API error:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
} 