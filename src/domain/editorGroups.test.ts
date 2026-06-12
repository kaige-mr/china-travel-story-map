import { describe, expect, it } from "vitest";
import { createDemoStory, type Photo, type Story } from "./story";
import { groupPhotosForEditor, reconcileCityOrder } from "./editorGroups";

function photo(id: string, cityId: string, sortIndex: number): Photo {
  return {
    id,
    storyId: "grouped-story",
    cityId,
    url: `https://example.com/${id}.jpg`,
    caption: id,
    sortIndex,
    width: 1200,
    height: 1500
  };
}

describe("editor photo groups", () => {
  it("separates unbound photos and orders city groups using story city order", () => {
    const story: Story = {
      ...createDemoStory(),
      cityOrder: ["hangzhou", "xian"],
      photos: [
        photo("xian-late", "xian", 4),
        photo("pending", "", 1),
        photo("hangzhou", "hangzhou", 3),
        photo("xian-early", "xian", 2)
      ]
    };

    const groups = groupPhotosForEditor(story);

    expect(groups.unboundPhotos.map((item) => item.id)).toEqual(["pending"]);
    expect(groups.cityGroups.map((group) => group.city.id)).toEqual(["hangzhou", "xian"]);
    expect(groups.cityGroups[1].photos.map((item) => item.id)).toEqual(["xian-early", "xian-late"]);
  });

  it("preserves used city order, removes empty cities, and appends newly used cities", () => {
    const photos = [photo("hangzhou", "hangzhou", 1), photo("chengdu", "chengdu", 2)];

    expect(reconcileCityOrder(["xian", "hangzhou"], photos)).toEqual(["hangzhou", "chengdu"]);
  });
});
