// ============================================================
// src/utils/soundUtils.ts — Audio playback helper
// ============================================================

export const playSound = (url: string): void => {
  const audio = new Audio(url);
  audio.play().catch((e) => console.warn('Sound playback prevented:', e));
};
