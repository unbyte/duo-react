import type { CSSProperties } from "react"

export interface GlassGeometry {
  readonly length: number
  readonly cross: number
  readonly pitch: number
  readonly first: number
  readonly itemLength: number
  readonly lensLength: number
  readonly lensCross: number
  readonly labels: number
}

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

export class TabLayout {
  readonly rest: GlassGeometry

  constructor(
    readonly vertical: boolean,
    private readonly count: number,
  ) {
    const length = vertical ? count * 50 + 12 : count < 4 ? count * 86 + 16 : 400
    const pitch = vertical ? 50 : (length - 16) / count
    this.rest = {
      length,
      cross: vertical ? 48 : 62,
      pitch,
      first: vertical ? (length - (count - 1) * pitch) / 2 : 4 + (pitch + 8) / 2,
      itemLength: pitch + 8,
      lensLength: pitch + 8,
      lensCross: vertical ? 44 : 54,
      labels: vertical ? 0 : 1,
    }
  }

  geometry(reveal: number, growth: number, deformation: number): GlassGeometry {
    const { rest, count } = this
    if (!this.vertical) {
      const stretch = clamp(deformation, -Math.max(0, (rest.itemLength - 58) / 1.45), 30) * growth
      return {
        ...rest,
        lensLength: rest.itemLength + growth * 16 + stretch,
        lensCross: 54 + growth * 16 - stretch * 0.45,
      }
    }
    // Expansion keeps the calibrated control axis centered.
    const extra = ((count - 1) * 8 + 14) * reveal
    const length = rest.length + extra
    const pitch = rest.pitch + (count > 1 ? Math.max(0, extra - 14) / (count - 1) : 0)
    const stretch = clamp(deformation, -24, 30) * growth
    return {
      length,
      cross: 48 + 28 * reveal,
      pitch,
      first: (length - (count - 1) * pitch) / 2,
      itemLength: rest.itemLength,
      lensLength: rest.itemLength + 20 * growth + 6 * reveal + stretch,
      lensCross: 44 + 20 * growth + 20 * reveal - stretch * 0.45,
      labels: reveal,
    }
  }

  point(bounds: DOMRect, x: number, y: number, geometry: GlassGeometry) {
    const { rest } = this
    if (!this.vertical) return ((x - bounds.left) * rest.length) / bounds.width
    const position = ((y - bounds.top) * geometry.length) / bounds.height
    return rest.first + ((position - geometry.first) / geometry.pitch) * rest.pitch
  }

  size(geometry: GlassGeometry): CSSProperties {
    return this.vertical
      ? {
          width: geometry.cross,
          height: geometry.length,
          left: (this.rest.cross - geometry.cross) / 2,
          bottom: 0,
        }
      : { width: geometry.length, height: geometry.cross }
  }

  itemStyle(geometry: GlassGeometry, index: number): CSSProperties {
    return this.vertical
      ? {
          left: 2,
          top: geometry.first + index * geometry.pitch - geometry.pitch / 2,
          width: geometry.cross - 4,
          height: geometry.pitch,
        }
      : { left: 4 + index * this.rest.pitch, top: 4, width: this.rest.itemLength, height: 54 }
  }
}
