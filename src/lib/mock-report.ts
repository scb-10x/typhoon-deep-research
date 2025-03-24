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
export function generateMockReport(
  prompt: string, 
  learnings: Array<{learning: string; url: string; title?: string}>, 
  language: string
): string {
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

${learnings.map((learning, index) => `${index + 1}. ${learning.learning} [${index + 1}]`).join('\n\n')}
`;

  // Create a conclusion
  const conclusion = `
## Conclusion

Based on the research findings, we can conclude that this topic has several important aspects worth noting. The information gathered provides valuable insights that address the original research query.
`;

  // Get the appropriate sources heading based on language
  let sourcesHeading = '# Sources';
  
  // Set the appropriate heading based on language
  const lowerLang = language.toLowerCase();
  if (lowerLang.includes('thai') || lowerLang === 'th') {
    sourcesHeading = '# แหล่งข้อมูล';
  } else if (lowerLang.includes('japanese') || lowerLang === 'ja') {
    sourcesHeading = '# 参考文献';
  } else if (lowerLang.includes('chinese') || lowerLang === 'zh') {
    sourcesHeading = '# 来源';
  } else if (lowerLang.includes('korean') || lowerLang === 'ko') {
    sourcesHeading = '# 출처';
  } else if (lowerLang.includes('german') || lowerLang === 'de') {
    sourcesHeading = '# Quellen';
  } else if (lowerLang.includes('spanish') || lowerLang === 'es') {
    sourcesHeading = '# Fuentes';
  } else if (lowerLang.includes('french') || lowerLang === 'fr') {
    sourcesHeading = '# Sources citées';
  } else if (lowerLang.includes('italian') || lowerLang === 'it') {
    sourcesHeading = '# Fonti';
  } else if (lowerLang.includes('russian') || lowerLang === 'ru') {
    sourcesHeading = '# Источники';
  } else if (lowerLang.includes('arabic') || lowerLang === 'ar') {
    sourcesHeading = '# مصادر';
  } else if (lowerLang.includes('polish') || lowerLang === 'pl') {
    sourcesHeading = '# Źródła';
  } else if (lowerLang.includes('dutch') || lowerLang === 'nl') {
    sourcesHeading = '# Bronnen';
  } else if (lowerLang.includes('portuguese') || lowerLang === 'pt') {
    sourcesHeading = '# Fontes';
  } else if (lowerLang.includes('danish') || lowerLang === 'da' || 
            lowerLang.includes('norwegian') || lowerLang === 'no') {
    sourcesHeading = '# Kilder';
  } else if (lowerLang.includes('swedish') || lowerLang === 'sv') {
    sourcesHeading = '# Källor';
  }

  // Add a sources section with URLs
  const sources = `
${sourcesHeading}

${learnings.map((learning, index) => `[${index + 1}] ${learning.url || 'No URL provided'}${learning.title ? ` - ${learning.title}` : ''}`).join('\n')}
`;

  // Add a timestamp
  const timestamp = `
---

*Report generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}*
`;

  // Combine all sections
  return `${title}${introduction}${findings}${conclusion}${sources}${timestamp}`;
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
  learnings: Array<{learning: string; url: string; title?: string}>;
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