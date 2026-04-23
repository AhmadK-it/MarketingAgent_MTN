// ============================================================
// src/api/strategyApi.ts — Strategy & content generation
// ============================================================

import { Type } from '@google/genai';
import { genAI, STRATEGY_MODEL } from '../constants';
import type { StrategyData, RequestType } from '../types';

// ── JSON response schema (shared across all request types) ────
const STRATEGY_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    captions: {
      type: Type.OBJECT,
      properties: {
        instagram: platformContentSchema(),
        facebook: platformContentSchema(),
        twitter: platformContentSchema(),
        linkedin: platformContentSchema(),
      },
    },
    scripts: {
      type: Type.OBJECT,
      properties: {
        tiktok: platformContentSchema(),
        reels: platformContentSchema(),
      },
    },
    hooks: { type: Type.ARRAY, items: { type: Type.STRING } },
    stories: {
      type: Type.OBJECT,
      properties: {
        instagram: platformContentSchema(),
        facebook: platformContentSchema(),
        snapchat: platformContentSchema(),
      },
    },
    imagePrompt: { type: Type.STRING },
    summary: { type: Type.STRING },
    videoRequest: {
      type: Type.OBJECT,
      properties: {
        visualPrompt: { type: Type.STRING },
        audioScript: { type: Type.STRING },
        sceneDuration: { type: Type.STRING },
      },
    },
  },
};

function platformContentSchema() {
  return {
    type: Type.OBJECT,
    properties: {
      sales: { type: Type.STRING },
      engagement: { type: Type.STRING },
      viral: { type: Type.STRING },
    },
  };
}

// ── Prompt builders ───────────────────────────────────────────

const CTA_DIRECTIVE =
  'استخدم لغة عربية بيضاء بسيطة، جذابة، وقريبة من لهجة الجمهور السوري. اعتمد دائماً دعوة لاتخاذ إجراء (CTA) واضحة، وتوافق مع معايير SEO.';

export const buildStrategyPrompt = (
  requestType: RequestType,
  productName: string,
  productNotes: string,
  extractedPrompt?: { ar: string; en: string } | null
): string => {
  const notesLine = productNotes
    ? `ملاحظات إضافية من العميل: [${productNotes}]`
    : '';

  const empty = {
    captions: '- captions: {}',
    scripts: '- scripts: {}',
    hooks: '- hooks: []',
    stories: '- stories: {}',
  };

  switch (requestType) {
    case 'all':
      return `أنت خبير استراتيجي في التسويق الرقمي. ${CTA_DIRECTIVE}
قم بتوليد استراتيجية محتوى كاملة وشاملة لـ [${productName}] بتنسيق JSON لجميع المنصات.
لكل منصة ولّد 3 نماذج: sales (بيع مباشر)، engagement (تفاعل وتأثير عاطفي)، viral (انتشار وترند).
${notesLine}
- captions: (instagram, facebook, twitter, linkedin) × (sales, engagement, viral)
- scripts: (tiktok, reels) × (sales, engagement, viral)
- hooks: 5 عناوين خاطفة
- stories: (instagram, facebook, snapchat) × (sales, engagement, viral)
- imagePrompt: وصف تفصيلي بالإنجليزية لصورة احترافية للمنتج
- summary: ملخص تنفيذي شامل`;

    case 'caption':
      return `أنت خبير كتابة محتوى تسويقي. ${CTA_DIRECTIVE}
قم بتوليد كابشن لـ [${productName}] لجميع المنصات بتنسيق JSON.
${notesLine}
- captions: (instagram, facebook, twitter, linkedin) × (sales, engagement, viral)
- hooks: 3 عناوين خاطفة
- imagePrompt: وصف بالإنجليزية لصورة احترافية
- summary: ملخص قصير
${empty.scripts}
${empty.stories}`;

    case 'script':
      return `أنت خبير سكريبتات فيديو. ${CTA_DIRECTIVE}
قم بتوليد سكريبتات فيديو لـ [${productName}] بتنسيق JSON.
${notesLine}
- scripts: (tiktok, reels) × (sales, engagement, viral)
- hooks: 3 عناوين خاطفة
- imagePrompt: وصف بالإنجليزية لصورة احترافية
- summary: ملخص قصير
${empty.captions}
${empty.stories}`;

    case 'image':
      return `أنت مصمم جرافيك محترف. قم بتوليد وصف صورة لـ [${productName}] بتنسيق JSON.
${notesLine}
- imagePrompt: وصف تفصيلي بالإنجليزية لصورة احترافية
- summary: وصف للصورة المقترحة وكيفية استخدامها
${empty.captions}
${empty.scripts}
${empty.hooks}
${empty.stories}`;

    case 'video':
      return `أنت خبير محتوى بصري. ${CTA_DIRECTIVE}
قم بتوليد خطة فيديو لـ [${productName}] بتنسيق JSON.
${notesLine}
- videoRequest: { visualPrompt (EN), audioScript, sceneDuration }
- summary: ملخص فكرة الفيديو
- imagePrompt: وصف بالإنجليزية للـ Thumbnail
${empty.captions}
${empty.scripts}
${empty.hooks}
${empty.stories}`;

    case 'prompt_extract':
      return `أنت خبير تحويل الصور التسويقية. ${CTA_DIRECTIVE}
النمط المستخرج: [${extractedPrompt?.ar ?? ''}].
الهدف: تطبيق هذا النمط على المنتج [${productName}].
${notesLine}
- imagePrompt: وصف بالإنجليزية بناءً على النمط [${extractedPrompt?.en ?? ''}] والمنتج
- summary: وصف كيفية تطبيق النمط على المنتج الجديد
- captions: (instagram, facebook, twitter, linkedin) × (sales, engagement, viral)
${empty.scripts}
${empty.hooks}
${empty.stories}`;

    default:
      return '';
  }
};

// ── Main generation function ──────────────────────────────────

export const generateStrategyRequest = async (
  prompt: string,
  imageData?: { base64: string; mimeType: string } | null
): Promise<StrategyData> => {
  const contents = imageData
    ? {
        parts: [
          {
            text:
              'حلل هذا المنتج وولد استراتيجية تسويقية كاملة. ' + prompt,
          },
          {
            inlineData: {
              data: imageData.base64,
              mimeType: imageData.mimeType,
            },
          },
        ],
      }
    : prompt;

  const response = await genAI.models.generateContent({
    model: STRATEGY_MODEL,
    contents,
    config: {
      responseMimeType: 'application/json',
      responseSchema: STRATEGY_SCHEMA,
    },
  });

  return JSON.parse(response.text ?? '{}') as StrategyData;
};

// ── Regeneration helper ───────────────────────────────────────

export const regeneratePartRequest = async (
  productName: string,
  part: string,
  activeModel: string,
  currentContent: string,
  feedback: string,
  platform?: string
): Promise<string> => {
  const prompt = `أنت خبير استراتيجي في التسويق الرقمي. ${CTA_DIRECTIVE}
المنتج: [${productName}]
الجزء المراد إعادة توليده: [${part}]${platform ? ` للمنصة: [${platform}] بأسلوب: [${activeModel}]` : ''}
المحتوى الحالي:
"${currentContent}"

ملاحظات المستخدم:
"${feedback || 'إعادة توليد بنسخة مختلفة وأكثر إبداعاً'}"

قم بإعادة توليد هذا الجزء فقط. أرجع النتيجة كنص عربي فقط بلا مقدمات.`;

  const response = await genAI.models.generateContent({
    model: STRATEGY_MODEL,
    contents: prompt,
  });

  return response.text ?? '';
};
