import { describe, expect, it } from "vitest";
import { cities } from "../domain/cities";
import { projectCityToStagePercent, projectCityToTiltedStagePercent, projectLngLatToWorld } from "./projection";

function city(id: string) {
  const found = cities.find((candidate) => candidate.id === id);
  if (!found) {
    throw new Error(`Missing city ${id}`);
  }
  return found;
}

describe("map projection", () => {
  it("projects cities into screen percentages by real relative geography", () => {
    const beijing = projectCityToStagePercent(city("beijing"));
    const hangzhou = projectCityToStagePercent(city("hangzhou"));
    const chengdu = projectCityToStagePercent(city("chengdu"));
    const urumqi = projectCityToStagePercent(city("urumqi"));
    const harbin = projectCityToStagePercent(city("harbin"));
    const sanya = projectCityToStagePercent(city("sanya"));

    expect(urumqi.x).toBeLessThan(chengdu.x);
    expect(chengdu.x).toBeLessThan(hangzhou.x);
    expect(harbin.y).toBeLessThan(beijing.y);
    expect(sanya.y).toBeGreaterThan(hangzhou.y);
  });

  it("projects real coordinates into bounded 3D world coordinates", () => {
    const hangzhou = projectLngLatToWorld(city("hangzhou").lng, city("hangzhou").lat);
    const chengdu = projectLngLatToWorld(city("chengdu").lng, city("chengdu").lat);

    expect(hangzhou.x).toBeGreaterThan(chengdu.x);
    expect(Math.abs(hangzhou.x)).toBeLessThanOrEqual(3.4);
    expect(Math.abs(hangzhou.y)).toBeLessThanOrEqual(2.2);
  });

  it("projects western and southwest cities through the same tilted camera as the 3D map", () => {
    const aspect = 962 / 769;
    const daliFlat = projectCityToStagePercent(city("dali"));
    const lhasaFlat = projectCityToStagePercent(city("lhasa"));
    const daliTilted = projectCityToTiltedStagePercent(city("dali"), aspect);
    const lhasaTilted = projectCityToTiltedStagePercent(city("lhasa"), aspect);
    const chengduTilted = projectCityToTiltedStagePercent(city("chengdu"), aspect);

    expect(daliTilted.y).toBeLessThan(daliFlat.y - 4);
    expect(lhasaTilted.y).toBeLessThan(lhasaFlat.y - 4);
    expect(lhasaTilted.x).toBeLessThan(chengduTilted.x);
    expect(daliTilted.y).toBeGreaterThan(48);
    expect(daliTilted.y).toBeLessThan(64);
    expect(lhasaTilted.y).toBeGreaterThan(48);
    expect(lhasaTilted.y).toBeLessThan(58);
  });
});
