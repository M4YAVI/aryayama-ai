// /components/ClearData.tsx
'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface ClearDataProps {
  onClear: () => void;
  children: React.ReactNode;
}

export function ClearData({ onClear, children }: ClearDataProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent className="bg-[#1C1C1C] border-gray-800 text-white">
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription className="text-gray-400">
            This action cannot be undone. This will permanently delete all your
            chat threads, messages, saved prompts, and usage data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="ghost">Cancel</Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button variant="destructive" onClick={onClear}>
              Continue
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
