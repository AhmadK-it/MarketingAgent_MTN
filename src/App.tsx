/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { jsPDF } from "jspdf";
import JSZip from "jszip";
import { 
  Rocket, 
  Target, 
  Zap, 
  MessageSquare, 
  Share2, 
  BarChart3, 
  AlertCircle, 
  Loader2,
  ArrowLeft,
  Instagram,
  Twitter,
  Video,
  Facebook,
  Lightbulb,
  ShieldCheck,
  Image as ImageIcon,
  Type as TypeIcon,
  Clapperboard,
  Magnet,
  Smartphone,
  Send,
  Download,
  FileVideo,
  Upload,
  Play,
  ClipboardList,
  Sparkles,
  Volume2,
  Camera,
  Palette,
  Baseline,
  Crop,
  Maximize,
  Filter,
  Check,
  X,
  RotateCcw,
  Scissors,
  Type as FontIcon,
  FileText,
  Copy,
  Ghost,
  Linkedin,
  Sun,
  Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import Cropper from 'react-easy-crop';
import confetti from 'canvas-confetti';

// Initialize Gemini AI
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const CLICK_SOUND = "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3";
const SUCCESS_SOUND = "https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3";

const playSound = (url: string) => {
  const audio = new Audio(url);
  audio.play().catch(e => console.log("Sound play prevented", e));
};

type ContentOption = {
  sales: string;
  engagement: string;
  viral: string;
};

type StrategyData = {
  captions: { [key: string]: ContentOption };
  scripts: { [key: string]: ContentOption };
  hooks: string[];
  stories: { [key: string]: ContentOption };
  imagePrompt: string;
  summary: string;
  videoRequest?: {
    visualPrompt: string;
    audioScript: string;
    sceneDuration: string;
  };
};

export default function App() {
  const [productName, setProductName] = useState('');
  const [strategy, setStrategy] = useState<StrategyData | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [extractedPrompt, setExtractedPrompt] = useState<{ ar: string, en: string } | null>(null);
  const [targetProductImage, setTargetProductImage] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<'text' | 'image'>('text');
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [transforming, setTransforming] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [brandLogo, setBrandLogo] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'caption' | 'script' | 'hook' | 'story' | 'summary' | 'video_request' | 'image_editor' | 'reference_result'>('caption');
  const [activeModel, setActiveModel] = useState<'sales' | 'engagement' | 'viral'>('sales');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('instagram');
  const [requestType, setRequestType] = useState<'all' | 'caption' | 'image' | 'script' | 'video' | 'prompt_extract'>('all');

  // Branding State
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('mshakas_darkMode') === 'true';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('mshakas_darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('mshakas_darkMode', 'false');
    }
  }, [darkMode]);

  // Branding State
  const [brandFont, setBrandFont] = useState('Tajawal');
  const [brandSize, setBrandSize] = useState('text-lg');
  const [brandColor, setBrandColor] = useState('#00678f');
  const [brandWeight, setBrandWeight] = useState('font-normal');
  const [restrictedWords, setRestrictedWords] = useState('');
  const [essentialKeywords, setEssentialKeywords] = useState('');
  const [productNotes, setProductNotes] = useState('');
  const [voiceInstructions, setVoiceInstructions] = useState('');
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageAspectRatio, setImageAspectRatio] = useState<'1:1' | '16:9' | '9:16'>('1:1');
  const [stylePreset, setStylePreset] = useState('photorealistic');
  const [negativePrompt, setNegativePrompt] = useState('');

  // Persistence: Load preferences on mount
  useEffect(() => {
    const savedFont = localStorage.getItem('mshakas_brandFont');
    const savedSize = localStorage.getItem('mshakas_brandSize');
    const savedColor = localStorage.getItem('mshakas_brandColor');
    const savedWeight = localStorage.getItem('mshakas_brandWeight');
    const savedPlatform = localStorage.getItem('mshakas_selectedPlatform');

    if (savedFont) setBrandFont(savedFont);
    if (savedSize) setBrandSize(savedSize);
    if (savedColor) setBrandColor(savedColor);
    if (savedWeight) setBrandWeight(savedWeight);
    if (savedPlatform) setSelectedPlatform(savedPlatform);
  }, []);

  // Persistence: Save preferences on change
  useEffect(() => {
    localStorage.setItem('mshakas_brandFont', brandFont);
    localStorage.setItem('mshakas_brandSize', brandSize);
    localStorage.setItem('mshakas_brandColor', brandColor);
    localStorage.setItem('mshakas_brandWeight', brandWeight);
    localStorage.setItem('mshakas_selectedPlatform', selectedPlatform);
  }, [brandFont, brandSize, brandColor, brandWeight, selectedPlatform]);

  const checkApiKey = async () => {
    // @ts-ignore
    if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      return false;
    }
    return true;
  };

  const generateStrategy = async () => {
    if (inputMode === 'text' && !productName.trim()) return;
    if (inputMode === 'image' && !uploadedImage) return;
    if (requestType === 'prompt_extract' && !extractedPrompt) {
      setError("يرجى استخراج البرومبت من الصورة أولاً.");
      return;
    }
    
    setLoading(true);
    setError(null);
    setStrategy(null);
    setGeneratedImage(null);
    setGeneratedAudio(null);

    try {
      playSound(CLICK_SOUND);
      let prompt = "";
      if (requestType === 'all') {
        prompt = `أنت خبير استراتيجي في التسويق الرقمي. استخدم لغة عربية بسيطة وسهلة وتؤثر في المشاهد. اعتمد دائماً وجود دعوة لاتخاذ إجراء (CTA) واضحة، بالإضافة إلى جعل النص متوافقاً مع معايير SEO.
          قم بتوليد استراتيجية محتوى كاملة وشاملة لـ [${productName}] بتنسيق JSON دقيق يحتوي على الحقول التالية باللغة العربية لجميع المنصات المذكورة.
          لكل منصة، يجب توليد 3 نماذج مختلفة من النصوص:
          1. sales: نص يركز على البيع المباشر وفوائد المنتج.
          2. engagement: نص يركز على جذب الانتباه، التفاعل، والتأثير العاطفي.
          3. viral: نص يركز على الانتشار، الإقناع، والنمط الترندي.

          ${productNotes ? `ملاحظات إضافية من العميل حول المنتج أو كيفية ظهور الصورة: [${productNotes}]` : ''}
          - captions: كائنات تحتوي على (sales, engagement, viral) لكل من (instagram, facebook, twitter, linkedin).
          - scripts: كائنات تحتوي على (sales, engagement, viral) لكل من (tiktok, reels).
          - hooks: مصفوفة من 5 عناوين خاطفة (Viral Hooks).
          - stories: كائنات تحتوي على (sales, engagement, viral) لكل من (instagram, facebook, snapchat).
          - imagePrompt: وصف تفصيلي باللغة الإنجليزية لصورة احترافية لهذا المنتج ليتم استخدامها في مولد صور.
          - summary: ملخص تنفيذي شامل للاستراتيجية يركز على النقاط الرئيسية والخطوات العملية.`;
      } else if (requestType === 'caption') {
        prompt = `أنت خبير في كتابة المحتوى التسويقي للسوق السوري. استخدم لغة عربية بيضاء بسيطة، جذابة، وقريبة من لهجة الجمهور السوري، مع الحفاظ على الاحترافية. اعتمد دائماً وجود دعوة لاتخاذ إجراء (CTA) واضحة، بالإضافة إلى جعل النص متوافقاً مع معايير SEO.
          قم بتوليد كابشن (نصوص بيعية وتفاعلية) لـ [${productName}] لجميع المنصات بتنسيق JSON دقيق.
          لكل منصة، ولد 3 نماذج: (sales, engagement, viral).
          ${productNotes ? `ملاحظات إضافية: [${productNotes}]` : ''}
          - captions: كائنات تحتوي على (sales, engagement, viral) لكل من (instagram, facebook, twitter, linkedin).
          - hooks: مصفوفة من 3 عناوين خاطفة.
          - imagePrompt: وصف تفصيلي باللغة الإنجليزية لصورة احترافية لهذا المنتج.
          - summary: ملخص قصير جداً.
          - scripts: {}
          - stories: {}`;
      } else if (requestType === 'script') {
        prompt = `أنت خبير في كتابة سكريبتات الفيديو للسوق السوري. استخدم لغة عربية بيضاء بسيطة، جذابة، وقريبة من لهجة الجمهور السوري، مع الحفاظ على الاحترافية. اعتمد دائماً وجود دعوة لاتخاذ إجراء (CTA) واضحة، بالإضافة إلى جعل النص متوافقاً مع معايير SEO.
          قم بتوليد سكريبتات فيديو لـ [${productName}] لجميع المنصات بتنسيق JSON دقيق.
          لكل منصة، ولد 3 نماذج: (sales, engagement, viral).
          ${productNotes ? `ملاحظات إضافية: [${productNotes}]` : ''}
          - scripts: كائنات تحتوي على (sales, engagement, viral) لكل من (tiktok, reels).
          - hooks: مصفوفة من 3 عناوين خاطفة.
          - imagePrompt: وصف تفصيلي باللغة الإنجليزية لصورة احترافية لهذا المنتج.
          - summary: ملخص قصير جداً.
          - captions: {}
          - stories: {}`;
      } else if (requestType === 'image') {
        prompt = `أنت مصمم جرافيك محترف. قم بتوليد وصف لصورة لـ [${productName}] بتنسيق JSON دقيق يحتوي على الحقول التالية باللغة العربية:
          ${productNotes ? `ملاحظات إضافية: [${productNotes}]` : ''}
          - imagePrompt: وصف تفصيلي باللغة الإنجليزية لصورة احترافية لهذا المنتج ليتم استخدامها في مولد صور.
          - summary: وصف للصورة المقترحة وكيفية استخدامها في المنصات المختلفة.
          - captions: {}
          - scripts: {}
          - hooks: []
          - stories: {}`;
      } else if (requestType === 'video') {
        prompt = `أنت خبير استراتيجي في المحتوى البصري. استخدم لغة عربية بسيطة وسهلة وتؤثر في المشاهد. اعتمد دائماً وجود دعوة لاتخاذ إجراء (CTA) واضحة، بالإضافة إلى جعل النص متوافقاً مع معايير SEO.
          قم بتوليد خطة فيديو لـ [${productName}] بتنسيق JSON دقيق يحتوي على الحقول التالية باللغة العربية:
          - videoRequest: كائن يحتوي على:
            - visualPrompt: وصف دقيق جداً باللغة الإنجليزية للمشاهد، الإضاءة، وحركة الكاميرا.
            - audioScript: النص الذي سيتم قراءته أو الموسيقى المقترحة.
            - sceneDuration: المدة المقترحة لكل مشهد.
          - summary: ملخص لفكرة الفيديو.
          - imagePrompt: وصف لصورة مصغرة (Thumbnail) للفيديو بالإنجليزية.
          - captions: {}
          - scripts: {}
          - hooks: []
          - stories: {}
          ${productNotes ? `ملاحظات إضافية: [${productNotes}]` : ''}`;
      } else if (requestType === 'prompt_extract') {
        prompt = `أنت خبير في تحويل الصور التسويقية. استخدم لغة عربية بسيطة وسهلة وتؤثر في المشاهد. اعتمد دائماً وجود دعوة لاتخاذ إجراء (CTA) واضحة، بالإضافة إلى جعل النص متوافقاً مع معايير SEO.
          لقد قمنا باستخراج نمط تسويقي من صورة سابقة وهو: [${extractedPrompt?.ar}].
          الهدف هو تطبيق هذا النمط على المنتج: [${productName}].
          قم بتوليد استراتيجية محتوى وصورة لهذا المنتج بتنسيق JSON دقيق يحتوي على الحقول التالية باللغة العربية.
          لكل منصة، ولد 3 نماذج: (sales, engagement, viral).
          ${productNotes ? `ملاحظات إضافية: [${productNotes}]` : ''}
          - imagePrompt: وصف تفصيلي باللغة الإنجليزية للصورة المطلوبة بناءً على النمط المستخرج [${extractedPrompt?.en}] والمنتج [${productName}].
          - summary: وصف لكيفية تطبيق النمط على المنتج الجديد.
          - captions: كائنات تحتوي على (sales, engagement, viral) لكل من (instagram, facebook, twitter, linkedin).
          - scripts: {}
          - hooks: []
          - stories: {}`;
      }

      let contents: any = prompt;

      if (inputMode === 'image' && uploadedImage) {
        const base64Data = uploadedImage.split(',')[1];
        contents = {
          parts: [
            { text: "حلل هذا المنتج وولد استراتيجية تسويقية كاملة له. " + (productNotes ? `ملاحظات العميل: ${productNotes}. ` : "") + prompt },
            { inlineData: { data: base64Data, mimeType: 'image/png' } }
          ]
        };
      }

      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: contents,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              captions: {
                type: Type.OBJECT,
                properties: {
                  instagram: { 
                    type: Type.OBJECT,
                    properties: {
                      sales: { type: Type.STRING },
                      engagement: { type: Type.STRING },
                      viral: { type: Type.STRING },
                    }
                  },
                  facebook: { 
                    type: Type.OBJECT,
                    properties: {
                      sales: { type: Type.STRING },
                      engagement: { type: Type.STRING },
                      viral: { type: Type.STRING },
                    }
                  },
                  twitter: { 
                    type: Type.OBJECT,
                    properties: {
                      sales: { type: Type.STRING },
                      engagement: { type: Type.STRING },
                      viral: { type: Type.STRING },
                    }
                  },
                  linkedin: { 
                    type: Type.OBJECT,
                    properties: {
                      sales: { type: Type.STRING },
                      engagement: { type: Type.STRING },
                      viral: { type: Type.STRING },
                    }
                  },
                }
              },
              scripts: {
                type: Type.OBJECT,
                properties: {
                  tiktok: { 
                    type: Type.OBJECT,
                    properties: {
                      sales: { type: Type.STRING },
                      engagement: { type: Type.STRING },
                      viral: { type: Type.STRING },
                    }
                  },
                  reels: { 
                    type: Type.OBJECT,
                    properties: {
                      sales: { type: Type.STRING },
                      engagement: { type: Type.STRING },
                      viral: { type: Type.STRING },
                    }
                  },
                }
              },
              hooks: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              stories: {
                type: Type.OBJECT,
                properties: {
                  instagram: { 
                    type: Type.OBJECT,
                    properties: {
                      sales: { type: Type.STRING },
                      engagement: { type: Type.STRING },
                      viral: { type: Type.STRING },
                    }
                  },
                  facebook: { 
                    type: Type.OBJECT,
                    properties: {
                      sales: { type: Type.STRING },
                      engagement: { type: Type.STRING },
                      viral: { type: Type.STRING },
                    }
                  },
                  snapchat: { 
                    type: Type.OBJECT,
                    properties: {
                      sales: { type: Type.STRING },
                      engagement: { type: Type.STRING },
                      viral: { type: Type.STRING },
                    }
                  },
                }
              },
              imagePrompt: { type: Type.STRING },
              summary: { type: Type.STRING },
              videoRequest: {
                type: Type.OBJECT,
                properties: {
                  visualPrompt: { type: Type.STRING },
                  audioScript: { type: Type.STRING },
                  sceneDuration: { type: Type.STRING },
                }
              }
            }
          }
        }
      });

      const data = JSON.parse(response.text) as StrategyData;
      setStrategy(data);
      playSound(SUCCESS_SOUND);
      confetti();
      
      if (requestType === 'video') {
        setActiveTab('video_request');
      } else if (requestType === 'image') {
        setActiveTab('summary');
      } else {
        setActiveTab('caption');
      }
      
      // Automatically generate professional image after strategy (except for captions)
      if (data.imagePrompt && requestType !== 'caption') {
        if (inputMode === 'image' && uploadedImage) {
          generateProfessionalImage(data.imagePrompt, uploadedImage);
        } else {
          generateImage(data.imagePrompt);
        }
      }
    } catch (err) {
      console.error(err);
      setError("حدث خطأ أثناء توليد الاستراتيجية. يرجى المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  const generateProfessionalImage = async (prompt: string, originalImage: string) => {
    setImageLoading(true);
    try {
      const base64Data = originalImage.split(',')[1];
      const mimeType = originalImage.split(';')[0].split(':')[1];
      const response = await genAI.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { inlineData: { data: base64Data, mimeType: mimeType } },
            { text: `Transform this product image into a single, high-quality, 4K, photorealistic marketing photo of the product. It must look completely authentic, not like AI-generated art. ${prompt}. ${productNotes ? `Customer specific instructions: ${productNotes}.` : ''} Cinematic lighting, commercial style, attractive and professional.` }
          ]
        },
        config: {
          imageConfig: {
            aspectRatio: imageAspectRatio
          }
        }
      });
      
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          setGeneratedImage(`data:image/png;base64,${part.inlineData.data}`);
          break;
        }
      }
    } catch (err) {
      console.error("Professional image generation failed:", err);
    } finally {
      setImageLoading(false);
    }
  };

  const generateAudio = async (text: string) => {
    setAudioLoading(true);
    try {
      const response = await genAI.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say in Arabic: ${text}. Voice instructions: ${voiceInstructions || 'cheerful tone, natural pacing'}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audioBlob = await (await fetch(`data:audio/wav;base64,${base64Audio}`)).blob();
        setGeneratedAudio(URL.createObjectURL(audioBlob));
      }
    } catch (err) {
      console.error("Audio generation failed:", err);
    } finally {
      setAudioLoading(false);
    }
  };

  const regeneratePart = async (part: string, platform?: string) => {
    if (!strategy) return;
    setRegenerating(true);
    setError(null);

    try {
      const isMultiPlatform = ['caption', 'script', 'story'].includes(part);
      
      if (isMultiPlatform && !platform) {
        // Regenerate all platforms for this part
        const platformsToRegenerate = platforms.filter(p => {
          if (part === 'caption') return !!strategy.captions[p.id];
          if (part === 'script') return !!strategy.scripts[p.id] || (p.id === 'tiktok' && strategy.scripts['tiktok']) || (p.id === 'instagram' && strategy.scripts['reels']);
          if (part === 'story') return !!strategy.stories[p.id] || (p.id === 'instagram' && strategy.stories['instagram']) || (p.id === 'facebook' && strategy.stories['facebook']) || (p.id === 'snapchat' && strategy.stories['snapchat']);
          return false;
        });

        for (const p of platformsToRegenerate) {
          const platId = part === 'script' && p.id === 'instagram' ? 'reels' : p.id;
          await performRegeneration(part, platId);
        }
      } else {
        await performRegeneration(part, platform);
      }
      
      setFeedback('');
    } catch (err) {
      console.error(err);
      setError("حدث خطأ أثناء إعادة توليد الجزء. يرجى المحاولة مرة أخرى.");
    } finally {
      setRegenerating(false);
    }
  };

  const performRegeneration = async (part: string, platform?: string) => {
    if (!strategy) return;
    
    let currentContent = "";
    if (part === 'hook') {
      currentContent = strategy.hooks.join('\n');
    } else if (platform) {
      const key = part === 'caption' ? 'captions' : part === 'script' ? 'scripts' : 'stories';
      const options = (strategy as any)[key][platform];
      currentContent = options ? options[activeModel] : "";
    } else if (part === 'summary') {
      currentContent = strategy.summary;
    }
    
    const prompt = `أنت خبير استراتيجي في التسويق الرقمي متخصص في السوق السوري. استخدم لغة عربية بيضاء بسيطة، جذابة، وقريبة من لهجة الجمهور السوري، مع الحفاظ على الاحترافية. اعتمد دائماً وجود دعوة لاتخاذ إجراء (CTA) واضحة، بالإضافة إلى جعل النص متوافقاً مع معايير SEO.
المنتج: [${productName}]
الجزء المراد إعادة توليده: [${part}] ${platform ? `للمنصة: [${platform}] بأسلوب: [${activeModel}]` : ''}
المحتوى الحالي:
"${currentContent}"

ملاحظات المستخدم للتعديل:
"${feedback || 'إعادة توليد بنسخة مختلفة وأكثر إبداعاً'}"

قم بإعادة توليد هذا الجزء فقط بناءً على الملاحظات. أرجع النتيجة كنص فقط (Plain Text) باللغة العربية. لا تضف أي نصوص أخرى أو مقدمات.`;

    const response = await genAI.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    const newContent = response.text || '';
    
    setStrategy(prev => {
      if (!prev) return null;
      const updated = { ...prev };
      if (part === 'hook') {
        updated.hooks = newContent.split('\n').map(h => h.replace(/^\d+\.\s*/, '').trim()).filter(h => h.length > 0).slice(0, 5);
      } else if (platform) {
        const key = part === 'caption' ? 'captions' : part === 'script' ? 'scripts' : 'stories';
        const currentOptions = (updated as any)[key][platform] || { sales: '', engagement: '', viral: '' };
        (updated as any)[key] = { 
          ...(updated as any)[key], 
          [platform]: { ...currentOptions, [activeModel]: newContent } 
        };
      } else if (part === 'summary') {
        updated.summary = newContent;
      }
      return updated;
    });
  };

  const analyzeReferenceImage = async () => {
    if (!referenceImage) return;
    setAnalyzing(true);
    setError(null);
    try {
      const base64Data = referenceImage.split(',')[1];
      const mimeType = referenceImage.split(';')[0].split(':')[1];
      
      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            { inlineData: { data: base64Data, mimeType: mimeType } },
            { text: "Analyze this image and extract a professional marketing prompt that describes its style, lighting, composition, and mood. Provide the prompt in both Arabic and English. Return as JSON with keys 'ar' and 'en'." }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              ar: { type: Type.STRING },
              en: { type: Type.STRING }
            }
          }
        }
      });

      const data = JSON.parse(response.text) as { ar: string, en: string };
      setExtractedPrompt(data);
      setActiveTab('reference_result');
    } catch (err) {
      console.error(err);
      setError("حدث خطأ أثناء تحليل الصورة المرجعية.");
    } finally {
      setAnalyzing(false);
    }
  };

  const transformWithExtractedPrompt = async () => {
    if (!targetProductImage || !extractedPrompt) return;
    setTransforming(true);
    setError(null);
    try {
      const base64Data = targetProductImage.split(',')[1];
      const mimeType = targetProductImage.split(';')[0].split(':')[1];
      
      const response = await genAI.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { inlineData: { data: base64Data, mimeType: mimeType } },
            { text: `Transform this product image using the following style and professional prompt: ${extractedPrompt.en}. Maintain the product's identity but apply the lighting, mood, and composition described.` }
          ]
        },
        config: {
          imageConfig: {
            aspectRatio: imageAspectRatio
          }
        }
      });
      
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          setGeneratedImage(`data:image/png;base64,${part.inlineData.data}`);
          setActiveTab('image_editor');
          break;
        }
      }
    } catch (err) {
      console.error(err);
      setError("حدث خطأ أثناء تحويل الصورة بناءً على البرومبت المستخرج.");
    } finally {
      setTransforming(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'uploaded' | 'reference' | 'target') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (type === 'uploaded') setUploadedImage(result);
        else if (type === 'reference') setReferenceImage(result);
        else if (type === 'target') setTargetProductImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateImage = async (prompt: string) => {
    setImageLoading(true);
    try {
      const response = await genAI.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: [{ parts: [{ text: `Generate a single, high-quality, 4K, photorealistic marketing photo of the product. It must look completely authentic, not like AI-generated art. ${prompt}. Cinematic lighting, commercial style, attractive and professional.` }] }],
        config: {
          imageConfig: {
            aspectRatio: imageAspectRatio
          }
        }
      });
      
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          setGeneratedImage(`data:image/png;base64,${part.inlineData.data}`);
          break;
        }
      }
    } catch (err) {
      console.error("Image generation failed:", err);
    } finally {
      setImageLoading(false);
    }
  };

  const platforms = [
    { id: 'instagram', icon: <Instagram className="w-5 h-5" />, label: 'إنستغرام', color: 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600' },
    { id: 'facebook', icon: <Facebook className="w-5 h-5" />, label: 'فيسبوك', color: 'bg-blue-600' },
    { id: 'linkedin', icon: <Linkedin className="w-5 h-5" />, label: 'لينكد إن', color: 'bg-[#0077b5]' },
    { id: 'tiktok', icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.6-4.13-1.47-.13-.08-.26-.17-.38-.26v7.02c.01 2.85-1.56 5.73-4.41 6.76-2.52.96-5.6.39-7.59-1.54-2-2-2.35-5.44-.79-7.85 1.36-2.22 4.29-3.23 6.76-2.43v4.14c-.88-.34-1.91-.21-2.66.38-.65.44-1.02 1.24-1.02 2.03 0 .89.42 1.81 1.21 2.22.71.39 1.61.3 2.27-.18.57-.43.84-1.15.84-1.85V.02z"/>
      </svg>
    ), label: 'تيك توك', color: 'bg-black' },
    { id: 'twitter', icon: <Twitter className="w-5 h-5" />, label: 'تويتر (X)', color: 'bg-slate-900' },
    { id: 'snapchat', icon: <Ghost className="w-5 h-5" />, label: 'سناب شات', color: 'bg-yellow-400' },
  ];

  const exportToPDF = (title: string, content: string, platformLabel: string) => {
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
    });

    // Add Logo if exists
    if (brandLogo) {
        doc.addImage(brandLogo, 'PNG', 85, 10, 40, 40);
    }

    doc.setFontSize(16);
    doc.text("Hi MTN AI", 105, 55, { align: 'center' });
    doc.setFontSize(14);
    doc.text(`${title} - ${platformLabel}`, 105, 65, { align: 'center' });
    doc.setFontSize(12);
    
    // Simple text export for RTL (basic approach)
    const splitText = doc.splitTextToSize(content, 180);
    // @ts-ignore
    doc.text(splitText, 105, 80, { align: 'center', direction: 'rtl' });
    
    doc.save(`mshakas_${title}_${platformLabel}.pdf`);
  };

  const exportPackage = async (content: string, imageUrl: string | null, name: string) => {
    const zip = new JSZip();
    zip.file(`${name}.txt`, content);

    if (imageUrl) {
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            zip.file(`${name}_image.png`, blob);
        } catch (e) {
            console.error("Failed to add image to zip", e);
        }
    }

    const contentZip = await zip.generateAsync({type:"blob"});
    const link = document.createElement('a');
    link.href = URL.createObjectURL(contentZip);
    link.download = `${name}_package.zip`;
    link.click();
  };


  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('تم النسخ إلى الحافظة!');
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-mtn-black' : 'bg-mtn-silver'} text-mtn-blue dark:text-white font-sans selection:bg-mtn-yellow/20`} dir="rtl">
      {/* Header */}
      <header className="bg-white dark:bg-mtn-grey border-b-4 border-mtn-yellow sticky top-0 z-50 shadow-2xl">
        <div className="max-w-6xl mx-auto px-6 h-28 flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-5"
          >
            <div className="w-16 h-16 rounded-2xl bg-mtn-yellow flex items-center justify-center shadow-2xl border-4 border-mtn-blue animate-logo-pulse shrink-0">
              <span className="text-mtn-blue font-black text-[22px] tracking-tighter">MTN</span>
            </div>
            <h1 className="text-[36px] font-black tracking-tight text-mtn-blue dark:text-mtn-yellow">Hi MTN AI</h1>
          </motion.div>
          
          <div className="flex items-center gap-8">
            <div className="hidden md:flex items-center gap-6">
              {/* Removed "ذكاء اصطناعي" tag */}
            </div>
            <button
              onClick={() => {
                playSound(CLICK_SOUND);
                setDarkMode(!darkMode);
              }}
              className="p-4 rounded-2xl bg-mtn-silver dark:bg-mtn-black hover:scale-110 transition-transform shadow-lg"
            >
              {darkMode ? <Sun className="w-8 h-8 text-mtn-yellow" /> : <Moon className="w-8 h-8 text-mtn-blue" />}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-16">
        {/* Hero Section */}
        <section className="text-center mb-20">
          <motion.h2 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-[48px] sm:text-[64px] font-black text-mtn-blue dark:text-white mb-6 leading-tight"
          >
            اصنع نجاحك مع <span className="bg-mtn-yellow text-mtn-black px-4 rounded-xl">Hi MTN AI</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-[24px] text-mtn-blue/70 dark:text-mtn-silver max-w-3xl mx-auto font-medium"
          >
            حوّل أفكارك إلى خطط تسويقية ذكية وصور احترافية بضغطة زر واحدة.
          </motion.p>
        </section>

        {/* Input Card */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mtn-card overflow-hidden ${loading ? 'loading-flicker' : ''}`}
        >
          {/* Request Type Selection */}
          <div className="mb-14">
            <label className="text-[22px] font-black text-mtn-blue/70 dark:text-mtn-silver mb-8 block text-center uppercase tracking-widest">اختر مهمة الذكاء الاصطناعي</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { id: 'all', label: 'استراتيجية كاملة', icon: <Zap className="w-6 h-6" /> },
                { id: 'caption', label: 'كابشن فقط', icon: <TypeIcon className="w-6 h-6" /> },
                { id: 'script', label: 'سكربتات فقط', icon: <Clapperboard className="w-6 h-6" /> },
                { id: 'image', label: 'صور فقط', icon: <ImageIcon className="w-6 h-6" /> },
                { id: 'prompt_extract', label: 'استخراج برومبت', icon: <Magnet className="w-6 h-6" /> },
              ].map((type) => (
                <button
                  key={type.id}
                  onClick={() => {
                    playSound(CLICK_SOUND);
                    setRequestType(type.id as any);
                  }}
                  className={`flex flex-col items-center justify-center gap-4 p-8 rounded-[24px] font-black transition-all border-4 ${
                    requestType === type.id 
                    ? 'border-mtn-yellow bg-mtn-yellow text-mtn-black shadow-2xl scale-105 z-10' 
                    : 'border-mtn-silver dark:border-mtn-black bg-mtn-silver dark:bg-mtn-black text-mtn-blue/50 dark:text-mtn-silver hover:border-mtn-yellow/50'
                  }`}
                >
                  {type.icon}
                  <span className="text-[18px]">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {requestType === 'prompt_extract' && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-purple-50/50 p-6 rounded-3xl border border-purple-100 mb-4 space-y-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Magnet className="w-5 h-5 text-purple-600" />
                  <h3 className="font-bold text-slate-900">الخطوة 1: استخراج النمط من صورة تعجبك</h3>
                </div>
                
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className="w-full md:w-48 shrink-0">
                    {referenceImage ? (
                      <div className="relative group rounded-2xl overflow-hidden border-4 border-white shadow-lg aspect-square">
                        <img src={referenceImage} className="w-full h-full object-cover" />
                        <button 
                          onClick={() => {
                            setReferenceImage(null);
                            setExtractedPrompt(null);
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full aspect-square bg-white border-2 border-dashed border-purple-200 rounded-2xl cursor-pointer hover:bg-purple-50 hover:border-purple-300 transition-all group">
                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'reference')} className="hidden" />
                        <Upload className="w-8 h-8 text-purple-300 group-hover:text-purple-500 mb-2" />
                        <span className="text-xs font-bold text-purple-400">ارفع الصورة</span>
                      </label>
                    )}
                  </div>

                  <div className="flex-1 space-y-4 w-full">
                    <button 
                      onClick={analyzeReferenceImage}
                      disabled={analyzing || !referenceImage}
                      className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-100 flex items-center justify-center gap-2"
                    >
                      {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Magnet className="w-4 h-4" />}
                      تحليل واستخراج البرومبت
                    </button>

                    {extractedPrompt && (
                      <div className="grid grid-cols-1 gap-3">
                        <div className="bg-white/80 p-3 rounded-xl border border-purple-100">
                          <span className="text-[10px] font-bold text-purple-400 uppercase mb-1 block">البرومبت المستخرج (عربي)</span>
                          <p className="text-xs text-slate-700 line-clamp-2">{extractedPrompt.ar}</p>
                        </div>
                        <div className="bg-white/80 p-3 rounded-xl border border-purple-100">
                          <span className="text-[10px] font-bold text-purple-400 uppercase mb-1 block">Extracted Prompt (EN)</span>
                          <p className="text-xs text-slate-700 line-clamp-2 italic">{extractedPrompt.en}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            <div className="flex flex-wrap justify-center gap-6 mb-12">
              <button 
                onClick={() => {
                  playSound(CLICK_SOUND);
                  setInputMode('text');
                }}
                className={`flex-1 min-w-[300px] flex items-center justify-center gap-4 py-8 rounded-[32px] font-black transition-all ${inputMode === 'text' ? 'bg-mtn-blue text-white shadow-3xl scale-105' : 'bg-mtn-silver dark:bg-mtn-black text-mtn-blue/40 dark:text-mtn-silver hover:bg-white/50'}`}
              >
                <Sparkles className="w-10 h-10" />
                <span className="text-[28px]">اكتب فكرة مشروعك</span>
              </button>
              <button 
                onClick={() => {
                  playSound(CLICK_SOUND);
                  setInputMode('image');
                }}
                className={`flex-1 min-w-[300px] flex items-center justify-center gap-4 py-8 rounded-[32px] font-black transition-all ${inputMode === 'image' ? 'bg-mtn-yellow text-mtn-black shadow-3xl scale-105' : 'bg-mtn-silver dark:bg-mtn-black text-mtn-blue/40 dark:text-mtn-silver hover:bg-white/50'}`}
              >
                <Camera className="w-10 h-10" />
                <span className="text-[28px]">تحليل صورة المنتج</span>
              </button>
            </div>

            {inputMode === 'text' ? (
              <div className="space-y-12">
                <div className="flex flex-col gap-6">
                  <label className="text-[26px] font-black text-mtn-blue dark:text-mtn-yellow px-4">ما هو اسم المنتج أو الفكرة؟</label>
                  <div className="relative group">
                    <input 
                      type="text" 
                      placeholder={requestType === 'prompt_extract' ? "مثال: عطر لاكوست رجالي" : "ماذا نسوق لك اليوم؟"}
                      className="w-full px-12 py-10 bg-mtn-silver dark:bg-mtn-black border-4 border-transparent focus:border-mtn-yellow rounded-[40px] focus:outline-none transition-all text-[32px] font-black text-mtn-blue dark:text-white placeholder:text-mtn-blue/20"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && generateStrategy()}
                    />
                    <div className="absolute left-10 top-1/2 -translate-y-1/2 text-mtn-yellow group-focus-within:animate-bounce">
                      <Lightbulb className="w-12 h-12" />
                    </div>
                  </div>
                </div>
                
                {(requestType === 'image' || requestType === 'prompt_extract' || requestType === 'all') && (
                  <div className="space-y-6">
                    <label className="text-[26px] font-black text-mtn-blue dark:text-mtn-yellow px-4 flex items-center gap-4">
                      <ImageIcon className="w-8 h-8" />
                      أبعاد التصميم
                    </label>
                    <div className="flex flex-col sm:flex-row gap-6">
                      <button
                        onClick={() => {
                          playSound(CLICK_SOUND);
                          setImageAspectRatio('1:1');
                        }}
                        className={`flex-1 py-10 rounded-[40px] font-black border-4 transition-all flex items-center justify-center gap-6 ${imageAspectRatio === '1:1' ? 'bg-mtn-blue text-white border-mtn-blue shadow-2xl' : 'bg-mtn-silver dark:bg-mtn-black text-mtn-blue/40 border-transparent hover:border-mtn-yellow/30'}`}
                      >
                        <div className="w-8 h-8 border-4 border-current rounded-lg" />
                        <span className="text-[26px]">مربع (1:1)</span>
                      </button>
                      <button
                        onClick={() => {
                          playSound(CLICK_SOUND);
                          setImageAspectRatio('9:16');
                        }}
                        className={`flex-1 py-10 rounded-[40px] font-black border-4 transition-all flex items-center justify-center gap-6 ${imageAspectRatio === '9:16' ? 'bg-mtn-blue text-white border-mtn-blue shadow-2xl' : 'bg-mtn-silver dark:bg-mtn-black text-mtn-blue/40 border-transparent hover:border-mtn-yellow/30'}`}
                      >
                        <div className="w-6 h-10 border-4 border-current rounded-lg" />
                        <span className="text-[26px]">طولي (9:16)</span>
                      </button>
                    </div>
                  </div>
                )}

                <button 
                  onClick={generateStrategy}
                  disabled={loading || !productName.trim()}
                  className={`w-full py-10 text-[40px] font-black rounded-[40px] transition-all shadow-3xl flex items-center justify-center gap-6 active:scale-95 ${loading ? 'bg-mtn-silver dark:bg-mtn-black text-mtn-blue/10' : 'bg-mtn-yellow text-mtn-black hover:bg-yellow-400'}`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-12 h-12 animate-spin" />
                      جاري الذكاء...
                    </>
                  ) : (
                    <>
                      {requestType === 'prompt_extract' ? 'تطبيق النمط' : 'ابدأ الابتكار'}
                      <Zap className="w-12 h-12 fill-current" />
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-12">
                <div className="w-full max-w-2xl">
                  {uploadedImage ? (
                    <div className="relative group rounded-[50px] overflow-hidden border-8 border-white dark:border-mtn-grey shadow-4xl aspect-square">
                      <img src={uploadedImage} className="w-full h-full object-cover" />
                      <button 
                        onClick={() => setUploadedImage(null)}
                        className="absolute top-10 right-10 bg-red-600 text-white p-6 rounded-full shadow-3xl opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-10 h-10" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full aspect-square bg-mtn-silver dark:bg-mtn-black border-6 border-dashed border-mtn-blue/10 rounded-[50px] cursor-pointer hover:bg-mtn-yellow/5 hover:border-mtn-yellow transition-all group">
                      <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'uploaded')} className="hidden" />
                      <div className="flex flex-col items-center gap-8 text-mtn-blue/20 group-hover:text-mtn-yellow">
                        <Upload className="w-32 h-32" />
                        <div className="text-center">
                          <span className="text-[40px] font-black block">ارفع صورة اليوم</span>
                          <span className="text-[22px] font-bold">سنحولها إلى تحفة تسويقية</span>
                        </div>
                      </div>
                    </label>
                  )}
                </div>

                <button 
                  onClick={generateStrategy}
                  disabled={loading || !uploadedImage}
                  className={`w-full max-w-2xl py-10 text-[40px] font-black rounded-[40px] transition-all shadow-3xl flex items-center justify-center gap-6 active:scale-95 ${loading ? 'bg-mtn-silver dark:bg-mtn-black text-mtn-blue/10' : 'bg-mtn-yellow text-mtn-black hover:bg-yellow-400'}`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-12 h-12 animate-spin" />
                      تحليل احترافي...
                    </>
                  ) : (
                    <>
                      بداية عبقرية
                      <Sparkles className="w-12 h-12" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </motion.div>
        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-2xl mb-8 flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Interactive Results Section */}
        <AnimatePresence>
          {strategy && (
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Sidebar: Platform Selection */}
              <div className="lg:col-span-3 space-y-4">
                <h3 className="text-lg font-bold text-slate-900 mb-4 px-2">اختر المنصة</h3>
                <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
                  {platforms.map((platform) => (
                    <button
                      key={platform.id}
                      onClick={() => setSelectedPlatform(platform.id)}
                      className={`flex items-center gap-3 p-4 rounded-2xl transition-all border-2 ${
                        selectedPlatform === platform.id 
                        ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-md' 
                        : 'border-transparent bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${platform.color}`}>
                        {platform.icon}
                      </div>
                      <span className="font-bold">{platform.label}</span>
                    </button>
                  ))}
                </div>


                  

              </div>

              {/* Sidebar */}
              <div className="lg:col-span-3 space-y-8">
                <div className="mtn-card p-8 space-y-8 sticky top-32">
                  <h3 className="text-[28px] font-black text-mtn-blue dark:text-mtn-yellow border-b-4 border-mtn-yellow pb-4">المنصات</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {platforms.map((platform) => (
                      <button
                        key={platform.id}
                        onClick={() => {
                          playSound(CLICK_SOUND);
                          setSelectedPlatform(platform.id as any);
                        }}
                        className={`group flex items-center gap-5 p-6 rounded-[24px] font-black transition-all border-4 ${
                          selectedPlatform === platform.id 
                          ? 'bg-mtn-blue text-white border-mtn-blue shadow-2xl scale-105' 
                          : 'bg-mtn-silver dark:bg-mtn-black text-mtn-blue/70 border-transparent hover:border-mtn-yellow/30'
                        }`}
                      >
                        <div className={`p-4 rounded-2xl group-hover:scale-110 transition-transform ${selectedPlatform === platform.id ? 'bg-white/20' : 'bg-white shadow-lg'}`}>
                          {/* @ts-ignore */}
                          {React.cloneElement(platform.icon, { className: `w-8 h-8 ${selectedPlatform === platform.id ? 'text-white' : 'text-mtn-blue'}` })}
                        </div>
                        <span className="text-[24px]">{platform.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Branding Settings */}
                  <div className="pt-8 border-t-4 border-mtn-silver dark:border-mtn-black space-y-6">
                    <h3 className="text-[24px] font-black text-mtn-blue dark:text-mtn-yellow">التخصيص</h3>
                    <div className="flex items-center justify-between bg-mtn-silver dark:bg-mtn-black p-5 rounded-2xl">
                      <label className="text-[20px] font-bold text-mtn-blue dark:text-mtn-silver">لون البراند:</label>
                      <input
                        type="color"
                        value={brandColor}
                        onChange={(e) => setBrandColor(e.target.value)}
                        className="w-12 h-12 rounded-xl cursor-pointer border-4 border-white shadow-lg"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="lg:col-span-9 space-y-10">
                {/* Content Type Tabs */}
                <div className="flex flex-wrap gap-4 bg-white dark:bg-mtn-grey p-4 rounded-[32px] border-4 border-mtn-yellow shadow-3xl">
                  {[
                    { id: 'summary', label: 'الاستراتيجية', icon: <ClipboardList className="w-6 h-6" />, show: true },
                    { id: 'caption', label: 'كابشن', icon: <TypeIcon className="w-6 h-6" />, show: requestType === 'all' || requestType === 'caption' },
                    { id: 'script', label: 'سكربت', icon: <Clapperboard className="w-6 h-6" />, show: requestType === 'all' || requestType === 'script' },
                    { id: 'hook', label: 'هوك', icon: <Magnet className="w-6 h-6" />, show: requestType === 'all' || requestType === 'caption' || requestType === 'script' },
                    { id: 'story', label: 'ستوري', icon: <Smartphone className="w-6 h-6" />, show: requestType === 'all' },
                    { id: 'image_editor', label: 'المحرر', icon: <Scissors className="w-6 h-6" />, show: true },
                    { id: 'video_request', label: 'فيديو', icon: <Video className="w-6 h-6" />, show: !!strategy?.videoRequest || requestType === 'video' },
                  ].filter(t => t.show).map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        playSound(CLICK_SOUND);
                        setActiveTab(tab.id as any);
                      }}
                      className={`flex-1 flex items-center justify-center gap-4 py-6 px-8 rounded-[24px] font-black transition-all ${
                        activeTab === tab.id 
                        ? 'bg-mtn-blue text-white shadow-2xl scale-105' 
                        : 'text-mtn-blue/40 dark:text-mtn-silver hover:bg-mtn-silver/50'
                      }`}
                    >
                      {tab.icon}
                      <span className="text-[20px] hidden xl:inline">{tab.label}</span>
                    </button>
                  ))}
                </div>

                {/* Content Display */}
                <div className="mtn-card overflow-hidden min-h-[600px] flex flex-col">
                  {/* Image/Video Preview */}
                  {(activeTab === 'summary' || activeTab === 'caption' || activeTab === 'story' || activeTab === 'script') && (
                    <div className={`grid grid-cols-1 ${requestType === 'caption' ? '' : 'md:grid-cols-2'} border-b-8 border-mtn-yellow`}>
                      {/* Image Section */}
                      {(requestType !== 'video') && (
                        <div className="relative h-[400px] sm:h-[500px] bg-mtn-silver dark:bg-mtn-black flex items-center justify-center overflow-hidden">
                          {imageLoading && requestType !== 'caption' ? (
                            <div className="flex flex-col items-center gap-6">
                              <Loader2 className="w-16 h-16 text-mtn-blue animate-spin" />
                              <span className="text-[24px] font-black text-mtn-blue/70">جاري الإبداع...</span>
                            </div>
                          ) : (generatedImage || uploadedImage) ? (
                            <div className="relative w-full h-full group">
                              <img 
                                src={generatedImage || uploadedImage || ''} 
                                alt="Product" 
                                className="w-full h-full object-contain cursor-zoom-in group-hover:scale-105 transition-transform duration-700"
                                referrerPolicy="no-referrer"
                                onClick={() => setShowImageModal(true)}
                              />
                              <div className="absolute inset-0 bg-mtn-blue/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                <div className="bg-white text-mtn-blue px-8 py-4 rounded-2xl font-black text-[24px] shadow-3xl">عرض التميز</div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-mtn-blue/10 flex flex-col items-center gap-6">
                              <ImageIcon className="w-32 h-32" />
                              <span className="text-[24px] font-black">لا توجد صورة</span>
                            </div>
                          )}
                          
                          <div className="absolute top-8 right-8 flex gap-3">
                            {uploadedImage && (
                              <div className="bg-mtn-blue px-6 py-2 rounded-full text-[16px] font-black text-white shadow-xl">
                                صورة الأصل
                              </div>
                            )}
                          </div>

                          {generatedImage && !imageLoading && (
                            <button 
                              onClick={() => {
                                playSound(CLICK_SOUND);
                                const link = document.createElement('a');
                                link.href = generatedImage;
                                link.download = `${productName || 'product'}-design.png`;
                                link.click();
                              }}
                              className="absolute bottom-8 left-8 bg-white text-mtn-blue p-5 rounded-full shadow-4xl hover:scale-110 transition-all"
                              title="تحميل"
                            >
                              <Download className="w-8 h-8" />
                            </button>
                          )}
                        </div>
                      )}

                      {/* Video Strategy Section */}
                      {(requestType === 'video' || requestType === 'all' || requestType === 'script') && (
                        <div className="relative h-[400px] sm:h-[500px] bg-mtn-blue flex items-center justify-center overflow-hidden">
                          <div className="flex flex-col items-center gap-8 p-12 text-center">
                            <div className="bg-white p-12 rounded-[40px] shadow-4xl animate-logo-pulse">
                              <Clapperboard className="w-20 h-20 text-mtn-blue mx-auto mb-6" />
                              <h4 className="text-[32px] font-black text-mtn-blue mb-4">الفيديو جاهز!</h4>
                              <p className="text-[20px] font-bold text-mtn-blue/60">
                                خطتك البصرية والسمعية بانتظارك في تبويب الفيديو.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Text Content */}
                  <div className="p-12 flex-1 bg-white dark:bg-mtn-grey">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={`${activeTab}-${selectedPlatform}`}
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -40 }}
                        className="prose prose-2xl prose-mtn max-w-none"
                      >
                        {activeTab === 'summary' && (
                          <div className="space-y-10">
                            <h4 className="text-[40px] font-black text-mtn-blue dark:text-mtn-yellow mb-8 flex items-center gap-6">
                              <ClipboardList className="w-12 h-12 text-mtn-yellow" />
                              خارطة طريق نجاحك
                            </h4>
                            <div className="bg-mtn-silver dark:bg-mtn-black p-12 rounded-[40px] border-4 border-mtn-blue/5 text-[28px] font-bold text-mtn-blue dark:text-white leading-[1.6] shadow-inner">
                              {strategy.summary}
                            </div>
                          </div>
                        )}

                        {activeTab === 'video_request' && strategy?.videoRequest && (
                          <div className="space-y-6">
                            <h4 className="text-slate-900 mb-4 flex items-center gap-2">
                              <Video className="w-5 h-5 text-indigo-600" />
                              تفاصيل طلب الفيديو
                            </h4>
                            <div className="grid grid-cols-1 gap-6">
                              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                <h5 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                                  <Camera className="w-4 h-4 text-indigo-600" />
                                  الوصف البصري (Visual Prompt)
                                </h5>
                                <p className="text-slate-700 font-mono text-sm bg-white p-4 rounded-xl border border-slate-200">
                                  {strategy.videoRequest.visualPrompt}
                                </p>
                              </div>
                              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                <h5 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                                  <Volume2 className="w-4 h-4 text-indigo-600" />
                                  السكربت الصوتي (Audio Script)
                                </h5>
                                <p className="text-slate-700">
                                  {strategy.videoRequest.audioScript}
                                </p>
                              </div>
                              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                <h5 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                                  <Play className="w-4 h-4 text-indigo-600" />
                                  مدة المشاهد (Scene Duration)
                                </h5>
                                <p className="text-slate-700">
                                  {strategy.videoRequest.sceneDuration}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {activeTab === 'caption' && (
                          <div className="space-y-8">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                              <h4 className="text-blue-600 flex items-center gap-2 font-bold">
                                <MessageSquare className="w-5 h-5" />
                                نصوص الكابشن المقترحة لجميع المنصات
                              </h4>
                              
                              <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
                                {[
                                  { id: 'sales', label: 'بيعي', icon: <Target className="w-4 h-4" /> },
                                  { id: 'engagement', label: 'تفاعلي', icon: <MessageSquare className="w-4 h-4" /> },
                                  { id: 'viral', label: 'انتشار', icon: <Zap className="w-4 h-4" /> },
                                ].map((model) => (
                                  <button
                                    key={model.id}
                                    onClick={() => setActiveModel(model.id as any)}
                                    className={`flex items-center justify-center gap-2 py-1.5 px-4 rounded-lg font-bold text-xs transition-all ${activeModel === model.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                  >
                                    {model.icon}
                                    {model.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {platforms.filter(p => strategy.captions[p.id]).map(platform => {
                              const content = strategy.captions[platform.id][activeModel];
                              return (
                                <div key={platform.id} className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                                  <div className={`px-4 py-2 text-white text-xs font-bold flex items-center justify-between ${platform.color}`}>
                                    <div className="flex items-center gap-2">
                                      {platform.icon}
                                      {platform.label}
                                      <span className="opacity-80 font-normal">({activeModel === 'sales' ? 'بيعي' : activeModel === 'engagement' ? 'تفاعلي' : 'انتشار'})</span>
                                    </div>
                                    <div className="flex gap-2">
                                      <button 
                                        onClick={() => copyToClipboard(content)}
                                        className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                                        title="نسخ"
                                      >
                                        <Copy className="w-4 h-4" />
                                      </button>
                                      <button 
                                        onClick={() => exportToPDF('كابشن', content, platform.label)}
                                        className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                                        title="تحميل PDF"
                                      >
                                        <FileText className="w-4 h-4" />
                                      </button>
                                      <button 
                                        onClick={() => regeneratePart('caption', platform.id)}
                                        className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                                        title="إعادة توليد"
                                      >
                                        <RotateCcw className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                  <div 
                                    className={`p-6 bg-slate-50 whitespace-pre-wrap leading-relaxed ${brandSize} ${brandWeight}`}
                                    style={{ fontFamily: brandFont, color: brandColor }}
                                  >
                                    {content}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {activeTab === 'script' && (
                          <div className="space-y-8">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                              <h4 className="text-mtn-yellow flex items-center gap-2 font-bold">
                                <Video className="w-5 h-5" />
                                سكريبتات فيديو لجميع المنصات
                              </h4>

                              <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
                                {[
                                  { id: 'sales', label: 'بيعي', icon: <Target className="w-4 h-4" /> },
                                  { id: 'engagement', label: 'تفاعلي', icon: <MessageSquare className="w-4 h-4" /> },
                                  { id: 'viral', label: 'انتشار', icon: <Zap className="w-4 h-4" /> },
                                ].map((model) => (
                                  <button
                                    key={model.id}
                                    onClick={() => setActiveModel(model.id as any)}
                                    className={`flex items-center justify-center gap-2 py-1.5 px-4 rounded-lg font-bold text-xs transition-all ${activeModel === model.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                  >
                                    {model.icon}
                                    {model.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="flex justify-end mb-4">
                              <button 
                                onClick={() => {
                                  const mainScript = strategy.scripts['tiktok']?.[activeModel] || strategy.scripts['reels']?.[activeModel] || 'سكريبت الفيديو جاهز للتنفيذ';
                                  generateAudio(mainScript);
                                }}
                                disabled={audioLoading}
                                className="flex items-center justify-center gap-2 bg-mtn-yellow text-white px-6 py-3 rounded-xl font-bold hover:bg-mtn-yellow-600 transition-all disabled:opacity-50 shadow-lg shadow-mtn-yellow-100"
                              >
                                {audioLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />}
                                توليد صوت للسكربت ({activeModel === 'sales' ? 'بيعي' : activeModel === 'engagement' ? 'تفاعلي' : 'انتشار'})
                              </button>
                            </div>

                            {platforms.filter(p => strategy.scripts[p.id] || (p.id === 'tiktok' && strategy.scripts['tiktok']) || (p.id === 'instagram' && strategy.scripts['reels'])).map(platform => {
                              const options = platform.id === 'tiktok' ? strategy.scripts['tiktok'] : 
                                                platform.id === 'instagram' ? strategy.scripts['reels'] : 
                                                strategy.scripts[platform.id];
                              if (!options) return null;
                              const scriptText = options[activeModel];
                              
                              return (
                                <div key={platform.id} className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                                  <div className={`px-4 py-2 text-white text-xs font-bold flex items-center justify-between ${platform.color}`}>
                                    <div className="flex items-center gap-2">
                                      {platform.icon}
                                      {platform.label}
                                      <span className="opacity-80 font-normal">({activeModel === 'sales' ? 'بيعي' : activeModel === 'engagement' ? 'تفاعلي' : 'انتشار'})</span>
                                    </div>
                                    <div className="flex gap-2">
                                      <button 
                                        onClick={() => copyToClipboard(scriptText)}
                                        className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                                      >
                                        <Copy className="w-4 h-4" />
                                      </button>
                                      <button 
                                        onClick={() => exportToPDF('سكريبت', scriptText, platform.label)}
                                        className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                                      >
                                        <FileText className="w-4 h-4" />
                                      </button>
                                      <button 
                                        onClick={() => regeneratePart('script', platform.id === 'instagram' ? 'reels' : platform.id)}
                                        className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                                      >
                                        <RotateCcw className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                  <div 
                                    className={`p-6 bg-slate-50 whitespace-pre-wrap leading-relaxed ${brandSize} ${brandWeight}`}
                                    style={{ fontFamily: brandFont, color: brandColor }}
                                  >
                                    {scriptText}
                                  </div>
                                </div>
                              );
                            })}
                            
                            {generatedAudio && (
                              <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 flex items-center gap-4">
                                <div className="bg-indigo-600 p-2 rounded-full text-white">
                                  <Play className="w-4 h-4" />
                                </div>
                                <audio src={generatedAudio} controls className="flex-1 h-8" />
                              </div>
                            )}
                          </div>
                        )}

                        {activeTab === 'hook' && (
                          <div>
                            <h4 className="text-red-600 mb-4 flex items-center gap-2">
                              <Magnet className="w-5 h-5" />
                              عناوين خاطفة (Viral Hooks)
                            </h4>
                            <div className="space-y-4">
                              {strategy.hooks.map((hook, i) => (
                                <div key={i} className="bg-red-50 p-4 rounded-xl border border-red-100 flex items-center gap-3">
                                  <div className="bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                                    {i + 1}
                                  </div>
                                  <p className="font-bold text-red-900">{hook}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {activeTab === 'story' && (
                          <div className="space-y-8">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                              <h4 className="text-purple-600 flex items-center gap-2 font-bold">
                                <Smartphone className="w-5 h-5" />
                                أفكار للستوري لجميع المنصات
                              </h4>

                              <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
                                {[
                                  { id: 'sales', label: 'بيعي', icon: <Target className="w-4 h-4" /> },
                                  { id: 'engagement', label: 'تفاعلي', icon: <MessageSquare className="w-4 h-4" /> },
                                  { id: 'viral', label: 'انتشار', icon: <Zap className="w-4 h-4" /> },
                                ].map((model) => (
                                  <button
                                    key={model.id}
                                    onClick={() => setActiveModel(model.id as any)}
                                    className={`flex items-center justify-center gap-2 py-1.5 px-4 rounded-lg font-bold text-xs transition-all ${activeModel === model.id ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                  >
                                    {model.icon}
                                    {model.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {platforms.filter(p => strategy.stories[p.id] || (p.id === 'instagram' && strategy.stories['instagram']) || (p.id === 'facebook' && strategy.stories['facebook']) || (p.id === 'snapchat' && strategy.stories['snapchat'])).map(platform => {
                              const options = strategy.stories[platform.id] || (platform.id === 'instagram' ? strategy.stories['instagram'] : platform.id === 'facebook' ? strategy.stories['facebook'] : platform.id === 'snapchat' ? strategy.stories['snapchat'] : null);
                              if (!options) return null;
                              const storyText = options[activeModel];

                              return (
                                <div key={platform.id} className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                                  <div className={`px-4 py-2 text-white text-xs font-bold flex items-center justify-between ${platform.color}`}>
                                    <div className="flex items-center gap-2">
                                      {platform.icon}
                                      {platform.label}
                                      <span className="opacity-80 font-normal">({activeModel === 'sales' ? 'بيعي' : activeModel === 'engagement' ? 'تفاعلي' : 'انتشار'})</span>
                                    </div>
                                    <div className="flex gap-2">
                                      <button 
                                        onClick={() => copyToClipboard(storyText)}
                                        className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                                      >
                                        <Copy className="w-4 h-4" />
                                      </button>
                                      <button 
                                        onClick={() => exportToPDF('ستوري', storyText, platform.label)}
                                        className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                                      >
                                        <FileText className="w-4 h-4" />
                                      </button>
                                      <button 
                                        onClick={() => exportPackage(storyText, generatedImage, platform.label)}
                                        className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                                      >
                                        <Share2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                  <div 
                                    className={`p-6 bg-slate-50 whitespace-pre-wrap leading-relaxed ${brandSize} ${brandWeight}`}
                                    style={{ fontFamily: brandFont, color: brandColor }}
                                  >
                                    {storyText}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {activeTab === 'image_editor' && (
                          <div className="space-y-6">
                            <h4 className="text-indigo-600 mb-4 flex items-center gap-2">
                              <Scissors className="w-5 h-5" />
                              أدوات تعديل الصور
                            </h4>
                            
                            {(generatedImage || uploadedImage) ? (
                              <ImageEditor 
                                image={generatedImage || uploadedImage || ''} 
                                onSave={(newImage) => {
                                  if (generatedImage) setGeneratedImage(newImage);
                                  else setUploadedImage(newImage);
                                }}
                              />
                            ) : (
                              <div className="bg-mtn-silver dark:bg-mtn-black p-12 rounded-3xl border-4 border-dashed border-mtn-blue/10 flex flex-col items-center justify-center text-mtn-blue/50 gap-6">
                                <ImageIcon className="w-24 h-24 opacity-20" />
                                <p className="text-[24px] font-black">يرجى توليد صورة أو رفع صورة أولاً للبدء في التعديل</p>
                              </div>
                            )}
                          </div>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* Action Bar */}
                  <div className="p-10 bg-mtn-silver dark:bg-mtn-black border-t-8 border-mtn-yellow space-y-8">
                    <div className="flex flex-col gap-6">
                      <div className="relative flex-1">
                        <input 
                          type="text" 
                          placeholder="أضف ملاحظاتك للتعديل (مثال: اجعله أكثر حماساً)..."
                          className="w-full px-8 py-6 bg-white dark:bg-mtn-grey border-4 border-mtn-blue/5 focus:border-mtn-yellow rounded-[24px] focus:outline-none transition-all text-[22px] font-bold"
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && regeneratePart(activeTab, (activeTab === 'hook' || activeTab === 'summary') ? undefined : selectedPlatform)}
                        />
                      </div>
                      <button 
                        onClick={() => {
                          playSound(CLICK_SOUND);
                          regeneratePart(activeTab, (activeTab === 'hook' || activeTab === 'summary') ? undefined : selectedPlatform);
                        }}
                        disabled={regenerating}
                        className="bg-mtn-blue text-white px-10 py-6 rounded-[24px] font-black text-[24px] flex items-center justify-center gap-4 hover:bg-mtn-blue/90 transition-all disabled:opacity-30 shadow-3xl"
                      >
                        {regenerating ? <Loader2 className="w-8 h-8 animate-spin" /> : <Sparkles className="w-8 h-8" />}
                        إعادة توليد بلمسة ذكية
                      </button>
                    </div>
                    
                    <div className="flex flex-wrap justify-center items-center gap-6 pt-4">
                      {['summary', 'hook', 'video_request'].includes(activeTab) && (
                        <>
                          <button 
                            onClick={() => {
                              playSound(CLICK_SOUND);
                              const text = activeTab === 'hook' ? strategy.hooks.join('\n') : 
                                         activeTab === 'summary' ? strategy.summary :
                                         strategy.videoRequest ? `${strategy.videoRequest.visualPrompt}\n\n${strategy.videoRequest.audioScript}` : '';
                              copyToClipboard(text || '');
                            }}
                            className="text-[20px] font-black text-mtn-blue hover:text-mtn-yellow dark:text-mtn-silver px-6 py-3 rounded-2xl bg-white dark:bg-mtn-grey shadow-md transition-all flex items-center gap-3"
                          >
                            <Copy className="w-6 h-6" />
                            نسخ النص الكامل
                          </button>
                          <button 
                            onClick={() => {
                              playSound(CLICK_SOUND);
                              const text = activeTab === 'hook' ? strategy.hooks.join('\n') : 
                                         activeTab === 'summary' ? strategy.summary :
                                         strategy.videoRequest ? `${strategy.videoRequest.visualPrompt}\n\n${strategy.videoRequest.audioScript}` : '';
                              exportToPDF(activeTab, text || '', 'عام');
                            }}
                            className="text-[20px] font-black text-mtn-blue/80 hover:text-mtn-blue dark:text-mtn-silver px-6 py-3 rounded-2xl bg-white dark:bg-mtn-grey shadow-md transition-all flex items-center gap-3"
                          >
                            <FileText className="w-6 h-6" />
                            تصدير PDF
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-12 text-center pt-16">
                <button 
                  onClick={() => {
                    playSound(CLICK_SOUND);
                    setStrategy(null);
                    setProductName('');
                    setGeneratedImage(null);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="text-mtn-blue/60 hover:text-mtn-blue dark:hover:text-mtn-yellow font-black text-[22px] flex items-center gap-4 mx-auto transition-all"
                >
                  <ArrowLeft className="w-8 h-8" />
                  بدء قصة نجاح جديدة لمنتج آخر
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State / Features */}
        {!strategy && !loading && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-24"
          >
            {[
              { 
                icon: <ImageIcon className="w-10 h-10 text-mtn-yellow" />, 
                title: "تصميم صور احترافية", 
                desc: "توليد صور جذابة لمنتجك بدقة عالية وألوان متناسقة." 
              },
              { 
                icon: <TypeIcon className="w-10 h-10 text-mtn-yellow" />, 
                title: "كابشن إعلاني", 
                desc: "نصوص بيعية مقنعة مصممة لزيادة المبيعات والانتشار." 
              },
              { 
                icon: <Clapperboard className="w-10 h-10 text-mtn-yellow" />, 
                title: "سكريبتات فيديو", 
                desc: "نصوص فيديو قصيرة وطويلة مصممة للترند والانتشار." 
              },
              { 
                icon: <Magnet className="w-10 h-10 text-mtn-yellow" />, 
                title: "هوك خاطف", 
                desc: "عناوين تضمن بقاء جمهورك لمشاهدة محتواك للنهاية." 
              }
            ].map((feature, i) => (
              <div key={i} className="mtn-card p-10 hover:shadow-4xl group cursor-default">
                <div className="bg-mtn-silver dark:bg-mtn-black w-24 h-24 rounded-[24px] flex items-center justify-center mb-8 border-4 border-transparent group-hover:border-mtn-yellow transition-all">
                  {feature.icon}
                </div>
                <h5 className="text-[28px] font-black text-mtn-blue dark:text-white mb-4">{feature.title}</h5>
                <p className="text-[20px] font-bold text-mtn-blue/40 dark:text-mtn-silver leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </motion.div>
        )}
      </main>

      <footer className="max-w-6xl mx-auto px-6 py-20 border-t-8 border-mtn-yellow text-center space-y-4">
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-2xl bg-mtn-yellow flex items-center justify-center shadow-lg border-2 border-mtn-blue shrink-0">
            <span className="text-mtn-blue font-black text-[20px] tracking-tighter">MTN</span>
          </div>
          <span className="text-[24px] font-black text-mtn-blue dark:text-white">Hi MTN AI</span>
        </div>
        <p className="text-[18px] font-bold text-mtn-blue/70 dark:text-mtn-silver leading-relaxed">© 2026 كل الحقوق محفوظة لـ Hi MTN AI. تم التطوير بالذكاء الاصطناعي لراحتك ونمو أعمالك.</p>
      </footer>

      {/* Image Modal */}
      <AnimatePresence>
        {showImageModal && generatedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 sm:p-12"
            onClick={() => setShowImageModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-5xl w-full h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={generatedImage} 
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                referrerPolicy="no-referrer"
              />
              <button 
                onClick={() => setShowImageModal(false)}
                className="absolute -top-12 right-0 text-white hover:text-slate-300 flex items-center gap-2 font-bold"
              >
                إغلاق
                <ArrowLeft className="w-6 h-6 rotate-90" />
              </button>
              <button 
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = generatedImage;
                  link.download = `${productName || 'product'}-design.png`;
                  link.click();
                }}
                className="absolute -bottom-12 left-1/2 -translate-x-1/2 bg-white text-slate-900 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-xl hover:bg-slate-50 transition-all"
              >
                <Download className="w-5 h-5" />
                تحميل الصورة الاحترافية
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Image Editor Component ---
function ImageEditor({ image, onSave }: { image: string, onSave: (newImage: string) => void }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [filter, setFilter] = useState('none');
  const [userEditRequest, setUserEditRequest] = useState('');

  const onCropComplete = (_: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const filters = [
    { name: 'الأصلي', value: 'none' },
    { name: 'سينمائي', value: 'sepia(20%) saturate(140%) contrast(110%)' },
    { name: 'أسود وأبيض', value: 'grayscale(100%)' },
    { name: 'نيون دافئ', value: 'hue-rotate(20deg) brightness(120%) saturate(150%)' },
    { name: 'تباين عالي', value: 'contrast(150%) brightness(110%)' },
    { name: 'حالم', value: 'blur(1px) brightness(110%) contrast(90%)' },
  ];

  const handleSave = async () => {
    playSound(CLICK_SOUND);
    setIsProcessing(true);
    try {
      const croppedImage = await getCroppedImg(image, croppedAreaPixels, rotation, filter);
      onSave(croppedImage);
      playSound(SUCCESS_SOUND);
      // @ts-ignore
      import('canvas-confetti').then(confetti => confetti.default());
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-10">
      <div className="relative h-[500px] bg-mtn-black rounded-[40px] overflow-hidden shadow-4xl border-8 border-white dark:border-mtn-grey">
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={1}
          onCropChange={setCrop}
          onCropComplete={onCropComplete}
          onZoomChange={setZoom}
          style={{
            containerStyle: {
              filter: `${filter === 'none' ? '' : filter} brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`
            }
          }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 bg-mtn-silver dark:bg-mtn-black p-10 rounded-[40px] shadow-inner">
        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-[20px] font-black text-mtn-blue dark:text-mtn-yellow">السطوع: {brightness}%</label>
            <input type="range" value={brightness} min="50" max="150" onChange={(e) => setBrightness(Number(e.target.value))} className="w-full h-4 bg-white dark:bg-mtn-grey rounded-full accent-mtn-yellow appearance-none cursor-pointer" />
          </div>
          <div className="space-y-3">
            <label className="text-[20px] font-black text-mtn-blue dark:text-mtn-yellow">التباين: {contrast}%</label>
            <input type="range" value={contrast} min="50" max="150" onChange={(e) => setContrast(Number(e.target.value))} className="w-full h-4 bg-white dark:bg-mtn-grey rounded-full accent-mtn-yellow appearance-none cursor-pointer" />
          </div>
          <div className="space-y-3">
            <label className="text-[20px] font-black text-mtn-blue dark:text-mtn-yellow">التشبع: {saturation}%</label>
            <input type="range" value={saturation} min="0" max="200" onChange={(e) => setSaturation(Number(e.target.value))} className="w-full h-4 bg-white dark:bg-mtn-grey rounded-full accent-mtn-yellow appearance-none cursor-pointer" />
          </div>
        </div>

        <div className="space-y-6">
          <label className="text-[20px] font-black text-mtn-blue dark:text-mtn-yellow flex items-center gap-3">
            <Filter className="w-6 h-6" /> الفلاتر الاحترافية
          </label>
          <div className="flex flex-wrap gap-3">
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => {
                  playSound(CLICK_SOUND);
                  setFilter(f.value);
                }}
                className={`px-5 py-3 text-[16px] font-black rounded-2xl border-4 transition-all ${
                  filter === f.value 
                  ? 'bg-mtn-yellow text-mtn-black border-mtn-yellow shadow-xl' 
                  : 'bg-white dark:bg-mtn-grey text-mtn-blue/40 border-transparent hover:border-mtn-yellow/20'
                }`}
              >
                {f.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <label className="text-[20px] font-black text-mtn-blue dark:text-mtn-yellow flex items-center gap-3">
          <Sparkles className="w-6 h-6" /> لمسات ذكاء اصطناعي إضافية
        </label>
        <textarea
          value={userEditRequest}
          onChange={(e) => setUserEditRequest(e.target.value)}
          placeholder="اكتب أي تعديل ترغب به (مثلاً: أضف إضاءة مشمسة، اجعل الخلفية عصرية)..."
          className="w-full px-8 py-6 bg-white dark:bg-mtn-grey border-4 border-mtn-blue/5 focus:border-mtn-yellow rounded-[30px] focus:outline-none transition-all text-[20px] font-bold min-h-[120px] resize-none"
        />
      </div>

      <div className="flex justify-end pt-8">
        <button
          onClick={handleSave}
          disabled={isProcessing}
          className="bg-mtn-blue text-white px-12 py-6 rounded-[30px] font-black text-[24px] flex items-center gap-4 hover:bg-mtn-blue/90 transition-all shadow-4xl disabled:opacity-50"
        >
          {isProcessing ? (
            <Loader2 className="w-8 h-8 animate-spin" />
          ) : (
            <Check className="w-8 h-8" />
          )}
          اعتماد التعديلات
        </button>
      </div>
    </div>
  );
}

// --- Helper Functions for Image Processing ---
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: any,
  rotation = 0,
  filter = 'none'
): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return '';
  }

  const rotRad = (rotation * Math.PI) / 180;
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  );

  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.translate(-image.width / 2, -image.height / 2);

  ctx.drawImage(image, 0, 0);

  const data = ctx.getImageData(
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height
  );

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.putImageData(data, 0, 0);

  // Apply filter if any
  if (filter !== 'none') {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
      tempCtx.filter = filter;
      tempCtx.drawImage(canvas, 0, 0);
      return tempCanvas.toDataURL('image/png');
    }
  }

  return canvas.toDataURL('image/png');
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });
}

function rotateSize(width: number, height: number, rotation: number) {
  const rotRad = (rotation * Math.PI) / 180;

  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}
