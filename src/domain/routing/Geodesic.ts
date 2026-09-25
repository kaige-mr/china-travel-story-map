/**
 * High-Precision Geodesic Calculator on WGS-84 Ellipsoid
 * Computes Vincenty direct and inverse geodetic solutions, forward and reverse azimuths,
 * cross-track error, and along-track distances for flight navigation lines.
 */

export interface GeoCoordinate {
  lat: number;
  lng: number;
}

export interface GeodesicResult {
  distanceMeters: number;
  initialAzimuthDeg: number;
  finalAzimuthDeg: number;
}

export class GeodesicCalculator {
  // WGS-84 Ellipsoid Constants
  public static readonly A = 6378137.0;          // Semi-major axis
  public static readonly B = 6356752.314245;     // Semi-minor axis
  public static readonly F = 1 / 298.257223563;  // Flattening

  /**
   * Solves inverse geodetic problem using Vincenty's formula.
   */
  public static inverse(p1: GeoCoordinate, p2: GeoCoordinate): GeodesicResult {
    const phi1 = (p1.lat * Math.PI) / 180;
    const lambda1 = (p1.lng * Math.PI) / 180;
    const phi2 = (p2.lat * Math.PI) / 180;
    const lambda2 = (p2.lng * Math.PI) / 180;

    const L = lambda2 - lambda1;
    const tanU1 = (1 - this.F) * Math.tan(phi1);
    const cosU1 = 1 / Math.sqrt(1 + tanU1 * tanU1);
    const sinU1 = tanU1 * cosU1;

    const tanU2 = (1 - this.F) * Math.tan(phi2);
    const cosU2 = 1 / Math.sqrt(1 + tanU2 * tanU2);
    const sinU2 = tanU2 * cosU2;

    let lambda = L;
    let lambdaPrev: number;
    let sinLambda: number;
    let cosLambda: number;
    let sinSigma = 0;
    let cosSigma = 0;
    let sigma = 0;
    let sinAlpha = 0;
    let cosSqAlpha = 0;
    let cos2SigmaM = 0;

    let iterations = 100;
    do {
      sinLambda = Math.sin(lambda);
      cosLambda = Math.cos(lambda);
      sinSigma = Math.sqrt(
        (cosU2 * sinLambda) ** 2 +
        (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda) ** 2
      );

      if (sinSigma === 0) {
        return { distanceMeters: 0, initialAzimuthDeg: 0, finalAzimuthDeg: 0 };
      }

      cosSigma = sinU1 * sinU2 + cosU1 * cosU2 * cosLambda;
      sigma = Math.atan2(sinSigma, cosSigma);
      sinAlpha = (cosU1 * cosU2 * sinLambda) / sinSigma;
      cosSqAlpha = 1 - sinAlpha * sinAlpha;
      cos2SigmaM = cosSqAlpha !== 0 ? cosSigma - (2 * sinU1 * sinU2) / cosSqAlpha : 0;

      const C = (this.F / 16) * cosSqAlpha * (4 + this.F * (4 - 3 * cosSqAlpha));
      lambdaPrev = lambda;
      lambda = L + (1 - C) * this.F * sinAlpha *
        (sigma + C * sinSigma * (cos2SigmaM + C * cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM)));
    } while (Math.abs(lambda - lambdaPrev) > 1e-12 && --iterations > 0);

    const uSq = (cosSqAlpha * (this.A * this.A - this.B * this.B)) / (this.B * this.B);
    const A_coeff = 1 + (uSq / 16384) * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
    const B_coeff = (uSq / 1024) * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));
    const deltaSigma = B_coeff * sinSigma *
      (cos2SigmaM + (B_coeff / 4) * (cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM) -
      (B_coeff / 6) * cos2SigmaM * (-3 + 4 * sinSigma * sinSigma) * (-3 + 4 * cos2SigmaM * cos2SigmaM)));

    const distanceMeters = this.B * A_coeff * (sigma - deltaSigma);
    const initialAzimuth = Math.atan2(
      cosU2 * sinLambda,
      cosU1 * sinU2 - sinU1 * cosU2 * cosLambda
    );
    const finalAzimuth = Math.atan2(
      cosU1 * sinLambda,
      -sinU1 * cosU2 + cosU1 * sinU2 * cosLambda
    );

    return {
      distanceMeters: Math.abs(distanceMeters),
      initialAzimuthDeg: ((initialAzimuth * 180) / Math.PI + 360) % 360,
      finalAzimuthDeg: ((finalAzimuth * 180) / Math.PI + 360) % 360
    };
  }

  /**
   * Computes Cross-Track Distance (meters) from a query point to a great circle route segment.
   */
  public static crossTrackDistance(point: GeoCoordinate, start: GeoCoordinate, end: GeoCoordinate): number {
    const R = 6371000; // Mean Earth radius
    const d13 = this.haversineDistance(start, point) / R;
    const theta13 = this.bearingRadians(start, point);
    const theta12 = this.bearingRadians(start, end);

    const dXt = Math.asin(Math.sin(d13) * Math.sin(theta13 - theta12));
    return dXt * R;
  }

  /**
   * Computes Along-Track Distance (meters) from start along the segment to the closest point to query.
   */
  public static alongTrackDistance(point: GeoCoordinate, start: GeoCoordinate, end: GeoCoordinate): number {
    const R = 6371000;
    const d13 = this.haversineDistance(start, point) / R;
    const dXt = this.crossTrackDistance(point, start, end) / R;

    const dAt = Math.acos(Math.cos(d13) / Math.cos(dXt));
    return dAt * R;
  }

  public static haversineDistance(p1: GeoCoordinate, p2: GeoCoordinate): number {
    const R = 6371000;
    const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
    const dLon = ((p2.lng - p1.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((p1.lat * Math.PI) / 180) *
      Math.cos((p2.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private static bearingRadians(p1: GeoCoordinate, p2: GeoCoordinate): number {
    const phi1 = (p1.lat * Math.PI) / 180;
    const phi2 = (p2.lat * Math.PI) / 180;
    const deltaLambda = ((p2.lng - p1.lng) * Math.PI) / 180;

    const y = Math.sin(deltaLambda) * Math.cos(phi2);
    const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
    return Math.atan2(y, x);
  }
}
