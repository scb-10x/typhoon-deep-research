import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

import { languagePrompt, systemPrompt } from '@/lib/prompt';
import { trimPrompt } from '@/lib/ai/providers';
import { typhoon } from '@/lib/ai/typhoon-client';

// Define the request schema
const requestSchema = z.object({
  query: z.string(),
  numQueries: z.number().default(3),
  learnings: z.array(z.string()).optional(),
  language: z.string().default('English'),
  searchLanguage: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    // Parse and validate the request body
    const body = await request.json();
    const { query, numQueries, learnings, language, searchLanguage } = requestSchema.parse(body);

    // Define the response schema
    const responseSchema = z.object({
      queries: z
        .array(
          z
            .object({
              query: z.string().describe('The SERP query.'),
              researchGoal: z
                .string()
                .describe(
                  'The research goal this query is trying to achieve. This should be specific and detailed.',
                ),
            })
            .describe('A search query and its research goal.'),
        )
        .describe('A list of search queries.'),
    });
    
    const jsonSchema = JSON.stringify(zodToJsonSchema(responseSchema));
    
    let prompt = '';

    if (learnings && learnings.length > 0) {
      prompt += `You have already learned the following from previous searches:\n\n${learnings
        .map((learning, i) => `${i + 1}. ${learning}`)
        .join('\n')}\n\n`;
    }

    prompt += `Given the following research query from the user, generate ${numQueries} search queries that would help answer the query comprehensively. Each query should focus on a different aspect of the research question.`;

    if (searchLanguage) {
      prompt += `\n\nIMPORTANT: Generate the search queries in ${searchLanguage}.`;
    }

    prompt += `\n\n<query>${query}</query>\n\nYou MUST respond in JSON matching this JSON schema: ${jsonSchema}`;

    if (language) {
      prompt += `\n\n${languagePrompt(language)}`;
    }

    // Use Typhoon API instead of OpenAI
    const result = await generateText({
      model: typhoon(process.env.AI_MODEL || 'gpt-4-turbo'),
      system: systemPrompt(),
      prompt: trimPrompt(prompt),
      maxTokens: 4096,
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
    console.error('Generate Queries API error:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
} 