// /hooks/useChat.ts
import { PerformanceMetrics } from '@/components/StreamingPerformance';
import { db } from '@/lib/db';
import { ChatAttachment, ChatMessage } from '@/types';
import { useLiveQuery } from 'dexie-react-hooks';
import { nanoid } from 'nanoid';
import { useCallback, useEffect, useRef, useState } from 'react';

export function useChat(initialThreadId: string | null = null) {
  const [activeThreadId, setActiveThreadId] = useState<string | null>(
    initialThreadId
  );
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [performanceMetrics, setPerformanceMetrics] =
    useState<PerformanceMetrics | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const threads = useLiveQuery(
    () => db.threads.orderBy('createdAt').reverse().toArray(),
    []
  );

  const messages = useLiveQuery(
    () =>
      activeThreadId
        ? db.messages
            .where('threadId')
            .equals(activeThreadId)
            .sortBy('createdAt')
        : [],
    [activeThreadId]
  );

  const activeThread = useLiveQuery(
    () => (activeThreadId ? db.threads.get(activeThreadId) : undefined),
    [activeThreadId]
  );

  useEffect(() => {
    if (!activeThreadId && threads && threads.length > 0) {
      setActiveThreadId(threads[0].id);
    }
  }, [threads, activeThreadId]);

  const handleStopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const handleNewChat = useCallback(async () => {
    const newThreadId = nanoid();
    await db.threads.add({
      id: newThreadId,
      title: 'New Chat',
      createdAt: new Date(),
    });
    setActiveThreadId(newThreadId);
    setSidebarOpen(true);
  }, []);

  const handleDeleteThread = useCallback(
    async (threadId: string) => {
      const newActiveThread = threads?.find((t) => t.id !== threadId);
      await db.transaction('rw', db.threads, db.messages, async () => {
        await db.threads.delete(threadId);
        await db.messages.where('threadId').equals(threadId).delete();
      });
      if (activeThreadId === threadId) {
        setActiveThreadId(newActiveThread?.id || null);
      }
    },
    [activeThreadId, threads]
  );

  const incrementRequestCount = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];
    await db.transaction('rw', db.usageStats, async () => {
      let stats = await db.usageStats.get('singleton');
      if (!stats) {
        stats = {
          id: 'singleton',
          totalRequests: 1,
          todayRequests: 1,
          lastResetDate: today,
        };
      } else {
        if (stats.lastResetDate !== today) {
          stats.todayRequests = 0;
          stats.lastResetDate = today;
        }
        stats.totalRequests += 1;
        stats.todayRequests += 1;
      }
      await db.usageStats.put(stats);
    });
  }, []);

  const clearAllData = useCallback(async () => {
    await db.delete();
    await db.open();
    window.location.reload();
  }, []);

  const handleEditMessage = async (messageId: string, newContent: string) => {
    await db.messages.update(messageId, { content: newContent });
  };

  const handleDeleteMessage = async (messageId: string) => {
    await db.messages.delete(messageId);
  };

  const handleUpdateSystemPrompt = async (prompt: string) => {
    if (activeThreadId) {
      await db.threads.update(activeThreadId, { systemPrompt: prompt });
    }
  };

  const handleSendMessage = useCallback(
    async (
      content: string,
      threadId: string,
      model: string,
      attachments?: ChatAttachment[]
    ) => {
      if (
        isStreaming ||
        (!content.trim() && (!attachments || attachments.length === 0))
      )
        return;

      const controller = new AbortController();
      abortControllerRef.current = controller;

      await incrementRequestCount();

      const userMessage: ChatMessage = {
        id: nanoid(),
        threadId,
        role: 'user',
        content,
        createdAt: new Date(),
        attachments: attachments || [],
      };
      await db.messages.add(userMessage);

      const messageCount = await db.messages
        .where('threadId')
        .equals(threadId)
        .count();
      if (messageCount === 1) {
        const newTitle =
          content.substring(0, 50) ||
          (attachments && attachments[0].name) ||
          'Untitled Chat';
        await db.threads.update(threadId, { title: newTitle });
      }

      setIsStreaming(true);
      const startTime = Date.now();
      let firstTokenTime: number | null = null;
      setPerformanceMetrics({
        timeToFirstToken: null,
        tokensPerSecond: 0,
        totalTokens: 0,
        totalTime: 0,
      });

      const messageHistory = await db.messages
        .where('threadId')
        .equals(threadId)
        .sortBy('createdAt');
      const systemPrompt = activeThread?.systemPrompt;

      const apiRequestBody = {
        model: model,
        messages: [
          ...(systemPrompt
            ? [
                {
                  role: 'system',
                  content: systemPrompt,
                  createdAt: new Date(),
                  id: '',
                  threadId: '',
                },
              ]
            : []),
          ...messageHistory,
        ],
      };

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(apiRequestBody),
          signal: controller.signal,
        });
        if (!response.ok || !response.body) {
          throw new Error(
            `API Error: ${response.status} ${response.statusText}`
          );
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        const botMessageId = nanoid();

        await db.messages.add({
          id: botMessageId,
          threadId,
          role: 'bot',
          content: '',
          reasoning: '',
          createdAt: new Date(),
        });

        let reasoningText = '';
        let answerText = '';
        let buffer = '';

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          if (firstTokenTime === null) firstTokenTime = Date.now();

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const json = JSON.parse(line.substring(6));
                if (json.type === 'reasoning') {
                  reasoningText += json.data;
                  await db.messages.update(botMessageId, {
                    reasoning: reasoningText,
                  });
                } else if (json.type === 'answer') {
                  answerText += json.data;
                  await db.messages.update(botMessageId, {
                    content: answerText,
                  });
                }
              } catch (e) {
                console.error('Failed to parse stream JSON', e);
              }
            }
          }

          const estimatedTokens = Math.round(
            (reasoningText.length + answerText.length) / 4
          );
          const elapsedTime = Date.now() - startTime;
          const tokensPerSecond = estimatedTokens / (elapsedTime / 1000) || 0;
          setPerformanceMetrics({
            timeToFirstToken: firstTokenTime
              ? (firstTokenTime - startTime) / 1000
              : null,
            tokensPerSecond: tokensPerSecond,
            totalTokens: estimatedTokens,
            totalTime: elapsedTime,
          });
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.log('Stream stopped by user.');
        } else {
          console.error('Failed to fetch bot response:', error);
          await db.messages.add({
            id: nanoid(),
            threadId,
            role: 'bot',
            content: `Sorry, I ran into a problem: ${error.message}`,
            createdAt: new Date(),
          });
        }
      } finally {
        setIsStreaming(false);
        setTimeout(() => setPerformanceMetrics(null), 5000);
        abortControllerRef.current = null;
      }
    },
    [isStreaming, activeThread, incrementRequestCount]
  );

  return {
    threads,
    activeThread,
    messages,
    input,
    setInput,
    isStreaming,
    isSidebarOpen,
    setSidebarOpen,
    handleNewChat,
    setActiveThreadId,
    handleDeleteThread,
    handleSendMessage,
    handleEditMessage,
    handleDeleteMessage,
    handleUpdateSystemPrompt,
    clearAllData,
    handleStopStreaming,
    performanceMetrics,
  };
}
