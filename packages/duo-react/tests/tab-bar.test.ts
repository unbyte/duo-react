import { DuoStore, getBarsLayout } from '@private/core'
import { barProfile } from '@private/profiles'
import { expect, expectTypeOf, test } from 'vitest'
import { TabLayout } from '../src/components/tab-bar/layout'
import type { DuoTabBarItem } from '../src/components/tab-bar/types'

test('resting tabs retain the measured dimensions for two through five destinations', () => {
  for (const [index, count] of [2, 3, 4, 5].entries()) {
    expect(new TabLayout(false, count).rest).toMatchObject({
      length: [188, 274, 400, 400][index],
      cross: 62,
    })
    expect(new TabLayout(true, count).rest).toMatchObject({
      length: [112, 162, 212, 262][index],
      cross: 48,
      pitch: 50,
      first: 31,
    })
  }
})

test('vertical expansion retains the resting axis and fits its reserved clearance', () => {
  for (const count of [2, 3, 4, 5]) {
    const layout = new TabLayout(true, count)
    for (const reveal of [0, 0.5, 1]) {
      const geometry = layout.geometry(reveal, 1, 30)
      const style = layout.size(geometry)
      expect(Number(style.left) + geometry.cross / 2).toBe(24)
      expect(style.bottom).toBe(0)
      // Include the maximum 12px resisted pointer travel.
      const protrusion = Math.max(0, geometry.lensLength / 2 - geometry.first + 12)
      expect(geometry.length - layout.rest.length + protrusion).toBeLessThan(
        barProfile.tabExpansion + barProfile.sectionGap,
      )
    }
  }
})

test('an upward drag keeps its destination when the vertical bar expands before release', () => {
  const layout = new TabLayout(true, 3)
  for (const scale of [0.5, 1, 2]) {
    const start = { top: 100, height: layout.rest.length * scale } as DOMRect
    let value = layout.rest.first + layout.rest.pitch
    value += layout.movement(start, 0, -32 * scale, layout.rest)
    expect(Math.round((value - layout.rest.first) / layout.rest.pitch)).toBe(0)

    for (const reveal of [0.25, 0.5, 1]) {
      const geometry = layout.geometry(reveal, 1, 0)
      const bounds = {
        top: start.top - (geometry.length - layout.rest.length) * scale,
        height: geometry.length * scale,
      } as DOMRect
      value += layout.movement(bounds, 0, 0, geometry)
      expect(Math.round((value - layout.rest.first) / layout.rest.pitch)).toBe(0)
    }
  }
})

test('drag travel follows the current tab spacing at each expansion and zoom', () => {
  for (const vertical of [false, true]) {
    const layout = new TabLayout(vertical, 3)
    for (const reveal of [0, 0.5, 1]) {
      const geometry = layout.geometry(reveal, 1, 0)
      for (const scale of [0.5, 1, 2]) {
        const bounds = {
          width: (vertical ? geometry.cross : geometry.length) * scale,
          height: (vertical ? geometry.length : geometry.cross) * scale,
        } as DOMRect
        for (const direction of [-1, 1]) {
          const travel = direction * geometry.pitch * scale
          expect(
            layout.movement(bounds, vertical ? 0 : travel, vertical ? travel : 0, geometry),
          ).toBeCloseTo(direction * layout.rest.pitch)
        }
        expect(layout.movement(bounds, vertical ? 10 : 0, vertical ? 0 : 10, geometry)).toBe(0)
      }
    }
  }
})

test('toolbar and status reservations clear the expanded vertical tab silhouette', () => {
  const store = new DuoStore()
  for (const screen of Object.values(store.getSnapshot().screens)) {
    for (const count of [0, 1, 3]) {
      const result = getBarsLayout(screen, {
        toolbars: Array.from({ length: count }, (_, index) => ({
          id: String(index),
          placement: 'top-trailing',
        })),
        tabbar: {},
      })
      if (result.tabbar!.axis !== 'vertical') continue
      const top = result.tabbar!.rect.y - barProfile.tabExpansion
      for (const toolbar of result.toolbars) {
        expect(top - toolbar.rect.y - toolbar.rect.height).toBeGreaterThanOrEqual(16 - 0.00001)
      }
      for (const region of screen.reservedRegions) {
        const tab = result.tabbar!.rect
        if (region.x < tab.x + tab.width && region.x + region.width > tab.x)
          expect(top >= region.y + region.height || tab.y + tab.height <= region.y).toBe(true)
      }
    }
  }
})

test('tab items require an icon and accept optional selected artwork and color', () => {
  type Base = { id: string; label: string }
  expectTypeOf<Base & { icon: string }>().toExtend<DuoTabBarItem>()
  expectTypeOf<Base & { icon: string; selectedColor: string }>().toExtend<DuoTabBarItem>()
  expectTypeOf<Base & { icon: string; selectedIcon: string }>().toExtend<DuoTabBarItem>()
  expectTypeOf<
    Base & { icon: string; selectedIcon: string; selectedColor: string }
  >().toExtend<DuoTabBarItem>()
  expectTypeOf<
    Base & { icon: string; selectedIcon: undefined; selectedColor: undefined }
  >().toExtend<DuoTabBarItem>()
  expectTypeOf<Base>().not.toExtend<DuoTabBarItem>()
  expectTypeOf<Base & { selectedIcon: string }>().not.toExtend<DuoTabBarItem>()
  expectTypeOf<Base & { icon: string; selectedColor: number }>().not.toExtend<DuoTabBarItem>()
})
