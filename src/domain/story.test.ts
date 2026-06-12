import { describe, expect, it } from "vitest";
import {
  createDemoStory,
  getCitiesWithPhotos,
  getPhotosForCity,
  validateStoryForPublish
} from "./story";

describe("story domain", () => {
  it("rejects publishing when a photo is not bound to a city", () => {
    const story = createDemoStory();
    const invalidStory = {
      ...story,
      photos: story.photos.map((photo, index) =>
        index === 0 ? { ...photo, cityId: "" } : photo
      )
    };

    expect(validateStoryForPublish(invalidStory)).toEqual({
      ok: false,
      reason: "Every photo needs a city before publishing."
    });
  });

  it("returns only cities that have photos in story order", () => {
    const story = createDemoStory();

    expect(getCitiesWithPhotos(story).map((city) => city.name)).toEqual([
      "Xi'an",
      "Chengdu",
      "Hangzhou"
    ]);
  });

  it("sorts photos within a city by sortIndex", () => {
    const story = createDemoStory();

    expect(getPhotosForCity(story, "hangzhou").map((photo) => photo.caption)).toEqual([
      "Morning light on West Lake",
      "Tea fields after rain"
    ]);
  });
});
