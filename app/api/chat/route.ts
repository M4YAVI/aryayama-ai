// /app/api/chat/route.ts
import { ChatMessage } from '@/types';
import { Content, GoogleGenerativeAI, Part } from '@google/generative-ai';
import { NextResponse } from 'next/server';

// --- API Key Management ---
const apiKeys =
  process.env.GEMINI_API_KEYS?.split(',')
    .map((key) => key.trim())
    .filter((key) => key.length > 0) || [];
let currentKeyIndex = 0;
const failedKeys = new Set<string>();

function getNextValidKey(): string | null {
  if (apiKeys.length === 0) {
    throw new Error(
      'GEMINI_API_KEYS environment variable is not set or empty.'
    );
  }

  // Try to find a working key
  for (let attempts = 0; attempts < apiKeys.length; attempts++) {
    const key = apiKeys[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;

    if (!failedKeys.has(key)) {
      console.log(`Using API key index: ${currentKeyIndex - 1}`);
      return key;
    }
  }

  // If all keys have failed, reset and try again
  console.log('All keys have failed, resetting failed keys list');
  failedKeys.clear();
  return apiKeys[0];
}

// --- Structured Prompt for Reasoning ---
const REASONING_PROMPT = `
You are an intelligent assistant. Your task is to process the user's request and provide a helpful response.
Before providing the final answer, you MUST first explain your thought process and reasoning for the upcoming response.
This reasoning should be enclosed in <reasoning> XML tags.
After the reasoning, provide the final answer to the user, enclosed in <answer> XML tags.
`;

// Helper to convert our ChatMessage format into Google's format
function buildHistory(messages: ChatMessage[]): Content[] {
  return messages.map((msg) => ({
    role: msg.role === 'bot' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));
}

async function attemptChat(
  modelName: string,
  messages: ChatMessage[],
  maxRetries: number = 3
): Promise<ReadableStream> {
  let lastError: Error | null = null;

  for (let retry = 0; retry < maxRetries; retry++) {
    const apiKey = getNextValidKey();
    if (!apiKey) {
      throw new Error('No valid API keys available');
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: REASONING_PROMPT,
      });

      const history = buildHistory(messages.slice(0, -1));
      const lastMessage = messages[messages.length - 1];

      const promptParts: Part[] = [{ text: lastMessage.content }];
      if (lastMessage.attachments) {
        for (const attachment of lastMessage.attachments) {
          if (attachment.type === 'image' && attachment.url) {
            const [meta, base64Data] = attachment.url.split(',');
            const mimeType = meta.match(/:(.*?);/)?.[1] ?? 'image/jpeg';
            promptParts.push({ inlineData: { mimeType, data: base64Data } });
          }
        }
      }

      const chat = model.startChat({ history });
      const result = await chat.sendMessageStream(promptParts);

      // If we get here, the API call was successful
      return createResponseStream(result);
    } catch (error: any) {
      lastError = error;
      console.error(`Attempt ${retry + 1} failed:`, error.message);

      // If it's an API key error, mark this key as failed
      if (
        error.message?.includes('API_KEY_INVALID') ||
        error.message?.includes('API key not valid')
      ) {
        failedKeys.add(apiKey);
        console.log(`Marked API key as failed: ${apiKey.substring(0, 10)}...`);
      }

      // Don't retry for non-API key errors
      if (!error.message?.includes('API') && !error.message?.includes('key')) {
        throw error;
      }
    }
  }

  throw lastError || new Error('All API keys failed');
}

function createResponseStream(result: any): ReadableStream {
  return new ReadableStream({
    async start(controller) {
      let buffer = '';
      let reasoningText = '';
      let isReasoningClosed = false;
      let isInAnswerTag = false;

      try {
        for await (const chunk of result.stream) {
          buffer += chunk.text();

          if (!isReasoningClosed) {
            const endReasoningTag = '</reasoning>';
            const endReasoningIndex = buffer.indexOf(endReasoningTag);

            if (endReasoningIndex !== -1) {
              const startReasoningTag = '<reasoning>';
              const startReasoningIndex = buffer.indexOf(startReasoningTag);
              if (startReasoningIndex !== -1) {
                reasoningText = buffer.substring(
                  startReasoningIndex + startReasoningTag.length,
                  endReasoningIndex
                );
                controller.enqueue(
                  `data: ${JSON.stringify({
                    type: 'reasoning',
                    data: reasoningText,
                  })}\n\n`
                );
              }

              buffer = buffer.substring(
                endReasoningIndex + endReasoningTag.length
              );
              isReasoningClosed = true;
            }
          }

          if (isReasoningClosed) {
            const startAnswerTag = '<answer>';
            const endAnswerTag = '</answer>';

            if (!isInAnswerTag) {
              const startAnswerIndex = buffer.indexOf(startAnswerTag);
              if (startAnswerIndex !== -1) {
                buffer = buffer.substring(
                  startAnswerIndex + startAnswerTag.length
                );
                isInAnswerTag = true;
              }
            }

            if (isInAnswerTag) {
              const endAnswerIndex = buffer.indexOf(endAnswerTag);
              if (endAnswerIndex !== -1) {
                const answerContent = buffer.substring(0, endAnswerIndex);
                if (answerContent.trim()) {
                  controller.enqueue(
                    `data: ${JSON.stringify({
                      type: 'answer',
                      data: answerContent,
                    })}\n\n`
                  );
                }
                buffer = buffer.substring(endAnswerIndex + endAnswerTag.length);
                isInAnswerTag = false;
              } else if (buffer.trim().length > 0) {
                controller.enqueue(
                  `data: ${JSON.stringify({
                    type: 'answer',
                    data: buffer,
                  })}\n\n`
                );
                buffer = '';
              }
            }
          }
        }

        // Send any remaining buffer content
        if (buffer.trim().length > 0 && isInAnswerTag) {
          controller.enqueue(
            `data: ${JSON.stringify({ type: 'answer', data: buffer })}\n\n`
          );
        }

        controller.enqueue(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
      } catch (error) {
        console.error('Stream processing error:', error);
        controller.enqueue(
          `data: ${JSON.stringify({
            type: 'error',
            data: 'Stream processing failed',
          })}\n\n`
        );
      } finally {
        controller.close();
      }
    },
  });
}

export async function POST(req: Request) {
  try {
    const { messages, model: modelName } = (await req.json()) as {
      messages: ChatMessage[];
      model: string;
    };

    if (!messages || messages.length === 0) {
      return new NextResponse('No messages provided', { status: 400 });
    }
    if (!modelName) {
      return new NextResponse('No model specified', { status: 400 });
    }

    console.log(`Processing chat request with model: ${modelName}`);
    console.log(`Available API keys: ${apiKeys.length}`);

    const stream = await attemptChat(modelName, messages);

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[CHAT_API_ERROR]', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred';

    return new NextResponse(
      JSON.stringify({
        error: 'Internal Server Error',
        details: errorMessage,
        suggestion: 'Please check your API keys configuration',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
