import { expect, test } from 'vitest'
import { getDuoGeometry } from '../src/geometry/screen'
import { getAccessoryLayout } from '../src/layout/accessories'
import { getSystemLayout } from '../src/layout/system'
import { DuoStore } from '../src/state/store'

test('full-window bars use measured glass-edge offsets without changing content safe areas', () => {
  const store = new DuoStore({ orientation: 'portrait' })
  const outer = store.getSnapshot().screens.outer
  expect(getAccessoryLayout(outer)).toMatchObject({ left: 394, right: 24, top: 170, bottom: 24 })
  expect(outer.safeArea).toEqual({ top: 0, right: 84, bottom: 34, left: 0 })

  const portrait = store.getSnapshot().screens.inner
  const horizontal = getAccessoryLayout(portrait)
  expect(horizontal.top).toBe(24)
  expect(portrait.window.width - horizontal.right - horizontal.toolbarEndInset).toBe(535)
  expect(portrait.window.height - horizontal.bottom).toBe(930)
  expect(portrait.safeArea).toEqual({ top: 82, right: 0, bottom: 34, left: 0 })

  store.actions.setOrientation('landscape-right')
  const landscape = store.getSnapshot().screens.inner
  expect(getAccessoryLayout(landscape)).toMatchObject({
    left: 879,
    right: 24,
    top: 120,
    bottom: 24,
  })
  expect(landscape.safeArea).toEqual({ top: 0, right: 84, bottom: 34, left: 0 })
})

test('bar rails follow app placement and measured hardware edges', () => {
  const store = new DuoStore()
  expect(getAccessoryLayout(store.getSnapshot().screens.inner).side).toBe('right')
  store.actions.setInnerPlacement('left')
  const left = getAccessoryLayout(store.getSnapshot().screens.inner)
  expect(left).toMatchObject({ side: 'left', left: 24, top: 24, bottom: 34 })
  store.actions.setInnerPlacement('right')
  const right = getAccessoryLayout(store.getSnapshot().screens.inner)
  expect(right).toMatchObject({ side: 'right', right: 24, bottom: 34 })
  expect(right.top).toBe(120)
  for (const layout of [left, right]) {
    expect(469 - layout.left - layout.right).toBe(48)
  }
  store.actions.setInnerPlacement('full')
  for (const orientation of ['portrait', 'portrait-upside-down'] as const) {
    store.actions.setOrientation(orientation)
    expect(getAccessoryLayout(store.getSnapshot().screens.inner)).toEqual({
      side: 'horizontal',
      left: 20,
      right: 20,
      top: 24,
      bottom: 21,
      toolbarEndInset: 114,
    })
  }
  store.actions.setOrientation('landscape-right')
  expect(getAccessoryLayout(store.getSnapshot().screens.outer).side).toBe('left')
})

test('outer bars leave room for status and the camera at either end', () => {
  for (const orientation of ['portrait', 'landscape-left', 'landscape-right'] as const) {
    const screen = { ...getDuoGeometry({ display: 'outer', orientation }), visible: true }
    const rail = getAccessoryLayout(screen)
    for (const region of screen.reservedRegions) {
      expect(
        rail.top >= region.y + region.height || screen.window.height - rail.bottom <= region.y,
      ).toBe(true)
    }
    expect(rail.top + rail.bottom).toBeLessThan(screen.window.height)
  }
})

test('inner landscape bars and status share the reference axis without doubling status clearance', () => {
  for (const orientation of ['landscape-left', 'landscape-right'] as const) {
    for (const placement of ['full', 'left', 'right'] as const) {
      const screen = {
        ...getDuoGeometry({ display: 'inner', orientation, placement }),
        visible: true,
      }
      const bars = getAccessoryLayout(screen)
      const { status } = getSystemLayout(screen)
      expect(status.y).toBe(30)
      expect(screen.size.width - status.x - status.width / 2).toBe(48)
      if (placement === 'left') {
        expect(bars.top).toBe(24)
        expect(bars.left + 24).toBe(48)
      } else {
        expect(bars.top).toBe(120)
        expect(screen.window.x + bars.left + 24).toBe(status.x + status.width / 2)
        expect(bars.top - status.y - status.height).toBeGreaterThanOrEqual(16)
      }
    }
  }
})
