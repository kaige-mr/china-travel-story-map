import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import type { ChinaFeatureCollection } from "./types";

export type ChinaMapDetail = "low" | "high";

interface ChinaTopology extends Topology<{ china: GeometryCollection }> {
  objects: {
    china: GeometryCollection;
  };
}

const mapDataCache = new Map<ChinaMapDetail, Promise<ChinaFeatureCollection>>();

function isChinaTopology(value: unknown): value is ChinaTopology {
  if (!value || typeof value !== "object") {
    return false;
  }

  const topology = value as Partial<ChinaTopology>;
  return topology.type === "Topology" && Boolean(topology.objects?.china);
}

function assertFeatureCollection(value: unknown): asserts value is ChinaFeatureCollection {
  if (!value || typeof value !== "object" || (value as Partial<ChinaFeatureCollection>).type !== "FeatureCollection") {
    throw new Error("China map TopoJSON did not convert to a FeatureCollection.");
  }
}

function mapAssetUrl(detail: ChinaMapDetail) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/maps/china-${detail}.topo.json`;
}

export function topoJsonToFeatureCollection(topology: unknown): ChinaFeatureCollection {
  if (!isChinaTopology(topology)) {
    throw new Error("China map asset is not a supported TopoJSON topology.");
  }

  const converted = feature(topology, topology.objects.china);
  assertFeatureCollection(converted);
  return converted as unknown as ChinaFeatureCollection;
}

export function resetChinaMapDataCache() {
  mapDataCache.clear();
}

export function loadChinaMapData(detail: ChinaMapDetail): Promise<ChinaFeatureCollection> {
  const cached = mapDataCache.get(detail);
  if (cached) {
    return cached;
  }

  const request = fetch(mapAssetUrl(detail)).then(async (response) => {
    if (!response.ok) {
      throw new Error(`Failed to load China map asset: ${response.status}`);
    }

    return topoJsonToFeatureCollection(await response.json());
  });

  mapDataCache.set(detail, request);
  return request;
}
