// /hooks/useChat.ts
import { db } from '@/lib/db';
import { ChatAttachment, ChatMessage } from '@/types';
import { useLiveQuery } from 'dexie-react-hooks';
import { nanoid } from 'nanoid';
import { useCallback, useEffect, useState } from 'react';

export function useChat(initialThreadId: string | null = null) {
  const [activeThreadId, setActiveThreadId] = useState<string | null>(
    initialThreadId
  );
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  // Live queries to keep UI in sync with the database
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

  // Automatically select the first chat thread on initial load
  useEffect(() => {
    if (!activeThreadId && threads && threads.length > 0) {
      setActiveThreadId(threads[0].id);
    }
  }, [threads, activeThreadId]);

  // Function to create a new chat
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

  // Function to delete a chat thread and all its messages
  const handleDeleteThread = useCallback(
    async (threadId: string) => {
      const newActiveThread = threads?.find((t) => t.id !== threadId);
      await db.transaction('rw', db.threads, db.messages, async () => {
        await db.threads.delete(threadId);
        await db.messages.where('threadId').equals(threadId).delete();
      });
      // If we deleted the active thread, switch to another one
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
        // Initialize if it doesn't exist
        stats = {
          id: 'singleton',
          totalRequests: 1,
          todayRequests: 1,
          lastResetDate: today,
        };
      } else {
        // Reset daily count if the date has changed
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

  // Function to completely wipe the database
  const clearAllData = useCallback(async () => {
    await db.delete(); // Deletes the entire database
    await db.open(); // Re-creates an empty database
    window.location.reload(); // Reload the app to reset all state
  }, []);

  // Main function to send a message
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

      // Track this request
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

      // If it's the first message, update the thread title automatically
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

          const chunk = decoder.decode(value, { stream: true });
          botMessageContent += chunk;
          await db.messages.update(botMessageId, {
            content: botMessageContent,
          });
        }
      } catch (error) {
        console.error('Failed to fetch bot response:', error);
        await db.messages.add({
          id: nanoid(),
          threadId,
          role: 'bot',
          content: 'Sorry, I ran into a problem. Please try again.',
          createdAt: new Date(),
        });
      } finally {
        setIsStreaming(false);
      }
    },
    [isStreaming, activeThread, incrementRequestCount]
  );

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
  };
}
