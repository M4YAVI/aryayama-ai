// /components/UsageTracker.tsx
'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Calendar, TrendingUp } from 'lucide-react';

interface UsageTrackerProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function UsageTracker({ open, setOpen }: UsageTrackerProps) {
  const stats = useLiveQuery(() => db.usageStats.get('singleton'), []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md bg-[#1C1C1C] border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle>API Usage</DialogTitle>
          <DialogDescription>
            Your request count for today and overall.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
            <div className="flex items-center gap-3">
              <Calendar className="text-gray-400" />
              <span className="font-medium">Today's Requests</span>
            </div>
            <span className="font-bold text-lg">
              {stats?.todayRequests || 0}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
            <div className="flex items-center gap-3">
              <TrendingUp className="text-gray-400" />
              <span className="font-medium">Total Requests</span>
            </div>
            <span className="font-bold text-lg">
              {stats?.totalRequests || 0}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
