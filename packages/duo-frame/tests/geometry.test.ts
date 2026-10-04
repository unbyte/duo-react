import { expect, test } from "vite-plus/test"
import { rotatedSize } from "../src/core/rotation"
import { getDuoGeometry } from "../src/core/geometry"
import { resolveZoom } from "../src/core/zoom"
import { safeAreaStyle } from "../src/core/safe-area"

test("split windows preserve a common pixel density and local reserved-region coordinates", () => {
  const options = { display: "inner", orientation: "landscape-left", cameraActive: true } as const
  const left = getDuoGeometry({ ...options, placement: "left" })
  const right = getDuoGeometry({ ...options, placement: "right" })
  expect(left.window).toEqual({ x: 0, y: 0, width: 469, height: 669 })
  expect(right.window).toEqual({ x: 482, y: 0, width: 469, height: 669 })
  expect(left.reservedRegions).toEqual([])
  expect(left.cornerRadii).toEqual([55, 55, 55, 55])
  expect(left.windowCornerRadii).toEqual([55, 32, 32, 55])
  expect(right.windowCornerRadii).toEqual([32, 55, 55, 32])
  expect(right.reservedRegions[0]).toEqual({
    type: "occlusion",
    x: 195.33,
    y: 21,
    width: 58,
    height: 37,
  })
  expect(safeAreaStyle(right.safeArea)).toEqual({
    "--duo-safe-area-inset-top": "0px",
    "--duo-safe-area-inset-right": "84px",
    "--duo-safe-area-inset-bottom": "34px",
    "--duo-safe-area-inset-left": "0px",
  })
})

test("portrait profiles and the outer display retain their reported asymmetry", () => {
  const inner = getDuoGeometry({ display: "inner", orientation: "portrait" })
  const outer = getDuoGeometry({ display: "outer", orientation: "portrait" })
  expect(inner.window).toMatchObject({ width: 669, height: 951 })
  expect(inner.safeArea.top).toBe(82)
  expect(outer.window).toMatchObject({ width: 466, height: 678 })
  expect(outer.cornerRadii).toEqual([8, 59, 59, 8])
  expect(outer.windowCornerRadii).toEqual(outer.cornerRadii)
  expect(() =>
    getDuoGeometry({ display: "inner", orientation: "portrait", placement: "left" }),
  ).toThrow("No measured Duo profile")
})

test("the inner fold follows the display axis and stays inactive in fully open layouts", () => {
  for (const orientation of [
    "portrait",
    "portrait-upside-down",
    "landscape-left",
    "landscape-right",
  ] as const) {
    const portrait = orientation.startsWith("portrait")
    for (const cameraActive of [false, true]) {
      const full = getDuoGeometry({ display: "inner", orientation, cameraActive })
      const fold = full.foldingRegion!
      expect(fold.active).toBe(false)
      expect(fold.frame).toEqual(
        portrait
          ? { x: 0, y: 455.5, width: 669, height: 40 }
          : { x: 455.5, y: 0, width: 40, height: 669 },
      )
      expect(fold.frame.x + fold.frame.width / 2).toBe(full.size.width / 2)
      expect(fold.frame.y + fold.frame.height / 2).toBe(full.size.height / 2)
      expect(fold.frame.width - fold.margins.left - fold.margins.right).toBe(portrait ? 669 : 0)
      expect(fold.frame.height - fold.margins.top - fold.margins.bottom).toBe(portrait ? 0 : 669)
      expect(full.reservedRegions.some((region) => region.type === "division")).toBe(false)
      expect(Object.isFrozen(fold.frame)).toBe(true)
      expect(Object.isFrozen(fold.margins)).toBe(true)
      if (!portrait) {
        const left = getDuoGeometry({
          display: "inner",
          orientation,
          cameraActive,
          placement: "left",
        })
        const right = getDuoGeometry({
          display: "inner",
          orientation,
          cameraActive,
          placement: "right",
        })
        expect(left.foldingRegion).toEqual(fold)
        expect(right.foldingRegion).toEqual(fold)
        expect(right.window.x - (left.window.x + left.window.width)).toBe(13)
      }
    }
  }
  expect(
    getDuoGeometry({ display: "outer", orientation: "portrait" }).foldingRegion,
  ).toBeUndefined()
})

test("fit responds to container bounds while numeric zoom preserves app scale", () => {
  const device = { width: 951, height: 669 }
  expect(resolveZoom("fit", { width: 499.5, height: 1000 }, device, 12)).toBe(0.5)
  expect(resolveZoom(2, { width: 100, height: 100 }, device)).toBe(2)
  expect(resolveZoom("fit", { width: 20, height: 20 }, device)).toBe(0)
  expect(resolveZoom(1, { width: 0, height: 200 }, device)).toBe(0)
  for (const zoom of [0, -1, Infinity, NaN])
    expect(() => resolveZoom(zoom, device, device)).toThrow(RangeError)
})

test("partial folding clips the active division to each window without changing measured layout", () => {
  for (const orientation of [
    "portrait",
    "portrait-upside-down",
    "landscape-left",
    "landscape-right",
  ] as const) {
    const portrait = orientation.startsWith("portrait")
    for (const cameraActive of [false, true]) {
      for (const placement of ["full", "left", "right"] as const) {
        if (portrait && placement !== "full") continue
        const options = { display: "inner", orientation, cameraActive, placement } as const
        const open = getDuoGeometry(options)
        const partial = getDuoGeometry({ ...options, posture: "partially-open" })
        const division = partial.reservedRegions.find((region) => region.type === "division")!
        expect(division).toEqual({
          type: "division",
          ...(portrait
            ? { x: 0, y: 455.5, width: 669, height: 40 }
            : {
                x: placement === "right" ? 0 : 455.5,
                y: 0,
                width: placement === "full" ? 40 : 13.5,
                height: 669,
              }),
        })
        expect(partial.foldingRegion).toEqual({ ...open.foldingRegion, active: true })
        expect(partial.reservedRegions).toEqual([...open.reservedRegions, division])
        expect(Object.isFrozen(division)).toBe(true)
        expect(Object.isFrozen(partial.reservedRegions)).toBe(true)
        expect({
          ...partial,
          foldingRegion: open.foldingRegion,
          reservedRegions: open.reservedRegions,
        }).toEqual(open)
      }
    }
  }
  const outer = { display: "outer", orientation: "portrait" } as const
  expect(getDuoGeometry({ ...outer, posture: "partially-open" })).toEqual(getDuoGeometry(outer))
})

test("outer corners rotate with the hinge edge and camera", () => {
  const portrait = getDuoGeometry({ display: "outer", orientation: "portrait" })
  const clockwise = getDuoGeometry({ display: "outer", orientation: "landscape-left" })
  const counterclockwise = getDuoGeometry({ display: "outer", orientation: "landscape-right" })
  expect(portrait.cornerRadii).toEqual([8, 59, 59, 8])
  expect(clockwise.cornerRadii).toEqual([8, 8, 59, 59])
  expect(counterclockwise.cornerRadii).toEqual([59, 59, 8, 8])
  for (const screen of [portrait, clockwise, counterclockwise]) {
    expect(screen.windowCornerRadii).toEqual(screen.cornerRadii)
    const camera = screen.reservedRegions.find((region) => region.width === region.height)!
    const right = camera.x > screen.size.width / 2
    const bottom = camera.y > screen.size.height / 2
    const cameraCorner = bottom ? (right ? 2 : 3) : right ? 1 : 0
    expect(screen.cornerRadii[cameraCorner]).toBe(59)
  }
})

test("upside-down inner profiles preserve measured camera and safe-area coordinates", () => {
  const options = { display: "inner", orientation: "portrait-upside-down" } as const
  const screen = getDuoGeometry(options)
  expect(screen.size).toEqual({ width: 669, height: 951 })
  expect(screen.safeArea).toEqual({ top: 82, right: 0, bottom: 34, left: 0 })
  expect(getDuoGeometry({ ...options, cameraActive: true }).reservedRegions).toEqual([
    { type: "occlusion", x: 611, y: 677.33, width: 37, height: 58 },
    { type: "occlusion", x: 535, y: 0, width: 134, height: 82 },
  ])
  expect(() => getDuoGeometry({ ...options, display: "outer" })).toThrow("No measured Duo profile")
})

test("rotated fit includes intermediate diagonal bounds and both portrait directions", () => {
  const size = { width: 700, height: 500 }
  for (const angle of [90, -90, 450]) {
    expect(rotatedSize(size, angle).width).toBeCloseTo(500)
    expect(rotatedSize(size, angle).height).toBeCloseTo(700)
  }
  const diagonal = rotatedSize(size, 45)
  expect(diagonal.width).toBeCloseTo(1200 / Math.sqrt(2))
  expect(diagonal.height).toBeCloseTo(diagonal.width)
  expect(
    resolveZoom("fit", { width: 648, height: 648 }, diagonal, 24) * diagonal.width,
  ).toBeCloseTo(600)
})
