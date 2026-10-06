import { expect, test } from 'vitest'
import { getDuoRegions } from '../src/geometry/regions'
import { DuoStore } from '../src/state/store'

function regions(store: DuoStore) {
  const state = store.getSnapshot()
  return getDuoRegions(
    state.screens[state.posture === 'closed' ? 'outer' : 'inner'],
    state.system.cameraActive,
    state.posture,
  )
}

test('regions use source names, omit inactive regions and zero insets, and retain window bounds', () => {
  const store = new DuoStore()
  expect(regions(store).map((r) => r.name)).toEqual([
    'Safe area',
    'Right inset',
    'Bottom inset',
    'occlusion',
  ])
  store.actions.setPosture('partially-open')
  expect(regions(store).find((r) => r.kind === 'division')).toMatchObject({
    name: 'division',
    x: 455.5,
    y: 0,
    width: 40,
    height: 669,
    scope: 'display',
  })
  const status = regions(store).find((r) => r.kind === 'occlusion')
  store.actions.setSystem({ cameraActive: true })
  expect(regions(store).filter((r) => r.kind === 'occlusion')).toHaveLength(2)
  expect(regions(store)).toContainEqual(status)
  store.actions.setPosture('open')
  expect(regions(store).some((r) => r.kind === 'division')).toBe(false)
  store.actions.setSystem({ cameraActive: false })
  expect(regions(store).filter((r) => r.kind === 'occlusion')).toEqual([status])
})

test('split gap is distinct from the division and does not appear for full or outer windows', () => {
  const store = new DuoStore()
  for (const orientation of ['landscape-left', 'landscape-right'] as const) {
    store.actions.setOrientation(orientation)
    for (const placement of ['left', 'right'] as const) {
      store.actions.setInnerPlacement(placement)
      for (const posture of ['open', 'partially-open'] as const) {
        store.actions.setPosture(posture)
        const currentRegions = regions(store)
        expect(currentRegions.find((r) => r.kind === 'gap')).toMatchObject({
          name: 'Split View gap',
          x: 469,
          y: 0,
          width: 13,
          height: 669,
          scope: 'display',
        })
        expect(currentRegions.filter((r) => r.kind === 'division')).toHaveLength(
          posture === 'open' ? 0 : 1,
        )
        expect(currentRegions.find((r) => r.kind === 'safe-area')?.x).toBe(
          placement === 'left' ? 0 : 482,
        )
      }
    }
  }
  store.actions.setPosture('closed')
  expect(regions(store).some((r) => r.kind === 'gap' || r.kind === 'division')).toBe(false)
  store.actions.setInnerPlacement('full')
  store.actions.setPosture('partially-open')
  store.actions.setOrientation('portrait')
  expect(regions(store).find((r) => r.kind === 'division')).toMatchObject({
    x: 0,
    y: 455.5,
    width: 669,
    height: 40,
  })
  expect(regions(store).some((r) => r.kind === 'gap')).toBe(false)
})
