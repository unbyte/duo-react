import type { DuoScreenInfo } from "../core/types"
import { createIframeCapture } from "./iframe-capture"
import { createCaptureScheduler } from "./scheduler"
import { prepareBackdrop, type BackdropStore } from "./store"

const excluded = ".duo-accessory-window, .duo-status-material, .duo-system"

export function observeBackdrop(
  source: HTMLElement,
  getScreen: () => DuoScreenInfo,
  store: BackdropStore,
) {
  const scheduler = createCaptureScheduler(async () => {
    const screen = getScreen()
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
    return prepareBackdrop(canvas, screen, store.getSnapshot())
  }, store.publish)
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
