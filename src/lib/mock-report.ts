/**
 * Mock report generator for testing purposes
 */

import { languageCodeToName } from '@/utils/language-detection';

/**
 * Generate a mock report based on the provided learnings and language
 * @param prompt The original research prompt
 * @param learnings The research learnings
 * @param language The language code
 * @returns A mock report in markdown format
 */
export function generateMockReport(prompt: string, learnings: string[], language: string): string {
  // Get the language name for display
  const languageName = languageCodeToName[language] || language;
  
  // Create a title based on the prompt
  const title = `# Typhoon Deep Research: ${prompt.split('.')[0]}`;
  
  // Create an introduction
  const introduction = `
## Introduction

This research report explores the topic: "${prompt}". The following sections present key findings and insights gathered during the research process.

*Report language: ${languageName}*
`;

  // Create a findings section with the learnings
  const findings = `
## Key Findings

${learnings.map((learning, index) => `${index + 1}. ${learning}`).join('\n\n')}
`;

  // Create a conclusion
  const conclusion = `
## Conclusion

Based on the research findings, we can conclude that this topic has several important aspects worth noting. The information gathered provides valuable insights that address the original research query.
`;

  // Add a timestamp
  const timestamp = `
---

*Report generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}*
`;

  // Combine all sections
  return `${title}${introduction}${findings}${conclusion}${timestamp}`;
}

/**
 * Mock implementation of the writeFinalReport function
 * This can be used as a fallback when the API is not working
 */
export async function mockWriteFinalReport({
  prompt,
  learnings,
  language,
}: {
  prompt: string;
  learnings: string[];
  language: string;
}) {
  // Generate a mock report
  const report = generateMockReport(prompt, learnings, language);
  
  // Return a response that mimics the real writeFinalReport function
  return {
    textStream: new ReadableStream({
      start(controller) {
        controller.enqueue(report);
        controller.close();
      },
    }),
    fullStream: new ReadableStream({
      start(controller) {
        controller.close();
      },
    }),
    text: Promise.resolve(report),
    language,
  };
} 