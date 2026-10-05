import { expect, test } from "vite-plus/test"
import { horizontalGeometry } from "../src/components/tab-bar/horizontal"
import { verticalGeometry, verticalVariant } from "../src/components/tab-bar/vertical"
import { getBarsLayout } from "../src/core/layout/bars"
import { barProfile } from "../src/core/profiles/bars"
import { createDuoStore } from "../src/core/store"

test("resting tabs retain the measured dimensions for two through five destinations", () => {
  for (const [index, count] of [2, 3, 4, 5].entries()) {
    expect(horizontalGeometry(count)).toMatchObject({
      length: [188, 274, 400, 400][index],
      cross: 62,
    })
    expect(verticalGeometry(count)).toMatchObject({
      length: [112, 162, 212, 262][index],
      cross: 48,
      pitch: 50,
      first: 31,
    })
  }
})

test("vertical expansion retains the resting axis and fits its reserved clearance", () => {
  for (const count of [2, 3, 4, 5]) {
    const variant = verticalVariant(count)
    for (const reveal of [0, 0.5, 1]) {
      const geometry = variant.geometry(reveal, 1, 30)
      const style = variant.size(geometry)
      expect(Number(style.left) + geometry.cross / 2).toBe(24)
      expect(style.bottom).toBe(0)
      // Include the prototype's maximum 12px resisted pointer travel.
      const protrusion = Math.max(0, geometry.lensLength / 2 - geometry.first + 12)
      expect(geometry.length - variant.rest.length + protrusion).toBeLessThan(
        barProfile.tabExpansion + barProfile.sectionGap,
      )
    }
  }
})

test("toolbar and status reservations clear the expanded vertical tab silhouette", () => {
  const store = createDuoStore()
  for (const screen of Object.values(store.getSnapshot().screens)) {
    for (const count of [0, 1, 3]) {
      const result = getBarsLayout(screen, {
        toolbars: Array.from({ length: count }, (_, index) => ({
          id: String(index),
          placement: "top-trailing",
        })),
        tabbar: {},
      })
      if (result.tabbar!.axis !== "vertical") continue
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
