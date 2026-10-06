import type { TabLayout } from "./layout"

export async function makeArtwork(
  element: HTMLDivElement,
  layout: TabLayout,
  labels: readonly string[],
) {
  const canvas = document.createElement("canvas")
  const ratio = 3
  const { rest, vertical } = layout
  canvas.width = Math.ceil((vertical ? labels.length * 80 : rest.length) * ratio)
  canvas.height = (vertical ? 96 : rest.cross) * ratio
  const context = canvas.getContext("2d")!
  context.scale(ratio, ratio)
  await document.fonts?.ready
  const icons = element.querySelectorAll<HTMLElement>(".duo-react-tab-bar-icon")
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
