// /app/api/chat/route.ts
import { NextResponse } from 'next/server';
// IMPORTANT: You'll need the Google Generative AI SDK
import { ChatMessage } from '@/types';
import { GoogleGenerativeAI, Part } from '@google/generative-ai';

// Make sure to set your GEMINI_API_KEY in your .env.local file
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Helper to convert our message format to Google's format
const buildGoogleGenAIPrompt = (messages: ChatMessage[]) => {
  return {
    history: messages
      .slice(0, -1) // All but the last message is history
      .map((msg) => ({
        role: msg.role === 'bot' ? 'model' : msg.role,
        parts: msg.parts.map((part) => {
          if (part.type === 'text') return { text: part.text };
          // This should not happen in history for this implementation, but as a safeguard:
          return { text: '' };
        }),
      })),
    // The last message is the current prompt
    prompt: messages[messages.length - 1].parts.map((part) => {
      if (part.type === 'text') {
        return { text: part.text };
      }
      if (part.type === 'image') {
        return {
          inlineData: {
            mimeType: part.mimeType,
            // Extract base64 data from data URL
            data: part.url.split(',')[1],
          },
        };
      }
      // This is needed to satisfy TypeScript but should not be reached
      return { text: '' };
    }),
  };
};

export async function POST(req: Request) {
  try {
    const { messages } = (await req.json()) as { messages: ChatMessage[] };

    if (!messages || messages.length === 0) {
      return new NextResponse('No messages provided', { status: 400 });
    }

    // Use the vision model for multimodal capabilities
    const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });

    const { history, prompt } = buildGoogleGenAIPrompt(messages);

    const chat = model.startChat({ history });
    const result = await chat.sendMessageStream(prompt as Part[]);

    // Convert the response stream to a format our client can handle
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          controller.enqueue(new TextEncoder().encode(chunkText));
        }
        controller.close();
      },
    });

    return new NextResponse(stream, {
      headers: { 'Content-Type': 'text/plain' },
    });
  } catch (error) {
    console.error('[CHAT_API_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
