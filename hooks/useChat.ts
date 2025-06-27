// /hooks/useChat.ts
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

  // Ref to hold the AbortController for the current fetch request
  const abortControllerRef = useRef<AbortController | null>(null);

  // Dexie live queries to automatically update the UI when the database changes
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

  // Effect to automatically select the first chat thread on initial load
  useEffect(() => {
    if (!activeThreadId && threads && threads.length > 0) {
      setActiveThreadId(threads[0].id);
    }
  }, [threads, activeThreadId]);

  // Function to abort the current streaming fetch request
  const handleStopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Function to create a new, empty chat thread
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

  // Function to delete a chat thread and all associated messages
  const handleDeleteThread = useCallback(
    async (threadId: string) => {
      const newActiveThread = threads?.find((t) => t.id !== threadId);
      await db.transaction('rw', db.threads, db.messages, async () => {
        await db.threads.delete(threadId);
        await db.messages.where('threadId').equals(threadId).delete();
      });
      // If we deleted the active thread, switch to another one or to null
      if (activeThreadId === threadId) {
        setActiveThreadId(newActiveThread?.id || null);
      }
    },
    [activeThreadId, threads]
  );

  // Function to track API usage stats
  const incrementRequestCount = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
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

  // Function to completely wipe all application data from the browser
  const clearAllData = useCallback(async () => {
    await db.delete();
    await db.open();
    window.location.reload(); // Reload the app to reset all component state
  }, []);

  // Function to handle editing a message's content
  const handleEditMessage = async (messageId: string, newContent: string) => {
    await db.messages.update(messageId, { content: newContent });
  };

  // Function to handle deleting a single message
  const handleDeleteMessage = async (messageId: string) => {
    await db.messages.delete(messageId);
  };

  // Function to update the system prompt for the active thread
  const handleUpdateSystemPrompt = async (prompt: string) => {
    if (activeThreadId) {
      await db.threads.update(activeThreadId, { systemPrompt: prompt });
    }
  };

  // Main function to send a message to the AI and handle the streaming response
  const handleSendMessage = useCallback(
    async (
      content: string,
      threadId: string,
      attachments?: ChatAttachment[]
    ) => {
      if (
        isStreaming ||
        (!content.trim() && (!attachments || attachments.length === 0))
      )
        return;

      // Create a new controller for this specific request
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

      const messageHistory = await db.messages
        .where('threadId')
        .equals(threadId)
        .sortBy('createdAt');
      const systemPrompt = activeThread?.systemPrompt;

      const apiRequestBody = {
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          ...messageHistory.map((m) => ({ role: m.role, content: m.content })),
        ],
      };

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(apiRequestBody),
          signal: controller.signal, // Pass the signal to the fetch request
        });

        if (!response.ok || !response.body) {
          throw new Error(`API Error: ${response.statusText}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let botMessageContent = '';
        const botMessageId = nanoid();

        await db.messages.add({
          id: botMessageId,
          threadId,
          role: 'bot',
          content: '',
          createdAt: new Date(),
        });

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          botMessageContent += decoder.decode(value, { stream: true });
          await db.messages.update(botMessageId, {
            content: botMessageContent,
          });
        }
      } catch (error: any) {
        // Gracefully handle user-initiated aborts
        if (error.name === 'AbortError') {
          console.log('Stream stopped by user.');
        } else {
          console.error('Failed to fetch bot response:', error);
          await db.messages.add({
            id: nanoid(),
            threadId,
            role: 'bot',
            content: 'Sorry, I ran into a problem. Please try again.',
            createdAt: new Date(),
          });
        }
      } finally {
        // This block runs whether the stream completes or is aborted
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [isStreaming, activeThread, incrementRequestCount]
  );

  // Return all state and functions to be used by the UI components
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
  };
}
