// ============================================================
// src/components/ModelSelector.tsx
// Toggles between sales / engagement / viral content modes
// ============================================================

import React from 'react';
import { Target, MessageSquare, Zap } from 'lucide-react';
import type { ActiveModel } from '../types';

const MODEL_OPTIONS: { id: ActiveModel; label: string; icon: React.ReactNode }[] = [
  { id: 'sales', label: 'بيعي', icon: <Target className="w-4 h-4" /> },
  { id: 'engagement', label: 'تفاعلي', icon: <MessageSquare className="w-4 h-4" /> },
  { id: 'viral', label: 'انتشار', icon: <Zap className="w-4 h-4" /> },
];

interface ModelSelectorProps {
  value: ActiveModel;
  onChange: (model: ActiveModel) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ value, onChange }) => (
  <div className="flex gap-2 bg-mtn-silver dark:bg-mtn-black p-1 rounded-xl border border-mtn-blue/20 dark:border-mtn-blue-light/20">
    {MODEL_OPTIONS.map((m) => (
      <button
        key={m.id}
        onClick={() => onChange(m.id)}
        className={`flex items-center justify-center gap-2 py-1.5 px-4 rounded-lg font-bold text-xs transition-all
          ${
            value === m.id
              ? 'bg-mtn-blue dark:bg-mtn-blue-lighter text-white dark:text-mtn-black shadow-lg'
              : 'text-mtn-blue/50 dark:text-mtn-blue-lighter/50 hover:text-mtn-blue dark:hover:text-mtn-blue-lighter'
          }`}
      >
        {m.icon}
        {m.label}
      </button>
    ))}
  </div>
);

export default ModelSelector;
