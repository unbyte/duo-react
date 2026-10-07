import { barProfile, tabProfile } from '@private/profiles'
import type { CSSProperties } from 'react'

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
    const itemLength = vertical
      ? tabProfile.verticalPitch + tabProfile.itemOverlap
      : count === 4
        ? tabProfile.horizontalFourItemLength
        : tabProfile.horizontalItemLength
    const pitch = vertical
      ? tabProfile.verticalPitch
      : count > 1
        ? (length - tabProfile.horizontalInset * 2 - itemLength) / (count - 1)
        : tabProfile.horizontalPitch
    this.rest = {
      length,
      cross: vertical ? barProfile.railWidth : barProfile.tabThickness,
      pitch,
      first: (length - (count - 1) * pitch) / 2,
      itemLength,
      lensLength: itemLength,
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

  movement(bounds: DOMRect, dx: number, dy: number, geometry: GlassGeometry) {
    if (!this.vertical) return (dx * this.rest.length) / bounds.width
    // Expansion moves the surface under the pointer; only pointer travel is a drag.
    return (dy * geometry.length * this.rest.pitch) / (bounds.height * geometry.pitch)
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

  badgeOffset(geometry: GlassGeometry, width: number) {
    const buttonWidth = this.vertical
      ? geometry.cross - tabProfile.verticalInset * 2
      : this.rest.itemLength
    const trailing = buttonWidth + 4 - width
    // Icons have a 27px unscaled box. Expanded rails use the horizontal anchor.
    const expanded = Math.min(buttonWidth / 2 + 13.5 - 5, trailing)
    if (!this.vertical) return expanded
    const compact = Math.max(-4, trailing)
    return compact + (expanded - compact) * geometry.labels
  }

  badgeRect(geometry: GlassGeometry, index: number, width: number, height: number) {
    const button = this.itemStyle(geometry, index)
    return {
      x: Number(button.left) + this.badgeOffset(geometry, width),
      y: Number(button.top) + this.badgeTop(geometry),
      width,
      height,
    }
  }

  badgeTop(geometry: GlassGeometry) {
    // Compact hit targets follow the pitch; the native badge follows the taller item box.
    return this.vertical ? 2 - (this.rest.itemLength - geometry.pitch) / 2 : 2
  }
}
