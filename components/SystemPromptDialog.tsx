// /components/SystemPromptDialog.tsx
'use client';

import { Button } from '@/components/ui/button';
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { BrainCircuit } from 'lucide-react';
import { FC, useEffect, useState } from 'react';

interface SystemPromptDialogProps {
  // The current system prompt value from the parent
  initialPrompt: string;
  // Callback to save the updated prompt. The parent will handle closing the dialog.
  onSave: (newPrompt: string) => void;
}

export const SystemPromptDialog: FC<SystemPromptDialogProps> = ({
  initialPrompt,
  onSave,
}) => {
  const [prompt, setPrompt] = useState(initialPrompt);

  // Sync internal state if the initial prompt changes (e.g., when switching chat threads)
  useEffect(() => {
    setPrompt(initialPrompt);
  }, [initialPrompt]);

  const handleSaveClick = () => {
    onSave(prompt);
  };

  return (
    <DialogContent className="bg-[#1C1C1C] border-gray-800 text-white flex flex-col max-h-[70vh]">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <BrainCircuit size={20} />
          System Prompt
        </DialogTitle>
        <DialogDescription className="text-gray-400">
          Define the AI's personality and instructions. This persists for the
          entire chat.
        </DialogDescription>
      </DialogHeader>

      <div className="flex-grow overflow-y-auto pr-2">
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., You are a senior developer who explains complex topics simply..."
          className="w-full h-full resize-none bg-black/20 border-gray-700 focus:ring-blue-500 min-h-[200px] no-scrollbar"
        />
      </div>

      <DialogFooter>
        {/* Using DialogClose is the idiomatic way to create a cancel button */}
        <DialogClose asChild>
          <Button variant="ghost">Cancel</Button>
        </DialogClose>
        <Button onClick={handleSaveClick}>Save</Button>
      </DialogFooter>
    </DialogContent>
  );
};
