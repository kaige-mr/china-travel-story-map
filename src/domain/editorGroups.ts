import { findCity } from "./cities";
import type { City, Photo, Story } from "./story";

export interface EditorCityGroup {
  city: City;
  photos: Photo[];
}

export interface EditorPhotoGroups {
  unboundPhotos: Photo[];
  cityGroups: EditorCityGroup[];
}

export function reconcileCityOrder(cityOrder: string[], photos: Photo[]): string[] {
  const usedCityIds = new Set(photos.map((photo) => photo.cityId).filter(Boolean));

  return [
    ...cityOrder.filter((cityId) => usedCityIds.has(cityId)),
    ...Array.from(usedCityIds).filter((cityId) => !cityOrder.includes(cityId))
  ];
}

export function groupPhotosForEditor(story: Story): EditorPhotoGroups {
  const sortedPhotos = [...story.photos].sort((left, right) => left.sortIndex - right.sortIndex);
  const unboundPhotos = sortedPhotos.filter((photo) => !photo.cityId);
  const cityOrder = reconcileCityOrder(story.cityOrder, sortedPhotos);
  const cityGroups = cityOrder.flatMap((cityId) => {
    const city = findCity(cityId);
    const photos = sortedPhotos.filter((photo) => photo.cityId === cityId);

    return city && photos.length > 0 ? [{ city, photos }] : [];
  });

  return { unboundPhotos, cityGroups };
}
