import { create } from "zustand";
import { createDemoStory, type Photo, type Story } from "../domain/story";

interface StoryState {
  story: Story;
  setStory: (story: Story) => void;
  resetToDemo: () => void;
  updateTitle: (title: string) => void;
  addPhotos: (photos: Photo[]) => void;
}

export const useStoryStore = create<StoryState>((set) => ({
  story: createDemoStory(),
  setStory: (story) => set({ story }),
  resetToDemo: () => set({ story: createDemoStory() }),
  updateTitle: (title) => set((state) => ({ story: { ...state.story, title } })),
  addPhotos: (photos) =>
    set((state) => ({
      story: {
        ...state.story,
        photos: [...state.story.photos, ...photos]
      }
    }))
}));
