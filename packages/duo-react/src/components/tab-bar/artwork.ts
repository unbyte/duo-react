import type { TabLayout } from './layout'
import type { DuoTabBarItem } from './types'

export async function makeArtwork(
  element: HTMLDivElement,
  layout: TabLayout,
  items: readonly DuoTabBarItem[],
) {
  const canvas = document.createElement('canvas')
  const ratio = 3
  const { rest, vertical } = layout
  const height = vertical ? 96 : rest.cross
  canvas.width = Math.ceil((vertical ? items.length * 80 : rest.length) * ratio)
  // Stack inactive and active artwork so the moving lens can sample either state.
  canvas.height = height * 2 * ratio
  const context = canvas.getContext('2d')!
  context.scale(ratio, ratio)
  await document.fonts?.ready
  const buttons = element.querySelectorAll<HTMLElement>('.duo-react-tab-bar-item')
  await Promise.all(
    Array.from(buttons).map(async (button, index) => {
      const item = items[index]
      const paired = item.selectedIcon !== undefined
      const labelColors = paired
        ? [getComputedStyle(element).color, getComputedStyle(button).color]
        : ['#ffffff', '#ffffff']
      const icons = button.querySelectorAll<HTMLElement>('.duo-react-tab-bar-icon')
      await Promise.all(
        Array.from(icons).map(async (icon, state) => {
          const source = icon.firstElementChild
          if (icon.childElementCount !== 1) throw new Error('Icon requires DOM rendering')
          const color = paired ? getComputedStyle(icon).color : '#ffffff'
          let image: HTMLImageElement
          if (source instanceof HTMLImageElement) image = source
          else if (source instanceof SVGSVGElement) {
            const copy = source.cloneNode(true) as SVGSVGElement
            copy.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
            image = new Image()
            image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(copy).replaceAll('currentColor', color))}`
          } else throw new Error('Icon requires DOM rendering')
          await image.decode()
          const center = vertical ? index * 80 + 40 : rest.first + index * rest.pitch
          for (const row of paired ? [state] : [0, 1]) {
            const offset = row * height
            context.drawImage(image, center - 13.5, offset + 10.5, 27, 27)
            context.fillStyle = labelColors[row]
            context.font =
              '600 10px -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif'
            context.textAlign = 'center'
            context.textBaseline = 'alphabetic'
            context.fillText(
              item.label,
              center,
              offset + (vertical ? 72 : 48.5),
              vertical ? 76 : Math.max(1, rest.pitch - 4),
            )
          }
        }),
      )
    }),
  )
  return canvas
}
