import { expect, test } from "vite-plus/test"
import { normalizeRotation } from "../src/geometry/orientation"
import { rotationStart } from "../src/preview/rotation"

test("normalization handles negative angles and whole turns without negative zero", () => {
  expect(normalizeRotation(-90)).toBe(270)
  expect(normalizeRotation(810)).toBe(90)
  expect(normalizeRotation(-720)).toBe(0)
})

test("animation crosses zero with a quarter-turn in the requested direction", () => {
  expect(rotationStart(270, 270, 0)).toBe(-90)
  expect(rotationStart(0, 0, 270)).toBe(360)
})

test("interrupted turns preserve unfinished travel and can reverse", () => {
  // Continue right even though 270 would be nearer counterclockwise from 40.
  expect(rotationStart(40, 180, 270)).toBe(40)
  expect(rotationStart(300, 270, 0)).toBe(-60)
  // Undo a right turn before it completes, then cross zero to the left.
  expect(rotationStart(40, 90, 0)).toBe(40)
  expect(rotationStart(20, 0, 270)).toBe(380)
})

test("continuous retargeting keeps animation values bounded in either direction", () => {
  for (const direction of [-90, 90]) {
    let current = 0
    let previousTarget = 0
    for (let i = 0; i < 1000; i++) {
      const target = normalizeRotation(previousTarget + direction)
      const from = rotationStart(current, previousTarget, target)
      expect(normalizeRotation(from)).toBeCloseTo(normalizeRotation(current))
      expect(Math.abs(target - from)).toBeLessThan(360)
      expect(Math.sign(target - from)).toBe(Math.sign(direction))
      current = from + (target - from) * 0.1
      expect(current).toBeGreaterThan(-360)
      expect(current).toBeLessThan(720)
      previousTarget = target
    }
  }
})
