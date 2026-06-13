import { get, set } from "idb-keyval";
import type { Story } from "../domain/story";

const storyKey = (id: string) => `china-memory-story:${id}`;
const latestKey = "china-memory-story:latest";

export interface StoryRepository {
  publish(story: Story): Promise<Story>;
  findById(id: string): Promise<Story | undefined>;
  findLatest(): Promise<Story | undefined>;
}

export class LocalStoryRepository implements StoryRepository {
  async publish(story: Story): Promise<Story> {
    const published: Story = {
      ...story,
      publishedAt: new Date().toISOString()
    };

    await set(storyKey(published.id), JSON.stringify(published));
    await set(latestKey, published.id);
    return published;
  }

  async findById(id: string): Promise<Story | undefined> {
    const rawStory = await get(storyKey(id));
    return rawStory ? (JSON.parse(rawStory) as Story) : undefined;
  }

  async findLatest(): Promise<Story | undefined> {
    const latestId = await get(latestKey);
    return latestId ? this.findById(latestId as string) : undefined;
  }
}

export const storyRepository = new LocalStoryRepository();
