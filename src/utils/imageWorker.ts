/**
 * Web Worker for asynchronous image compression and resizing
 */

export interface ResizeMessage {
  file: File;
  maxWidth: number;
  quality: number;
}

export function createResizeWorkerBlobUrl(): string {
  const code = `
    self.onmessage = async (e) => {
      const { file, maxWidth, quality } = e.data;
      try {
        const bitmap = await createImageBitmap(file);
        const scale = Math.min(1, maxWidth / bitmap.width);
        const w = Math.round(bitmap.width * scale);
        const h = Math.round(bitmap.height * scale);

        const canvas = new OffscreenCanvas(w, h);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(bitmap, 0, 0, w, h);

        const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: quality || 0.85 });
        self.postMessage({ success: true, blob });
      } catch (err) {
        self.postMessage({ success: false, error: String(err) });
      }
    };
  `;
  const blob = new Blob([code], { type: 'application/javascript' });
  return URL.createObjectURL(blob);
}
