import { expect, test } from "vite-plus/test";
import { getDuoGeometry, resolveZoom, safeAreaStyle } from "../src/geometry";

test("split windows preserve a common pixel density and local reserved-region coordinates", () => {
  const options = { display: "inner", orientation: "landscape-left", cameraActive: true } as const;
  const left = getDuoGeometry({ ...options, placement: "left" });
  const right = getDuoGeometry({ ...options, placement: "right" });
  expect(left.window).toEqual({ x: 0, y: 0, width: 469, height: 669 });
  expect(right.window).toEqual({ x: 482, y: 0, width: 469, height: 669 });
  expect(left.reservedRegions).toEqual([]);
  expect(right.reservedRegions[0]).toEqual({
    type: "occlusion",
    x: 195.33,
    y: 21,
    width: 58,
    height: 37,
  });
  expect(safeAreaStyle(right.safeArea)).toEqual({
    "--duo-safe-area-inset-top": "0px",
    "--duo-safe-area-inset-right": "84px",
    "--duo-safe-area-inset-bottom": "34px",
    "--duo-safe-area-inset-left": "0px",
  });
});

test("portrait profiles and the outer display retain their reported asymmetry", () => {
  const inner = getDuoGeometry({ display: "inner", orientation: "portrait" });
  const outer = getDuoGeometry({ display: "outer", orientation: "portrait" });
  expect(inner.window).toMatchObject({ width: 669, height: 951 });
  expect(inner.safeArea.top).toBe(82);
  expect(outer.window).toMatchObject({ width: 466, height: 678 });
  expect(outer.cornerRadii).toEqual([8, 59, 59, 8]);
  expect(() =>
    getDuoGeometry({ display: "inner", orientation: "portrait", placement: "left" }),
  ).toThrow("No measured Duo profile");
});

test("fit responds to container bounds while numeric zoom preserves app scale", () => {
  const device = { width: 951, height: 669 };
  expect(resolveZoom("fit", { width: 499.5, height: 1000 }, device, 12)).toBe(0.5);
  expect(resolveZoom(2, { width: 100, height: 100 }, device)).toBe(2);
  expect(resolveZoom("fit", { width: 20, height: 20 }, device)).toBe(0);
  expect(resolveZoom(1, { width: 0, height: 200 }, device)).toBe(0);
  for (const zoom of [0, -1, Infinity, NaN])
    expect(() => resolveZoom(zoom, device, device)).toThrow(RangeError);
});
