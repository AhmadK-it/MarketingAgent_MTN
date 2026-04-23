// ============================================================
// src/components/ContentCard.tsx
// Platform content card with action buttons
// ============================================================

import React from 'react';
import { Copy, FileText, RotateCcw, Share2 } from 'lucide-react';
import type { PlatformDef, BrandSettings } from '../types';

interface ContentCardProps {
  platform: PlatformDef;
  content: string;
  modelLabel: string;
  brand: BrandSettings;
  onCopy: () => void;
  onExportPDF: () => void;
  onRegenerate: () => void;
  onExportPackage?: () => void;
}

const ContentCard: React.FC<ContentCardProps> = ({
  platform,
  content,
  modelLabel,
  brand,
  onCopy,
  onExportPDF,
  onRegenerate,
  onExportPackage,
}) => (
  <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
    {/* Header bar */}
    <div
      className={`px-4 py-2 text-white text-xs font-bold flex items-center justify-between ${platform.color}`}
    >
      <div className="flex items-center gap-2">
        {platform.icon}
        <span>{platform.label}</span>
        <span className="opacity-80 font-normal">({modelLabel})</span>
      </div>
      <div className="flex gap-1">
        <ActionBtn onClick={onCopy} title="نسخ">
          <Copy className="w-4 h-4" />
        </ActionBtn>
        <ActionBtn onClick={onExportPDF} title="تحميل PDF">
          <FileText className="w-4 h-4" />
        </ActionBtn>
        <ActionBtn onClick={onRegenerate} title="إعادة توليد">
          <RotateCcw className="w-4 h-4" />
        </ActionBtn>
        {onExportPackage && (
          <ActionBtn onClick={onExportPackage} title="تصدير حزمة">
            <Share2 className="w-4 h-4" />
          </ActionBtn>
        )}
      </div>
    </div>

    {/* Content body */}
    <div
      className={`p-6 bg-slate-50 whitespace-pre-wrap leading-relaxed dark:bg-mtn-black/30 dark:text-white ${brand.size} ${brand.weight}`}
      style={{ fontFamily: brand.font, color: brand.color }}
    >
      {content}
    </div>
  </div>
);

const ActionBtn: React.FC<{
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ onClick, title, children }) => (
  <button
    onClick={onClick}
    title={title}
    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
  >
    {children}
  </button>
);

export default ContentCard;
