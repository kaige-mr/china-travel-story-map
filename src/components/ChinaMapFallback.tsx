import { getMainMapBoundarySegments, getMainMapPolygons } from "../map/chinaGeo";
import { getProvinceVisualStyle } from "../map/mapStyle";
import { CHINA_RENDER_BOUNDS, projectLngLatToUnit } from "../map/projection";
import type { ChinaFeatureCollection, LngLat } from "../map/types";

const SVG_WIDTH = 1000;
const SVG_HEIGHT = 650;

function pointToSvg([lng, lat]: LngLat) {
  const unit = projectLngLatToUnit(lng, lat, CHINA_RENDER_BOUNDS);
  return {
    x: unit.x * SVG_WIDTH,
    y: unit.y * SVG_HEIGHT
  };
}

function ringToPath(ring: LngLat[]) {
  return ring
    .map((point, index) => {
      const svgPoint = pointToSvg(point);
      return `${index === 0 ? "M" : "L"}${svgPoint.x.toFixed(2)} ${svgPoint.y.toFixed(2)}`;
    })
    .join(" ");
}

interface ChinaMapFallbackProps {
  mapData: ChinaFeatureCollection;
}

export function ChinaMapFallback({ mapData }: ChinaMapFallbackProps) {
  const polygons = getMainMapPolygons(mapData);
  const boundaries = getMainMapBoundarySegments(mapData);

  return (
    <svg className="fallback-china-map" viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} role="img" aria-label="China map fallback">
      <g className="fallback-china-map__shadow">
        {polygons.map((polygon, index) => (
          <path key={`${polygon.featureName}-shadow-${index}`} d={`${ringToPath(polygon.rings[0])} Z`} />
        ))}
      </g>
      <g className="fallback-china-map__land">
        {polygons.map((polygon, index) => (
          <path
            key={`${polygon.featureName}-${index}`}
            d={`${ringToPath(polygon.rings[0])} Z`}
            style={{ fill: getProvinceVisualStyle(polygon.featureName, index).color }}
          />
        ))}
      </g>
      <g className="fallback-china-map__lines">
        {boundaries.map((line, index) => (
          <path key={`line-${index}`} d={ringToPath(line)} />
        ))}
      </g>
      <g className="fallback-china-map__inset">
        <rect x="806" y="470" width="150" height="124" rx="8" />
        <path d="M828 538 C850 518 884 520 908 500" />
        <path d="M838 566 C866 548 896 554 930 528" />
      </g>
    </svg>
  );
}
