import { chooseIndicatorStyle } from '../backdrop/contrast'
import { sameRect } from '../backdrop/geometry'
import type { BackdropRegion, BackdropRequest, BackdropSnapshot } from '../backdrop/types'
import { blur, samePixels } from './image'

export class DomBackdrops {
  private readonly pixels = new WeakMap<BackdropRegion, Uint8ClampedArray>()

  async prepare(
    canvas: HTMLCanvasElement,
    requests: ReadonlyMap<symbol, BackdropRequest>,
    previous: BackdropSnapshot,
  ) {
    // Read the shared image once; reading separate GPU-backed crops repeats the
    // readback cost for every consumer, even when all of them are unchanged.
    const source = canvas.getContext('2d', { willReadFrequently: true })!
    const image = source.getImageData(0, 0, canvas.width, canvas.height)
    const regions = new Map<symbol, BackdropRegion>()
    const colors = { ...previous.colors }
    let changed = requests.size !== previous.regions.size
    await Promise.all(
      Array.from(requests, async ([key, request]) => {
        const { area } = request
        const pixels = new Uint8ClampedArray(area.width * area.height * 4)
        for (let y = 0; y < area.height; y++) {
          const offset = ((area.y + y) * image.width + area.x) * 4
          pixels.set(image.data.subarray(offset, offset + area.width * 4), y * area.width * 4)
        }
        const old = previous.regions.get(key)
        if (
          old &&
          sameRect(old, area) &&
          old.blur === request.blur &&
          old.indicator === request.indicator &&
          samePixels(this.pixels.get(old)!, pixels)
        ) {
          regions.set(key, old)
          return
        }
        changed = true
        const raw = document.createElement('canvas')
        raw.width = area.width
        raw.height = area.height
        const context = raw.getContext('2d')!
        const crop = context.createImageData(raw.width, raw.height)
        crop.data.set(pixels)
        context.putImageData(crop, 0, 0)
        const blurred = request.blur ? await blur(raw, request.blur) : raw
        const region: BackdropRegion = {
          ...area,
          canvas: raw,
          blurred,
          blur: request.blur,
          indicator: request.indicator,
        }
        this.pixels.set(region, pixels)
        regions.set(key, region)
        if (request.indicator)
          colors[request.indicator] = chooseIndicatorStyle(pixels, colors[request.indicator])
      }),
    )
    return changed ? { regions, colors } : previous
  }
}
