import { streamText } from 'ai';
import { groq } from '@ai-sdk/groq';
import { google } from '@ai-sdk/google';
import { ResumeData } from '@/types/resume';
import { generateInterviewerSystemPrompt } from '@/lib/prompts';

export const maxDuration = 30;

/**
 * Handle local Ollama model requests
 */
async function handleLocalModel(
  systemPrompt: string,
  messages: { role: string; content: string }[]
) {
  try {
    console.log('🏠 Using Local Ollama Model');

    const { Ollama } = await import('ollama');
    const ollama = new Ollama({ host: 'http://localhost:11434' });

    // Build conversation history with embedded system prompt in first message
    const conversationHistory = [...messages];

    // Embed system prompt into first user message for better adherence
    if (conversationHistory.length > 0 && conversationHistory[0].role === 'user') {
      conversationHistory[0] = {
        ...conversationHistory[0],
        content: `${systemPrompt}\n\nUser: ${conversationHistory[0].content}`
      };
    }

    const stream = await ollama.chat({
      model: 'socratic-interviewer',
      messages: conversationHistory.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      stream: true,
    });

    // Create a readable stream for the response
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.message?.content) {
              controller.enqueue(encoder.encode(chunk.message.content));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });

  } catch (error: any) {
    console.error('❌ Local model error:', error.message);
    return new Response(
      JSON.stringify({
        error: 'Local model failed. Please ensure Ollama is running with socratic-interviewer model.',
        details: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Chat API Route with Hybrid Cloud Fallback Pattern
 * Primary: Groq (llama-3.3-70b-versatile) - Fast, free tier
 * Fallback: Google Gemini (gemini-2.0-flash) - Rate limit resilient
 * Local: Ollama (socratic-interviewer) - Custom fine-tuned model
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('📥 Received chat request');

    const { messages, resumeData, model = 'cloud', difficulty = 'middle' } = body as {
      messages: { role: string; content: string }[];
      resumeData: ResumeData;
      model?: 'cloud' | 'local';
      difficulty?: 'junior' | 'middle' | 'senior';
    };

    if (!resumeData) {
      console.error('❌ No resume data provided');
      return new Response('Resume data is required', { status: 400 });
    }

    console.log('✅ Candidate:', resumeData.name);
    console.log('✅ Messages:', messages?.length || 0);
    console.log('🤖 Model:', model);
    console.log('📊 Difficulty:', difficulty);

    // Generate system prompt with resume context and difficulty
    const systemPrompt = generateInterviewerSystemPrompt(resumeData, difficulty);

    // Format messages
    const formattedMessages = messages.map(m => ({
      role: m.role,
      content: m.content
    }));

    // Route based on model selection
    if (model === 'local') {
      // Use Ollama local model
      return handleLocalModel(systemPrompt, formattedMessages);
    }

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
