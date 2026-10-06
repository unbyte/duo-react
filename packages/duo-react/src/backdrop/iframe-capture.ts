import type { SnapdomPlugin } from "@zumer/snapdom"

export const iframeCapture: SnapdomPlugin = {
  name: "duo-iframe-capture",
  pure: true,
  async resolveNode(node, context) {
    // Nested iframe elements belong to another realm, so instanceof is unsuitable.
    if (node.tagName !== "IFRAME") return
    const frame = node as HTMLIFrameElement
    const document = frame.contentDocument
    const view = document?.defaultView
    if (!document || !view) return

    const width = view.innerWidth
    const height = view.innerHeight
    const replacement = frame.ownerDocument.createElement("div")
    replacement.style.overflow = "hidden"
    if (!width || !height) return replacement

    // Capture the document directly: the built-in iframe path resizes its live root.
    const { snapdom } = await import("@zumer/snapdom")
    const image = await snapdom.toPng(document.documentElement, {
      scale: 1,
      dpr: 1,
      clip: { x: view.scrollX, y: view.scrollY, width, height },
      exclude: [...context.exclude],
      excludeMode: context.excludeMode,
      fast: context.fast,
      invalidate: context.invalidate,
      plugins: [iframeCapture],
    })
    image.style.display = "block"
    image.style.width = `${width}px`
    image.style.height = `${height}px`
    replacement.appendChild(image)
    return replacement
  },
}
