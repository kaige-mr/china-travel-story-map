/**
 * Canvas card generator for social media footprint sharing
 */

export interface ShareCardOptions {
  storyTitle: string;
  totalDistanceKm: number;
  cityCount: number;
}

export function generateShareCardCanvas(opts: ShareCardOptions): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, 600, 400);
  gradient.addColorStop(0, '#1E293B');
  gradient.addColorStop(1, '#0F172A');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 600, 400);

  // Card Content
  ctx.fillStyle = '#D4AF37';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText(opts.storyTitle, 40, 60);

  ctx.fillStyle = '#F8FAFC';
  ctx.font = '16px sans-serif';
  ctx.fillText(`足迹总里程: ${opts.totalDistanceKm} 公里`, 40, 120);
  ctx.fillText(`点亮城市: ${opts.cityCount} 座`, 40, 160);

  ctx.fillStyle = '#94A3B8';
  ctx.font = '12px sans-serif';
  ctx.fillText('由 China Travel Story Map 自动生成', 40, 360);

  return canvas;
}
