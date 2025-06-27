// /types/index.ts

export interface ChatAttachment {
  type: 'image' | 'file';
  name: string;
  url: string;
}

export interface ChatMessage {
  id: string;
  threadId: string;
  role: 'user' | 'bot' | 'system';
  content: string;
  createdAt: Date;
  attachments?: ChatAttachment[];
  reasoning?: string; // NEW: To store the AI's thought process
}

export interface ChatThread {
  id: string;
  title: string;
  createdAt: Date;
  systemPrompt?: string;
}

// --- NEW TYPES ---
export interface Prompt {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
}

export interface UsageStats {
  id: 'singleton'; // Use a fixed ID to ensure only one document
  totalRequests: number;
  todayRequests: number;
  lastResetDate: string; // Store date as ISO string e.g., '2023-10-27'
}
