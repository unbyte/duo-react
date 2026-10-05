import * as React from "react"
import { GlassTabs } from "./glass-tabs"
import { type GlassGeometry, type GlassVariant, type VariantProps, clamp } from "./shared"

export function horizontalGeometry(count: number): GlassGeometry {
  const length = count < 4 ? count * 86 + 16 : 400
  const pitch = (length - 16) / count
  const itemLength = pitch + 8
  return {
    length,
    cross: 62,
    pitch,
    first: 4 + itemLength / 2,
    itemLength,
    lensLength: itemLength,
    lensCross: 54,
    labels: 1,
  }
}

export function horizontalVariant(count: number) {
  const rest = horizontalGeometry(count)
  const variant: GlassVariant = {
    vertical: false,
    rest,
    style: { width: rest.length, height: rest.cross },
    geometry: (_reveal, growth, deformation) => {
      const stretch = clamp(deformation, -Math.max(0, (rest.itemLength - 58) / 1.45), 30) * growth
      return {
        ...rest,
        lensLength: rest.itemLength + growth * 16 + stretch,
        lensCross: 54 + growth * 16 - stretch * 0.45,
      }
    },
    point: (bounds, x) => ((x - bounds.left) * rest.length) / bounds.width,
    size: (geometry) => ({ width: geometry.length, height: geometry.cross }),
    itemStyle: (_geometry, index) => ({
      left: 4 + index * rest.pitch,
      top: 4,
      width: rest.itemLength,
      height: 54,
    }),
  }
  return variant
}

export function HorizontalTabBar(props: VariantProps) {
  return <GlassTabs {...props} variant={horizontalVariant(props.items.length)} />
}
