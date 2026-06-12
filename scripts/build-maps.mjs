import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { feature } from "topojson-client";
import { presimplify, quantile, simplify } from "topojson-simplify";
import { topology } from "topojson-server";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = resolve(root, "data/maps/china-tiandi.geo.json");
const outputDir = resolve(root, "public/maps");
const SVG_WIDTH = 1000;
const SVG_HEIGHT = 650;
const CHINA_RENDER_BOUNDS = {
  minLng: 73.4,
  maxLng: 135.2,
  minLat: 17.6,
  maxLat: 53.7
};
const MAIN_MAP_LAT_BUFFER = 0.6;

function buildTopology(geo, quantization, simplifyQuantile) {
  const baseTopology = topology({ china: geo }, quantization);
  const weightedTopology = presimplify(baseTopology);
  return simplify(weightedTopology, quantile(weightedTopology, simplifyQuantile));
}

function getFeaturePolygons(mapFeature) {
  if (mapFeature.geometry?.type === "Polygon") {
    return [{ featureName: mapFeature.properties.name, rings: mapFeature.geometry.coordinates }];
  }

  if (mapFeature.geometry?.type === "MultiPolygon") {
    return mapFeature.geometry.coordinates.map((rings) => ({
      featureName: mapFeature.properties.name,
      rings
    }));
  }

  return [];
}

function getRingBounds(ring) {
  return ring.reduce(
    (bounds, [lng, lat]) => ({
      minLng: Math.min(bounds.minLng, lng),
      maxLng: Math.max(bounds.maxLng, lng),
      minLat: Math.min(bounds.minLat, lat),
      maxLat: Math.max(bounds.maxLat, lat)
    }),
    {
      minLng: Number.POSITIVE_INFINITY,
      maxLng: Number.NEGATIVE_INFINITY,
      minLat: Number.POSITIVE_INFINITY,
      maxLat: Number.NEGATIVE_INFINITY
    }
  );
}

function isMainMapRing(ring) {
  if (ring.length < 2) {
    return false;
  }

  const bounds = getRingBounds(ring);
  return (
    bounds.minLat >= CHINA_RENDER_BOUNDS.minLat - MAIN_MAP_LAT_BUFFER &&
    bounds.maxLat <= CHINA_RENDER_BOUNDS.maxLat + MAIN_MAP_LAT_BUFFER &&
    bounds.maxLng >= CHINA_RENDER_BOUNDS.minLng &&
    bounds.minLng <= CHINA_RENDER_BOUNDS.maxLng
  );
}

function pointToSvg([lng, lat]) {
  return {
    x: ((lng - CHINA_RENDER_BOUNDS.minLng) / (CHINA_RENDER_BOUNDS.maxLng - CHINA_RENDER_BOUNDS.minLng)) * SVG_WIDTH,
    y: ((CHINA_RENDER_BOUNDS.maxLat - lat) / (CHINA_RENDER_BOUNDS.maxLat - CHINA_RENDER_BOUNDS.minLat)) * SVG_HEIGHT
  };
}

function ringToPath(ring) {
  return ring
    .map((point, index) => {
      const svgPoint = pointToSvg(point);
      return `${index === 0 ? "M" : "L"}${svgPoint.x.toFixed(1)} ${svgPoint.y.toFixed(1)}`;
    })
    .join(" ");
}

function buildSilhouetteSvg(featureCollection) {
  const polygons = featureCollection.features
    .flatMap(getFeaturePolygons)
    .filter((polygon) => polygon.rings[0] && isMainMapRing(polygon.rings[0]));
  const paths = polygons
    .map((polygon, index) => {
      const d = `${ringToPath(polygon.rings[0])} Z`;
      const opacity = 0.86 - (index % 5) * 0.025;
      return `<path d="${d}" fill="rgba(22, 38, 42, ${opacity.toFixed(2)})" stroke="rgba(255,196,111,0.42)" stroke-width="1"/>`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SVG_WIDTH} ${SVG_HEIGHT}" role="img" aria-label="China map silhouette"><rect width="${SVG_WIDTH}" height="${SVG_HEIGHT}" fill="none"/><g transform="translate(18 34)" opacity="0.32">${paths}</g><g>${paths}</g></svg>\n`;
}

async function main() {
  const geo = JSON.parse(await readFile(sourcePath, "utf8"));
  const highTopology = buildTopology(geo, 100000, 0.18);
  const lowTopology = buildTopology(geo, 100000, 0.02);
  const lowFeatureCollection = feature(lowTopology, lowTopology.objects.china);

  await mkdir(outputDir, { recursive: true });
  await writeFile(resolve(outputDir, "china-high.topo.json"), `${JSON.stringify(highTopology)}\n`);
  await writeFile(resolve(outputDir, "china-low.topo.json"), `${JSON.stringify(lowTopology)}\n`);
  await writeFile(resolve(outputDir, "china-silhouette.svg"), buildSilhouetteSvg(lowFeatureCollection));
}

await main();
