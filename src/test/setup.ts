import "@testing-library/jest-dom/vitest";

const memoryStorage = () => {
  const values = new Map<string, string>();

  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
    clear: () => values.clear()
  };
};

if (typeof window !== "undefined" && typeof window.localStorage.clear !== "function") {
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: memoryStorage()
  });
}
