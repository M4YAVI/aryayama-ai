// /components/ChatNavigator.tsx
'use client';

import { ChatMessage } from '@/lib/types';
import { AnimatePresence, motion } from 'framer-motion';
import { CornerDownRight, X } from 'lucide-react';
import { FC } from 'react';

interface ChatNavigatorProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onJumpToMessage: (messageId: string) => void;
}

const ChatNavigator: FC<ChatNavigatorProps> = ({
  isOpen,
  onClose,
  messages,
  onJumpToMessage,
}) => {
  const userPrompts = messages.filter((msg) => msg.role === 'user');

  const handleJump = (id: string) => {
    onJumpToMessage(id);
    onClose();
  };

  const backdropVariants = {
    visible: { opacity: 1 },
    hidden: { opacity: 0 },
  };

  const drawerVariants = {
    visible: { x: 0 },
    hidden: { x: '100%' },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-30"
            aria-hidden="true"
          />
          <motion.div
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            className="fixed top-0 right-0 h-full w-80 bg-[#1C1C1C] border-l border-gray-800 z-40 flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-labelledby="navigator-title"
          >
            <header className="flex items-center justify-between p-4 border-b border-gray-800 flex-shrink-0">
              <h2
                id="navigator-title"
                className="text-lg font-semibold text-white"
              >
                Chat Navigator
              </h2>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:bg-gray-700 rounded-md"
              >
                <X size={20} />
              </button>
            </header>
            <div className="flex-grow overflow-y-auto p-2">
              {userPrompts.length > 0 ? (
                <ul>
                  {userPrompts.map((prompt) => (
                    <li key={prompt.id}>
                      <button
                        onClick={() => handleJump(prompt.id)}
                        className="w-full text-left flex items-start gap-2 p-2 rounded-md hover:bg-gray-700/50"
                      >
                        <CornerDownRight
                          size={16}
                          className="text-gray-500 mt-1 flex-shrink-0"
                        />
                        <p className="text-sm text-gray-300 truncate">
                          {prompt.content}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center text-gray-500 p-4">
                  <p>No prompts sent yet.</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ChatNavigator;
