/**
 * Utility functions for handling AI responses
 */

import { generateText } from 'ai';
import { typhoon } from '@/lib/ai/typhoon-client';
import { systemPrompt } from '@/lib/prompt';

/**
 * Extracts the result from a response that might contain <think>...</think> tags
 * Also cleans up JSON code blocks and extra newlines
 * @param text The response text
 * @returns The cleaned response text
 */
export function extractResultFromThinking(text: string): string {
  let result = text;
  
  // Check if the response contains <think> tags
  const thinkMatch = result.match(/<think>([\s\S]*?)<\/think>([\s\S]*)/);
  
  if (thinkMatch) {
    // Return everything after the </think> tag
    result = thinkMatch[2].trim();
  }
  
  // Remove JSON code blocks (```json...```)
  result = result.replace(/```json\s*([\s\S]*?)```/g, '$1');
  
  // Remove other code blocks that might contain JSON
  result = result.replace(/```\s*([\s\S]*?)```/g, '$1');
  
  // Remove excessive newlines (more than 2 consecutive)
  result = result.replace(/\n{3,}/g, '\n\n');
  
  return result.trim();
}

/**
 * Safely parses JSON from an AI response, with retry functionality
 * @param text The text to parse as JSON
 * @param retryCount Number of retries if parsing fails (default: 1)
 * @param model The model to use for retries
 * @returns The parsed JSON object
 * @throws Error if parsing fails after all retries
 */
export async function safeJsonParse<T>(
  text: string, 
  schema: string,
  retryCount: number = 1,
  model: string = process.env.AI_MODEL || 'gpt-4-turbo'
): Promise<T> {
  // First, try to parse the JSON directly
  try {
    return JSON.parse(text) as T;
  } catch (error) {
    // If we have no retries left, throw the error
    if (retryCount <= 0) {
      throw new Error(`Failed to parse JSON after retries: ${error}`);
    }
    
    console.warn("JSON parsing failed, retrying with LLM to fix the response");
    
    // Try to fix the JSON with the LLM
    const fixPrompt = `
The following text was supposed to be valid JSON but has syntax errors.
Please fix the JSON and return ONLY the corrected JSON with no explanations or markdown formatting.

ORIGINAL INVALID JSON:
${text}

EXPECTED SCHEMA:
${schema}

Return ONLY the fixed JSON with no additional text, comments, or markdown formatting.
`;
    
    try {
      // Call the LLM to fix the JSON
      const result = await generateText({
        model: typhoon(model),
        system: systemPrompt(),
        prompt: fixPrompt,
        maxTokens: 4096,
      });
      
      // Clean the result
      const cleanedResult = extractResultFromThinking(result.text);
      
      // Try to parse the fixed JSON
      return JSON.parse(cleanedResult) as T;
    } catch (secondError) {
      // If that fails too, try again with one fewer retry
      console.warn(`LLM JSON fix attempt failed: ${secondError}`);
      return safeJsonParse<T>(text, schema, retryCount - 1, model);
    }
  }
} 