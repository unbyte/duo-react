import { expect, test } from 'vitest'
import { paddedRegion } from '../../../src/renderers/backdrop/geometry'

test('blur padding rounds outward and clips to the display', () => {
  const size = { width: 669, height: 951 }
  const tab = paddedRegion({ x: 592.5, y: 700, width: 48, height: 162 }, 18, size)!
  const status = paddedRegion({ x: 590, y: 30, width: 50, height: 70 }, 36, size)!
  expect(tab).toEqual({ x: 574, y: 682, width: 85, height: 198 })
  expect(status).toEqual({ x: 554, y: 0, width: 115, height: 136 })
  expect(paddedRegion({ x: 800, y: 0, width: 10, height: 10 }, 0, size)).toBeUndefined()
})
