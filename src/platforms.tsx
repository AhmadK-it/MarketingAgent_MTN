// ============================================================
// src/platforms.tsx — Platform metadata used across the app
// ============================================================

import React from 'react';
import { Instagram, Twitter, Facebook, Linkedin, Ghost } from 'lucide-react';
import type { PlatformDef } from './types';

/** TikTok SVG icon — extracted to avoid React.cloneElement issues */
const TikTokIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.6-4.13-1.47-.13-.08-.26-.17-.38-.26v7.02c.01 2.85-1.56 5.73-4.41 6.76-2.52.96-5.6.39-7.59-1.54-2-2-2.35-5.44-.79-7.85 1.36-2.22 4.29-3.23 6.76-2.43v4.14c-.88-.34-1.91-.21-2.66.38-.65.44-1.02 1.24-1.02 2.03 0 .89.42 1.81 1.21 2.22.71.39 1.61.3 2.27-.18.57-.43.84-1.15.84-1.85V.02z" />
  </svg>
);

/**
 * Ordered list of social platforms used for rendering sidebars,
 * content cards, and filtering strategy results.
 */
export const PLATFORMS: PlatformDef[] = [
  {
    id: 'instagram',
    label: 'إنستغرام',
    color: 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600',
    icon: <Instagram className="w-5 h-5" />,
  },
  {
    id: 'facebook',
    label: 'فيسبوك',
    color: 'bg-blue-600',
    icon: <Facebook className="w-5 h-5" />,
  },
  {
    id: 'linkedin',
    label: 'لينكد إن',
    color: 'bg-[#0077b5]',
    icon: <Linkedin className="w-5 h-5" />,
  },
  {
    id: 'tiktok',
    label: 'تيك توك',
    color: 'bg-black',
    icon: <TikTokIcon className="w-5 h-5" />,
  },
  {
    id: 'twitter',
    label: 'تويتر (X)',
    color: 'bg-slate-900',
    icon: <Twitter className="w-5 h-5" />,
  },
  {
    id: 'snapchat',
    label: 'سناب شات',
    color: 'bg-yellow-400',
    icon: <Ghost className="w-5 h-5" />,
  },
];
