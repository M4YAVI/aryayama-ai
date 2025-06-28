'use client';

import { useChat } from '@/hooks/useChat';
import { PanelLeftOpen } from 'lucide-react';
import { useState } from 'react';
import ChatView from './ChatView';
import { CommandKSearch } from './CommandKSearch';
import { PromptLibrary } from './PromptLibrary';
import Sidebar from './Sidebar';
import { UsageTracker } from './UsageTracker';

export default function AiChatInterface() {
  const [isCommandKOpen, setCommandKOpen] = useState(false);
  const [isUsageOpen, setUsageOpen] = useState(false);
  const [isLibraryOpen, setLibraryOpen] = useState(false);

  const {
    threads,
    activeThread,
    messages,
    input,
    setInput,
    isStreaming,
    isSidebarOpen,
    setSidebarOpen,
    handleNewChat,
    setActiveThreadId,
    handleDeleteThread,
    handleSendMessage,
    handleEditMessage,
    handleDeleteMessage,
    handleUpdateSystemPrompt,
    clearAllData,
    handleStopStreaming,
    performanceMetrics,
  } = useChat();

  return (
    <>
      <CommandKSearch
        open={isCommandKOpen}
        setOpen={setCommandKOpen}
        onSelectPrompt={(promptContent) =>
          setInput(input ? `${input.trim()} ${promptContent}` : promptContent)
        }
        setLibraryOpen={setLibraryOpen}
        setUsageOpen={setUsageOpen}
        onClearData={clearAllData}
      />
      <UsageTracker open={isUsageOpen} setOpen={setUsageOpen} />
      <PromptLibrary
        open={isLibraryOpen}
        setOpen={setLibraryOpen}
        onSelectPrompt={(promptContent) =>
          setInput(input ? `${input.trim()} ${promptContent}` : promptContent)
        }
      />

      <div className="w-full h-full bg-black border border-gray-800 rounded-xl shadow-2xl flex relative overflow-hidden">
        {!isSidebarOpen && (
          <div className="absolute top-2 left-2 z-20">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-gray-400 hover:text-white bg-[#111] rounded-md"
              title="Open Sidebar"
            >
              <PanelLeftOpen size={20} />
            </button>
          </div>
        )}

        <Sidebar
          threads={threads}
          activeThreadId={activeThread?.id || null}
          onNewChat={handleNewChat}
          onSelectThread={setActiveThreadId}
          onDeleteThread={handleDeleteThread}
          isOpen={isSidebarOpen}
          setIsOpen={setSidebarOpen}
          onOpenCommandK={() => setCommandKOpen(true)}
        />

        <main className="flex-grow h-full min-w-0">
          {activeThread ? (
            <ChatView
              key={activeThread.id}
              thread={activeThread}
              messages={messages}
              isStreaming={isStreaming}
              input={input}
              setInput={setInput}
              onSendMessage={handleSendMessage}
              onEditMessage={handleEditMessage}
              onDeleteMessage={handleDeleteMessage}
              onUpdateSystemPrompt={handleUpdateSystemPrompt}
              onStopStreaming={handleStopStreaming}
              performanceMetrics={performanceMetrics}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 pl-12">
              <h2 className="text-2xl font-semibold">Welcome to AI Chat</h2>
              <p>Select a chat or start a new one to begin.</p>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
