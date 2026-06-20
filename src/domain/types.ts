/**
 * Consolidated domain types for story map entities
 */

export interface StoryNode {
  id: string;
  cityId: string;
  cityName: string;
  date: string;
  title: string;
  description: string;
  photos: string[];
  lat: number;
  lng: number;
}

export interface TravelStory {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  nodes: StoryNode[];
  theme: 'gold' | 'neon' | 'light';
}

export interface CityOption {
  code: string;
  name: string;
  province: string;
  lat: number;
  lng: number;
}
