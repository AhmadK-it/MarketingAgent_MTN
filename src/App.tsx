/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * App.tsx — Hi MTN AI Strategy App
 *
 * Bugs fixed vs. original:
 *  1. `finally` block no longer unconditionally calls setError()
 *  2. Broken retry logic removed; replaced with clean error state
 *  3. Correct Gemini model name (was "gemini-3-flash-preview")
 *  4. Duplicate platform sidebar removed (was producing 15-col layout)
 *  5. React.cloneElement on raw SVG node replaced with proper component
 *  6. `var` declarations replaced with `const` / `let`
 *  7. `alert()` for clipboard replaced with state-driven toast
 *  8. `confetti` dynamic re-import in ImageEditor removed; top-level import used
 *  9. `platforms` array moved out of component to avoid recreating each render
 * 10. All API calls extracted into dedicated modules (src/api/)
 */

import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
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
  Crop,
  Maximize,
  Filter,
  Check,
  X,
  RotateCcw,
  Scissors,
  FileText,
  Copy,
  Ghost,
  Linkedin,
  Sun,
  Moon,
} from 'lucide-react';

// ── Internal modules ──────────────────────────────────────────
import { LS_KEYS, CLICK_SOUND, SUCCESS_SOUND } from './constants';
import { playSound } from './utils/soundUtils';
import { downloadImage } from './utils/exportUtils';
import { exportToPDF, exportPackage, copyToClipboard } from './utils/exportUtils';
import {
  generateStrategyRequest,
  buildStrategyPrompt,
  regeneratePartRequest,
} from './api/strategyApi';
import {
  generateImageFromPrompt,
  generateProfessionalImage,
  transformImageWithStyle,
  generateAudio as generateAudioRequest,
  analyzeReferenceImage as analyzeReferenceImageRequest,
} from './api/mediaApi';
import { PLATFORMS } from './platforms';

import Header from './components/Header';
import ImageEditor from './components/ImageEditor';
import ModelSelector from './components/ModelSelector';
import ContentCard from './components/ContentCard';
import Toast from './components/Toast';

import type {
  StrategyData,
  InputMode,
  ActiveTab,
  ActiveModel,
  RequestType,
  ImageAspectRatio,
  BrandSettings,
} from './types';

// ─────────────────────────────────────────────────────────────
export default function App() {
  // ── Input state ─────────────────────────────────────────────
  const [productName, setProductName] = useState('');
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [requestType, setRequestType] = useState<RequestType>('all');
  const [productNotes, setProductNotes] = useState('');
  const [voiceInstructions, setVoiceInstructions] = useState('');
  const [restrictedWords, setRestrictedWords] = useState('');
  const [essentialKeywords, setEssentialKeywords] = useState('');

  // ── Media state ─────────────────────────────────────────────
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [targetProductImage, setTargetProductImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  const [extractedPrompt, setExtractedPrompt] = useState<{ ar: string; en: string } | null>(null);
  const [brandLogo, setBrandLogo] = useState<string | null>(null);

  // ── Result state ────────────────────────────────────────────
  const [strategy, setStrategy] = useState<StrategyData | null>(null);

  // ── UI / navigation state ───────────────────────────────────
  const [activeTab, setActiveTab] = useState<ActiveTab>('caption');
  const [activeModel, setActiveModel] = useState<ActiveModel>('sales');
  const [selectedPlatform, setSelectedPlatform] = useState('instagram');
  const [imageAspectRatio, setImageAspectRatio] = useState<ImageAspectRatio>('1:1');
  const [showImageModal, setShowImageModal] = useState(false);
  const [stylePreset, setStylePreset] = useState('photorealistic');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [feedback, setFeedback] = useState('');
  const [toast, setToast] = useState({ message: '', visible: false });

  // ── Loading / error state ───────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [transforming, setTransforming] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Branding / theming state ────────────────────────────────
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem(LS_KEYS.darkMode) === 'true'
  );
  const [brandFont, setBrandFont] = useState('Tajawal');
  const [brandSize, setBrandSize] = useState('text-lg');
  const [brandColor, setBrandColor] = useState('#00678f');
  const [brandWeight, setBrandWeight] = useState('font-normal');

  const brand: BrandSettings = { font: brandFont, size: brandSize, color: brandColor, weight: brandWeight };

  // ── Dark-mode effect ────────────────────────────────────────
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem(LS_KEYS.darkMode, String(darkMode));
  }, [darkMode]);

  // ── Persist branding preferences ────────────────────────────
  useEffect(() => {
    const s = (k: string) => localStorage.getItem(k);
    if (s(LS_KEYS.brandFont)) setBrandFont(s(LS_KEYS.brandFont)!);
    if (s(LS_KEYS.brandSize)) setBrandSize(s(LS_KEYS.brandSize)!);
    if (s(LS_KEYS.brandColor)) setBrandColor(s(LS_KEYS.brandColor)!);
    if (s(LS_KEYS.brandWeight)) setBrandWeight(s(LS_KEYS.brandWeight)!);
    if (s(LS_KEYS.selectedPlatform)) setSelectedPlatform(s(LS_KEYS.selectedPlatform)!);
  }, []);

  useEffect(() => {
    localStorage.setItem(LS_KEYS.brandFont, brandFont);
    localStorage.setItem(LS_KEYS.brandSize, brandSize);
    localStorage.setItem(LS_KEYS.brandColor, brandColor);
    localStorage.setItem(LS_KEYS.brandWeight, brandWeight);
    localStorage.setItem(LS_KEYS.selectedPlatform, selectedPlatform);
  }, [brandFont, brandSize, brandColor, brandWeight, selectedPlatform]);

  // ── Toast helper ────────────────────────────────────────────
  const showToast = useCallback((message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2500);
  }, []);

  // ── Image upload handler ────────────────────────────────────
  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, type: 'uploaded' | 'reference' | 'target') => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (type === 'uploaded') setUploadedImage(result);
        else if (type === 'reference') setReferenceImage(result);
        else if (type === 'target') setTargetProductImage(result);
      };
      reader.readAsDataURL(file);
    },
    []
  );

  // ── Trigger image generation (text-based or upload-based) ───
  const triggerImageGeneration = useCallback(
    async (imagePrompt: string) => {
      setImageLoading(true);
      try {
        let img: string | null = null;
        if (inputMode === 'image' && uploadedImage) {
          const [meta, base64] = uploadedImage.split(',');
          const mimeType = meta.split(':')[1].split(';')[0];
          img = await generateProfessionalImage(
            imagePrompt,
            base64,
            mimeType,
            imageAspectRatio,
            productNotes
          );
        } else {
          img = await generateImageFromPrompt(imagePrompt, imageAspectRatio);
        }
        if (img) setGeneratedImage(img);
      } catch (e) {
        console.error('Image generation failed:', e);
      } finally {
        setImageLoading(false);
      }
    },
    [inputMode, uploadedImage, imageAspectRatio, productNotes]
  );

  // ── Main strategy generation ─────────────────────────────────
  // FIX #1: finally no longer sets error — only catch does
  // FIX #2: broken retry removed
  const generateStrategy = useCallback(async () => {
    if (inputMode === 'text' && !productName.trim()) return;
    if (inputMode === 'image' && !uploadedImage) return;
    if (requestType === 'prompt_extract' && !extractedPrompt) {
      setError('يرجى استخراج البرومبت من الصورة أولاً.');
      return;
    }

    playSound(CLICK_SOUND);
    setLoading(true);
    setError(null);
    setStrategy(null);
    setGeneratedImage(null);
    setGeneratedAudio(null);

    try {
      const prompt = buildStrategyPrompt(
        requestType,
        productName,
        productNotes,
        extractedPrompt
      );

      let imageData: { base64: string; mimeType: string } | null = null;
      if (inputMode === 'image' && uploadedImage) {
        const [meta, base64] = uploadedImage.split(',');
        imageData = { base64, mimeType: meta.split(':')[1].split(';')[0] };
      }

      const data = await generateStrategyRequest(prompt, imageData);
      setStrategy(data);
      playSound(SUCCESS_SOUND);
      confetti();

      // Navigate to relevant tab
      if (requestType === 'video') setActiveTab('video_request');
      else if (requestType === 'image') setActiveTab('summary');
      else setActiveTab('caption');

      // Auto-generate image (skip for caption-only)
      if (data.imagePrompt && requestType !== 'caption') {
        triggerImageGeneration(data.imagePrompt);
      }
    } catch (err) {
      // FIX #1: error is set ONLY here in catch, never in finally
      console.error('Strategy generation failed:', err);
      setError('حدث خطأ أثناء توليد الاستراتيجية. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  }, [inputMode, productName, uploadedImage, requestType, extractedPrompt, productNotes, triggerImageGeneration]);

  // ── Part regeneration ────────────────────────────────────────
  const regeneratePart = useCallback(
    async (part: string, platform?: string) => {
      if (!strategy) return;
      setRegenerating(true);
      setError(null);

      try {
        let currentContent = '';
        if (part === 'hook') {
          currentContent = strategy.hooks.join('\n');
        } else if (part === 'summary') {
          currentContent = strategy.summary;
        } else if (platform) {
          const key = part === 'caption' ? 'captions' : part === 'script' ? 'scripts' : 'stories';
          currentContent = (strategy as Record<string, unknown>)[key]
            ? ((strategy as unknown as Record<string, Record<string, Record<string, string>>>)[key][platform]?.[activeModel] ?? '')
            : '';
        }

        const newContent = await regeneratePartRequest(
          productName,
          part,
          activeModel,
          currentContent,
          feedback,
          platform
        );

        setStrategy((prev) => {
          if (!prev) return null;
          const updated = { ...prev };
          if (part === 'hook') {
            updated.hooks = newContent
              .split('\n')
              .map((h) => h.replace(/^\d+\.\s*/, '').trim())
              .filter((h) => h.length > 0)
              .slice(0, 5);
          } else if (part === 'summary') {
            updated.summary = newContent;
          } else if (platform) {
            const key = part === 'caption' ? 'captions' : part === 'script' ? 'scripts' : 'stories';
            const existing = (updated as unknown as Record<string, Record<string, Record<string, string>>>)[key][platform] ?? { sales: '', engagement: '', viral: '' };
            (updated as unknown as Record<string, Record<string, Record<string, string>>>)[key] = {
              ...(updated as unknown as Record<string, Record<string, Record<string, string>>>)[key],
              [platform]: { ...existing, [activeModel]: newContent },
            };
          }
          return updated;
        });

        setFeedback('');
        showToast('تم إعادة التوليد بنجاح ✓');
      } catch (err) {
        console.error('Regeneration failed:', err);
        setError('حدث خطأ أثناء إعادة التوليد. يرجى المحاولة مرة أخرى.');
      } finally {
        setRegenerating(false);
      }
    },
    [strategy, activeModel, productName, feedback, showToast]
  );

  // ── Reference image analysis ─────────────────────────────────
  const analyzeReferenceImage = useCallback(async () => {
    if (!referenceImage) return;
    setAnalyzing(true);
    setError(null);
    try {
      const [meta, base64] = referenceImage.split(',');
      const mimeType = meta.split(':')[1].split(';')[0];
      const data = await analyzeReferenceImageRequest(base64, mimeType);
      setExtractedPrompt(data);
      setActiveTab('reference_result');
    } catch (err) {
      console.error('Reference analysis failed:', err);
      setError('حدث خطأ أثناء تحليل الصورة المرجعية.');
    } finally {
      setAnalyzing(false);
    }
  }, [referenceImage]);

  // ── Transform product with style prompt ──────────────────────
  const transformWithExtractedPrompt = useCallback(async () => {
    if (!targetProductImage || !extractedPrompt) return;
    setTransforming(true);
    setError(null);
    try {
      const [meta, base64] = targetProductImage.split(',');
      const mimeType = meta.split(':')[1].split(';')[0];
      const img = await transformImageWithStyle(base64, mimeType, extractedPrompt.en, imageAspectRatio);
      if (img) {
        setGeneratedImage(img);
        setActiveTab('image_editor');
      }
    } catch (err) {
      console.error('Image transform failed:', err);
      setError('حدث خطأ أثناء تحويل الصورة بناءً على البرومبت المستخرج.');
    } finally {
      setTransforming(false);
    }
  }, [targetProductImage, extractedPrompt, imageAspectRatio]);

  // ── Audio generation ─────────────────────────────────────────
  const generateAudio = useCallback(
    async (text: string) => {
      setAudioLoading(true);
      try {
        const url = await generateAudioRequest(text, voiceInstructions);
        if (url) setGeneratedAudio(url);
      } catch (err) {
        console.error('Audio generation failed:', err);
      } finally {
        setAudioLoading(false);
      }
    },
    [voiceInstructions]
  );

  // ── Copy helper (uses toast instead of alert) ────────────────
  const handleCopy = useCallback(
    async (text: string) => {
      await copyToClipboard(text);
      showToast('تم النسخ إلى الحافظة ✓');
    },
    [showToast]
  );

  // ── Model label helper ────────────────────────────────────────
  const modelLabel = activeModel === 'sales' ? 'بيعي' : activeModel === 'engagement' ? 'تفاعلي' : 'انتشار';

  // ── Tabs config ──────────────────────────────────────────────
  const tabs = [
    { id: 'summary', label: 'الاستراتيجية', icon: <ClipboardList className="w-6 h-6" />, show: true },
    { id: 'caption', label: 'كابشن', icon: <TypeIcon className="w-6 h-6" />, show: requestType === 'all' || requestType === 'caption' },
    { id: 'script', label: 'سكربت', icon: <Clapperboard className="w-6 h-6" />, show: requestType === 'all' || requestType === 'script' },
    { id: 'hook', label: 'هوك', icon: <Magnet className="w-6 h-6" />, show: requestType === 'all' || requestType === 'caption' || requestType === 'script' },
    { id: 'story', label: 'ستوري', icon: <Smartphone className="w-6 h-6" />, show: requestType === 'all' },
    { id: 'image_editor', label: 'المحرر', icon: <Scissors className="w-6 h-6" />, show: true },
    { id: 'video_request', label: 'فيديو', icon: <Video className="w-6 h-6" />, show: !!strategy?.videoRequest || requestType === 'video' },
  ].filter((t) => t.show);

  // ── Reset app ────────────────────────────────────────────────
  const resetApp = () => {
    playSound(CLICK_SOUND);
    setStrategy(null);
    setProductName('');
    setGeneratedImage(null);
    setGeneratedAudio(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────
  return (
    <div
      className={`min-h-screen ${darkMode ? 'dark bg-mtn-black' : 'bg-mtn-silver'} text-mtn-blue dark:text-mtn-blue-lighter font-sans selection:bg-mtn-yellow/20`}
      dir="rtl"
    >
      <Header darkMode={darkMode} onToggleDark={() => setDarkMode((d) => !d)} />

      <main className="max-w-6xl mx-auto px-6 py-16">

        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="text-center mb-20">
          <motion.h2
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-[48px] sm:text-[64px] font-black text-mtn-blue dark:text-mtn-blue-lighter mb-6 leading-tight"
          >
            اصنع نجاحك مع{' '}
            <span className="bg-mtn-yellow text-mtn-black px-4 rounded-xl">Hi MTN AI</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-[24px] text-mtn-blue/70 dark:text-mtn-blue-lighter max-w-3xl mx-auto font-medium"
          >
            حوّل أفكارك إلى خطط تسويقية ذكية وصور احترافية بضغطة زر واحدة.
          </motion.p>
        </section>

        {/* ── Input Card ───────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mtn-card overflow-hidden ${loading ? 'loading-flicker' : ''}`}
        >
          {/* Request type selector */}
          <div className="mb-14">
            <label className="text-[22px] font-black text-mtn-blue/70 dark:text-mtn-blue-lighter mb-8 block text-center uppercase tracking-widest">
              اختر مهمة الذكاء الاصطناعي
            </label>
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
                    setRequestType(type.id as RequestType);
                  }}
                  className={`flex flex-col items-center justify-center gap-4 p-8 rounded-[24px] font-black transition-all border-4 btn-interactive ${
                    requestType === type.id
                      ? 'border-mtn-yellow bg-mtn-yellow text-mtn-black shadow-2xl scale-105 z-10'
                      : 'border-mtn-silver dark:border-mtn-grey bg-mtn-silver dark:bg-mtn-grey text-mtn-blue/50 dark:text-mtn-blue-lighter/60 hover:border-mtn-yellow/50'
                  }`}
                >
                  {type.icon}
                  <span className="text-[18px]">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Prompt-extract reference image panel */}
          {requestType === 'prompt_extract' && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-mtn-yellow/10 dark:bg-mtn-blue-light/10 p-6 rounded-3xl border border-mtn-yellow/30 mb-4 space-y-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Magnet className="w-5 h-5 text-mtn-blue dark:text-mtn-blue-lighter" />
                <h3 className="font-bold text-mtn-blue dark:text-mtn-blue-lighter">
                  الخطوة 1: استخراج النمط من صورة تعجبك
                </h3>
              </div>
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="w-full md:w-48 shrink-0">
                  {referenceImage ? (
                    <div className="relative group rounded-2xl overflow-hidden border-4 border-white shadow-lg aspect-square">
                      <img src={referenceImage} className="w-full h-full object-cover" alt="Reference" />
                      <button
                        onClick={() => { setReferenceImage(null); setExtractedPrompt(null); }}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full aspect-square bg-mtn-silver dark:bg-mtn-black border-2 border-dashed border-mtn-blue/20 rounded-2xl cursor-pointer hover:border-mtn-yellow transition-all group">
                      <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'reference')} className="hidden" />
                      <Upload className="w-8 h-8 text-mtn-blue/30 group-hover:text-mtn-yellow mb-2" />
                      <span className="text-xs font-bold text-mtn-yellow">ارفع الصورة</span>
                    </label>
                  )}
                </div>
                <div className="flex-1 space-y-4 w-full">
                  <button
                    onClick={analyzeReferenceImage}
                    disabled={analyzing || !referenceImage}
                    className="w-full py-3 bg-mtn-blue hover:bg-mtn-blue-light disabled:bg-mtn-silver text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Magnet className="w-4 h-4" />}
                    تحليل واستخراج البرومبت
                  </button>
                  {extractedPrompt && (
                    <div className="grid grid-cols-1 gap-3">
                      <div className="bg-mtn-silver/50 dark:bg-mtn-black/50 p-3 rounded-xl border border-mtn-blue/20">
                        <span className="text-[10px] font-bold text-mtn-blue uppercase mb-1 block">البرومبت المستخرج (عربي)</span>
                        <p className="text-xs text-mtn-blue/70 line-clamp-2">{extractedPrompt.ar}</p>
                      </div>
                      <div className="bg-mtn-silver/50 dark:bg-mtn-black/50 p-3 rounded-xl border border-mtn-blue/20">
                        <span className="text-[10px] font-bold text-mtn-blue uppercase mb-1 block">Extracted Prompt (EN)</span>
                        <p className="text-xs text-mtn-blue/70 line-clamp-2 italic">{extractedPrompt.en}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Input mode toggle */}
          <div className="flex flex-wrap justify-center gap-6 mb-12">
            {[
              { mode: 'text' as InputMode, label: 'اكتب فكرة مشروعك', icon: <Sparkles className="w-10 h-10" />, activeColor: 'bg-mtn-blue dark:bg-mtn-blue-lighter text-white dark:text-mtn-black' },
              { mode: 'image' as InputMode, label: 'تحليل صورة المنتج', icon: <Camera className="w-10 h-10" />, activeColor: 'bg-mtn-yellow text-mtn-black' },
            ].map(({ mode, label, icon, activeColor }) => (
              <button
                key={mode}
                onClick={() => { playSound(CLICK_SOUND); setInputMode(mode); }}
                className={`flex-1 min-w-[300px] flex items-center justify-center gap-4 py-8 rounded-[32px] font-black transition-all btn-interactive ${
                  inputMode === mode
                    ? `${activeColor} shadow-3xl scale-105`
                    : 'bg-mtn-silver dark:bg-mtn-grey text-mtn-blue/40 dark:text-mtn-blue-lighter/60 hover:bg-mtn-silver/70'
                }`}
              >
                {icon}
                <span className="text-[28px]">{label}</span>
              </button>
            ))}
          </div>

          {/* Text input */}
          {inputMode === 'text' ? (
            <div className="space-y-12">
              <div className="flex flex-col gap-6">
                <label className="text-[26px] font-black text-mtn-blue dark:text-mtn-blue-lighter px-4">
                  ما هو اسم المنتج أو الفكرة؟
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    placeholder={requestType === 'prompt_extract' ? 'مثال: عطر لاكوست رجالي' : 'ماذا نسوق لك اليوم؟'}
                    className="w-full px-12 py-10 bg-mtn-silver dark:bg-mtn-black border-4 border-transparent focus:border-mtn-yellow rounded-[40px] focus:outline-none transition-all text-[32px] font-black text-mtn-blue dark:text-mtn-blue-lighter placeholder:text-mtn-blue/20"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && generateStrategy()}
                  />
                  <div className="absolute left-10 top-1/2 -translate-y-1/2 text-mtn-yellow group-focus-within:animate-bounce">
                    <Lightbulb className="w-12 h-12" />
                  </div>
                </div>
              </div>

              {/* Aspect ratio selector */}
              {(requestType === 'image' || requestType === 'prompt_extract' || requestType === 'all') && (
                <div className="space-y-6">
                  <label className="text-[26px] font-black text-mtn-blue dark:text-mtn-blue-lighter px-4 flex items-center gap-4">
                    <ImageIcon className="w-8 h-8" /> أبعاد التصميم
                  </label>
                  <div className="flex flex-col sm:flex-row gap-6">
                    {([
                      { ratio: '1:1' as ImageAspectRatio, label: 'مربع (1:1)', shape: 'w-8 h-8' },
                      { ratio: '9:16' as ImageAspectRatio, label: 'طولي (9:16)', shape: 'w-6 h-10' },
                      { ratio: '16:9' as ImageAspectRatio, label: 'عرضي (16:9)', shape: 'w-10 h-6' },
                    ] as const).map(({ ratio, label, shape }) => (
                      <button
                        key={ratio}
                        onClick={() => { playSound(CLICK_SOUND); setImageAspectRatio(ratio); }}
                        className={`flex-1 py-10 rounded-[40px] font-black border-4 transition-all flex items-center justify-center gap-6 ${imageAspectRatio === ratio ? 'bg-mtn-blue text-white border-mtn-blue shadow-2xl' : 'bg-mtn-silver dark:bg-mtn-black text-mtn-blue/40 border-transparent hover:border-mtn-yellow/30'}`}
                      >
                        <div className={`${shape} border-4 border-current rounded-lg`} />
                        <span className="text-[26px]">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Product notes */}
              <div className="space-y-4">
                <label className="text-[22px] font-black text-mtn-blue dark:text-mtn-blue-lighter px-4">
                  ملاحظات إضافية (اختياري)
                </label>
                <textarea
                  value={productNotes}
                  onChange={(e) => setProductNotes(e.target.value)}
                  placeholder="مثلاً: المنتج مخصص للشباب، اللون الأساسي أزرق، الأسلوب عصري..."
                  className="w-full px-8 py-6 bg-white dark:bg-mtn-grey border-4 border-mtn-blue/5 focus:border-mtn-yellow rounded-[30px] focus:outline-none transition-all text-[20px] font-bold min-h-[100px] resize-none"
                />
              </div>

              <button
                onClick={generateStrategy}
                disabled={loading || !productName.trim()}
                className={`w-full py-10 text-[40px] font-black rounded-[40px] transition-all shadow-3xl flex items-center justify-center gap-6 active:scale-95 btn-interactive ${
                  loading
                    ? 'bg-mtn-silver dark:bg-mtn-grey text-mtn-blue/20'
                    : 'bg-mtn-yellow text-mtn-black hover:bg-yellow-400 hover:shadow-2xl'
                }`}
              >
                {loading ? (
                  <><Loader2 className="w-12 h-12 animate-spin" /> جاري الإبداع...</>
                ) : (
                  <>{requestType === 'prompt_extract' ? 'تطبيق النمط' : 'ابدأ الابتكار'}<Zap className="w-12 h-12 fill-current" /></>
                )}
              </button>
            </div>
          ) : (
            /* Image upload mode */
            <div className="flex flex-col items-center gap-12">
              <div className="w-full max-w-2xl">
                {uploadedImage ? (
                  <div className="relative group rounded-[50px] overflow-hidden border-8 border-white dark:border-mtn-grey shadow-4xl aspect-square">
                    <img src={uploadedImage} className="w-full h-full object-cover" alt="Uploaded product" />
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
                className={`w-full max-w-2xl py-10 text-[40px] font-black rounded-[40px] transition-all shadow-3xl flex items-center justify-center gap-6 active:scale-95 btn-interactive ${
                  loading
                    ? 'bg-mtn-silver dark:bg-mtn-grey text-mtn-blue/20'
                    : 'bg-mtn-yellow text-mtn-black hover:bg-yellow-400 hover:shadow-2xl'
                }`}
              >
                {loading ? (
                  <><Loader2 className="w-12 h-12 animate-spin" /> جاري الإبداع...</>
                ) : (
                  <><Sparkles className="w-12 h-12" /> بداية عبقرية</>
                )}
              </button>
            </div>
          )}
        </motion.div>

        {/* ── Error banner ──────────────────────────────────────── */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-2xl mt-6 flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
              <button onClick={() => setError(null)} className="ml-auto">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Strategy Results ───────────────────────────────────── */}
        <AnimatePresence>
          {strategy && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* FIX #4: Only ONE sidebar column (was duplicated, causing 15-col layout) */}
              <div className="lg:col-span-3 space-y-4">
                <div className="mtn-card p-6 space-y-6 sticky top-32">
                  <h3 className="text-[22px] font-black text-mtn-blue dark:text-mtn-yellow border-b-4 border-mtn-yellow pb-3">
                    المنصات
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {PLATFORMS.map((platform) => (
                      <button
                        key={platform.id}
                        onClick={() => { playSound(CLICK_SOUND); setSelectedPlatform(platform.id); }}
                        className={`flex items-center gap-4 p-4 rounded-2xl font-black transition-all border-4 ${
                          selectedPlatform === platform.id
                            ? 'text-white border-mtn-blue bg-mtn-blue shadow-2xl scale-105'
                            : 'bg-mtn-silver dark:bg-mtn-black text-mtn-blue/70 border-transparent hover:border-mtn-yellow/30'
                        }`}
                      >
                        {/* FIX #5: use icon directly — no React.cloneElement on SVG */}
                        <div className={`p-3 rounded-xl ${selectedPlatform === platform.id ? 'bg-white/20' : 'bg-white shadow-md'}`}>
                          <span className={selectedPlatform === platform.id ? 'text-white' : 'text-mtn-blue'}>
                            {platform.icon}
                          </span>
                        </div>
                        <span className="text-[18px]">{platform.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Brand color picker */}
                  <div className="pt-4 border-t-4 border-mtn-silver dark:border-mtn-black">
                    <h4 className="text-[18px] font-black text-mtn-blue dark:text-mtn-yellow mb-4">التخصيص</h4>
                    <div className="flex items-center justify-between bg-mtn-silver dark:bg-mtn-black p-4 rounded-2xl">
                      <label className="text-[16px] font-bold text-mtn-blue dark:text-mtn-silver">لون البراند:</label>
                      <input
                        type="color"
                        value={brandColor}
                        onChange={(e) => setBrandColor(e.target.value)}
                        className="w-10 h-10 rounded-xl cursor-pointer border-4 border-white shadow-lg"
                      />
                    </div>
                  </div>

                  {/* Feedback for regeneration */}
                  <div>
                    <label className="text-[14px] font-bold text-mtn-blue/70 dark:text-mtn-silver mb-2 block">
                      ملاحظات لإعادة التوليد:
                    </label>
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="اجعله أكثر إقناعاً..."
                      className="w-full px-4 py-3 bg-mtn-silver dark:bg-mtn-black border-2 border-mtn-blue/10 focus:border-mtn-yellow rounded-2xl focus:outline-none text-sm resize-none min-h-[80px]"
                    />
                  </div>
                </div>
              </div>

              {/* Main content: 9 cols (total 3+9=12) */}
              <div className="lg:col-span-9 space-y-8">
                {/* Tab bar */}
                <div className="flex flex-wrap gap-3 bg-white dark:bg-mtn-grey p-4 rounded-[32px] border-4 border-mtn-yellow shadow-3xl">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => { playSound(CLICK_SOUND); setActiveTab(tab.id as ActiveTab); }}
                      className={`flex-1 flex items-center justify-center gap-3 py-5 px-6 rounded-[24px] font-black transition-all btn-interactive ${
                        activeTab === tab.id
                          ? 'bg-mtn-blue dark:bg-mtn-blue-lighter text-white dark:text-mtn-black shadow-2xl scale-105'
                          : 'text-mtn-blue/40 dark:text-mtn-blue-lighter/60 hover:bg-mtn-silver/50'
                      }`}
                    >
                      {tab.icon}
                      <span className="text-[18px] hidden xl:inline">{tab.label}</span>
                    </button>
                  ))}
                </div>

                {/* Content panel */}
                <div className="mtn-card overflow-hidden min-h-[600px] flex flex-col">
                  {/* Image preview row */}
                  {['summary', 'caption', 'story', 'script'].includes(activeTab) && (
                    <div className={`grid grid-cols-1 ${requestType !== 'caption' ? 'md:grid-cols-2' : ''} border-b-8 border-mtn-yellow`}>
                      {requestType !== 'video' && (
                        <div className="relative h-[400px] sm:h-[500px] bg-mtn-silver dark:bg-mtn-black flex items-center justify-center overflow-hidden">
                          {imageLoading && requestType !== 'caption' ? (
                            <div className="flex flex-col items-center gap-6">
                              <Loader2 className="w-16 h-16 text-mtn-blue animate-spin" />
                              <span className="text-[24px] font-black text-mtn-blue/70">جاري الإبداع...</span>
                            </div>
                          ) : (generatedImage ?? uploadedImage) ? (
                            <div className="relative w-full h-full group">
                              <img
                                src={generatedImage ?? uploadedImage ?? ''}
                                alt="Product"
                                className="w-full h-full object-contain cursor-zoom-in group-hover:scale-105 transition-transform duration-700"
                                referrerPolicy="no-referrer"
                                onClick={() => setShowImageModal(true)}
                              />
                              {generatedImage && !imageLoading && (
                                <button
                                  onClick={() => { playSound(CLICK_SOUND); downloadImage(generatedImage, `${productName || 'product'}-design.png`); }}
                                  className="absolute bottom-8 left-8 bg-white text-mtn-blue p-5 rounded-full shadow-4xl hover:scale-110 transition-all"
                                  title="تحميل"
                                >
                                  <Download className="w-8 h-8" />
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="text-mtn-blue/10 flex flex-col items-center gap-6">
                              <ImageIcon className="w-32 h-32" />
                              <span className="text-[24px] font-black">لا توجد صورة</span>
                            </div>
                          )}
                        </div>
                      )}
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

                  {/* Tab content */}
                  <div className="p-10 flex-1 bg-white dark:bg-mtn-grey">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={`${activeTab}-${selectedPlatform}`}
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -40 }}
                        className="prose prose-2xl prose-mtn max-w-none"
                      >
                        {/* Summary */}
                        {activeTab === 'summary' && (
                          <div className="space-y-10">
                            <h4 className="text-[40px] font-black text-mtn-blue dark:text-mtn-yellow mb-8 flex items-center gap-6">
                              <ClipboardList className="w-12 h-12 text-mtn-yellow" /> خارطة طريق نجاحك
                            </h4>
                            <div className="bg-mtn-silver dark:bg-mtn-black p-12 rounded-[40px] border-4 border-mtn-blue/5 text-[26px] font-bold text-mtn-blue dark:text-white leading-[1.7] shadow-inner">
                              {strategy.summary}
                            </div>
                            <button
                              onClick={() => regeneratePart('summary')}
                              disabled={regenerating}
                              className="flex items-center gap-2 text-mtn-blue/70 hover:text-mtn-blue font-bold transition-all"
                            >
                              {regenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                              إعادة توليد الملخص
                            </button>
                          </div>
                        )}

                        {/* Captions */}
                        {activeTab === 'caption' && (
                          <div className="space-y-8">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                              <h4 className="text-blue-600 flex items-center gap-2 font-bold">
                                <MessageSquare className="w-5 h-5" /> نصوص الكابشن لجميع المنصات
                              </h4>
                              <ModelSelector value={activeModel} onChange={setActiveModel} />
                            </div>
                            {PLATFORMS.filter((p) => strategy.captions[p.id]).map((platform) => (
                              <ContentCard
                                key={platform.id}
                                platform={platform}
                                content={strategy.captions[platform.id]?.[activeModel] ?? ''}
                                modelLabel={modelLabel}
                                brand={brand}
                                onCopy={() => handleCopy(strategy.captions[platform.id]?.[activeModel] ?? '')}
                                onExportPDF={() => exportToPDF('كابشن', strategy.captions[platform.id]?.[activeModel] ?? '', platform.label, brandLogo)}
                                onRegenerate={() => regeneratePart('caption', platform.id)}
                              />
                            ))}
                          </div>
                        )}

                        {/* Scripts */}
                        {activeTab === 'script' && (
                          <div className="space-y-8">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                              <h4 className="text-mtn-yellow flex items-center gap-2 font-bold">
                                <Video className="w-5 h-5" /> سكريبتات فيديو
                              </h4>
                              <ModelSelector value={activeModel} onChange={setActiveModel} />
                            </div>
                            <div className="flex justify-end mb-4">
                              <button
                                onClick={() => {
                                  const text = strategy.scripts['tiktok']?.[activeModel]
                                    ?? strategy.scripts['reels']?.[activeModel]
                                    ?? 'سكريبت الفيديو جاهز';
                                  generateAudio(text);
                                }}
                                disabled={audioLoading}
                                className="flex items-center gap-2 bg-mtn-yellow text-mtn-black px-6 py-3 rounded-xl font-bold hover:bg-yellow-400 transition-all disabled:opacity-50 shadow-lg"
                              >
                                {audioLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />}
                                توليد صوت للسكربت
                              </button>
                            </div>
                            {PLATFORMS.filter((p) => {
                              const key = p.id === 'instagram' ? 'reels' : p.id;
                              return !!strategy.scripts[key];
                            }).map((platform) => {
                              const key = platform.id === 'instagram' ? 'reels' : platform.id;
                              const options = strategy.scripts[key];
                              if (!options) return null;
                              return (
                                <ContentCard
                                  key={platform.id}
                                  platform={platform}
                                  content={options[activeModel] ?? ''}
                                  modelLabel={modelLabel}
                                  brand={brand}
                                  onCopy={() => handleCopy(options[activeModel] ?? '')}
                                  onExportPDF={() => exportToPDF('سكريبت', options[activeModel] ?? '', platform.label, brandLogo)}
                                  onRegenerate={() => regeneratePart('script', key)}
                                />
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

                        {/* Hooks */}
                        {activeTab === 'hook' && (
                          <div>
                            <div className="flex items-center justify-between mb-6">
                              <h4 className="text-red-600 flex items-center gap-2 font-bold">
                                <Magnet className="w-5 h-5" /> عناوين خاطفة (Viral Hooks)
                              </h4>
                              <button
                                onClick={() => regeneratePart('hook')}
                                disabled={regenerating}
                                className="flex items-center gap-2 text-mtn-blue/70 hover:text-mtn-blue font-bold text-sm transition-all"
                              >
                                {regenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                                إعادة توليد
                              </button>
                            </div>
                            <div className="space-y-4">
                              {strategy.hooks.map((hook, i) => (
                                <div key={i} className="bg-red-50 p-4 rounded-xl border border-red-100 flex items-center gap-3">
                                  <div className="bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0">
                                    {i + 1}
                                  </div>
                                  <p className="font-bold text-red-900 flex-1">{hook}</p>
                                  <button
                                    onClick={() => handleCopy(hook)}
                                    className="text-red-400 hover:text-red-600 transition-colors"
                                  >
                                    <Copy className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Stories */}
                        {activeTab === 'story' && (
                          <div className="space-y-8">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                              <h4 className="text-purple-600 flex items-center gap-2 font-bold">
                                <Smartphone className="w-5 h-5" /> أفكار الستوري
                              </h4>
                              <ModelSelector value={activeModel} onChange={setActiveModel} />
                            </div>
                            {PLATFORMS.filter((p) => strategy.stories[p.id]).map((platform) => {
                              const options = strategy.stories[platform.id];
                              if (!options) return null;
                              return (
                                <ContentCard
                                  key={platform.id}
                                  platform={platform}
                                  content={options[activeModel] ?? ''}
                                  modelLabel={modelLabel}
                                  brand={brand}
                                  onCopy={() => handleCopy(options[activeModel] ?? '')}
                                  onExportPDF={() => exportToPDF('ستوري', options[activeModel] ?? '', platform.label, brandLogo)}
                                  onRegenerate={() => regeneratePart('story', platform.id)}
                                  onExportPackage={() => exportPackage(options[activeModel] ?? '', generatedImage, platform.label)}
                                />
                              );
                            })}
                          </div>
                        )}

                        {/* Video request */}
                        {activeTab === 'video_request' && strategy.videoRequest && (
                          <div className="space-y-6">
                            <h4 className="text-slate-900 dark:text-white mb-4 flex items-center gap-2 font-bold">
                              <Video className="w-5 h-5 text-indigo-600" /> تفاصيل طلب الفيديو
                            </h4>
                            {[
                              { label: 'الوصف البصري (Visual Prompt)', icon: <Camera className="w-4 h-4 text-indigo-600" />, value: strategy.videoRequest.visualPrompt, mono: true },
                              { label: 'السكربت الصوتي (Audio Script)', icon: <Volume2 className="w-4 h-4 text-indigo-600" />, value: strategy.videoRequest.audioScript, mono: false },
                              { label: 'مدة المشاهد', icon: <Play className="w-4 h-4 text-indigo-600" />, value: strategy.videoRequest.sceneDuration, mono: false },
                            ].map(({ label, icon, value, mono }) => (
                              <div key={label} className="bg-slate-50 dark:bg-mtn-black/30 p-6 rounded-2xl border border-slate-100">
                                <h5 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                                  {icon} {label}
                                </h5>
                                <p className={`text-slate-700 dark:text-slate-300 ${mono ? 'font-mono text-sm bg-white dark:bg-mtn-black p-4 rounded-xl border border-slate-200' : ''}`}>
                                  {value}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Image editor */}
                        {activeTab === 'image_editor' && (generatedImage ?? uploadedImage) && (
                          <ImageEditor
                            image={generatedImage ?? uploadedImage ?? ''}
                            onSave={(newImg) => {
                              setGeneratedImage(newImg);
                              showToast('تم حفظ الصورة بنجاح ✓');
                            }}
                          />
                        )}
                        {activeTab === 'image_editor' && !generatedImage && !uploadedImage && (
                          <div className="flex flex-col items-center justify-center h-64 text-mtn-blue/30 gap-4">
                            <ImageIcon className="w-20 h-20" />
                            <p className="font-bold text-xl">لا توجد صورة لتحريرها بعد</p>
                          </div>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>

                {/* Reset button */}
                <div className="text-center pt-8">
                  <button
                    onClick={resetApp}
                    className="text-mtn-blue/60 hover:text-mtn-blue dark:hover:text-mtn-yellow font-black text-[20px] flex items-center gap-4 mx-auto transition-all"
                  >
                    <ArrowLeft className="w-6 h-6" />
                    بدء قصة نجاح جديدة لمنتج آخر
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Empty-state features grid ─────────────────────────── */}
        {!strategy && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-24"
          >
            {[
              { icon: <ImageIcon className="w-10 h-10 text-mtn-yellow" />, title: 'تصميم صور احترافية', desc: 'توليد صور جذابة لمنتجك بدقة عالية وألوان متناسقة.' },
              { icon: <TypeIcon className="w-10 h-10 text-mtn-yellow" />, title: 'كابشن إعلاني', desc: 'نصوص بيعية مقنعة مصممة لزيادة المبيعات والانتشار.' },
              { icon: <Clapperboard className="w-10 h-10 text-mtn-yellow" />, title: 'سكريبتات فيديو', desc: 'نصوص فيديو قصيرة وطويلة مصممة للترند والانتشار.' },
              { icon: <Magnet className="w-10 h-10 text-mtn-yellow" />, title: 'هوك خاطف', desc: 'عناوين تضمن بقاء جمهورك لمشاهدة محتواك للنهاية.' },
            ].map((feat, i) => (
              <div key={i} className="mtn-card p-10 hover:shadow-4xl group cursor-default">
                <div className="bg-mtn-silver dark:bg-mtn-black w-24 h-24 rounded-[24px] flex items-center justify-center mb-8 border-4 border-transparent group-hover:border-mtn-yellow transition-all">
                  {feat.icon}
                </div>
                <h5 className="text-[28px] font-black text-mtn-blue dark:text-white mb-4">{feat.title}</h5>
                <p className="text-[20px] font-bold text-mtn-blue/40 dark:text-mtn-silver leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </motion.div>
        )}
      </main>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="max-w-6xl mx-auto px-6 py-20 border-t-8 border-mtn-yellow text-center space-y-4">
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-2xl bg-mtn-yellow flex items-center justify-center shadow-lg border-2 border-mtn-blue shrink-0">
            <span className="text-mtn-blue font-black text-[20px] tracking-tighter">MTN</span>
          </div>
          <span className="text-[24px] font-black text-mtn-blue dark:text-white">Hi MTN AI</span>
        </div>
        <p className="text-[18px] font-bold text-mtn-blue/70 dark:text-mtn-silver leading-relaxed">
          © 2026 كل الحقوق محفوظة لـ Hi MTN AI. تم التطوير بالذكاء الاصطناعي لراحتك ونمو أعمالك.
        </p>
      </footer>

      {/* ── Image modal ────────────────────────────────────────── */}
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
                alt="Generated product"
              />
              <button
                onClick={() => setShowImageModal(false)}
                className="absolute -top-12 right-0 text-white hover:text-slate-300 flex items-center gap-2 font-bold"
              >
                إغلاق <X className="w-5 h-5" />
              </button>
              <button
                onClick={() => downloadImage(generatedImage, `${productName || 'product'}-design.png`)}
                className="absolute -bottom-12 left-1/2 -translate-x-1/2 bg-white text-slate-900 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-xl hover:bg-slate-50 transition-all"
              >
                <Download className="w-5 h-5" /> تحميل الصورة الاحترافية
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Toast ─────────────────────────────────────────────── */}
      <Toast message={toast.message} visible={toast.visible} />
    </div>
  );
}
