// /components/PromptLibrary.tsx
'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Trash2 } from 'lucide-react';
import { nanoid } from 'nanoid';
import { useState } from 'react';

interface PromptLibraryProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function PromptLibrary({ open, setOpen }: PromptLibraryProps) {
  const prompts = useLiveQuery(
    () => db.prompts.orderBy('createdAt').reverse().toArray(),
    []
  );
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
    setTitle('');
    setContent('');
  };

  const handleDelete = async (id: string) => {
    await db.prompts.delete(id);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl h-[70vh] flex flex-col bg-[#1C1C1C] border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle>Prompt Library</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-6 flex-grow overflow-hidden">
          {/* Saved Prompts List */}
          <div className="flex flex-col gap-2 overflow-y-auto pr-2">
            <h3 className="font-semibold text-gray-300">Saved Prompts</h3>
            {prompts?.map((prompt) => (
              <div
                key={prompt.id}
                className="group p-3 bg-black/30 rounded-lg flex justify-between items-start"
              >
                <div>
                  <h4 className="font-semibold truncate">{prompt.title}</h4>
                  <p className="text-sm text-gray-400 line-clamp-2">
                    {prompt.content}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-500 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-400"
                  onClick={() => handleDelete(prompt.id)}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}
          </div>
          {/* New Prompt Form */}
          <div className="flex flex-col gap-4 border-l border-gray-800 pl-6">
            <h3 className="font-semibold text-gray-300">Add New Prompt</h3>
            <div className="space-y-2">
              <Label htmlFor="prompt-title">Title</Label>
              <Input
                id="prompt-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., React Component Explainer"
              />
            </div>
            <div className="space-y-2 flex-grow flex flex-col">
              <Label htmlFor="prompt-content">Content</Label>
              <Textarea
                id="prompt-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="You are a senior React developer..."
                className="flex-grow resize-none"
              />
            </div>
            <Button onClick={handleSave} className="flex items-center gap-2">
              <Plus size={16} />
              Save Prompt
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
