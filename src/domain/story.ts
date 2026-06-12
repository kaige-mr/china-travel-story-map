import { cities, findCity } from "./cities";

export interface City {
  id: string;
  name: string;
  localName: string;
  province: string;
  lng: number;
  lat: number;
}

export interface Photo {
  id: string;
  storyId: string;
  cityId: string;
  url: string;
  caption: string;
  sortIndex: number;
  width: number;
  height: number;
}

export interface Story {
  id: string;
  title: string;
  coverCityId: string;
  cityOrder: string[];
  createdAt: string;
  publishedAt?: string;
  photos: Photo[];
}

export type PublishValidation =
  | { ok: true }
  | { ok: false; reason: string };

export function validateStoryForPublish(story: Story): PublishValidation {
  if (story.photos.length === 0) {
    return { ok: false, reason: "Add at least one photo before publishing." };
  }

  if (story.photos.some((photo) => !photo.cityId)) {
    return { ok: false, reason: "Every photo needs a city before publishing." };
  }

  if (story.photos.some((photo) => !findCity(photo.cityId))) {
    return { ok: false, reason: "Every photo needs a supported city." };
  }

  return { ok: true };
}

export function getPhotosForCity(story: Story, cityId: string): Photo[] {
  return story.photos
    .filter((photo) => photo.cityId === cityId)
    .sort((left, right) => left.sortIndex - right.sortIndex);
}

export function getCitiesWithPhotos(story: Story): City[] {
  const usedCityIds = new Set(story.photos.map((photo) => photo.cityId).filter(Boolean));
  const orderedIds = [
    ...story.cityOrder.filter((cityId) => usedCityIds.has(cityId)),
    ...Array.from(usedCityIds).filter((cityId) => !story.cityOrder.includes(cityId))
  ];

  return orderedIds
    .map((cityId) => findCity(cityId))
    .filter((city): city is City => Boolean(city));
}

export function createBlankStory(): Story {
  return {
    id: `story-${Date.now()}`,
    title: "My China Travel Story",
    coverCityId: "hangzhou",
    cityOrder: [],
    createdAt: new Date().toISOString(),
    photos: []
  };
}

export function createDemoStory(): Story {
  return {
    id: "demo-china-memory",
    title: "Seven Days Across China",
    coverCityId: "xian",
    cityOrder: ["xian", "chengdu", "hangzhou"],
    createdAt: "2026-06-10T00:00:00.000Z",
    publishedAt: "2026-06-10T00:00:00.000Z",
    photos: [
      {
        id: "xian-wall",
        storyId: "demo-china-memory",
        cityId: "xian",
        url: "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=82",
        caption: "Ancient walls at sunset",
        sortIndex: 1,
        width: 1200,
        height: 1500
      },
      {
        id: "chengdu-tea",
        storyId: "demo-china-memory",
        cityId: "chengdu",
        url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=82",
        caption: "Slow afternoon in Chengdu",
        sortIndex: 1,
        width: 1200,
        height: 1500
      },
      {
        id: "hangzhou-lake",
        storyId: "demo-china-memory",
        cityId: "hangzhou",
        url: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=82",
        caption: "Morning light on West Lake",
        sortIndex: 1,
        width: 1200,
        height: 1500
      },
      {
        id: "hangzhou-tea",
        storyId: "demo-china-memory",
        cityId: "hangzhou",
        url: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1200&q=82",
        caption: "Tea fields after rain",
        sortIndex: 2,
        width: 1200,
        height: 1500
      }
    ]
  };
}

export function cityLabel(cityId: string): string {
  const city = findCity(cityId);
  return city ? `${city.name} / ${city.localName}` : "Select city";
}

export { cities };
