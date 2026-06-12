import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/china-travel-story-map/",
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("three") || id.includes("@react-three")) {
              return "vendor-three";
            }
            if (id.includes("gsap")) {
              return "vendor-motion";
            }
            if (id.includes("topojson")) {
              return "vendor-topojson";
            }
          }
          if (id.includes("src/components/ChinaMapCanvas")) {
            return "china-map-webgl";
          }
        }
      }
    },
    modulePreload: {
      resolveDependencies(url, deps, context) {
        return deps.filter((dep) => {
          return !dep.includes("vendor-three") && 
                 !dep.includes("china-map-webgl") && 
                 !dep.includes("vendor-motion");
        });
      }
    }
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.ts",
    css: true
  }
});
