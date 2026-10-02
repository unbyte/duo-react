import { expect, test } from "vite-plus/test";
import { getDuoGeometry, resolveZoom, safeAreaStyle } from "../src/geometry";

test("split windows preserve a common pixel density and local reserved-region coordinates", () => {
  const options = { display: "inner", orientation: "landscape-left", cameraActive: true } as const;
  const left = getDuoGeometry({ ...options, placement: "left" });
  const right = getDuoGeometry({ ...options, placement: "right" });
  expect(left.window).toEqual({ x: 0, y: 0, width: 469, height: 669 });
  expect(right.window).toEqual({ x: 482, y: 0, width: 469, height: 669 });
  expect(left.reservedRegions).toEqual([]);
  expect(left.cornerRadii).toEqual([55, 55, 55, 55]);
  expect(left.windowCornerRadii).toEqual([55, 32, 32, 55]);
  expect(right.windowCornerRadii).toEqual([32, 55, 55, 32]);
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
  expect(outer.windowCornerRadii).toEqual(outer.cornerRadii);
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

test("outer corners rotate with the hinge edge and camera", () => {
  const portrait = getDuoGeometry({ display: "outer", orientation: "portrait" });
  const clockwise = getDuoGeometry({ display: "outer", orientation: "landscape-left" });
  const counterclockwise = getDuoGeometry({ display: "outer", orientation: "landscape-right" });
  expect(portrait.cornerRadii).toEqual([8, 59, 59, 8]);
  expect(clockwise.cornerRadii).toEqual([8, 8, 59, 59]);
  expect(counterclockwise.cornerRadii).toEqual([59, 59, 8, 8]);
  for (const screen of [portrait, clockwise, counterclockwise]) {
    expect(screen.windowCornerRadii).toEqual(screen.cornerRadii);
    const camera = screen.reservedRegions.find((region) => region.width === region.height)!;
    const right = camera.x > screen.size.width / 2;
    const bottom = camera.y > screen.size.height / 2;
    const cameraCorner = bottom ? (right ? 2 : 3) : right ? 1 : 0;
    expect(screen.cornerRadii[cameraCorner]).toBe(59);
  }
});
