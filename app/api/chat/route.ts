// /app/api/chat/route.ts
import { ChatMessage } from '@/types';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

// --- API Key Management ---
const geminiKey = (
  process.env.GEMINI_API_KEYS?.split(/[\n,;]+/)[0] || ''
).trim();
if (!geminiKey) {
  console.error(
    'CRITICAL: Gemini API key not found. Main chat functionality will fail.'
  );
}

const GEMINI_SYSTEM_PROMPT = `You are a helpful, streaming-first AI assistant. Provide your reasoning within <reasoning> XML tags, then the final answer within <answer> XML tags.`;

// --- Main API Handler ---
export async function POST(req: Request) {
  if (!geminiKey) {
    return new NextResponse(
      JSON.stringify({
        error: 'Server is not configured with a Gemini API key.',
      }),
      { status: 500 }
    );
  }

  try {
    const { messages, systemPrompt } = (await req.json()) as {
      messages: ChatMessage[];
      systemPrompt?: string;
    };
    if (!messages || messages.length === 0) {
      return new NextResponse(
        JSON.stringify({ error: 'No messages provided' }),
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: systemPrompt || GEMINI_SYSTEM_PROMPT,
    });

    // The entire conversation history is now used for context.
    const chat = model.startChat({
      history: messages.slice(0, -1).map((m) => ({
        role: m.role === 'bot' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
    });

    const lastMessage = messages[messages.length - 1];
    const result = await chat.sendMessageStream(lastMessage.content);

    // This robust stream processing handles the response correctly.
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const sendEvent = (type: string, data: any) =>
          data &&
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type, data })}\n\n`)
          );

        let fullResponseText = '';
        for await (const chunk of result.stream) {
          const text = chunk.text();
          sendEvent('chunk', text); // Send raw chunks for live performance metrics
          fullResponseText += text;
        }

        const reasoningMatch = fullResponseText.match(
          /<reasoning>([\s\S]*?)<\/reasoning>/
        );
        const answerMatch = fullResponseText.match(
          /<answer>([\s\S]*?)<\/answer>/
        );

        const reasoning = reasoningMatch ? reasoningMatch[1].trim() : null;
        const answer = answerMatch
          ? answerMatch[1].trim()
          : (reasoning
              ? fullResponseText.split('</reasoning>')[1] || ''
              : fullResponseText
            ).trim();

        if (reasoning) sendEvent('reasoning', reasoning);
        if (answer) sendEvent('answer', answer);

        sendEvent('done', true);
        controller.close();
      },
    });

    return new NextResponse(stream, {
      headers: { 'Content-Type': 'text/event-stream' },
    });
  } catch (error) {
    console.error('[CHAT_API_ERROR]', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred';
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error', details: errorMessage }),
      { status: 500 }
    );
  }
}
