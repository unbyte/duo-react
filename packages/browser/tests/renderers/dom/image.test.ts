import { expect, test } from 'vitest'
import { samePixels } from '../../../src/renderers/dom/image'

test('pixel comparison notices alpha changes and differences at the end of the region', () => {
  const pixels = new Uint8ClampedArray([0, 1, 2, 255, 3, 4, 5, 255])
  expect(samePixels(pixels, pixels.slice())).toBe(true)
  const changed = pixels.slice()
  changed[7] = 254
  expect(samePixels(pixels, changed)).toBe(false)
  expect(samePixels(pixels, pixels.slice(0, 4))).toBe(false)
})
