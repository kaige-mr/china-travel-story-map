import { describe, it, expect } from 'vitest';
import { SplineInterpolator, SplinePoint } from '../SplineInterpolator';

describe('SplineInterpolator & Trajectory Resampling', () => {
  const controlPoints: SplinePoint[] = [
    { x: 0, y: 0 },
    { x: 50, y: 80 },
    { x: 100, y: 20 },
    { x: 150, y: 100 }
  ];

  it('generates smooth subdivided path through control points', () => {
    const path = SplineInterpolator.generateSmoothPath(controlPoints, 10);
    expect(path.length).toBeGreaterThan(controlPoints.length);
    expect(path[0].x).toBeCloseTo(controlPoints[0].x, 1);
    expect(path[0].y).toBeCloseTo(controlPoints[0].y, 1);
  });

  it('generates 3D parabolic flight arc with altitude elevation', () => {
    const start: SplinePoint = { x: 0, y: 0 };
    const end: SplinePoint = { x: 100, y: 100 };
    const arc = SplineInterpolator.generateFlightArc(start, end, 80, 20);

    expect(arc.length).toBe(21);
    expect(arc[0].z).toBe(0);
    expect(arc[20].z).toBe(0);
    expect(arc[10].z).toBeCloseTo(80, 1); // Peak altitude at midpoint
  });

  it('resamples path with uniform arc lengths', () => {
    const resampled = SplineInterpolator.resampleEquidistant(controlPoints, 20);
    expect(resampled.length).toBe(20);
    expect(resampled[0].x).toBe(controlPoints[0].x);
    expect(resampled[19].x).toBe(controlPoints[3].x);
  });
});
