import { describe, expect, it } from "vitest";
import { getBoundaryVisualStyle, getProvinceVisualStyle } from "./mapStyle";

describe("map visual style", () => {
  it("uses a dark cinematic terrain palette instead of one flat map color", () => {
    const provinceNames = [
      "新疆维吾尔自治区",
      "西藏自治区",
      "四川省",
      "浙江省",
      "黑龙江省",
      "海南省",
      "河南省"
    ];
    const styles = provinceNames.map((name, index) => getProvinceVisualStyle(name, index));

    expect(new Set(styles.map((style) => style.color)).size).toBeGreaterThanOrEqual(5);
    expect(styles.every((style) => style.emissive !== style.color)).toBe(true);
    expect(styles.every((style) => style.roughness >= 0.72 && style.roughness <= 0.96)).toBe(true);
    expect(styles.some((style) => style.highlightColor === "#ffd08a")).toBe(true);
    expect(styles.every((style) => style.metalness >= 0.18)).toBe(true);
    expect(styles.every((style) => style.emissiveIntensity >= 0.11)).toBe(true);
  });

  it("defines separate province line and glow colors for cinematic boundaries", () => {
    const style = getBoundaryVisualStyle();

    expect(style.lineColor).not.toBe(style.glowColor);
    expect(style.lineColor).toBe("#ffc46f");
    expect(style.glowColor).toBe("#ff9f35");
    expect(style.lineOpacity).toBeGreaterThan(0.7);
    expect(style.contourOpacity).toBeLessThan(style.lineOpacity);
    expect(style.aquaColor).toBe("#32e6ff");
    expect(style.glowOpacity).toBeLessThan(style.lineOpacity);
    expect(style.aquaOpacity).toBeGreaterThan(style.highlightOpacity);
  });

  it("gives large western provinces separate surface colors so the map does not read as one slab", () => {
    const westernStyles = ["新疆维吾尔自治区", "西藏自治区", "青海省", "甘肃省"].map((name) =>
      getProvinceVisualStyle(name, 0)
    );

    expect(new Set(westernStyles.map((style) => style.color)).size).toBeGreaterThanOrEqual(3);
  });

  it("keeps boundary and highlight layers above the deepest province surface", () => {
    const boundaryStyle = getBoundaryVisualStyle();
    const deepestSurface = Math.max(
      getProvinceVisualStyle("四川省", 99).depth,
      getProvinceVisualStyle("西藏自治区", 99).depth
    );

    expect(boundaryStyle.lineZ).toBeGreaterThan(deepestSurface);
    expect(Math.abs(boundaryStyle.glowZ - boundaryStyle.lineZ)).toBeLessThanOrEqual(0.002);
    expect(Math.abs(boundaryStyle.contourZ - boundaryStyle.lineZ)).toBeLessThanOrEqual(0.003);
    expect(boundaryStyle.highlightOpacity).toBeGreaterThan(0.06);
  });
});
