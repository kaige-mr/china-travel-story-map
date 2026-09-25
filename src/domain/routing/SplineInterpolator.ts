/**
 * Catmull-Rom Spline & Flight Arc Interpolator
 * Produces organic, smooth curve trajectories between geographic travel destinations.
 * Supports arc height elevation simulation and uniform speed arc-length parameterization.
 */

export interface SplinePoint {
  x: number;
  y: number;
  z?: number;
}

export class SplineInterpolator {
  /**
   * Evaluates a Catmull-Rom spline at parameter t in [0, 1] across 4 control points.
   * alpha = 0.5 yields centripetal Catmull-Rom which avoids loops and self-intersections.
   */
  public static evaluateCatmullRom(
    p0: SplinePoint,
    p1: SplinePoint,
    p2: SplinePoint,
    p3: SplinePoint,
    t: number,
    alpha = 0.5
  ): SplinePoint {
    const t0 = 0;
    const t1 = this.getT(t0, alpha, p0, p1);
    const t2 = this.getT(t1, alpha, p1, p2);
    const t3 = this.getT(t2, alpha, p2, p3);

    const mappedT = t1 + t * (t2 - t1);

    const a1 = this.lerpPoint(p0, p1, (t1 - mappedT) / (t1 - t0), (mappedT - t0) / (t1 - t0));
    const a2 = this.lerpPoint(p1, p2, (t2 - mappedT) / (t2 - t1), (mappedT - t1) / (t2 - t1));
    const a3 = this.lerpPoint(p2, p3, (t3 - mappedT) / (t3 - t2), (mappedT - t2) / (t3 - t2));

    const b1 = this.lerpPoint(a1, a2, (t2 - mappedT) / (t2 - t0), (mappedT - t0) / (t2 - t0));
    const b2 = this.lerpPoint(a2, a3, (t3 - mappedT) / (t3 - t1), (mappedT - t1) / (t3 - t1));

    return this.lerpPoint(b1, b2, (t2 - mappedT) / (t2 - t1), (mappedT - t1) / (t2 - t1));
  }

  public static generateSmoothPath(points: SplinePoint[], subdivisions = 16, alpha = 0.5): SplinePoint[] {
    if (points.length < 2) return [...points];
    if (points.length === 2) {
      const res: SplinePoint[] = [];
      for (let i = 0; i <= subdivisions; i++) {
        const t = i / subdivisions;
        res.push({
          x: points[0].x + t * (points[1].x - points[0].x),
          y: points[0].y + t * (points[1].y - points[0].y)
        });
      }
      return res;
    }

    const extended: SplinePoint[] = [
      {
        x: points[0].x - (points[1].x - points[0].x),
        y: points[0].y - (points[1].y - points[0].y)
      },
      ...points,
      {
        x: points[points.length - 1].x + (points[points.length - 1].x - points[points.length - 2].x),
        y: points[points.length - 1].y + (points[points.length - 1].y - points[points.length - 2].y)
      }
    ];

    const result: SplinePoint[] = [];
    for (let i = 1; i < extended.length - 2; i++) {
      const p0 = extended[i - 1];
      const p1 = extended[i];
      const p2 = extended[i + 1];
      const p3 = extended[i + 2];

      const steps = i === extended.length - 3 ? subdivisions : subdivisions - 1;
      for (let s = 0; s <= steps; s++) {
        const t = s / subdivisions;
        result.push(this.evaluateCatmullRom(p0, p1, p2, p3, t, alpha));
      }
    }

    return result;
  }

  /**
   * Generates a 3D parabolic flight arc between two 2D geographic points
   */
  public static generateFlightArc(
    start: SplinePoint,
    end: SplinePoint,
    maxAltitude = 100,
    steps = 30
  ): SplinePoint[] {
    const arc: SplinePoint[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      // Parabolic altitude: 4 * maxAlt * t * (1 - t)
      const altitude = 4 * maxAltitude * t * (1 - t);
      arc.push({
        x: start.x + t * (end.x - start.x),
        y: start.y + t * (end.y - start.y),
        z: altitude
      });
    }
    return arc;
  }

  /**
   * Re-parameterizes a polyline to have equidistant sample intervals.
   */
  public static resampleEquidistant(points: SplinePoint[], targetCount: number): SplinePoint[] {
    if (points.length <= 1 || targetCount <= 1) return [...points];

    const lengths: number[] = [0];
    let totalLength = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const dx = points[i + 1].x - points[i].x;
      const dy = points[i + 1].y - points[i].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      totalLength += dist;
      lengths.push(totalLength);
    }

    const step = totalLength / (targetCount - 1);
    const resampled: SplinePoint[] = [points[0]];

    let currentSegment = 0;
    for (let i = 1; i < targetCount - 1; i++) {
      const targetDist = i * step;

      while (currentSegment < lengths.length - 1 && lengths[currentSegment + 1] < targetDist) {
        currentSegment++;
      }

      const segStartDist = lengths[currentSegment];
      const segEndDist = lengths[currentSegment + 1];
      const segLen = segEndDist - segStartDist;
      const t = segLen > 0 ? (targetDist - segStartDist) / segLen : 0;

      const pA = points[currentSegment];
      const pB = points[currentSegment + 1];

      resampled.push({
        x: pA.x + t * (pB.x - pA.x),
        y: pA.y + t * (pB.y - pA.y),
        z: (pA.z !== undefined && pB.z !== undefined) ? pA.z + t * (pB.z - pA.z) : undefined
      });
    }

    resampled.push(points[points.length - 1]);
    return resampled;
  }

  private static getT(t: number, alpha: number, p0: SplinePoint, p1: SplinePoint): number {
    const d = Math.sqrt((p1.x - p0.x) ** 2 + (p1.y - p0.y) ** 2);
    return t + Math.pow(d, alpha);
  }

  private static lerpPoint(pA: SplinePoint, pB: SplinePoint, factorA: number, factorB: number): SplinePoint {
    return {
      x: factorA * pA.x + factorB * pB.x,
      y: factorA * pA.y + factorB * pB.y
    };
  }
}
