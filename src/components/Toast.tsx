// ============================================================
// src/components/Toast.tsx — Lightweight toast notification
// ============================================================

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check } from 'lucide-react';

interface ToastProps {
  message: string;
  visible: boolean;
}

const Toast: React.FC<ToastProps> = ({ message, visible }) => (
  <AnimatePresence>
    {visible && (
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.9 }}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 bg-mtn-blue text-white px-6 py-4 rounded-2xl shadow-2xl font-bold text-lg"
      >
        <Check className="w-5 h-5 text-mtn-yellow shrink-0" />
        {message}
      </motion.div>
    )}
  </AnimatePresence>
);

export default Toast;
