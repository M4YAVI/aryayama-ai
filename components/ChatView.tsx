// /components/ChatView.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { ChatAttachment, ChatMessage, ChatThread } from '@/types';
import { motion } from 'framer-motion';
import {
  BrainCircuit,
  Image as ImageIcon,
  List,
  Mic,
  MicOff,
  Paperclip,
  Plus,
  Send,
  Square,
  X,
} from 'lucide-react';
import { FC, FormEvent, useEffect, useRef, useState } from 'react';
import ChatMessageComponent from './ChatMessage';
import ChatNavigator from './ChatNavigator';
import {
  PerformanceMetrics,
  StreamingPerformance,
} from './StreamingPerformance';
import { SystemPromptDialog } from './SystemPromptDialog';

interface ChatViewProps {
  thread: ChatThread | undefined;
  messages: ChatMessage[] | undefined;
  isStreaming: boolean;
  input: string;
  setInput: (value: string) => void;
  onSendMessage: (
    content: string,
    threadId: string,
    attachments?: ChatAttachment[]
  ) => void;
  onEditMessage: (id: string, content: string) => void;
  onDeleteMessage: (id: string) => void;
  onUpdateSystemPrompt: (prompt: string) => void;
  onStopStreaming: () => void;
  performanceMetrics: PerformanceMetrics | null;
}

const ChatView: FC<ChatViewProps> = ({
  thread,
  messages,
  isStreaming,
  input,
  setInput,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  onUpdateSystemPrompt,
  onStopStreaming,
  performanceMetrics,
}) => {
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [isNavigatorOpen, setNavigatorOpen] = useState(false);
  const [isSystemPromptOpen, setSystemPromptOpen] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const { isListening, startListening, stopListening, isSupported } =
    useSpeechRecognition({
      onResult: (transcript) => setInput(transcript),
    });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const handleSaveSystemPrompt = (newPrompt: string) => {
    onUpdateSystemPrompt(newPrompt);
    setSystemPromptOpen(false);
  };

  const handleJumpToMessage = (messageId: string) => {
    const element = document.getElementById(`message-${messageId}`);
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleRegenerate = () => {
    if (!thread || !messages || messages.length === 0) return;
    const lastUserMessage = [...messages]
      .reverse()
      .find((m) => m.role === 'user');
    if (lastUserMessage) {
      const lastBotMessage = messages[messages.length - 1];
      if (lastBotMessage.role === 'bot') onDeleteMessage(lastBotMessage.id);
      onSendMessage(
        lastUserMessage.content,
        thread.id,
        lastUserMessage.attachments
      );
    }
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'image' | 'file'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (type === 'image') {
      const reader = new FileReader();
      reader.onload = (loadEvent) =>
        setAttachments((prev) => [
          ...prev,
          {
            type: 'image',
            name: file.name,
            url: loadEvent.target?.result as string,
          },
        ]);
      reader.readAsDataURL(file);
    } else {
      setAttachments((prev) => [
        ...prev,
        { type: 'file', name: file.name, url: '' },
      ]);
    }
    e.target.value = '';
  };

  const handleSend = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if ((!input.trim() && attachments.length === 0) || !thread) return;
    onSendMessage(input, thread.id, attachments);
    setInput('');
    setAttachments([]);
  };

  return (
    <motion.div
      key={thread?.id || 'chat'}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full flex flex-col text-gray-300 bg-black"
    >
      <header className="flex-shrink-0 p-4 border-b border-gray-800 flex items-center justify-between">
        <div className="font-semibold text-white truncate pr-4">
          {thread?.title}
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isSystemPromptOpen} onOpenChange={setSystemPromptOpen}>
            <DialogTrigger asChild>
              <button
                className="p-2 text-gray-400 hover:text-white"
                title="System Prompt Settings"
              >
                <BrainCircuit size={18} />
              </button>
            </DialogTrigger>
            <SystemPromptDialog
              initialPrompt={thread?.systemPrompt || ''}
              onSave={handleSaveSystemPrompt}
            />
          </Dialog>
          <button
            onClick={() => setNavigatorOpen(true)}
            className="p-2 text-gray-400 hover:text-white"
            title="Open Chat Navigator"
          >
            <List size={18} />
          </button>
        </div>
      </header>

      <div className="flex-grow p-4 md:p-8 overflow-y-auto">
        <div className="space-y-6">
          {messages && messages.length > 0 ? (
            messages.map((msg, index) => (
              <ChatMessageComponent
                key={msg.id}
                message={msg}
                isStreaming={isStreaming && index === messages.length - 1}
                onEdit={onEditMessage}
                onDelete={onDeleteMessage}
                onRegenerate={handleRegenerate}
              />
            ))
          ) : (
            <div className="text-center text-gray-500 mt-20">
              <h2 className="text-2xl font-semibold">AI Chat</h2>
              <p>Start a conversation by typing below.</p>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </div>

      {attachments.length > 0 && (
        <div className="flex-shrink-0 p-4 border-t border-gray-800">
          <div className="flex flex-wrap gap-2">
            {attachments.map((att, index) => (
              <div
                key={index}
                className="bg-[#1C1C1C] rounded-md p-1.5 flex items-center gap-2 relative"
              >
                {att.type === 'image' ? (
                  <ImageIcon size={16} />
                ) : (
                  <Paperclip size={16} />
                )}
                <span className="text-sm text-gray-300 truncate max-w-xs">
                  {att.name}
                </span>
                <button
                  onClick={() =>
                    setAttachments((prev) => prev.filter((_, i) => i !== index))
                  }
                  className="p-0.5 bg-gray-800 rounded-full absolute -top-1 -right-1 hover:bg-red-500"
                  title={`Remove ${att.name}`}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {(isStreaming || performanceMetrics) && performanceMetrics && (
        <div className="flex-shrink-0 border-t border-gray-800">
          <StreamingPerformance metrics={performanceMetrics} />
        </div>
      )}

      <div className="flex-shrink-0 p-4 border-t border-gray-800">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            type="file"
            ref={imageInputRef}
            onChange={(e) => handleFileChange(e, 'image')}
            accept="image/*"
            className="hidden"
          />
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileChange(e, 'file')}
            className="hidden"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                disabled={isStreaming}
                className="text-gray-400 hover:text-white flex-shrink-0 disabled:opacity-50"
              >
                <Plus size={20} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#1C1C1C] border-gray-800 text-white">
              <DropdownMenuItem onClick={() => imageInputRef.current?.click()}>
                <ImageIcon className="mr-2 h-4 w-4" />
                <span>Image</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                <Paperclip className="mr-2 h-4 w-4" />
                <span>File</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isStreaming
                ? 'Generating response...'
                : 'Ask anything, or use your voice...'
            }
            disabled={isStreaming}
            className="bg-transparent w-full focus:outline-none placeholder-gray-500 disabled:opacity-50"
          />
          {isSupported && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={isStreaming}
              className="text-gray-400 hover:text-white disabled:opacity-50"
              onClick={isListening ? stopListening : startListening}
            >
              {isListening ? (
                <MicOff size={18} className="text-red-500 animate-pulse" />
              ) : (
                <Mic size={18} />
              )}
            </Button>
          )}
          {isStreaming ? (
            <Button
              type="button"
              onClick={onStopStreaming}
              variant="outline"
              className="flex-shrink-0 flex items-center gap-2 border-red-500/50 text-red-400 hover:bg-red-500/20 hover:text-red-300"
            >
              <Square size={16} className="fill-current" />
              Stop
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={!input.trim() && attachments.length === 0}
              size="icon"
              className="bg-blue-600 hover:bg-blue-500 rounded-full flex-shrink-0"
            >
              <Send size={18} />
            </Button>
          )}
        </form>
      </div>

      <ChatNavigator
        isOpen={isNavigatorOpen}
        onClose={() => setNavigatorOpen(false)}
        messages={messages || []}
        onJumpToMessage={handleJumpToMessage}
      />
    </motion.div>
  );
};

export default ChatView;
