// /components/ClarificationDialog.tsx
'use client';

import { ClarificationPayload } from '@/types';
import { motion } from 'framer-motion';
import { FC, useState } from 'react';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface ClarificationDialogProps {
  request: ClarificationPayload;
  onRespond: (details: string, skip: boolean) => void;
}

export const ClarificationDialog: FC<ClarificationDialogProps> = ({
  request,
  onRespond,
}) => {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState('');

  const handleCheckboxChange = (option: string, checked: boolean) => {
    setSelectedOptions((prev) =>
      checked ? [...prev, option] : prev.filter((o) => o !== option)
    );
  };

  const handleSend = () => {
    const parts = [...selectedOptions];
    if (customInput.trim()) {
      parts.push(customInput.trim());
    }
    onRespond(parts.join(', '), false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-shrink-0 p-6 border-t border-gray-800 bg-black/50"
    >
      <div className="max-w-3xl mx-auto bg-[#1C1C1C] p-6 rounded-lg border border-gray-700">
        <h3 className="text-lg font-semibold mb-4">{request.question}</h3>
        <div className="space-y-3 mb-4">
          {request.options.map((option) => (
            <div key={option} className="flex items-center gap-3">
              <Checkbox
                id={option}
                onCheckedChange={(checked) =>
                  handleCheckboxChange(option, !!checked)
                }
              />
              <Label htmlFor={option} className="font-normal text-gray-300">
                {option}
              </Label>
            </div>
          ))}
        </div>
        {request.allowCustom && (
          <div className="space-y-2">
            <Label htmlFor="custom-clarification">
              Other (please specify):
            </Label>
            <Input
              id="custom-clarification"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Your specific requirement..."
            />
          </div>
        )}
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => onRespond('', true)}>
            Skip
          </Button>
          <Button
            onClick={handleSend}
            disabled={selectedOptions.length === 0 && !customInput.trim()}
          >
            Send
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
