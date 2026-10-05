import type { BackdropFrame } from "../../backdrop/store"
import type { CSSProperties } from "react"
import type { DuoTabBarProps } from "./tab-bar"

export type VariantProps = Pick<DuoTabBarProps, "items" | "selectedId" | "onSelect" | "layout"> & {
  readonly dark?: boolean
}

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

export interface GlassVariant {
  readonly vertical: boolean
  readonly rest: GlassGeometry
  readonly style: CSSProperties
  geometry: (reveal: number, growth: number, deformation: number) => GlassGeometry
  point: (bounds: DOMRect, x: number, y: number, geometry: GlassGeometry) => number
  size: (geometry: GlassGeometry) => CSSProperties
  itemStyle: (geometry: GlassGeometry, index: number) => CSSProperties
}

export interface GlassFrame {
  readonly backdrop?: BackdropFrame
  readonly origin: { readonly x: number; readonly y: number }
  readonly width: number
  readonly crossSize: number
  readonly firstCenter: number
  readonly labels: number
  readonly count: number
  readonly itemWidth: number
  readonly pitch: number
  readonly x: number
  readonly lensWidth: number
  readonly lensHeight: number
  readonly growth: number
  readonly dark: boolean
  readonly accent: string
  readonly dispersion: number
  readonly rimDistortion: number
  readonly containerInset: number
  readonly edgeCurlWidth: number
  readonly edgeCurlStrength: number
  readonly outerRefraction: boolean
  readonly outerRefractionStrength: number
}

export const optics = {
  dispersion: 0.8,
  rimDistortion: 1.2,
  containerInset: 3.3,
  edgeCurlWidth: 4,
  edgeCurlStrength: 2,
  outerRefraction: true,
  outerRefractionStrength: 0.6,
} as const

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

export async function makeArtwork(
  element: HTMLDivElement,
  variant: GlassVariant,
  labels: readonly string[],
) {
  const canvas = document.createElement("canvas")
  const ratio = 3
  const { rest, vertical } = variant
  canvas.width = Math.ceil((vertical ? labels.length * 80 : rest.length) * ratio)
  canvas.height = (vertical ? 96 : rest.cross) * ratio
  const context = canvas.getContext("2d")!
  context.scale(ratio, ratio)
  await document.fonts?.ready
  const icons = element.querySelectorAll<HTMLElement>(".duo-tab-bar-icon")
  await Promise.all(
    Array.from(icons).map(async (icon, index) => {
      // Arbitrary React icons remain usable through the DOM presentation. Only
      // self-contained SVG artwork can be safely uploaded to a WebGL texture.
      const svg = icon.firstElementChild
      if (!(svg instanceof SVGSVGElement) || icon.childElementCount !== 1)
        throw new Error("Icon requires DOM rendering")
      const copy = svg.cloneNode(true) as SVGSVGElement
      copy.setAttribute("xmlns", "http://www.w3.org/2000/svg")
      const image = new Image()
      image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(copy).replaceAll("currentColor", "#ffffff"))}`
      await image.decode()
      const center = vertical ? index * 80 + 40 : rest.first + index * rest.pitch
      context.drawImage(image, center - 13.5, 10.5, 27, 27)
      context.fillStyle = "#ffffff"
      context.font = '600 10px -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif'
      context.textAlign = "center"
      context.textBaseline = "alphabetic"
      context.fillText(
        labels[index],
        center,
        vertical ? 72 : 48.5,
        vertical ? 76 : Math.max(1, rest.pitch - 4),
      )
    }),
  )
  return canvas
}
