import { readFileSync } from "node:fs";
import { stat } from "node:fs/promises";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getMainMapBoundarySegments, getMainMapPolygons, getProvinceBoundarySegments } from "./chinaGeo";
import { loadChinaMapData, resetChinaMapDataCache, topoJsonToFeatureCollection } from "./chinaMapData";

const root = resolve(__dirname, "../..");

function readJson(path: string) {
  return JSON.parse(readFileSync(resolve(root, path), "utf8"));
}

describe("china map data assets", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    resetChinaMapDataCache();
  });

  it("ships low and high TopoJSON assets outside the JavaScript bundle", async () => {
    const raw = await stat(resolve(root, "data/maps/china-tiandi.geo.json"));
    const low = await stat(resolve(root, "public/maps/china-low.topo.json"));
    const high = await stat(resolve(root, "public/maps/china-high.topo.json"));
    const silhouette = await stat(resolve(root, "public/maps/china-silhouette.svg"));

    expect(low.size).toBeLessThan(high.size);
    expect(high.size).toBeLessThan(raw.size);
    expect(silhouette.size).toBeGreaterThan(1000);
  });

  it("converts generated TopoJSON back to recognizable China GeoJSON", () => {
    const geo = topoJsonToFeatureCollection(readJson("public/maps/china-low.topo.json"));
    const names = geo.features.map((feature) => feature.properties.name);

    expect(names).toContain("浙江省");
    expect(names).toContain("台湾省");
    expect(names).toContain("海南省");
    expect(getMainMapPolygons(geo).length).toBeGreaterThan(30);
    expect(getProvinceBoundarySegments(geo).length).toBeGreaterThan(40);
    expect(getMainMapBoundarySegments(geo).length).toBeGreaterThan(30);
  });

  it("loads map detail through fetch once and returns the cached feature collection", async () => {
    const topology = readJson("public/maps/china-low.topo.json");
    const fetch = vi.fn(async () => ({
      ok: true,
      json: async () => topology
    }));
    vi.stubGlobal("fetch", fetch);

    const first = await loadChinaMapData("low");
    const second = await loadChinaMapData("low");

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith("/maps/china-low.topo.json");
    expect(second).toBe(first);
    expect(first.features.some((feature) => feature.properties.name === "浙江省")).toBe(true);
  });
});
