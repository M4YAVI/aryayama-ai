// /components/Sidebar.tsx
'use client';

import { Input } from '@/components/ui/input';
import { ChatThread } from '@/types';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Command,
  MessageSquare,
  PanelLeftClose,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { FC, useState } from 'react';

interface SidebarProps {
  threads: ChatThread[] | undefined;
  activeThreadId: string | null;
  onNewChat: () => void;
  onSelectThread: (id: string) => void;
  onDeleteThread: (id: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onOpenCommandK: () => void;
}

const Sidebar: FC<SidebarProps> = ({
  threads,
  activeThreadId,
  onNewChat,
  onSelectThread,
  onDeleteThread,
  isOpen,
  setIsOpen,
  onOpenCommandK,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredThreads = threads?.filter((thread) =>
    thread.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '-100%', width: 0 }}
          animate={{ x: 0, width: '16rem' }}
          exit={{ x: '-100%', width: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="bg-[#1C1C1C] flex-shrink-0 h-full flex flex-col border-r border-gray-800 overflow-hidden"
        >
          {/* Header Section */}
          <div className="p-4 flex-shrink-0 flex justify-between items-center border-b border-gray-800">
            <h2 className="text-lg font-semibold text-white">Chats</h2>
            <div className="flex items-center gap-1">
              <button
                onClick={onNewChat}
                className="p-2 text-gray-300 hover:bg-gray-700 rounded-md"
                title="New Chat"
              >
                <Plus size={20} />
              </button>
              <button
                onClick={onOpenCommandK}
                className="p-2 text-gray-300 hover:bg-gray-700 rounded-md"
                title="Search & Commands (Cmd+K)"
              >
                <Command size={20} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-300 hover:bg-gray-700 rounded-md"
                title="Collapse Sidebar"
              >
                <PanelLeftClose size={20} />
              </button>
            </div>
          </div>

          {/* Search Bar Section */}
          <div className="p-2 flex-shrink-0 border-b border-gray-800">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search chats..."
                className="pl-9 bg-black/20 border-gray-700 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Chat Threads List */}
          <div className="flex-grow overflow-y-auto p-2">
            <nav>
              {filteredThreads?.map((thread) => (
                <div
                  key={thread.id}
                  onClick={() => onSelectThread(thread.id)}
                  className={`group flex items-center justify-between p-2 rounded-md cursor-pointer mb-1 ${
                    activeThreadId === thread.id
                      ? 'bg-blue-600/30 text-white'
                      : 'hover:bg-gray-700/50 text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <MessageSquare size={16} className="flex-shrink-0" />
                    <span className="text-sm truncate">{thread.title}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteThread(thread.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-red-500/50 text-gray-400 hover:text-white flex-shrink-0"
                    title="Delete Chat"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </nav>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Sidebar;
