import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  getChinaBounds,
  getFeaturePolygons,
  getMainMapBoundarySegments,
  getMainMapPolygons,
  getProvinceBoundarySegments,
  getRenderablePolygons,
  getSouthChinaSeaSegments
} from "./chinaGeo";
import type { ChinaFeatureCollection } from "./types";

const geo = JSON.parse(
  readFileSync(resolve(__dirname, "../../data/maps/china-tiandi.geo.json"), "utf8")
) as ChinaFeatureCollection;

describe("china geo data", () => {
  it("loads recognizable province-level China GeoJSON instead of a hand-drawn polygon", () => {
    expect(geo.type).toBe("FeatureCollection");
    expect(geo.features.length).toBeGreaterThanOrEqual(30);
    expect(geo.features.some((feature) => feature.properties.name === "浙江省")).toBe(true);
    expect(geo.features.some((feature) => feature.properties.name === "台湾省")).toBe(true);
  });

  it("exposes multipolygon and island geometry for rendering", () => {
    const polygons = getRenderablePolygons(geo);
    const multipolygonFeatures = geo.features.filter(
      (feature) => feature.geometry.type === "MultiPolygon"
    );

    expect(multipolygonFeatures.length).toBeGreaterThan(0);
    expect(polygons.length).toBeGreaterThan(geo.features.length);
    expect(polygons.some((polygon) => polygon.featureName === "海南省")).toBe(true);
  });

  it("computes China bounds from real coordinates", () => {
    const bounds = getChinaBounds(geo);

    expect(bounds.minLng).toBeLessThan(75);
    expect(bounds.maxLng).toBeGreaterThan(130);
    expect(bounds.minLat).toBeLessThan(19);
    expect(bounds.maxLat).toBeGreaterThan(50);
  });

  it("returns province boundary line segments", () => {
    const segments = getProvinceBoundarySegments(geo);

    expect(segments.length).toBeGreaterThan(40);
    expect(segments[0].length).toBeGreaterThan(20);
  });

  it("keeps polygon rings addressable for a named province", () => {
    const zhejiang = geo.features.find(
      (feature) => feature.properties.name === "浙江省"
    );

    expect(zhejiang).toBeDefined();
    expect(getFeaturePolygons(zhejiang!).length).toBeGreaterThan(0);
  });

  it("filters render geometry to the recognizable main China map", () => {
    const polygons = getMainMapPolygons(geo);

    expect(polygons.length).toBeGreaterThan(30);
    expect(polygons.length).toBeLessThan(getRenderablePolygons(geo).length);
    expect(polygons.some((polygon) => polygon.featureName === "海南省")).toBe(true);
    expect(polygons.some((polygon) => polygon.featureName === "台湾省")).toBe(true);
    expect(polygons.every((polygon) => polygon.rings[0].every(([, lat]) => lat >= 17))).toBe(true);
  });

  it("uses the same main-map filter for boundary lines", () => {
    const segments = getMainMapBoundarySegments(geo);

    expect(segments.length).toBeGreaterThan(30);
    expect(segments.length).toBeLessThan(getProvinceBoundarySegments(geo).length);
    expect(segments.every((segment) => segment.every(([, lat]) => lat >= 17))).toBe(true);
  });

  it("separates low-latitude South China Sea geometry for the inset", () => {
    const segments = getSouthChinaSeaSegments(geo);

    expect(segments.length).toBeGreaterThan(20);
    expect(segments.some((segment) => segment.some(([, lat]) => lat < 12))).toBe(true);
    expect(segments.every((segment) => segment.some(([, lat]) => lat < 17.6))).toBe(true);
  });
});
