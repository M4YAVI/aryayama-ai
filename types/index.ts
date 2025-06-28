// /types/index.ts

export interface ChatAttachment {
  type: 'image' | 'file';
  name: string;
  url: string;
}

// All clarification-related types have been removed.
export interface ChatMessage {
  id: string;
  threadId: string;
  role: 'user' | 'bot' | 'system';
  content: string;
  createdAt: Date;
  attachments?: ChatAttachment[];
  reasoning?: string;
}

export interface ChatThread {
  id: string;
  title: string;
  createdAt: Date;
  systemPrompt?: string;
}

export interface Prompt {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
}

export interface UsageStats {
  id: 'singleton';
  totalRequests: number;
  todayRequests: number;
  lastResetDate: string;
}
