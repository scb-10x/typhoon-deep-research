/**
 * Language detection utility
 * This provides centralized language detection functionality for the application
 */

/**
 * Map of language codes to their full names
 */
export const languageCodeToName: Record<string, string> = {
  'en': 'English',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'it': 'Italian',
  'pt': 'Portuguese',
  'ja': 'Japanese',
  'zh': 'Chinese',
  'ko': 'Korean',
  'ru': 'Russian',
  'ar': 'Arabic',
  'hi': 'Hindi',
  'th': 'Thai',
  // Add more languages as needed
};

/**
 * Map of language codes to their regex patterns for detection
 */
export const languagePatterns: Record<string, RegExp[]> = {
  'th': [/[\u0E00-\u0E7F]/], // Thai - prioritized
  'en': [/^[a-zA-Z0-9\s.,?!;:'"\-()]+$/], // English (default)
  'es': [/¿|á|é|í|ó|ú|ñ|¡/], // Spanish
  'fr': [/ç|à|â|é|è|ê|ë|î|ï|ô|œ|ù|û|ü|ÿ/], // French
  'de': [/ä|ö|ü|ß/], // German
  'it': [/à|è|é|ì|ò|ù/], // Italian
  'pt': [/ã|õ|á|é|í|ó|ú|â|ê|ô|ç/], // Portuguese
  'ja': [/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]/], // Japanese
  'zh': [/[\u4e00-\u9fff\u3400-\u4dbf\u20000-\u2a6df\u2a700-\u2b73f\u2b740-\u2b81f\u2b820-\u2ceaf]/], // Chinese
  'ko': [/[\uac00-\ud7af\u1100-\u11ff\u3130-\u318f\ua960-\ua97f\ud7b0-\ud7ff]/], // Korean
  'ru': [/[\u0400-\u04FF]/], // Russian
  'ar': [/[\u0600-\u06FF]/], // Arabic
  'hi': [/[\u0900-\u097F]/], // Hindi
};

/**
 * Counts the number of characters in a string that match a specific pattern
 * @param text The text to analyze
 * @param pattern The regex pattern to match
 * @returns The count of matching characters
 */
function countMatchingChars(text: string, pattern: RegExp): number {
  let count = 0;
  for (let i = 0; i < text.length; i++) {
    if (pattern.test(text[i])) {
      count++;
    }
  }
  return count;
}

/**
 * Detect language from text
 * This is a simple implementation - in a production app, you would use a more robust language detection library
 * @param text The text to detect language from
 * @returns The detected language code, defaults to 'en' if no match
 */
export function detectLanguage(text: string): string {
  // First, check specifically for Thai characters with a threshold approach
  const thaiPattern = /[\u0E00-\u0E7F]/;
  const thaiCharCount = countMatchingChars(text, thaiPattern);
  
  // If more than 10% of characters are Thai, consider it Thai
  // This helps with mixed language text where Thai is the primary language
  if (thaiCharCount > 0 && (thaiCharCount / text.length) > 0.1) {
    return 'th';
  }
  
  // Then check for other languages
  for (const [lang, patterns] of Object.entries(languagePatterns)) {
    // Skip Thai as we already checked it
    if (lang === 'th') continue;
    
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        return lang;
      }
    }
  }

  // Default to English if no patterns match
  return 'en';
}

/**
 * Get language-specific instructions for LLM prompts
 * @param language The language code or name
 * @returns Language-specific instructions
 */
export function getLanguageInstructions(language: string): string {
  // Convert language code to full name if needed
  const languageName = language.length <= 2 ? languageCodeToName[language] || language : language;
  
  let languagePrompt = `Respond in ${languageName}.`;

  // Add language-specific instructions
  switch (language) {
    case 'zh':
    case 'Chinese':
    case '中文':
      languagePrompt += ' 在中文和英文之间添加适当的空格来提升可读性';
      break;
    case 'ja':
    case 'Japanese':
    case '日本語':
      languagePrompt += ' 日本語で回答する際は、専門用語には適宜英語を併記してください。';
      break;
    case 'ko':
    case 'Korean':
    case '한국어':
      languagePrompt += ' 한국어로 응답할 때는 전문 용어에 영어를 함께 표기해 주세요.';
      break;
    case 'th':
    case 'Thai':
    case 'ไทย':
      languagePrompt += ' เมื่อตอบเป็นภาษาไทย กรุณาใช้คำศัพท์ที่เข้าใจง่ายและเพิ่มคำศัพท์ภาษาอังกฤษสำหรับคำศัพท์เฉพาะทาง';
      break;
    // Add more language-specific instructions as needed
  }
  
  return languagePrompt;
}

/**
 * Test function for Thai language detection
 * This is for development purposes only and should be removed in production
 */
export function testThaiDetection(): void {
  const testCases = [
    { text: 'สวัสดีครับ', expected: 'th', description: 'Pure Thai' },
    { text: 'Hello world', expected: 'en', description: 'Pure English' },
    { text: 'สวัสดี, my name is John', expected: 'th', description: 'Mixed Thai-English with Thai first' },
    { text: 'I am learning ภาษาไทย', expected: 'th', description: 'Mixed English-Thai with Thai word' },
    { text: 'ฉันชอบกินอาหารไทย but I also like pizza', expected: 'th', description: 'Mixed with more Thai than English' },
    { text: 'Just a few Thai words like สวัสดี and ขอบคุณ', expected: 'th', description: 'Mostly English with some Thai' },
    { text: '今日は、สวัสดี, hello', expected: 'th', description: 'Mixed Japanese, Thai, English' },
  ];

  console.log('=== Thai Language Detection Test ===');
  testCases.forEach(({ text, expected, description }) => {
    const detected = detectLanguage(text);
    const result = detected === expected ? 'PASS' : 'FAIL';
    console.log(`${result}: "${text}" - Detected: ${detected}, Expected: ${expected} (${description})`);
  });
  console.log('=== Test Complete ===');
} 