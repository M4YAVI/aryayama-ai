// /components/ChatMessage.tsx
'use client';
import { ChatMessage } from '@/types';
import { motion } from 'framer-motion';
import {
  Bot,
  Check,
  Clipboard,
  Edit,
  Paperclip,
  RefreshCw,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { FC, useEffect, useRef, useState } from 'react';
import MarkdownRenderer from './MarkdownRenderer';

interface ChatMessageProps {
  message: ChatMessage;
  isStreaming: boolean;
  onEdit: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onRegenerate: () => void;
}

const ChatMessageComponent: FC<ChatMessageProps> = ({
  message,
  isStreaming,
  onEdit,
  onDelete,
  onRegenerate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
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
  };

  return (
    <motion.div
      id={`message-${message.id}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`group flex items-start gap-4 ${
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
        className={`rounded-lg max-w-2xl w-full text-white ${
          isBot ? 'bg-[#1C1C1C]' : 'bg-blue-600'
        }`}
      >
        {message.attachments && message.attachments.length > 0 && (
          <div className="p-3 border-b border-black/20">
            <div className="flex flex-wrap gap-2">
              {message.attachments.map((att, index) =>
                att.type === 'image' ? (
                  <img
                    key={index}
                    src={att.url}
                    alt={att.name}
                    className="max-w-xs max-h-48 rounded-md object-cover"
                  />
                ) : (
                  <div
                    key={index}
                    className="bg-black/20 p-2 rounded-md flex items-center gap-2"
                  >
                    <Paperclip size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-300">{att.name}</span>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        <div className="p-3">
          {isEditing ? (
            <div className="flex flex-col gap-2">
              <textarea
                ref={textareaRef}
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full bg-transparent border border-gray-600 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none text-white text-sm"
                rows={1}
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={handleSaveEdit}
                  className="p-1.5 hover:bg-gray-700 rounded-md"
                >
                  <Check size={16} />
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="p-1.5 hover:bg-gray-700 rounded-md"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ) : (
            <>
              {message.content && (
                <MarkdownRenderer content={message.content} />
              )}
              {isStreaming && isBot && (
                <motion.div
                  className="ml-1 inline-block bg-white w-1 h-4 align-text-bottom"
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}
            </>
          )}
        </div>
      </div>

      <div
        className={`flex-shrink-0 self-center flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${
          isBot ? 'order-last ml-2' : ''
        }`}
      >
        {!isEditing && (
          <>
            <button
              onClick={handleCopy}
              className="p-1.5 hover:bg-gray-700 rounded-md"
            >
              <Clipboard size={16} />
            </button>
            {!isBot && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-1.5 hover:bg-gray-700 rounded-md"
              >
                <Edit size={16} />
              </button>
            )}
            <button
              onClick={() => onDelete(message.id)}
              className="p-1.5 hover:bg-gray-700 rounded-md"
            >
              <Trash2 size={16} />
            </button>
            {isBot && !isStreaming && (
              <button
                onClick={onRegenerate}
                className="p-1.5 hover:bg-gray-700 rounded-md"
              >
                <RefreshCw size={16} />
              </button>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};

export default ChatMessageComponent;
