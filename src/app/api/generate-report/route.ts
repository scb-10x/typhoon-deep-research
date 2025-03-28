import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { z } from 'zod';

import { languagePrompt, systemPrompt } from '@/lib/prompt';
import { trimPrompt } from '@/lib/ai/providers';
import { typhoon } from '@/lib/ai/typhoon-client';
import { extractResultFromThinking } from '@/utils/ai-response';

// Define the request schema
const requestSchema = z.object({
  prompt: z.string(),
  learnings: z.array(z.object({
    learning: z.string().optional(),
    url: z.string().optional(),
    title: z.string().optional()
  })),
  language: z.string().default('English'),
});

export async function POST(request: Request) {
  try {
    // Parse and validate the request body
    const body = await request.json();
    const { prompt, learnings, language } = requestSchema.parse(body);

    // Format learnings without URLs for the prompt
    const formattedLearnings = learnings
      .map((learning, i) => {
        return `${i + 1}. ${learning.learning}`;
      })
      .join('\n\n');

    const reportPrompt = [
      `Based on the following research query and learnings, write a comprehensive research report. The report should synthesize the learnings into a coherent narrative, highlighting key insights, patterns, and conclusions.`,
      `<query>${prompt}</query>`,
      `<learnings>\n${formattedLearnings}\n</learnings>`,
      `IMPORTANT CONSTRAINTS AND GUIDELINES:`,
      
      `1. USER ALIGNMENT (HIGHEST PRIORITY): Ensure the report directly addresses the user's original query. Focus on providing practical, actionable insights that are relevant to the user's needs. Organize information in a way that prioritizes what would be most valuable to someone asking this specific question. Begin with a brief prelude that helps orient the user to the topic and sets expectations for what they'll learn.`,
      
      `2. FACTUAL ACCURACY: Never make up facts or information. Only use information that is explicitly provided in the learnings. If you're uncertain about something, acknowledge the limitation rather than inventing details.`,
      
      `3. CITATIONS: Use numbered citations like "[1]" to reference specific learnings. Each citation number should correspond to the index of the source in the learnings list. Include citations whenever you present specific facts, statistics, or direct information from the learnings. IMPORTANT: Place citation numbers within the text immediately after the relevant information. Also add the same citation into source section at the end of the report.`,
      
      `4. BALANCED PERSPECTIVE: Present multiple viewpoints when the learnings contain different perspectives on a topic. Avoid bias and present information objectively.`,
      
      `5. STRUCTURE: The report should be well-structured with clear sections including:
         - A brief prelude/introduction that orients the user to the topic
         - An executive summary that outlines the key findings and includes at least one surprising or counterintuitive insight to immediately capture interest
         - Main body sections organized by themes or topics
         - A conclusion that directly addresses the original query
         - If appropriate, a "Limitations" section acknowledging any gaps in the research`,
      
      `6. ENGAGEMENT & MEMORABILITY: Highlight counterintuitive findings, surprising statistics, and unexpected connections between concepts. Specifically:
         - Emphasize the most surprising or unexpected facts from the research
         - Identify and highlight any paradigm-shifting insights that challenge conventional wisdom
         - Create "Did you know?" moments by spotlighting the most unusual or impressive statistics
         - Draw attention to any contrasting or contradictory evidence found across different sources
         - Connect seemingly unrelated concepts in insightful ways when supported by the research
         DO NOT invent facts or exaggerate - only highlight genuinely surprising information that exists in the provided learnings.`,
      
      `FORMAT REQUIREMENTS:
         - Return ONLY plain markdown text. DO NOT include any JSON, XML, or other structured data formats in your response.
         - Start with a # heading for the title.
         - The prelude should come immediately after the title, before diving into the executive summary and main content.
         - Include a "Key Insights" section after the executive summary that highlights 3-5 of the most surprising or counterintuitive findings with appropriate citations.
         - Use formatting such as **bold text** or > blockquotes to emphasize particularly surprising or impactful facts throughout the report.
         - At the end of the report, include a "Sources" section that lists all the sources (citations), with their corresponding numbers.
         - Example of a source citation in the text: "According to recent studies [1], the impact of climate change..."
         - Example of the Sources section at the end:
           # Sources
           [1] Source 1
           [2] Source 2
         `,
      languagePrompt(language),
    ].join('\n');
    
    // Use Typhoon API instead of OpenAI
    const result = await generateText({
      model: typhoon((process.env.AI_REASONING_MODEL || process.env.AI_MODEL || 'typhoon-v2.1-12b-instruct')),
      system: systemPrompt(),
      prompt: trimPrompt(reportPrompt),
      maxTokens: 4096,
    });

    // Extract the result from thinking if present
    let cleanReport = extractResultFromThinking(result.text);
    
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
    
    // Add URLs to the Sources section
    // Match various possible headings for the sources section (Sources, References, แหล่งข้อมูล, etc.)
    let sourcesHeadingPatterns = [
      '# Sources',
      '# SOURCES',
      '# References',
      '# REFERENCES',
      '# แหล่งข้อมูล', // Thai
      '# แหล่งอ้างอิง', // Thai alternative
      '# อ้างอิง', // Thai alternative
      '# 参考文献', // Japanese
      '# 来源', // Chinese
      '# 출처', // Korean
      '# Quellen', // German
      '# Fuentes', // Spanish
      '# Sources citées', // French
      '# Fonti', // Italian
      '# Источники', // Russian
      '# مصادر', // Arabic
      '# Źródła', // Polish
      '# Bronnen', // Dutch
      '# Fontes', // Portuguese
      '# Kilder', // Danish/Norwegian
      '# Källor', // Swedish
    ]
    
    sourcesHeadingPatterns = sourcesHeadingPatterns.concat(sourcesHeadingPatterns.map(pattern => '#' + pattern));
    
    // Create a regex pattern that matches any of the source heading patterns
    const sourcesHeadingRegexPattern = sourcesHeadingPatterns
      .map(pattern => pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) // Escape regex special chars
      .join('|');
    
    const sourcesRegex = new RegExp(`((?:${sourcesHeadingRegexPattern})\\s*\\n)([\\s\\S]*)$`, 'i');
    const sourcesMatch = cleanReport.match(sourcesRegex);
    
    if (sourcesMatch) {
      const sourcesHeader = sourcesMatch[1];
      const sourcesList = sourcesMatch[2];
      
      // Extract source numbers and add URLs
      const sourceLines = sourcesList.trim().split('\n');
      const updatedSourceLines = sourceLines.map(line => {
        // Match citation numbers like [1], [2], etc.
        const sourceMatch = line.match(/\[(\d+)\]/);
        if (sourceMatch) {
          const sourceIndex = parseInt(sourceMatch[1]) - 1;
          if (sourceIndex >= 0 && sourceIndex < learnings.length) {
            const learning = learnings[sourceIndex];
            if (learning.url) {
              return `[${sourceMatch[1]}](${learning.url}) ${learning.title ? ` - ${learning.title}` : ` - ${learning.learning}`}`;
            }
          }
        }
        return line;
      }).filter(line => line !== undefined);
      
      // Replace the sources section with the updated one
      cleanReport = cleanReport.replace(
        sourcesRegex, 
        `${sourcesHeader}${updatedSourceLines.join('\n\n')}`
      );
    } else {
      // If no Sources section exists, add one with the appropriate heading based on language
      let sourcesHeading = '# Sources';
      
      // Set the appropriate heading based on language
      if (language) {
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
      }
      
      const sourcesSection = `\n\n${sourcesHeading}\n${learnings.map((learning, i) => 
        `[${i + 1}]${learning.url ? '('+ learning.url + ')' : ''}${learning.title ? ` - ${learning.title}` : ` - ${learning.learning}`}`
      ).join('\n\n')}`;
      
      cleanReport = `${cleanReport}${sourcesSection}`;
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