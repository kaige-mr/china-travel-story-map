/**
 * SVG vector generator for travel route diagrams
 */

export interface SvgPoint {
  x: number;
  y: number;
  label: string;
}

export function generateRouteSvg(points: SvgPoint[], width = 800, height = 600): string {
  if (!points || points.length === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"></svg>`;
  }

  const pathData = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');

  const markers = points
    .map(
      p => `
    <circle cx="${p.x}" cy="${p.y}" r="6" fill="#D4AF37" stroke="#FFFFFF" stroke-width="2" />
    <text x="${p.x + 8}" y="${p.y + 4}" font-size="12" fill="#333333" font-family="sans-serif">${p.label}</text>`
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <rect width="100%" height="100%" fill="#F8FAFC" />
  <path d="${pathData}" fill="none" stroke="#D4AF37" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
  ${markers}
</svg>`;
}
