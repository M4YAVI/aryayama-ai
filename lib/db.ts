// /lib/db.ts
import { ChatMessage, ChatThread, Prompt, UsageStats } from '@/types';
import Dexie, { Table } from 'dexie';

export class MySubClassedDexie extends Dexie {
  threads!: Table<ChatThread>;
  messages!: Table<ChatMessage>;
  prompts!: Table<Prompt>;
  usageStats!: Table<UsageStats>;

  constructor() {
    super('aiChatDatabase');
    // --- BUMP THE VERSION NUMBER TO 3 ---
    this.version(3).stores({
      threads: 'id, createdAt',
      // Add 'reasoning' to the messages schema
      messages: 'id, threadId, createdAt, reasoning',
      prompts: 'id, title, createdAt',
      usageStats: 'id',
    });
  }
}

// Only initialize the database on the client-side
let db: MySubClassedDexie | null = null;

if (typeof window !== 'undefined') {
  db = new MySubClassedDexie();
}

export { db };