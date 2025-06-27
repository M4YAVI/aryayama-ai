// /components/PromptLibrary.tsx
'use client';

import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  ChevronDown,
  ChevronUp,
  CornerDownLeft,
  Plus,
  Trash2,
} from 'lucide-react';
import { nanoid } from 'nanoid';
import { FC, useState } from 'react';

interface PromptLibraryProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onSelectPrompt: (promptContent: string) => void;
}

export const PromptLibrary: FC<PromptLibraryProps> = ({
  open,
  setOpen,
  onSelectPrompt,
}) => {
  const prompts = useLiveQuery(
    () => db.prompts.orderBy('createdAt').reverse().toArray(),
    []
  );
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return;
    await db.prompts.add({
      id: nanoid(),
      title,
      content,
      createdAt: new Date(),
    });
    // Reset form and close collapsible
    setTitle('');
    setContent('');
    setIsFormOpen(false);
  };

  const handleDelete = async (id: string) => {
    await db.prompts.delete(id);
  };

  const handleInsert = (promptContent: string) => {
    onSelectPrompt(promptContent);
    setOpen(false); // Close the library dialog after inserting
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl h-[70vh] flex flex-col bg-[#1C1C1C] border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle>Prompt Library</DialogTitle>
          <DialogDescription>
            Manage your reusable prompts. Insert them directly into your chat.
          </DialogDescription>
        </DialogHeader>

        {/* --- Collapsible "Add New" Form --- */}
        <Collapsible
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          className="flex-shrink-0 border-b border-gray-800"
        >
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-4">
              <span>Add New Prompt</span>
              {isFormOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent className="p-4 pt-0">
            {/* --- FIX: Wrapped the form content in a flex container --- */}
            <div className="space-y-4 flex flex-col">
              <div className="space-y-2">
                <Label htmlFor="prompt-title">Title</Label>
                <Input
                  id="prompt-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., React Component Explainer"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prompt-content">Content</Label>
                {/* --- FIX: Added max-h-* and overflow-y-auto to the Textarea --- */}
                <Textarea
                  id="prompt-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="You are a senior React developer..."
                  className="resize-none h-32 max-h-48 overflow-y-auto no-scrollbar"
                />
              </div>
              <Button
                onClick={handleSave}
                className="w-full flex items-center gap-2"
              >
                <Plus size={16} />
                Save Prompt
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* --- Saved Prompts List (This part is now guaranteed to get the remaining space) --- */}
        <div className="flex-grow overflow-y-auto mt-4 space-y-2 pr-2 no-scrollbar">
          {prompts && prompts.length > 0 ? (
            prompts.map((prompt) => (
              <div
                key={prompt.id}
                className="group p-3 bg-black/30 rounded-lg flex justify-between items-center gap-2"
              >
                <div className="flex-grow overflow-hidden">
                  <h4 className="font-semibold truncate">{prompt.title}</h4>
                  <p className="text-sm text-gray-400 line-clamp-1">
                    {prompt.content}
                  </p>
                </div>
                <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-white"
                    onClick={() => handleInsert(prompt.content)}
                    title="Insert Prompt"
                  >
                    <CornerDownLeft size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:bg-red-500/20 hover:text-red-400"
                    onClick={() => handleDelete(prompt.id)}
                    title="Delete Prompt"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-10">
              <p>Your prompt library is empty.</p>
              <p>Click "Add New Prompt" to save your first one.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
