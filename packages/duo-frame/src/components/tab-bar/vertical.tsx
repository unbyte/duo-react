import * as React from "react"
import { GlassTabs } from "./glass-tabs"
import { type GlassGeometry, type GlassVariant, type VariantProps, clamp } from "./shared"

export function verticalGeometry(count: number): GlassGeometry {
  const length = count * 50 + 12
  const pitch = 50
  return {
    length,
    cross: 48,
    pitch,
    first: (length - (count - 1) * pitch) / 2,
    itemLength: pitch + 8,
    lensLength: pitch + 8,
    lensCross: 44,
    labels: 0,
  }
}

export function verticalVariant(count: number) {
  const rest = verticalGeometry(count)
  const variant: GlassVariant = {
    vertical: true,
    rest,
    style: { width: rest.cross, height: rest.length },
    geometry: (reveal, growth, deformation) => {
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
    },
    point: (bounds, _x, y, geometry) => {
      const position = ((y - bounds.top) * geometry.length) / bounds.height
      return rest.first + ((position - geometry.first) / geometry.pitch) * rest.pitch
    },
    size: (geometry) => ({
      width: geometry.cross,
      height: geometry.length,
      left: (rest.cross - geometry.cross) / 2,
      bottom: 0,
    }),
    itemStyle: (geometry, index) => ({
      left: 2,
      top: geometry.first + index * geometry.pitch - geometry.pitch / 2,
      width: geometry.cross - 4,
      height: geometry.pitch,
    }),
  }
  return variant
}

export function VerticalTabBar(props: VariantProps) {
  return <GlassTabs {...props} variant={verticalVariant(props.items.length)} />
}
