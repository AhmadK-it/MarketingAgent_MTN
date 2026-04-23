// ============================================================
// src/components/Header.tsx
// ============================================================

import React from 'react';
import { motion } from 'motion/react';
import { Sun, Moon } from 'lucide-react';
import logo from '/media/logo.svg';
import { CLICK_SOUND } from '../constants';
import { playSound } from '../utils/soundUtils';

interface HeaderProps {
  darkMode: boolean;
  onToggleDark: () => void;
}

const Header: React.FC<HeaderProps> = ({ darkMode, onToggleDark }) => (
  <header className="bg-mtn-silver dark:bg-mtn-grey border-b-4 border-mtn-yellow sticky top-0 z-50 shadow-2xl">
    <div className="max-w-6xl mx-auto px-6 h-28 flex items-center justify-between">
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-5"
      >
        <div className="w-16 h-16 rounded-2xl bg-mtn-yellow flex items-center justify-center shadow-2xl border-4 border-mtn-blue animate-logo-pulse shrink-0 overflow-hidden">
          <img src={logo} alt="MTN Logo" className="w-full h-full object-contain p-1" />
        </div>
        <h1 className="text-[36px] font-black tracking-tight text-mtn-blue dark:text-mtn-blue-lighter">
          Hi MTN AI
        </h1>
      </motion.div>

      <button
        onClick={() => {
          playSound(CLICK_SOUND);
          onToggleDark();
        }}
        className="p-4 rounded-2xl bg-mtn-silver dark:bg-mtn-grey hover:scale-110 transition-all shadow-lg btn-interactive border-2 border-mtn-blue/20 dark:border-mtn-blue-light/40"
        aria-label="Toggle dark mode"
      >
        {darkMode ? (
          <Sun className="w-8 h-8 text-mtn-yellow" />
        ) : (
          <Moon className="w-8 h-8 text-mtn-blue" />
        )}
      </button>
    </div>
  </header>
);

export default Header;
