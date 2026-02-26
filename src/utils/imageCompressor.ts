const MAX_EDGE = 1536;
const JPEG_QUALITY = 0.8;

/**
 * Decode a raw base64 string + mimeType into a Blob.
 */
function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteChars = atob(base64);
  const byteArray = new Uint8Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteArray[i] = byteChars.charCodeAt(i);
  }
  return new Blob([byteArray], { type: mimeType });
}

/**
 * Resize and re-encode using OffscreenCanvas (Chrome, Firefox, Edge).
 */
async function compressWithOffscreen(
  base64: string,
  mimeType: string,
): Promise<{ base64: string; mimeType: string }> {
  const blob = base64ToBlob(base64, mimeType);
  const bitmap = await createImageBitmap(blob);

  let w = bitmap.width;
  let h = bitmap.height;
  const longest = Math.max(w, h);
  if (longest > MAX_EDGE) {
    const scale = MAX_EDGE / longest;
    w = Math.round(w * scale);
    h = Math.round(h * scale);
  }

  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get OffscreenCanvas 2d context');
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const outBlob = await canvas.convertToBlob({
    type: 'image/jpeg',
    quality: JPEG_QUALITY,
  });

  const buffer = await outBlob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return { base64: btoa(binary), mimeType: 'image/jpeg' };
}

/**
 * Resize and re-encode using HTMLCanvasElement (Safari fallback).
 */
function compressWithCanvas(
  base64: string,
  mimeType: string,
): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let w = img.width;
      let h = img.height;
      const longest = Math.max(w, h);
      if (longest > MAX_EDGE) {
        const scale = MAX_EDGE / longest;
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas 2d context'));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);

      const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
      // Strip the "data:image/jpeg;base64," prefix
      const commaIdx = dataUrl.indexOf(',');
      resolve({
        base64: commaIdx !== -1 ? dataUrl.slice(commaIdx + 1) : dataUrl,
        mimeType: 'image/jpeg',
      });
    };
    img.onerror = () => reject(new Error('Failed to load image for compression'));
    img.src = `data:${mimeType};base64,${base64}`;
  });
}

/**
 * Compress/resize an image for AI identification.
 *
 * - Resizes so the longest edge is max 1536 px (Gemini sweet spot)
 * - Re-encodes as JPEG at quality 0.8
 * - Uses OffscreenCanvas when available, HTMLCanvasElement as fallback
 * - On failure returns the original image unchanged
 *
 * @param base64   Raw base64 string (no data: prefix)
 * @param mimeType Original MIME type (e.g. "image/jpeg")
 * @returns        Compressed base64 string and mimeType
 */
export async function compressImage(
  base64: string,
  mimeType: string,
): Promise<{ base64: string; mimeType: string }> {
  try {
    if (typeof OffscreenCanvas !== 'undefined') {
      return await compressWithOffscreen(base64, mimeType);
    }
    return await compressWithCanvas(base64, mimeType);
  } catch (err) {
    console.warn('Image compression failed, using original:', err);
    return { base64, mimeType };
  }
}
