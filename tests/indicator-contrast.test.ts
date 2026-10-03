import { expect, test } from "vite-plus/test";
import { chooseIndicatorStyle } from "../src/indicator-contrast";

const pixels = (...colors: number[][]) => new Uint8ClampedArray(colors.flat());

test("dark and light backdrops choose opposite solid foregrounds", () => {
  for (const previous of ["light", "dark"] as const) {
    expect(chooseIndicatorStyle(pixels([0, 0, 0, 255]), previous)).toBe("light");
    expect(chooseIndicatorStyle(pixels([255, 255, 255, 255]), previous)).toBe("dark");
    expect(chooseIndicatorStyle(pixels([128, 128, 128, 255]), previous)).toBe("dark");
    expect(chooseIndicatorStyle(pixels([0, 102, 255, 255]), previous)).toBe("light");
  }
});

test("each control averages its own area rather than sharing a combined status color", () => {
  const time = pixels([255, 255, 255, 255], [255, 255, 255, 255]);
  const glyph = pixels([0, 0, 0, 255], [20, 20, 20, 255]);
  expect(chooseIndicatorStyle(time, "dark")).toBe("dark");
  expect(chooseIndicatorStyle(glyph, "dark")).toBe("light");
  expect(chooseIndicatorStyle(pixels([0, 0, 0, 255], [255, 255, 255, 255]), "light")).toBe("dark");
});

test("near-equal contrast has hysteresis, but clear changes switch in both directions", () => {
  const neutral = pixels([117, 117, 117, 255]);
  expect(chooseIndicatorStyle(neutral, "light")).toBe("light");
  expect(chooseIndicatorStyle(neutral, "dark")).toBe("dark");
  expect(chooseIndicatorStyle(pixels([130, 130, 130, 255]), "light")).toBe("dark");
  expect(chooseIndicatorStyle(pixels([100, 100, 100, 255]), "dark")).toBe("light");
});

test("empty or transparent samples preserve the previous choice", () => {
  for (const previous of ["light", "dark"] as const) {
    expect(chooseIndicatorStyle(pixels(), previous)).toBe(previous);
    expect(chooseIndicatorStyle(pixels([255, 255, 255, 0]), previous)).toBe(previous);
  }
  expect(chooseIndicatorStyle(pixels([255, 255, 255, 0], [0, 0, 0, 255]), "dark")).toBe("light");
});
