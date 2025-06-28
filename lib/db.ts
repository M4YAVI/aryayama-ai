// /lib/db.ts
import { ChatMessage, ChatThread, Prompt, UsageStats } from '@/types';
import Dexie, { Table } from 'dexie';

export class AiChatDatabase extends Dexie {
  threads!: Table<ChatThread>;
  messages!: Table<ChatMessage>;
  prompts!: Table<Prompt>;
  usageStats!: Table<UsageStats>;

  constructor() {
    super('aiChatDatabase');
    this.version(4).stores({
      threads: 'id, createdAt',
      messages: 'id, threadId, createdAt, reasoning',
      prompts: 'id, title, createdAt',
      usageStats: 'id',
    });
  }
}

// Create a single, globally-accessible instance of the database.
// This ensures that `db` is never null or undefined after its initial creation.
const createDb = () => {
  const db = new AiChatDatabase();
  return db;
};

// Export the singleton instance.
export const db = createDb();
