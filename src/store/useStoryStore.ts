import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { get, set, del } from "idb-keyval";
import { createDemoStory, type Photo, type Story } from "../domain/story";

const idbStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await get(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};

interface StoryState {
  story: Story;
  setStory: (story: Story) => void;
  resetToDemo: () => void;
  updateTitle: (title: string) => void;
  addPhotos: (photos: Photo[]) => void;
}

export const useStoryStore = create<StoryState>()(
  persist(
    (setFn) => ({
      story: createDemoStory(),
      setStory: (story) => setFn({ story }),
      resetToDemo: () => setFn({ story: createDemoStory() }),
      updateTitle: (title) => setFn((state) => ({ story: { ...state.story, title } })),
      addPhotos: (photos) =>
        setFn((state) => ({
          story: {
            ...state.story,
            photos: [...state.story.photos, ...photos]
          }
        }))
    }),
    {
      name: "china-memory-story-auto-save",
      storage: createJSONStorage(() => idbStorage),
    }
  )
);
