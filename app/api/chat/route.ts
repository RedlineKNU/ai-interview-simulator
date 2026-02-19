import { streamText } from 'ai';
import { groq } from '@ai-sdk/groq';
import { google } from '@ai-sdk/google';
import { ResumeData } from '@/types/resume';
import { generateInterviewerSystemPrompt } from '@/lib/prompts';

export const maxDuration = 30;

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

/**
 * Chat API Route with Hybrid Cloud Fallback Pattern
 * Primary: Groq (llama-3.3-70b-versatile) - Fast, free tier
 * Fallback: Google Gemini (gemini-2.0-flash) - Rate limit resilient
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('📥 Received chat request');

    const { messages, resumeData, difficulty = 'middle' } = body as {
      messages: ChatMessage[];
      resumeData: ResumeData;
      difficulty?: 'junior' | 'middle' | 'senior';
    };

    if (!resumeData) {
      console.error('❌ No resume data provided');
      return new Response('Resume data is required', { status: 400 });
    }

    console.log('✅ Candidate:', resumeData.name);
    console.log('✅ Messages:', messages?.length || 0);
    console.log('📊 Difficulty:', difficulty);

    // Generate system prompt with resume context and difficulty
    const systemPrompt = generateInterviewerSystemPrompt(resumeData, difficulty);

    // Format messages
    const formattedMessages: ChatMessage[] = messages.map(m => ({
      role: m.role,
      content: m.content,
    }));

    // Strategy 1: Try Groq first (fastest, 70B model)
    try {
      console.log('🚀 Using Groq API (Primary)');

      const result = streamText({
        model: groq('llama-3.3-70b-versatile'),
        system: systemPrompt,
        messages: formattedMessages,
        temperature: 0.7,
      });

      return result.toTextStreamResponse();

    } catch (groqError: any) {
      // Check if it's a rate limit error
      const isRateLimit = groqError?.status === 429 ||
                         groqError?.message?.includes('rate limit') ||
                         groqError?.message?.includes('429');

      if (isRateLimit) {
        console.log('⚠️ Groq rate limit, falling back to Gemini');
      } else {
        console.error('❌ Groq error:', groqError.message);
      }

      // Strategy 2: Fallback to Google Gemini
      try {
        console.log('🔄 Using Gemini API (Fallback)');

        const result = streamText({
          model: google('gemini-2.0-flash'),
          system: systemPrompt,
          messages: formattedMessages,
          temperature: 0.7,
        });

        return result.toTextStreamResponse();

      } catch (geminiError: any) {
        console.error('❌ Gemini fallback failed:', geminiError.message);
        throw geminiError;
      }
    }

  } catch (error: any) {
    console.error('💥 Complete API failure:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to generate response. Please check your API keys.',
        details: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
