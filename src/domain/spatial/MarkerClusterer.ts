/**
 * Multi-Resolution Marker Clusterer
 * Dynamically aggregates closely situated travel pins into weighted cluster markers
 * based on geographic distance threshold and map viewport scale.
 */

export interface GeoPoint {
  id: string;
  lat: number;
  lng: number;
  weight?: number;
  title?: string;
  metadata?: Record<string, unknown>;
}

export interface GeoCluster {
  id: string;
  lat: number;
  lng: number;
  count: number;
  points: GeoPoint[];
  bounds: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
}

export interface ClusterOptions {
  gridSize?: number;       // Grid cell size in pixels
  maxZoom?: number;        // Zoom level at which clustering ceases
  radiusKm?: number;       // Clustering radius in kilometers
}

export class MarkerClusterer {
  private points: GeoPoint[] = [];
  private options: Required<ClusterOptions>;
  private cache: Map<string, GeoCluster[]> = new Map();

  constructor(points: GeoPoint[] = [], options: ClusterOptions = {}) {
    this.points = [...points];
    this.options = {
      gridSize: options.gridSize ?? 60,
      maxZoom: options.maxZoom ?? 16,
      radiusKm: options.radiusKm ?? 35
    };
  }

  public setPoints(points: GeoPoint[]): void {
    this.points = [...points];
    this.cache.clear();
  }

  public addPoint(point: GeoPoint): void {
    this.points.push(point);
    this.cache.clear();
  }

  public getClusters(zoom: number): GeoCluster[] {
    const clampedZoom = Math.max(1, Math.min(20, Math.floor(zoom)));
    const cacheKey = `zoom_${clampedZoom}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    if (clampedZoom >= this.options.maxZoom) {
      const discreteClusters: GeoCluster[] = this.points.map(pt => ({
        id: `single_${pt.id}`,
        lat: pt.lat,
        lng: pt.lng,
        count: 1,
        points: [pt],
        bounds: { minLat: pt.lat, maxLat: pt.lat, minLng: pt.lng, maxLng: pt.lng }
      }));
      this.cache.set(cacheKey, discreteClusters);
      return discreteClusters;
    }

    const clusters: GeoCluster[] = [];
    const visited = new Set<string>();
    const effectiveRadius = this.calculateEffectiveRadius(clampedZoom);

    for (let i = 0; i < this.points.length; i++) {
      const p = this.points[i];
      if (visited.has(p.id)) continue;

      const clusterPoints: GeoPoint[] = [p];
      visited.add(p.id);

      for (let j = i + 1; j < this.points.length; j++) {
        const other = this.points[j];
        if (visited.has(other.id)) continue;

        const dist = this.haversineDistance(p.lat, p.lng, other.lat, other.lng);
        if (dist <= effectiveRadius) {
          clusterPoints.push(other);
          visited.add(other.id);
        }
      }

      clusters.push(this.buildCluster(`c_${clampedZoom}_${clusters.length}`, clusterPoints));
    }

    this.cache.set(cacheKey, clusters);
    return clusters;
  }

  private buildCluster(id: string, points: GeoPoint[]): GeoCluster {
    let sumLat = 0;
    let sumLng = 0;
    let minLat = Infinity;
    let maxLat = -Infinity;
    let minLng = Infinity;
    let maxLng = -Infinity;

    for (const pt of points) {
      sumLat += pt.lat;
      sumLng += pt.lng;
      if (pt.lat < minLat) minLat = pt.lat;
      if (pt.lat > maxLat) maxLat = pt.lat;
      if (pt.lng < minLng) minLng = pt.lng;
      if (pt.lng > maxLng) maxLng = pt.lng;
    }

    return {
      id,
      lat: sumLat / points.length,
      lng: sumLng / points.length,
      count: points.length,
      points,
      bounds: { minLat, maxLat, minLng, maxLng }
    };
  }

  private calculateEffectiveRadius(zoom: number): number {
    const scaleFactor = Math.pow(2, 8 - zoom);
    return Math.max(2, this.options.radiusKm * scaleFactor);
  }

  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
