'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/utils/language-context';
import ReactMarkdown from 'react-markdown';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

// Markdown content for English
const englishContent = `
# How It Works

## The Deep Research Algorithm

Typhoon Deep Research uses a sophisticated AI-powered algorithm to conduct comprehensive research on any topic. 
The system combines multiple AI models and search technologies to deliver high-quality research results.

### Research Process Overview

1. **User Query Submission**  
   You submit your research topic or question.

2. **Clarification Questions**  
   The system generates follow-up questions to better understand your research needs.

3. **Query Generation**  
   Based on your input, the system formulates optimal search queries.

4. **Web Search**  
   The system searches the web for relevant information.

5. **Information Processing**  
   Search results are analyzed and key learnings are extracted.

6. **Follow-up Research**  
   The system identifies knowledge gaps and conducts additional searches.

7. **Report Generation**  
   A comprehensive research report is created, synthesizing all findings.

## Technology Stack

### Typhoon R1
Typhoon R1 powers the feedback and report generation components of our system:
- Generates clarifying questions to refine research direction
- Synthesizes research findings into coherent reports
- Structures information for maximum readability and usefulness
- Ensures proper citation and attribution of sources

### Typhoon2
Typhoon2 handles the learning and query generation aspects:
- Formulates optimal search queries based on research goals
- Extracts key learnings from search results
- Identifies knowledge gaps requiring further research
- Generates follow-up queries to deepen the research

### Tavily Search
Tavily powers our web search capabilities:
- Performs advanced web searches across multiple domains
- Retrieves high-quality, relevant information from the internet
- Provides structured search results with titles, URLs, and content snippets
- Enables deep research with comprehensive web coverage

## Technical Implementation

The deep research algorithm works through a recursive tree-based approach:

1. Starting with your initial query, the system generates multiple search queries
2. For each query, it performs a web search and extracts key learnings
3. Based on these learnings, it identifies knowledge gaps and generates follow-up queries
4. This process continues recursively up to a specified depth
5. All learnings are accumulated and synthesized into a comprehensive report

The system is designed to explore topics broadly and deeply, ensuring comprehensive coverage of your research topic.

### Key Features

- **Multi-level Research:** Explores topics through multiple levels of depth
- **Adaptive Learning:** Adjusts research direction based on discovered information
- **Comprehensive Coverage:** Explores multiple perspectives and aspects of a topic
- **Source Attribution:** Properly cites all sources in the final report
- **Language Support:** Conducts research and generates reports in multiple languages

## Try It Yourself

Experience the power of Typhoon Deep Research by submitting your own research topic.
`;

// Markdown content for Thai
const thaiContent = `
# วิธีการทำงาน

## อัลกอริทึมการวิจัยเชิงลึก

Typhoon Deep Research ใช้อัลกอริทึมขั้นสูงที่ขับเคลื่อนด้วย AI เพื่อทำการวิจัยอย่างครอบคลุมในทุกหัวข้อ 
ระบบรวมโมเดล AI หลายตัวและเทคโนโลยีการค้นหาเพื่อให้ผลการวิจัยที่มีคุณภาพสูง

### ภาพรวมกระบวนการวิจัย

1. **การส่งคำถามวิจัย**  
   คุณส่งหัวข้อหรือคำถามวิจัยของคุณ

2. **คำถามเพื่อความชัดเจน**  
   ระบบสร้างคำถามติดตามเพื่อให้เข้าใจความต้องการวิจัยของคุณได้ดีขึ้น

3. **การสร้างคำค้นหา**  
   จากข้อมูลของคุณ ระบบจะสร้างคำค้นหาที่เหมาะสมที่สุด

4. **การค้นหาเว็บ**  
   ระบบค้นหาข้อมูลที่เกี่ยวข้องบนเว็บ

5. **การประมวลผลข้อมูล**  
   ผลการค้นหาจะถูกวิเคราะห์และสกัดข้อมูลสำคัญ

6. **การวิจัยเพิ่มเติม**  
   ระบบระบุช่องว่างความรู้และทำการค้นหาเพิ่มเติม

7. **การสร้างรายงาน**  
   รายงานวิจัยที่ครอบคลุมจะถูกสร้างขึ้น โดยสังเคราะห์ข้อค้นพบทั้งหมด

## เทคโนโลยีที่ใช้

### Typhoon R1
Typhoon R1 ขับเคลื่อนส่วนประกอบการให้ข้อเสนอแนะและการสร้างรายงานของระบบเรา:
- สร้างคำถามเพื่อความชัดเจนเพื่อปรับทิศทางการวิจัย
- สังเคราะห์ผลการวิจัยเป็นรายงานที่เข้าใจง่าย
- จัดโครงสร้างข้อมูลเพื่อความอ่านง่ายและมีประโยชน์สูงสุด
- รับรองการอ้างอิงและการระบุแหล่งที่มาอย่างเหมาะสม

### Typhoon2
Typhoon2 จัดการด้านการเรียนรู้และการสร้างคำค้นหา:
- สร้างคำค้นหาที่เหมาะสมตามเป้าหมายการวิจัย
- สกัดข้อมูลสำคัญจากผลการค้นหา
- ระบุช่องว่างความรู้ที่ต้องการการวิจัยเพิ่มเติม
- สร้างคำค้นหาติดตามเพื่อเจาะลึกการวิจัย

### Tavily Search
Tavily ขับเคลื่อนความสามารถในการค้นหาเว็บของเรา:
- ทำการค้นหาเว็บขั้นสูงในหลายโดเมน
- ดึงข้อมูลที่มีคุณภาพสูงและเกี่ยวข้องจากอินเทอร์เน็ต
- ให้ผลการค้นหาที่มีโครงสร้างพร้อมชื่อเรื่อง URL และข้อความสรุป
- เปิดใช้งานการวิจัยเชิงลึกด้วยการครอบคลุมเว็บอย่างครอบคลุม

## การนำไปใช้ทางเทคนิค

อัลกอริทึมการวิจัยเชิงลึกทำงานผ่านวิธีการแบบต้นไม้เวียนซ้ำ:

1. เริ่มต้นด้วยคำถามเริ่มต้นของคุณ ระบบจะสร้างคำค้นหาหลายรายการ
2. สำหรับแต่ละคำค้นหา ระบบจะทำการค้นหาเว็บและสกัดข้อมูลสำคัญ
3. จากข้อมูลเหล่านี้ ระบบจะระบุช่องว่างความรู้และสร้างคำค้นหาติดตาม
4. กระบวนการนี้จะดำเนินต่อไปซ้ำๆ จนถึงความลึกที่กำหนด
5. ข้อมูลทั้งหมดจะถูกรวบรวมและสังเคราะห์เป็นรายงานที่ครอบคลุม

ระบบได้รับการออกแบบให้สำรวจหัวข้ออย่างกว้างและลึก เพื่อให้มั่นใจว่าครอบคลุมหัวข้อวิจัยของคุณอย่างครบถ้วน

### คุณสมบัติหลัก

- **การวิจัยหลายระดับ:** สำรวจหัวข้อผ่านหลายระดับความลึก
- **การเรียนรู้แบบปรับตัว:** ปรับทิศทางการวิจัยตามข้อมูลที่ค้นพบ
- **ความครอบคลุมที่ครอบคลุม:** สำรวจมุมมองและแง่มุมต่างๆ ของหัวข้อ
- **การอ้างอิงแหล่งที่มา:** อ้างอิงแหล่งที่มาทั้งหมดในรายงานฉบับสมบูรณ์อย่างเหมาะสม
- **รองรับหลายภาษา:** ทำการวิจัยและสร้างรายงานในหลายภาษา

## ลองด้วยตัวคุณเอง

สัมผัสพลังของ Typhoon Deep Research โดยส่งหัวข้อวิจัยของคุณเอง
`;

// Custom components for ReactMarkdown
const MarkdownComponents = {
  h1: (props: React.HTMLProps<HTMLHeadingElement>) => (
    <h1 className="text-4xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600" {...props} />
  ),
  h2: (props: React.HTMLProps<HTMLHeadingElement>) => (
    <h2 className="text-3xl font-bold mt-12 mb-6 text-indigo-600 dark:text-indigo-400" {...props} />
  ),
  h3: (props: React.HTMLProps<HTMLHeadingElement>) => (
    <h3 className="text-2xl font-semibold mt-8 mb-4 text-gray-800 dark:text-gray-200" {...props} />
  ),
  p: (props: React.HTMLProps<HTMLParagraphElement>) => (
    <p className="text-lg text-gray-700 dark:text-gray-300 mb-6 leading-relaxed" {...props} />
  ),
  ul: (props: React.HTMLProps<HTMLUListElement>) => (
    <ul className="mb-6 space-y-2" {...props} />
  ),
  ol: ({ ...props }) => (
    <ol className="mb-6 space-y-4 ml-6 list-decimal" {...props} />
  ),
  li: ({ children, ...props }: React.HTMLProps<HTMLLIElement>) => {
    // Handle special case for list items with bold prefixes
    try {
      const childArray = React.Children.toArray(children);
      if (childArray.length > 0 && typeof childArray[0] === 'string') {
        const text = childArray[0] as string;
        if (text.startsWith('**')) {
          const parts = text.split('**');
          if (parts.length >= 3) {
            const prefix = parts[1];
            const rest = parts.slice(2).join('**');
            return (
              <li className="text-gray-700 dark:text-gray-300" {...props}>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">{prefix}:</span>
                {rest}
              </li>
            );
          }
        }
      }
    } catch (_) {
        console.log('error', _)
      // Fallback to default rendering if there's an error
    }
    return <li className="text-gray-700 dark:text-gray-300" {...props}>{children}</li>;
  },
  strong: (props: React.HTMLProps<HTMLElement>) => (
    <strong className="font-semibold text-indigo-600 dark:text-indigo-400" {...props} />
  ),
};

export default function HowItWorks() {
  const { language, t } = useLanguage();
  
  // Select the appropriate markdown content based on language
  const markdownContent = language === 'th' ? thaiContent : englishContent;
  
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-10 animate-blob"></div>
      <div className="absolute top-40 right-10 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-10 animate-blob animation-delay-2000"></div>
      
      <div className="prose prose-lg dark:prose-invert max-w-none relative z-10">
        <ReactMarkdown components={MarkdownComponents}>
          {markdownContent}
        </ReactMarkdown>
        
        <div className="mt-12 mb-8 text-center">
          <Link 
            href="/" 
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-lg font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            {t('howItWorks.startResearching')}
            <ArrowRightIcon className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </div>
      
      {/* Process visualization */}
      <div className="mt-16 mb-12 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl"></div>
        <div className="relative p-8 rounded-xl">
          <h3 className="text-2xl font-bold text-center mb-8 text-indigo-600 dark:text-indigo-400">
            {language === 'th' ? 'กระบวนการวิจัยเชิงลึก' : 'Deep Research Process'}
          </h3>
          
          <div className="flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0 md:space-x-4">
            <div className="flex-1 text-center p-4">
              <div className="w-16 h-16 mx-auto bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">1</span>
              </div>
              <h4 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">
                {language === 'th' ? 'คำถาม' : 'Query'}
              </h4>
            </div>
            
            <div className="hidden md:block w-8 h-1 bg-indigo-200 dark:bg-indigo-800"></div>
            
            <div className="flex-1 text-center p-4">
              <div className="w-16 h-16 mx-auto bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">2</span>
              </div>
              <h4 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">
                {language === 'th' ? 'ค้นหา' : 'Search'}
              </h4>
            </div>
            
            <div className="hidden md:block w-8 h-1 bg-indigo-200 dark:bg-indigo-800"></div>
            
            <div className="flex-1 text-center p-4">
              <div className="w-16 h-16 mx-auto bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">3</span>
              </div>
              <h4 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">
                {language === 'th' ? 'วิเคราะห์' : 'Analyze'}
              </h4>
            </div>
            
            <div className="hidden md:block w-8 h-1 bg-indigo-200 dark:bg-indigo-800"></div>
            
            <div className="flex-1 text-center p-4">
              <div className="w-16 h-16 mx-auto bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">4</span>
              </div>
              <h4 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">
                {language === 'th' ? 'รายงาน' : 'Report'}
              </h4>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 