import type { TabLayout } from './layout'
import type { DuoTabBarItem } from './types'

export const badgeAtlas = { cellWidth: 80, cellHeight: 32, padding: 4 } as const

export interface TabArtwork {
  readonly icons: HTMLCanvasElement
  readonly badges?: {
    readonly canvas: HTMLCanvasElement
    readonly sizes: readonly { readonly width: number; readonly height: number }[]
  }
}

export async function makeArtwork(
  element: HTMLDivElement,
  layout: TabLayout,
  items: readonly DuoTabBarItem[],
): Promise<TabArtwork> {
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
  return { icons: canvas, badges: makeBadges(buttons, items, ratio) }
}

function makeBadges(
  buttons: NodeListOf<HTMLElement>,
  items: readonly DuoTabBarItem[],
  ratio: number,
) {
  if (!items.some((item) => item.badge !== undefined)) return undefined
  const canvas = document.createElement('canvas')
  const { cellWidth, cellHeight, padding } = badgeAtlas
  canvas.width = items.length * cellWidth * ratio
  canvas.height = cellHeight * ratio
  const context = canvas.getContext('2d')!
  context.scale(ratio, ratio)
  const sizes = items.map((item, index) => {
    if (item.badge === undefined) return { width: 0, height: 0 }
    const badge = buttons[index].querySelector<HTMLElement>('.duo-react-tab-bar-badge')!
    const style = getComputedStyle(badge)
    const width = Number.parseFloat(style.width)
    const height = Number.parseFloat(style.height)
    const x = index * cellWidth + padding
    context.fillStyle = style.backgroundColor
    context.beginPath()
    context.roundRect(x, padding, width, height, 9)
    context.fill()
    context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
    context.fillStyle = style.color
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillText(
      truncateBadge(badge.textContent ?? '', width - 8, context),
      x + width / 2,
      padding + height / 2,
    )
    return { width, height }
  })
  return { canvas, sizes }
}

function truncateBadge(text: string, width: number, context: CanvasRenderingContext2D) {
  if (context.measureText(text).width <= width) return text
  const segments = new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text)
  let result = ''
  for (const { segment } of segments) {
    if (context.measureText(`${result}${segment}…`).width > width) break
    result += segment
  }
  return `${result}…`
}
