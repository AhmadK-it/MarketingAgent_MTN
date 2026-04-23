// ============================================================
// src/components/ImageEditor.tsx
// Crop / rotate / filter editor powered by react-easy-crop
// ============================================================

import React, { useState } from 'react';
import Cropper from 'react-easy-crop';
import confetti from 'canvas-confetti';
import { Loader2, Check, Filter, Sparkles } from 'lucide-react';
import { CLICK_SOUND, SUCCESS_SOUND } from '../constants';
import { playSound } from '../utils/soundUtils';
import { getCroppedImg } from '../utils/imageUtils';

interface ImageEditorProps {
  image: string;
  onSave: (newImage: string) => void;
}

const FILTERS = [
  { name: 'الأصلي', value: 'none' },
  { name: 'سينمائي', value: 'sepia(20%) saturate(140%) contrast(110%)' },
  { name: 'أسود وأبيض', value: 'grayscale(100%)' },
  { name: 'نيون دافئ', value: 'hue-rotate(20deg) brightness(120%) saturate(150%)' },
  { name: 'تباين عالي', value: 'contrast(150%) brightness(110%)' },
  { name: 'حالم', value: 'blur(1px) brightness(110%) contrast(90%)' },
];

const ImageEditor: React.FC<ImageEditorProps> = ({ image, onSave }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{
    x: number; y: number; width: number; height: number;
  } | null>(null);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [filter, setFilter] = useState('none');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    playSound(CLICK_SOUND);
    setIsProcessing(true);
    try {
      const cropped = await getCroppedImg(image, croppedAreaPixels, rotation, filter);
      onSave(cropped);
      playSound(SUCCESS_SOUND);
      confetti();
    } catch (e) {
      console.error('Image editor save failed:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  const containerFilter = [
    filter !== 'none' ? filter : '',
    `brightness(${brightness}%)`,
    `contrast(${contrast}%)`,
    `saturate(${saturation}%)`,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="space-y-10">
      {/* Crop canvas */}
      <div className="relative h-[500px] bg-mtn-black rounded-[40px] overflow-hidden shadow-4xl border-8 border-white dark:border-mtn-grey">
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={1}
          onCropChange={setCrop}
          onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
          onZoomChange={setZoom}
          style={{ containerStyle: { filter: containerFilter } }}
        />
      </div>

      {/* Adjustment controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 bg-mtn-silver dark:bg-mtn-black p-10 rounded-[40px] shadow-inner">
        <div className="space-y-6">
          {[
            { label: 'السطوع', value: brightness, setter: setBrightness, min: 50, max: 150 },
            { label: 'التباين', value: contrast, setter: setContrast, min: 50, max: 150 },
            { label: 'التشبع', value: saturation, setter: setSaturation, min: 0, max: 200 },
          ].map(({ label, value, setter, min, max }) => (
            <div key={label} className="space-y-3">
              <label className="text-[20px] font-black text-mtn-blue dark:text-mtn-yellow">
                {label}: {value}%
              </label>
              <input
                type="range"
                value={value}
                min={min}
                max={max}
                onChange={(e) => setter(Number(e.target.value))}
                className="w-full h-4 bg-white dark:bg-mtn-grey rounded-full accent-mtn-yellow appearance-none cursor-pointer"
              />
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <label className="text-[20px] font-black text-mtn-blue dark:text-mtn-yellow flex items-center gap-3">
            <Filter className="w-6 h-6" /> الفلاتر الاحترافية
          </label>
          <div className="flex flex-wrap gap-3">
            {FILTERS.map((f) => (
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

      {/* Rotation control */}
      <div className="space-y-3 px-2">
        <label className="text-[20px] font-black text-mtn-blue dark:text-mtn-yellow">
          التدوير: {rotation}°
        </label>
        <input
          type="range"
          value={rotation}
          min={-180}
          max={180}
          onChange={(e) => setRotation(Number(e.target.value))}
          className="w-full h-4 bg-white dark:bg-mtn-grey rounded-full accent-mtn-yellow appearance-none cursor-pointer"
        />
      </div>

      {/* Save button */}
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
};

export default ImageEditor;
