import type { BackdropStore } from './backdrop/store'

interface MovableElement extends Element {
  moveBefore(node: Node, child: Node | null): void
}

// Keep the experimental API local until it is part of lib.dom.d.ts.
interface DrawableCanvas extends HTMLCanvasElement {
  moveBefore(node: Node, child: Node | null): void
  content: string
  requestPaint(): void
  updateElementGeometry(element: Element, options?: object): void
}
interface DrawableContext extends CanvasRenderingContext2D {
  drawElementImage(element: Element, x: number, y: number, width: number, height: number): void
}

/** Require the current proposal, including native hit testing, not just a draw method. */
export function supportsHtmlInCanvas() {
  if (typeof HTMLCanvasElement === 'undefined' || typeof CanvasRenderingContext2D === 'undefined')
    return false
  const canvas = HTMLCanvasElement.prototype as Partial<DrawableCanvas>
  return (
    typeof (Element.prototype as Partial<MovableElement>).moveBefore === 'function' &&
    'content' in canvas &&
    'onpaint' in canvas &&
    typeof canvas.requestPaint === 'function' &&
    typeof canvas.updateElementGeometry === 'function' &&
    typeof (CanvasRenderingContext2D.prototype as Partial<DrawableContext>).drawElementImage ===
      'function'
  )
}

/** Renders the display interior; the physical bezel and buttons remain ordinary DOM. */
export class HtmlInCanvasRenderer {
  private readonly canvas: DrawableCanvas
  private readonly context: DrawableContext
  private readonly sample: HTMLCanvasElement
  private readonly sampleContext: CanvasRenderingContext2D
  private readonly positions: { node: HTMLElement; marker: Comment }[] = []
  private readonly attributes: (string | null)[]
  private readonly resize: ResizeObserver
  private timer?: ReturnType<typeof setTimeout>
  private disposed = false
  private width = 0
  private height = 0

  constructor(
    private readonly source: HTMLElement,
    private readonly chrome: HTMLElement,
    private readonly system: HTMLElement,
    private readonly backdrop: BackdropStore,
    private readonly onError: () => void,
  ) {
    const document = source.ownerDocument
    this.canvas = document.createElement('canvas') as DrawableCanvas
    this.canvas.className = 'duo-react-display-canvas'
    this.canvas.content = 'drawable'
    const context = this.canvas.getContext('2d') as DrawableContext | null
    this.sample = document.createElement('canvas')
    const sampleContext = this.sample.getContext('2d', { willReadFrequently: true })
    if (!context || !sampleContext) throw new Error('Canvas 2D is unavailable')
    this.context = context
    this.sampleContext = sampleContext
    this.attributes = [source, chrome, system].map((node) => node.getAttribute('drawable'))
    this.resize = new ResizeObserver(() => this.requestPaint())
    try {
      source.before(this.canvas)
      for (const node of [source, system]) {
        const marker = document.createComment('duo-react-renderer')
        node.before(marker)
        this.positions.push({ node, marker })
        // State-preserving moves retain iframe documents, focus, and running animations.
        this.canvas.moveBefore(node, null)
      }
      for (const node of [source, chrome, system]) node.setAttribute('drawable', '')
      this.canvas.addEventListener('paint', this.paint)
      this.canvas.addEventListener('contextlost', this.fail)
      this.resize.observe(this.canvas, { box: 'device-pixel-content-box' })
      backdrop.connectCanvas(this.sample)
      this.requestPaint()
      this.watchPaint()
    } catch (error) {
      this.dispose()
      throw error
    }
  }

  private requestPaint() {
    if (!this.disposed) this.canvas.requestPaint()
  }

  private watchPaint() {
    this.timer = setTimeout(() => {
      if (this.disposed) return
      // A hidden frame need not receive paint events until it becomes visible.
      if (
        this.canvas.ownerDocument.hidden ||
        !this.canvas.getBoundingClientRect().width ||
        getComputedStyle(this.canvas).visibility === 'hidden'
      )
        this.watchPaint()
      else this.fail()
    }, 1500)
  }

  private fail = () => {
    if (this.disposed) return
    this.dispose()
    this.onError()
  }

  private paint = (event: Event) => {
    if (this.disposed) return
    try {
      const width = this.canvas.clientWidth
      const height = this.canvas.clientHeight
      if (
        !width ||
        !height ||
        !this.canvas.getBoundingClientRect().width ||
        getComputedStyle(this.canvas).visibility === 'hidden'
      )
        return
      const ratio = this.canvas.ownerDocument.defaultView?.devicePixelRatio || 1
      const pixelWidth = Math.ceil(width * ratio)
      const pixelHeight = Math.ceil(height * ratio)
      const resized = this.width !== width || this.height !== height
      if (this.canvas.width !== pixelWidth || this.canvas.height !== pixelHeight) {
        this.canvas.width = pixelWidth
        this.canvas.height = pixelHeight
      }
      this.width = width
      this.height = height
      const { context } = this
      context.clearRect(0, 0, pixelWidth, pixelHeight)
      context.drawElementImage(this.source, 0, 0, pixelWidth, pixelHeight)
      const changed = (event as Event & { changedElements?: readonly Element[] }).changedElements
      if (resized || !changed || changed.includes(this.source)) {
        this.sample.width = width
        this.sample.height = height
        // Copy before drawing chrome so glass never samples itself. BackdropStore
        // continues to use logical display pixels, independent of zoom and DPR.
        this.sampleContext.drawImage(this.canvas, 0, 0, width, height)
        this.backdrop.canvasPainted()
      }
      this.paintCanvasLayers(ratio)
      context.drawElementImage(this.chrome, 0, 0, pixelWidth, pixelHeight)
      context.drawElementImage(this.system, 0, 0, pixelWidth, pixelHeight)
      clearTimeout(this.timer)
    } catch {
      this.fail()
    }
  }

  private paintCanvasLayers(ratio: number) {
    // Library-owned canvas surfaces are drawable boundaries: the HTML snapshot
    // omits them, and we composite their actual bitmaps exactly once. This also
    // avoids Chromium dropping composited canvas content from DOM snapshots.
    for (const selector of ['canvas.duo-react-status-material', 'canvas.duo-react-tab-bar-glass']) {
      for (const canvas of this.chrome.querySelectorAll<HTMLCanvasElement>(selector)) {
        const style = getComputedStyle(canvas)
        if (
          style.visibility !== 'visible' ||
          style.display === 'none' ||
          !canvas.width ||
          !canvas.height
        )
          continue
        const origin = this.origin(canvas)
        const width = Number.parseFloat(style.width)
        const height = Number.parseFloat(style.height)
        if (!(width > 0 && height > 0)) continue
        const { context } = this
        context.save()
        context.scale(ratio, ratio)
        const clip = canvas.closest<HTMLElement>('.duo-react-accessory-window')
        if (clip) {
          const position = this.origin(clip)
          context.beginPath()
          context.roundRect(
            position.x,
            position.y,
            clip.offsetWidth,
            clip.offsetHeight,
            this.radii(getComputedStyle(clip)),
          )
          context.clip()
        }
        context.beginPath()
        context.roundRect(origin.x, origin.y, width, height, this.radii(style))
        context.clip()
        context.drawImage(canvas, origin.x, origin.y, width, height)
        context.restore()
      }
    }
  }

  private radii(style: CSSStyleDeclaration) {
    return [
      style.borderTopLeftRadius,
      style.borderTopRightRadius,
      style.borderBottomRightRadius,
      style.borderBottomLeftRadius,
    ].map((value) => Number.parseFloat(value) || 0)
  }

  private origin(element: HTMLElement) {
    let x = 0
    let y = 0
    for (
      let node: HTMLElement | null = element;
      node && node !== this.source;
      node = node.offsetParent as HTMLElement | null
    ) {
      x += node.offsetLeft
      y += node.offsetTop
    }
    return { x, y }
  }

  dispose() {
    if (this.disposed) return
    this.disposed = true
    clearTimeout(this.timer)
    this.resize.disconnect()
    this.canvas.removeEventListener('paint', this.paint)
    this.canvas.removeEventListener('contextlost', this.fail)
    this.backdrop.disconnect()
    for (const [index, node] of [this.source, this.chrome, this.system].entries()) {
      const value = this.attributes[index]
      if (value === null) node.removeAttribute('drawable')
      else node.setAttribute('drawable', value)
    }
    for (const { node, marker } of this.positions) {
      ;(marker.parentElement as HTMLElement & MovableElement).moveBefore(node, marker)
      marker.remove()
    }
    this.canvas.remove()
  }
}
