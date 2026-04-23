// ============================================================
// src/types.ts — Shared TypeScript types for Hi MTN AI
// ============================================================

export type ContentOption = {
  sales: string;
  engagement: string;
  viral: string;
};

export type StrategyData = {
  captions: Record<string, ContentOption>;
  scripts: Record<string, ContentOption>;
  hooks: string[];
  stories: Record<string, ContentOption>;
  imagePrompt: string;
  summary: string;
  videoRequest?: {
    visualPrompt: string;
    audioScript: string;
    sceneDuration: string;
  };
};

export type InputMode = 'text' | 'image';

export type ActiveTab =
  | 'caption'
  | 'script'
  | 'hook'
  | 'story'
  | 'summary'
  | 'video_request'
  | 'image_editor'
  | 'reference_result';

export type ActiveModel = 'sales' | 'engagement' | 'viral';

export type RequestType =
  | 'all'
  | 'caption'
  | 'image'
  | 'script'
  | 'video'
  | 'prompt_extract';

export type ImageAspectRatio = '1:1' | '16:9' | '9:16';

export type PlatformDef = {
  id: string;
  label: string;
  color: string;
  /** React node rendered as an icon */
  icon: React.ReactNode;
};

export type BrandSettings = {
  font: string;
  size: string;
  color: string;
  weight: string;
};

export type ToastState = {
  message: string;
  visible: boolean;
};
