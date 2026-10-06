import type { CSSProperties } from "react"
import { barProfile, tabProfile } from "@duo-react/profiles"

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
    const length = vertical
      ? count * tabProfile.verticalPitch + tabProfile.verticalPadding
      : count < 4
        ? count * tabProfile.horizontalPitch + tabProfile.horizontalPadding
        : barProfile.packedTabWidth
    const pitch = vertical
      ? tabProfile.verticalPitch
      : (length - tabProfile.horizontalPadding) / count
    this.rest = {
      length,
      cross: vertical ? barProfile.railWidth : barProfile.tabThickness,
      pitch,
      first: vertical
        ? (length - (count - 1) * pitch) / 2
        : tabProfile.horizontalInset + (pitch + tabProfile.itemOverlap) / 2,
      itemLength: pitch + tabProfile.itemOverlap,
      lensLength: pitch + tabProfile.itemOverlap,
      lensCross: vertical ? tabProfile.verticalLensCross : tabProfile.horizontalLensCross,
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
        lensCross: rest.lensCross + growth * 16 - stretch * 0.45,
      }
    }
    // Expansion keeps the calibrated control axis centered.
    const extra = ((count - 1) * 8 + 14) * reveal
    const length = rest.length + extra
    const pitch = rest.pitch + (count > 1 ? Math.max(0, extra - 14) / (count - 1) : 0)
    const stretch = clamp(deformation, -24, 30) * growth
    return {
      length,
      cross: rest.cross + 28 * reveal,
      pitch,
      first: (length - (count - 1) * pitch) / 2,
      itemLength: rest.itemLength,
      lensLength: rest.itemLength + 20 * growth + 6 * reveal + stretch,
      lensCross: rest.lensCross + 20 * growth + 20 * reveal - stretch * 0.45,
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
          left: tabProfile.verticalInset,
          top: geometry.first + index * geometry.pitch - geometry.pitch / 2,
          width: geometry.cross - tabProfile.verticalInset * 2,
          height: geometry.pitch,
        }
      : {
          left: tabProfile.horizontalInset + index * this.rest.pitch,
          top: tabProfile.horizontalInset,
          width: this.rest.itemLength,
          height: this.rest.lensCross,
        }
  }
}
