import { BackdropStore } from '../backdrop/store'
import type { ContentRenderer, RendererScreen } from '../types'
import { CanvasBackdrops } from './backdrops'
import type { DrawableCanvas, DrawableContext } from './html-in-canvas'

export class CanvasRenderer implements ContentRenderer {
  readonly backdrop = new BackdropStore(() => this.invalidate())
  private readonly backdrops = new CanvasBackdrops()
  private screen?: RendererScreen
  private source?: HTMLElement
  private canvas?: DrawableCanvas
  private context?: DrawableContext
  private resize?: ResizeObserver

  constructor(private readonly onError: (error: unknown) => void) {}

  updateScreen(screen: RendererScreen) {
    this.screen = screen
    this.invalidate()
  }

  connect(source: HTMLElement) {
    const canvas = source.parentElement as DrawableCanvas
    const context = canvas.getContext('2d') as DrawableContext | null
    if (!context) {
      this.onError(new Error('The content canvas requires a 2D context.'))
      return
    }
    this.source = source
    this.canvas = canvas
    this.context = context
    canvas.addEventListener('paint', this.paint)
    canvas.addEventListener('contextrestored', this.invalidate)
    document.addEventListener('visibilitychange', this.invalidate)
    window.addEventListener('resize', this.invalidate)
    this.resize = new ResizeObserver(this.invalidate)
    this.resize.observe(canvas, { box: 'device-pixel-content-box' })
    this.invalidate()
  }

  disconnect() {
    this.canvas?.removeEventListener('paint', this.paint)
    this.canvas?.removeEventListener('contextrestored', this.invalidate)
    document.removeEventListener('visibilitychange', this.invalidate)
    window.removeEventListener('resize', this.invalidate)
    this.resize?.disconnect()
    this.source = undefined
    this.canvas = undefined
    this.context = undefined
    this.backdrops.clear()
  }

  private invalidate = () => {
    const { canvas, screen } = this
    if (!canvas || !screen?.visible) return
    const ratio = window.devicePixelRatio * (screen.scale ?? 1)
    const width = Math.max(1, Math.round(screen.size.width * ratio))
    const height = Math.max(1, Math.round(screen.size.height * ratio))
    if (canvas.width !== width) canvas.width = width
    if (canvas.height !== height) canvas.height = height
    canvas.requestPaint()
  }

  private paint = () => {
    const { canvas, context, source, screen } = this
    if (!canvas || !context || !source || !screen?.visible || document.hidden) return
    try {
      const { width, height } = canvas
      context.clearRect(0, 0, width, height)
      context.drawElementImage(source, 0, 0, width, height)
      this.backdrop.publish(
        this.backdrops.render(
          canvas,
          screen.size,
          this.backdrop.getRequests(),
          this.backdrop.getSnapshot().colors,
        ),
      )
    } catch (error) {
      this.disconnect()
      this.onError(error)
    }
  }
}
