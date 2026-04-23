// ============================================================
// src/constants.ts — App-wide constants and AI client
// ============================================================

import { GoogleGenAI } from '@google/genai';

// ── Sound URLs ───────────────────────────────────────────────
export const CLICK_SOUND =
  'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3';
export const SUCCESS_SOUND =
  'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3';

// ── Gemini model identifiers ──────────────────────────────────
/** General-purpose text / JSON generation */
export const STRATEGY_MODEL = 'gemini-3-flash-preview';
/** Multimodal image-generation model */
export const IMAGE_MODEL = 'gemini-2.5-flash-image';
/** Text-to-speech model */
export const TTS_MODEL = 'gemini-3-flash-preview-tts';

// ── Gemini AI client (singleton) ──────────────────────────────
export const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY ?? '',
});

// ── LocalStorage keys ─────────────────────────────────────────
export const LS_KEYS = {
  darkMode: 'mshakas_darkMode',
  brandFont: 'mshakas_brandFont',
  brandSize: 'mshakas_brandSize',
  brandColor: 'mshakas_brandColor',
  brandWeight: 'mshakas_brandWeight',
  selectedPlatform: 'mshakas_selectedPlatform',
} as const;
