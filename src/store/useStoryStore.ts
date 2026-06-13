import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { get, set, del } from "idb-keyval";
import { createDemoStory, type Photo, type Story } from "../domain/story";

const idbStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      return (await get(name)) || window.localStorage.getItem(name) || null;
    } catch (err) {
      console.warn("IDB get failed, falling back to localStorage", err);
      return window.localStorage.getItem(name) || null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await set(name, value);
      // Also write to localStorage if small enough, for extra safety
      try { window.localStorage.setItem(name, value); } catch (e) {}
    } catch (err) {
      console.warn("IDB set failed, falling back to localStorage", err);
      try {
        window.localStorage.setItem(name, value);
      } catch (lsErr) {
        console.error("localStorage also failed", lsErr);
      }
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await del(name);
    } catch (err) {
      console.warn("IDB remove failed", err);
    }
    window.localStorage.removeItem(name);
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
