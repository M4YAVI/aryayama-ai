// /components/StreamingPerformance.tsx
'use client';

import { motion } from 'framer-motion';
import { Gauge } from 'lucide-react';
import { FC } from 'react';

export interface PerformanceMetrics {
  timeToFirstToken: number | null;
  tokensPerSecond: number;
  totalTokens: number;
  totalTime: number;
}

interface StreamingPerformanceProps {
  metrics: PerformanceMetrics;
}

const StatItem: FC<{ value: string | number; label: string }> = ({
  value,
  label,
}) => (
  <div className="flex items-center gap-2">
    <span className="font-bold text-white text-sm">{value}</span>
    <span className="text-gray-400 text-xs tracking-wider">{label}</span>
  </div>
);

export const StreamingPerformance: FC<StreamingPerformanceProps> = ({
  metrics,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.2 }}
      className="flex items-center gap-4 px-4 py-2 text-sm text-gray-300"
    >
      <Gauge className="text-cyan-400" size={18} />
      <div className="h-4 w-px bg-gray-700" />

      <StatItem
        value={
          metrics.timeToFirstToken ? metrics.timeToFirstToken.toFixed(2) : '-'
        }
        label="SEC TO FIRST TOKEN"
      />
      <div className="h-4 w-px bg-gray-700" />

      <StatItem
        value={Math.round(metrics.tokensPerSecond)}
        label="TOKENS/SEC"
      />
      <div className="h-4 w-px bg-gray-700" />

      <StatItem value={metrics.totalTokens} label="TOKENS" />
      <div className="h-4 w-px bg-gray-700" />

      <StatItem value={(metrics.totalTime / 1000).toFixed(2)} label="SEC" />
    </motion.div>
  );
};
