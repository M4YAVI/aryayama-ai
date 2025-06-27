// /lib/db.ts
import { ChatMessage, ChatThread, Prompt, UsageStats } from '@/types';
import Dexie, { Table } from 'dexie';

export class MySubClassedDexie extends Dexie {
  threads!: Table<ChatThread>;
  messages!: Table<ChatMessage>;
  prompts!: Table<Prompt>; // New table for prompts
  usageStats!: Table<UsageStats>; // New table for usage

  constructor() {
    super('aiChatDatabase');
    // Bump the version number due to schema change
    this.version(2).stores({
      threads: 'id, createdAt',
      messages: 'id, threadId, createdAt',
      prompts: 'id, title, createdAt',
      usageStats: 'id',
    });
  }
}

export const db = new MySubClassedDexie();
