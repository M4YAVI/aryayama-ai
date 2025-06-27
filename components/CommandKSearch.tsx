// /components/CommandKSearch.tsx
'use client';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  BookMarked,
  MessageSquareText,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { useEffect } from 'react';
import { ClearData } from './ClearData'; // We'll need this for the trigger

interface CommandKSearchProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onSelectPrompt: (content: string) => void;
  // Functions to open other dialogs
  setLibraryOpen: (open: boolean) => void;
  setUsageOpen: (open: boolean) => void;
  onClearData: () => void;
}

export function CommandKSearch({
  open,
  setOpen,
  onSelectPrompt,
  setLibraryOpen,
  setUsageOpen,
  onClearData,
}: CommandKSearchProps) {
  const prompts = useLiveQuery(() =>
    db.prompts.orderBy('createdAt').reverse().toArray()
  );

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prevOpen) => !prevOpen);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [setOpen]);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search prompts or run commands..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* --- Actions Group --- */}
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => runCommand(() => setLibraryOpen(true))}>
            <BookMarked className="mr-2 h-4 w-4" />
            <span>Prompt Library</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setUsageOpen(true))}>
            <TrendingUp className="mr-2 h-4 w-4" />
            <span>View Usage</span>
          </CommandItem>
          {/* We wrap the trigger in a CommandItem for styling */}
          <ClearData onClear={() => runCommand(onClearData)}>
            <CommandItem
              className="text-red-500 aria-selected:text-red-500"
              onSelect={(e) => {
                // We need to prevent the default behavior so the dialog can open
                e.preventDefault();
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Clear All Data</span>
            </CommandItem>
          </ClearData>
        </CommandGroup>

        {/* --- Prompts Group --- */}
        <CommandGroup heading="My Prompts">
          {prompts?.map((prompt) => (
            <CommandItem
              key={prompt.id}
              onSelect={() => runCommand(() => onSelectPrompt(prompt.content))}
            >
              <MessageSquareText className="mr-2 h-4 w-4" />
              <span>{prompt.title}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
