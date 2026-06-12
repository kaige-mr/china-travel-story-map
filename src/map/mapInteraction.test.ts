import { describe, expect, it } from "vitest";
import { MAP_ORBIT_CONTROLS } from "./mapInteraction";

describe("map interaction", () => {
  it("keeps the default camera higher than the previous low stage angle", () => {
    expect(MAP_ORBIT_CONTROLS.defaultCameraPosition[1]).toBeGreaterThan(0.7);
    expect(MAP_ORBIT_CONTROLS.maxPolarAngle).toBeLessThan(Math.PI * 0.62);
  });

  it("allows deliberate side-to-side orbiting without letting the map roll away", () => {
    expect(Math.abs(MAP_ORBIT_CONTROLS.minAzimuthAngle)).toBeGreaterThan(Math.PI * 0.2);
    expect(MAP_ORBIT_CONTROLS.maxAzimuthAngle).toBeGreaterThan(Math.PI * 0.2);
    expect(MAP_ORBIT_CONTROLS.enablePan).toBe(false);
  });
});
