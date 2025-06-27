// /components/AiChatInterface.tsx
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
  // State for controlling the visibility of various dialogs/modals
  const [isCommandKOpen, setCommandKOpen] = useState(false);
  const [isUsageOpen, setUsageOpen] = useState(false);
  const [isLibraryOpen, setLibraryOpen] = useState(false);

  // The main hook that provides all application logic and state
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
  } = useChat();

  return (
    <>
      {/* --- MODAL/DIALOG COMPONENTS --- */}
      {/* These components are rendered here but are invisible until their 'open' state is true. */}

      <CommandKSearch
        open={isCommandKOpen}
        setOpen={setCommandKOpen}
        onSelectPrompt={(promptContent) => {
          // Appends selected prompt to the input, or sets it if input is empty
          setInput(input ? `${input.trim()} ${promptContent}` : promptContent);
        }}
        setLibraryOpen={setLibraryOpen}
        setUsageOpen={setUsageOpen}
        onClearData={clearAllData}
      />

      <UsageTracker open={isUsageOpen} setOpen={setUsageOpen} />

      <PromptLibrary
        open={isLibraryOpen}
        setOpen={setLibraryOpen}
        onSelectPrompt={(promptContent) => {
          setInput(input ? `${input.trim()} ${promptContent}` : promptContent);
        }}
      />

      {/* --- MAIN UI LAYOUT --- */}
      <div className="w-full h-full bg-black border border-gray-800 rounded-xl shadow-2xl flex relative overflow-hidden">
        {/* Button to open the sidebar when it's closed */}
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

        {/* The main sidebar for navigation */}
        <Sidebar
          threads={threads}
          activeThreadId={activeThread?.id || null}
          onNewChat={handleNewChat}
          onSelectThread={setActiveThreadId}
          onDeleteThread={handleDeleteThread}
          isOpen={isSidebarOpen}
          setIsOpen={setSidebarOpen}
          onOpenCommandK={() => setCommandKOpen(true)} // Pass handler to open CommandK
        />

        {/* The main content area where chats are displayed */}
        <main className="flex-grow h-full min-w-0">
          {activeThread ? (
            // If a chat is active, render the ChatView
            <ChatView
              key={activeThread.id} // Re-mount component when thread changes
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
            />
          ) : (
            // If no chat is active, show a welcome/placeholder screen
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
