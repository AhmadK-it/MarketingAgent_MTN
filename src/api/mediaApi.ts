// ============================================================
// src/api/mediaApi.ts — Image generation, TTS, and image analysis
// ============================================================

import { Type, Modality } from '@google/genai';
import { genAI, IMAGE_MODEL, TTS_MODEL, STRATEGY_MODEL } from '../constants';
import { extractImageFromResponse } from '../utils/imageUtils';
import type { ImageAspectRatio } from '../types';

// ── Image generation from text prompt ────────────────────────

export const generateImageFromPrompt = async (
  prompt: string,
  aspectRatio: ImageAspectRatio
): Promise<string | null> => {
  try {
    const response = await genAI.models.generateContent({
      model: IMAGE_MODEL,
      contents: [
        {
          parts: [
            {
              text: `Generate a single, high-quality, 4K, photorealistic marketing photo. Authentic commercial style — not AI-looking. ${prompt}. Cinematic lighting, professional finish.`,
            },
          ],
        },
      ],
      config: { imageConfig: { aspectRatio } },
    });

    return extractImageFromResponse(response);
  } catch (error: any) {
    if (error?.status === 429) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return generateImageFromPrompt(prompt, aspectRatio);
    }
    throw error;
  }
};

// ── Professional image from uploaded product image ────────────

export const generateProfessionalImage = async (
  prompt: string,
  originalImageBase64: string,
  mimeType: string,
  aspectRatio: ImageAspectRatio,
  productNotes: string
): Promise<string | null> => {
  const response = await genAI.models.generateContent({
    model: IMAGE_MODEL,
    contents: {
      parts: [
        { inlineData: { data: originalImageBase64, mimeType } },
        {
          text: `Transform this product image into a single, high-quality, 4K, photorealistic marketing photo. Authentic style — not AI-looking. ${prompt}. ${productNotes ? `Customer instructions: ${productNotes}.` : ''} Cinematic lighting, commercial style.`,
        },
      ],
    },
    config: { imageConfig: { aspectRatio } },
  });

  return extractImageFromResponse(response);
};

// ── Image transformation with extracted style prompt ──────────

export const transformImageWithStyle = async (
  productImageBase64: string,
  mimeType: string,
  stylePromptEn: string,
  aspectRatio: ImageAspectRatio
): Promise<string | null> => {
  const response = await genAI.models.generateContent({
    model: IMAGE_MODEL,
    contents: {
      parts: [
        { inlineData: { data: productImageBase64, mimeType } },
        {
          text: `Transform this product image using the following professional style prompt: ${stylePromptEn}. Maintain the product's identity but apply the lighting, mood, and composition described.`,
        },
      ],
    },
    config: { imageConfig: { aspectRatio } },
  });

  return extractImageFromResponse(response);
};

// ── Text-to-Speech ────────────────────────────────────────────

export const generateAudio = async (
  text: string,
  voiceInstructions: string
): Promise<string | null> => {
  const response = await genAI.models.generateContent({
    model: TTS_MODEL,
    contents: [
      {
        parts: [
          {
            text: `Say in Arabic: ${text}. Voice instructions: ${voiceInstructions || 'cheerful tone, natural pacing'}`,
          },
        ],
      },
    ],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
      },
    },
  });

  const base64Audio =
    response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) return null;

  const blob = await fetch(`data:audio/wav;base64,${base64Audio}`).then((r) =>
    r.blob()
  );
  return URL.createObjectURL(blob);
};

// ── Reference image analysis (prompt extraction) ─────────────

export const analyzeReferenceImage = async (
  imageBase64: string,
  mimeType: string
): Promise<{ ar: string; en: string }> => {
  const response = await genAI.models.generateContent({
    model: STRATEGY_MODEL,
    contents: {
      parts: [
        { inlineData: { data: imageBase64, mimeType } },
        {
          text: "Analyze this image and extract a professional marketing prompt describing its style, lighting, composition, and mood. Return JSON with keys 'ar' (Arabic) and 'en' (English).",
        },
      ],
    },
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          ar: { type: Type.STRING },
          en: { type: Type.STRING },
        },
      },
    },
  });

  return JSON.parse(response.text ?? '{}') as { ar: string; en: string };
};
