import { createStore } from "zustand/vanilla";
import { persist, createJSONStorage } from "zustand/middleware";
import { get, set, del } from "idb-keyval";
import "fake-indexeddb/auto";

const idbStorage = {
  getItem: async (name) => {
    const val = (await get(name)) || null;
    console.log('getItem', name, '->', val ? 'exists' : 'null');
    return val;
  },
  setItem: async (name, value) => {
    console.log('setItem', name, '-> length:', value.length);
    await set(name, value);
  },
  removeItem: async (name) => {
    await del(name);
  },
};

const store = createStore(
  persist(
    (setFn) => ({
      story: { id: "demo", photos: [] },
      setStory: (story) => setFn({ story }),
    }),
    {
      name: "test-save",
      storage: createJSONStorage(() => idbStorage),
    }
  )
);

console.log("Initial state:", store.getState().story);
setTimeout(() => {
  console.log("Hydrated state:", store.getState().story);
  store.getState().setStory({ id: "real", photos: [1, 2, 3] });
  setTimeout(() => {
    console.log("State after update:", store.getState().story);
    
    // Now create a NEW store to simulate refresh
    console.log("\n--- SIMULATING REFRESH ---");
    const store2 = createStore(
      persist(
        (setFn) => ({
          story: { id: "demo2", photos: [] },
          setStory: (story) => setFn({ story }),
        }),
        {
          name: "test-save",
          storage: createJSONStorage(() => idbStorage),
        }
      )
    );
    console.log("Initial state 2:", store2.getState().story);
    setTimeout(() => {
      console.log("Hydrated state 2:", store2.getState().story);
    }, 500);
  }, 100);
}, 500);
