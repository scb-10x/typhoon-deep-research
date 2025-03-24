import { z } from 'zod';

export const feedbackTypeSchema = z.object({
  questions: z.array(z.string()),
});

export async function generateFeedback({
  query,
  language,
  numQuestions = 3,
}: {
  query: string;
  language: string;
  numQuestions?: number;
}) {
  try {
    // Call the server-side API route with a simple await request
    const response = await fetch('/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        language,
        numQuestions,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate feedback questions');
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
    };
  } catch (error) {
    console.error('Error generating feedback:', error);
    throw error;
  }
} 