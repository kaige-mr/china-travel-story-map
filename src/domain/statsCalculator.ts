/**
 * Statistical calculations for travel footprints
 */

import { StoryNode } from './types';
import { calculateHaversineDistance } from '../utils/geo';

export interface TravelStats {
  totalDistanceKm: number;
  visitedCityCount: number;
  visitedProvinceCount: number;
  totalPhotos: number;
}

export function computeTravelStats(nodes: StoryNode[]): TravelStats {
  if (!nodes || nodes.length === 0) {
    return {
      totalDistanceKm: 0,
      visitedCityCount: 0,
      visitedProvinceCount: 0,
      totalPhotos: 0
    };
  }

  let totalDistanceKm = 0;
  for (let i = 1; i < nodes.length; i++) {
    totalDistanceKm += calculateHaversineDistance(
      { lat: nodes[i - 1].lat, lng: nodes[i - 1].lng },
      { lat: nodes[i].lat, lng: nodes[i].lng }
    );
  }

  const cities = new Set(nodes.map(n => n.cityName));
  const totalPhotos = nodes.reduce((acc, n) => acc + (n.photos ? n.photos.length : 0), 0);

  return {
    totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
    visitedCityCount: cities.size,
    visitedProvinceCount: Math.min(34, cities.size),
    totalPhotos
  };
}
