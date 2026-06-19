import { describe, it, expect } from 'vitest';
import { generateRouteSvg } from './exportSvg';

describe('SVG Route Generator', () => {
  it('generates valid SVG markup with path and markers', () => {
    const points = [
      { x: 100, y: 150, label: 'Beijing' },
      { x: 200, y: 250, label: 'Xi\'an' },
      { x: 300, y: 350, label: 'Chengdu' }
    ];

    const svg = generateRouteSvg(points);
    expect(svg).toContain('<svg');
    expect(svg).toContain('M 100.0 150.0');
    expect(svg).toContain('Beijing');
    expect(svg).toContain('Chengdu');
  });
});
