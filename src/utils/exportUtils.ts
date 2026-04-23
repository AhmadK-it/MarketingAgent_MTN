// ============================================================
// src/utils/exportUtils.ts — PDF / ZIP / download helpers
// ============================================================

import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { dataURLToBlob } from './imageUtils';

export const downloadImage = async (
  url: string,
  filename: string
): Promise<void> => {
  try {
    let blobUrl: string;
    if (url.startsWith('data:')) {
      blobUrl = URL.createObjectURL(dataURLToBlob(url));
    } else {
      const blob = await fetch(url).then((r) => r.blob());
      blobUrl = URL.createObjectURL(blob);
    }
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(blobUrl);
  } catch (e) {
    console.error('Download failed:', e);
  }
};

export const exportToPDF = (
  title: string,
  content: string,
  platformLabel: string,
  brandLogo?: string | null
): void => {
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

  if (brandLogo) {
    doc.addImage(brandLogo, 'PNG', 85, 10, 40, 40);
  }

  doc.setFontSize(16);
  doc.text('Hi MTN AI', 105, 55, { align: 'center' });
  doc.setFontSize(14);
  doc.text(`${title} – ${platformLabel}`, 105, 65, { align: 'center' });
  doc.setFontSize(12);

  const split = doc.splitTextToSize(content, 180);
  // @ts-ignore – jsPDF RTL support
  doc.text(split, 105, 80, { align: 'center', direction: 'rtl' });

  doc.save(`mshakas_${title}_${platformLabel}.pdf`);
};

export const exportPackage = async (
  content: string,
  imageUrl: string | null,
  name: string
): Promise<void> => {
  const zip = new JSZip();
  zip.file(`${name}.txt`, content);

  if (imageUrl) {
    try {
      const blob = await fetch(imageUrl).then((r) => r.blob());
      zip.file(`${name}_image.png`, blob);
    } catch (e) {
      console.error('Failed to add image to ZIP:', e);
    }
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(zipBlob);
  a.download = `${name}_package.zip`;
  a.click();
};

export const copyToClipboard = async (text: string): Promise<void> => {
  await navigator.clipboard.writeText(text);
};
