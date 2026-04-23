// ============================================================
// src/utils/imageUtils.ts — Image processing helpers
// ============================================================

/** Convert a base64 data-URL to a Blob object */
export const dataURLToBlob = (dataURL: string): Blob => {
  const [meta, base64] = dataURL.split(',');
  const mime = meta.match(/:(.*?);/)?.[1] ?? 'image/png';
  const binary = atob(base64);
  const buffer = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    buffer[i] = binary.charCodeAt(i);
  }
  return new Blob([buffer], { type: mime });
};

/**
 * Extract an image data-URL or object-URL from a Gemini response.
 * Tries inlineData first, then image.uri shapes.
 */
export const extractImageFromResponse = async (
  response: unknown
): Promise<string | null> => {
  const res = response as Record<string, unknown>;
  const candidates = res?.candidates as Array<Record<string, unknown>> | undefined;
  const parts =
    (candidates?.[0]?.content as Record<string, unknown>)?.parts as
      | Array<Record<string, unknown>>
      | undefined
    ?? [];

  for (const part of parts) {
    const inlineData = part.inlineData as
      | { data: string; mimeType?: string }
      | undefined;
    if (inlineData?.data) {
      return `data:${inlineData.mimeType ?? 'image/png'};base64,${inlineData.data}`;
    }

    const image = part.image as { uri?: string; imageUri?: string } | undefined;
    const uri = image?.uri ?? image?.imageUri;
    if (uri) {
      try {
        const blob = await fetch(uri).then((r) => r.blob());
        return URL.createObjectURL(blob);
      } catch (e) {
        console.warn('Failed to fetch remote image URI:', e);
      }
    }
  }

  // Fallback: top-level image.uri
  const topImage = res?.image as { uri?: string } | undefined;
  if (topImage?.uri) {
    try {
      const blob = await fetch(topImage.uri).then((r) => r.blob());
      return URL.createObjectURL(blob);
    } catch (e) {
      console.warn('Failed to fetch top-level image.uri:', e);
    }
  }

  return null;
};

// ── Canvas helpers ────────────────────────────────────────────

export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.setAttribute('crossOrigin', 'anonymous');
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', reject);
    img.src = url;
  });

export const rotateSize = (
  width: number,
  height: number,
  rotation: number
): { width: number; height: number } => {
  const rad = (rotation * Math.PI) / 180;
  return {
    width: Math.abs(Math.cos(rad) * width) + Math.abs(Math.sin(rad) * height),
    height: Math.abs(Math.sin(rad) * width) + Math.abs(Math.cos(rad) * height),
  };
};

export const getCroppedImg = async (
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  rotation = 0,
  filter = 'none'
): Promise<string> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const rotRad = (rotation * Math.PI) / 180;
  const { width: bBoxW, height: bBoxH } = rotateSize(
    image.width,
    image.height,
    rotation
  );

  canvas.width = bBoxW;
  canvas.height = bBoxH;

  ctx.translate(bBoxW / 2, bBoxH / 2);
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

  if (filter !== 'none') {
    const tmp = document.createElement('canvas');
    tmp.width = canvas.width;
    tmp.height = canvas.height;
    const tmpCtx = tmp.getContext('2d');
    if (tmpCtx) {
      tmpCtx.filter = filter;
      tmpCtx.drawImage(canvas, 0, 0);
      return tmp.toDataURL('image/png');
    }
  }

  return canvas.toDataURL('image/png');
};
