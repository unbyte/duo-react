export interface DrawableCanvas extends HTMLCanvasElement {
  requestPaint(): void
}

export interface DrawableContext extends CanvasRenderingContext2D {
  drawElementImage(element: Element, x: number, y: number, width: number, height: number): void
}

export function supportsCanvasRenderer() {
  return (
    typeof HTMLCanvasElement !== 'undefined' &&
    typeof CanvasRenderingContext2D !== 'undefined' &&
    'drawElementImage' in CanvasRenderingContext2D.prototype &&
    'requestPaint' in HTMLCanvasElement.prototype &&
    'content' in HTMLCanvasElement.prototype &&
    'updateElementGeometry' in HTMLCanvasElement.prototype
  )
}
