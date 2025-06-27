// /app/page.tsx
'use client';

import AiChatInterface from '@/components/AIChatInterface';

export default function AiInterfacePage() {
  return (
    <div className="bg-[#111111] min-h-screen w-full flex items-center justify-center p-4 font-mono text-white antialiased">
      <div className="w-full max-w-7xl h-[90vh] max-h-[900px]">
        {/* The AiChatInterface component now contains all the UI and logic */}
        <AiChatInterface />
      </div>
    </div>
  );
}
