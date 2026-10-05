import type { DuoScreenInfo } from "../core/types"
import { createIframeCapture } from "./iframe-capture"
import { createCaptureScheduler } from "./scheduler"
import { prepareBackdrop, type BackdropRequest, type BackdropStore } from "./store"
import { paddedRegion } from "./regions"

const excluded = ".duo-accessory-window, .duo-status-material, .duo-system"

export function observeBackdrop(
  source: HTMLElement,
  getScreen: () => DuoScreenInfo,
  store: BackdropStore,
) {
  const scheduler = createCaptureScheduler(async () => {
    const screen = getScreen()
    if (document.hidden || !screen.visible) return store.getSnapshot()
    const requests = new Map<symbol, BackdropRequest>()
    for (const [key, request] of store.getRequests()) {
      const area = paddedRegion(request.area, request.blur * 3, screen.size)
      if (area) requests.set(key, { ...request, area })
    }
    if (!requests.size) {
      const previous = store.getSnapshot()
      return previous.regions.size ? { ...previous, regions: new Map() } : previous
    }
    const { snapdom } = await import("@zumer/snapdom")
    const canvas = await snapdom.toCanvas(source, {
      scale: 1,
      dpr: 1,
      exclude: excluded,
      excludeMode: "remove",
      fast: false,
      invalidate: true,
      plugins: [createIframeCapture(snapdom)],
    })
    return prepareBackdrop(canvas, requests, store.getSnapshot())
  }, store.publish)
  const unsubscribeRequests = store.subscribeRequests(() => scheduler.invalidate(true))
  function schedule() {
    if (!document.hidden) scheduler.invalidate()
  }
  const observer = new MutationObserver((records) => {
    if (
      records.some((record) => {
        const element =
          record.target instanceof Element ? record.target : record.target.parentElement
        return !element?.closest(excluded)
      })
    )
      schedule()
  })
  observer.observe(source, {
    attributes: true,
    childList: true,
    characterData: true,
    subtree: true,
  })
  // Frame CSS variables can alter the app without mutating its subtree.
  for (let parent = source.parentElement; parent; parent = parent.parentElement)
    observer.observe(parent, { attributes: true })
  const resize = new ResizeObserver(schedule)
  resize.observe(source)
  source.addEventListener("scroll", schedule, true)
  source.addEventListener("input", schedule, true)
  source.addEventListener("load", schedule, true)
  document.addEventListener("visibilitychange", schedule)
  // CSSOM, canvas drawing, and iframe interiors have no parent DOM mutation signal.
  const refresh = setInterval(schedule, 500)
  schedule()
  return {
    invalidate: () => scheduler.invalidate(true),
    dispose() {
      scheduler.stop()
      unsubscribeRequests()
      observer.disconnect()
      resize.disconnect()
      clearInterval(refresh)
      source.removeEventListener("scroll", schedule, true)
      source.removeEventListener("input", schedule, true)
      source.removeEventListener("load", schedule, true)
      document.removeEventListener("visibilitychange", schedule)
    },
  }
}
