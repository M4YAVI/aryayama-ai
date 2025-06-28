'use client';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChatMessage } from '@/types';
import { motion } from 'framer-motion';
import {
  Bot,
  Check,
  ChevronDown,
  Clipboard,
  Edit,
  RefreshCw,
  Sparkles,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { FC, useEffect, useRef, useState } from 'react';
import MarkdownRenderer from './MarkdownRenderer';

interface ChatMessageProps {
  message: ChatMessage;
  isStreaming: boolean;
  isLastMessage: boolean;
  onEdit: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onRegenerate: () => void;
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

const ThinkingSkeleton: FC = () => (
  <div className="flex items-center gap-2 p-3 text-gray-400">
    <div className="w-2 h-2 bg-current rounded-full animate-pulse [animation-delay:-0.3s]" />
    <div className="w-2 h-2 bg-current rounded-full animate-pulse [animation-delay:-0.15s]" />
    <div className="w-2 h-2 bg-current rounded-full animate-pulse" />
  </div>
);

// A small, styled action button component for reuse
const ActionButton: FC<{
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ onClick, title, children }) => (
  <button
    onClick={onClick}
    title={title}
    className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-md transition-colors"
  >
    {children}
  </button>
);

const ChatMessageComponent: FC<ChatMessageProps> = ({
  message,
  isStreaming,
  isLastMessage,
  onEdit,
  onDelete,
  onRegenerate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isBot = message.role === 'bot';

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [isEditing, editedContent]);

  const handleSaveEdit = () => {
    if (editedContent.trim() && editedContent.trim() !== message.content) {
      onEdit(message.id, editedContent.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedContent(message.content);
    setIsEditing(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Render a dedicated editing UI for a cleaner separation of concerns
  if (isEditing) {
    return (
      <div className="flex w-full items-start gap-4 flex-row-reverse">
        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-blue-600">
          <User size={20} />
        </div>
        <div className="rounded-lg max-w-4xl w-full text-white bg-blue-600 p-3">
          <div className="flex flex-col gap-2">
            <textarea
              ref={textareaRef}
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full bg-transparent border border-white/20 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-white/50 resize-none text-white text-sm"
              rows={1}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={handleSaveEdit}
                className="p-1.5 hover:bg-white/20 rounded-md"
              >
                <Check size={16} />
              </button>
              <button
                onClick={handleCancelEdit}
                className="p-1.5 hover:bg-white/20 rounded-md"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render the standard message display
  return (
    <motion.div
      id={`message-${message.id}`}
      variants={itemVariants}
      layout
      className="group flex flex-col gap-1.5"
    >
      {/* Message Bubble Row */}
      <div
        className={`flex w-full items-start gap-4 ${
          isBot ? '' : 'flex-row-reverse'
        }`}
      >
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isBot ? 'bg-gray-800' : 'bg-blue-600'
          }`}
        >
          {isBot ? <Bot size={20} /> : <User size={20} />}
        </div>
        <div
          className={`rounded-lg max-w-4xl w-full text-white ${
            isBot ? 'bg-[#1C1C1C]' : 'bg-blue-600'
          }`}
        >
          {isBot && message.reasoning && (
            <Collapsible>
              <CollapsibleTrigger className="group w-full flex justify-between items-center p-3 text-sm text-yellow-400 hover:bg-black/20 rounded-t-lg data-[state=open]:bg-black/20">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} />
                  <span>Reasoning</span>
                </div>
                <ChevronDown
                  size={16}
                  className="group-data-[state=open]:rotate-180 transition-transform"
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="p-3 border-t border-black/30 bg-black/10">
                <MarkdownRenderer content={message.reasoning} />
              </CollapsibleContent>
            </Collapsible>
          )}
          <div className="p-3">
            {isBot ? (
              <>
                {isStreaming && !message.content ? (
                  <ThinkingSkeleton />
                ) : (
                  <MarkdownRenderer content={message.content} />
                )}
                {isStreaming && message.content && (
                  <span className="ml-1 inline-block bg-white w-0.5 h-4 align-text-bottom animate-blink" />
                )}
              </>
            ) : (
              <MarkdownRenderer content={message.content} />
            )}
          </div>
        </div>
      </div>

      {/* Action Bar - appears on hover */}
      <div
        className={`flex items-center gap-1.5 transition-opacity duration-200 opacity-0 group-hover:opacity-100 ${
          isBot ? 'pl-12' : 'pr-12 self-end'
        }`}
      >
        {isBot ? (
          <>
            <ActionButton
              onClick={handleCopy}
              title={isCopied ? 'Copied!' : 'Copy'}
            >
              {isCopied ? (
                <Check size={16} className="text-green-400" />
              ) : (
                <Clipboard size={16} />
              )}
            </ActionButton>
            <ActionButton onClick={() => onDelete(message.id)} title="Delete">
              <Trash2 size={16} />
            </ActionButton>
            {isLastMessage && !isStreaming && (
              <ActionButton onClick={onRegenerate} title="Regenerate">
                <RefreshCw size={16} />
              </ActionButton>
            )}
          </>
        ) : (
          <>
            <ActionButton onClick={() => setIsEditing(true)} title="Edit">
              <Edit size={16} />
            </ActionButton>
            <ActionButton
              onClick={handleCopy}
              title={isCopied ? 'Copied!' : 'Copy'}
            >
              {isCopied ? (
                <Check size={16} className="text-green-400" />
              ) : (
                <Clipboard size={16} />
              )}
            </ActionButton>
            <ActionButton onClick={() => onDelete(message.id)} title="Delete">
              <Trash2 size={16} />
            </ActionButton>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default ChatMessageComponent;
