import { beforeEach, describe, expect, it } from "vitest";
import { createDemoStory } from "../domain/story";
import { LocalStoryRepository } from "./storyRepository";

describe("LocalStoryRepository", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("publishes and reloads a shareable story by id", async () => {
    const repository = new LocalStoryRepository();
    const story = createDemoStory();

    const published = await repository.publish(story);
    const loaded = await repository.findById(published.id);

    expect(published.publishedAt).toEqual(expect.any(String));
    expect(loaded?.title).toBe(story.title);
    expect(loaded?.photos).toHaveLength(story.photos.length);
  });
});
