import type { DuoSize } from '@private/profiles'
import { chooseIndicatorStyle } from '../backdrop/contrast'
import { paddedRegion } from '../backdrop/geometry'
import type { BackdropRegion, BackdropRequest, BackdropSnapshot } from '../backdrop/types'
import { blurRegion } from './blur'

interface RegionSurface {
  raw: HTMLCanvasElement
  blurred: HTMLCanvasElement
  padded: HTMLCanvasElement
}

export class CanvasBackdrops {
  private readonly surfaces = new Map<symbol, RegionSurface>()

  clear() {
    this.surfaces.clear()
  }

  render(
    source: HTMLCanvasElement,
    size: DuoSize,
    requests: ReadonlyMap<symbol, BackdropRequest>,
    previousColors: BackdropSnapshot['colors'],
  ) {
    const scaleX = source.width / size.width
    const scaleY = source.height / size.height
    const regions = new Map<symbol, BackdropRegion>()
    const colors = { ...previousColors }
    for (const [key, request] of requests) {
      const area = paddedRegion(request.area, request.blur * 3, size)
      if (!area) continue
      let surface = this.surfaces.get(key)
      if (!surface) {
        surface = {
          raw: document.createElement('canvas'),
          blurred: document.createElement('canvas'),
          padded: document.createElement('canvas'),
        }
        this.surfaces.set(key, surface)
      }
      const { raw, blurred, padded } = surface
      // Backdrops use CSS-pixel resolution; only the visible app needs display resolution.
      if (raw.width !== area.width) raw.width = area.width
      if (raw.height !== area.height) raw.height = area.height
      const crop = raw.getContext('2d', { willReadFrequently: request.indicator !== undefined })!
      crop.clearRect(0, 0, raw.width, raw.height)
      crop.drawImage(
        source,
        area.x * scaleX,
        area.y * scaleY,
        area.width * scaleX,
        area.height * scaleY,
        0,
        0,
        raw.width,
        raw.height,
      )
      if (request.blur) blurRegion(raw, blurred, padded, request.blur)
      if (request.indicator) {
        const pixels = crop.getImageData(0, 0, raw.width, raw.height).data
        colors[request.indicator] = chooseIndicatorStyle(pixels, colors[request.indicator])
      }
      regions.set(key, {
        ...area,
        canvas: raw,
        blurred: request.blur ? blurred : raw,
        blur: request.blur,
        indicator: request.indicator,
      })
    }
    for (const key of this.surfaces.keys()) {
      if (!regions.has(key)) this.surfaces.delete(key)
    }
    return { regions, colors }
  }
}
