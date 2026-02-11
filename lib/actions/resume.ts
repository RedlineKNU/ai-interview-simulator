'use server';

import { generateText } from 'ai';
import { groq } from '@ai-sdk/groq';
import { google } from '@ai-sdk/google';
import { ResumeData } from '@/types/resume';

/**
 * Server Action: Extract and structure resume data from PDF
 * Uses pdf-parse for text extraction and Gemini 1.5 Flash for structuring
 */
export async function extractResumeData(formData: FormData): Promise<{
  success: boolean;
  data?: ResumeData;
  error?: string;
}> {
  try {
    const file = formData.get('resume') as File;

    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    if (file.type !== 'application/pdf') {
      return { success: false, error: 'File must be a PDF' };
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text from PDF using pdfreader - simple Node.js library
    const { PdfReader } = await import('pdfreader');

    const rawText = await new Promise<string>((resolve, reject) => {
      const textLines: string[] = [];
      let currentPage = 0;
      const pageTexts: { [page: number]: { [y: number]: string[] } } = {};

      new PdfReader().parseBuffer(buffer, (err: any, item: any) => {
        if (err) {
          reject(err);
        } else if (!item) {
          // End of file - combine all text
          const allText: string[] = [];

          // Sort by page and y-coordinate
          Object.keys(pageTexts)
            .sort((a, b) => parseInt(a) - parseInt(b))
            .forEach(page => {
              const pageNum = parseInt(page);
              const lines = pageTexts[pageNum];

              Object.keys(lines)
                .sort((a, b) => parseFloat(a) - parseFloat(b))
                .forEach(y => {
                  const lineText = lines[parseFloat(y)].join(' ');
                  allText.push(lineText);
                });

              allText.push('\n'); // Page separator
            });

          const finalText = allText.join(' ').trim();
          console.log('📄 PDF parsed, extracted text length:', finalText.length);
          console.log('📄 First 300 chars:', finalText.substring(0, 300));
          resolve(finalText);
        } else if (item.page) {
          // New page
          currentPage = item.page;
          pageTexts[currentPage] = pageTexts[currentPage] || {};
        } else if (item.text) {
          // Text item
          const y = item.y || 0;
          pageTexts[currentPage] = pageTexts[currentPage] || {};
          pageTexts[currentPage][y] = pageTexts[currentPage][y] || [];
          pageTexts[currentPage][y].push(item.text);
        }
      });
    });

    if (!rawText || rawText.trim().length < 20) {
      return {
        success: false,
        error: `Unable to extract sufficient text from PDF (got ${rawText?.length || 0} characters). Please ensure the PDF contains readable text.`
      };
    }

    // Use Groq (primary) to structure the resume data, fallback to Gemini if needed
    let text: string;

    try {
      console.log('🚀 Using Groq to parse resume...');
      const result = await generateText({
        model: groq('llama-3.3-70b-versatile'),
        prompt: `You are an expert resume parser. Analyze the following resume text and extract structured information.

IMPORTANT: Respond ONLY with a valid JSON object. No markdown, no code blocks, no explanations.

Extract the following fields:
- name: The candidate's full name
- email: Email address
- phone: Phone number (optional)
- summary: Brief professional summary (optional)
- skills: Array of technical skills
- experience: Array of work experiences with structure: {company, position, duration, description, technologies[]}
- education: Array of education entries with structure: {institution, degree, field, year}
- weaknesses: Array of potential weaknesses or areas for improvement based on the resume (gaps in experience, limited exposure to certain technologies, etc.)

Resume Text:
${rawText}

Remember: Respond ONLY with the JSON object, nothing else.`,
      });
      text = result.text;
    } catch (groqError) {
      console.log('⚠️ Groq failed, trying Gemini fallback...');
      const result = await generateText({
        model: google('gemini-2.0-flash'),
        prompt: `You are an expert resume parser. Analyze the following resume text and extract structured information.

IMPORTANT: Respond ONLY with a valid JSON object. No markdown, no code blocks, no explanations.

Extract the following fields:
- name: The candidate's full name
- email: Email address
- phone: Phone number (optional)
- summary: Brief professional summary (optional)
- skills: Array of technical skills
- experience: Array of work experiences with structure: {company, position, duration, description, technologies[]}
- education: Array of education entries with structure: {institution, degree, field, year}
- weaknesses: Array of potential weaknesses or areas for improvement based on the resume (gaps in experience, limited exposure to certain technologies, etc.)

Resume Text:
${rawText}

Remember: Respond ONLY with the JSON object, nothing else.`,
      });
      text = result.text;
    }

    // Parse the JSON response
    let structuredData: Omit<ResumeData, 'rawText'>;

    try {
      // Try to extract JSON from the response (in case Gemini adds markdown)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : text;
      structuredData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Raw response:', text);
      return {
        success: false,
        error: 'Failed to parse resume structure. Please try again.'
      };
    }

    // Combine structured data with raw text
    const resumeData: ResumeData = {
      ...structuredData,
      rawText,
    };

    return { success: true, data: resumeData };

  } catch (error) {
    console.error('Resume extraction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process resume'
    };
  }
}
