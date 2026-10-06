import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { expect, test } from 'vitest'
import { StatusGlyph } from '../src/components/system/status-glyph'

function render(battery: number, charging = false, wifiStrength = 3, cellularStrength = 0) {
  return renderToStaticMarkup(
    <StatusGlyph
      battery={battery}
      charging={charging}
      wifiStrength={wifiStrength}
      cellularStrength={cellularStrength}
    />,
  )
}

test('battery outlines preserve the charge angle and ring thickness', () => {
  for (const battery of [0, 0.1, 25, 50, 75, 75.1, 99.9, 100]) {
    const html = render(battery)
    expect(html).not.toMatch(/stroke-width|stroke-dasharray|pathLength|NaN/)
    const paths = [...html.matchAll(/<path d="([^"]*A50\.75 [^"]*)"/g)]
    expect(paths).toHaveLength(battery === 0 || battery === 100 ? 1 : 2)
    if (battery === 0) continue
    const outline = paths.at(-1)![1]
    expect(outline).toContain('A44.25 44.25')
    expect(outline).toMatch(/ Z$/)
    const arc = outline.match(/A50.75 50.75 0 ([01]) 1 ([\d.e+-]+) ([\d.e+-]+)/)!
    expect(Number(arc[1])).toBe(battery > 75 ? 1 : 0)
    const x = Number(arc[2]) - 52
    const y = Number(arc[3]) - 52
    expect(Math.hypot(x, y)).toBeCloseTo(50.75)
    const sweptDegrees = ((Math.atan2(y, x) * 180) / Math.PI - 150 + 360) % 360
    expect(sweptDegrees).toBeCloseTo(battery * 2.4)
  }
})

test('charging keeps Wi-Fi and cellular signals with a green battery and a top lightning mark', () => {
  const normal = render(50)
  const charging = render(50, true)
  expect(normal.match(/<circle/g)).toHaveLength(5)
  expect(charging.match(/<circle/g)).toHaveLength(5)
  expect(charging).toContain('fill="#34c759"')
  expect(charging).toContain('d="M56 -3 43 12h8l-3 11L61 7h-8z" opacity="0.5"')
  for (const battery of [0, 0.1, 42.5, 50, 57.5, 57.6, 100]) {
    const html = render(battery, true)
    expect(html).not.toMatch(/NaN|Infinity/)
    const paths = [...html.matchAll(/<path d="([^"]*A50\.75 [^"]*)"/g)]
    expect(paths).toHaveLength(battery === 0 || battery === 100 ? 1 : 2)
    const normalPaths = [...render(battery).matchAll(/<path d="([^"]*A50\.75 [^"]*)"/g)]
    expect(paths.map(([, path]) => path)).toEqual(normalPaths.map(([, path]) => path))
    expect(html).toContain('clip-path:path(evenodd,')
  }
})

test('the charging accent separates colored battery artwork from the adaptive mask', () => {
  const props = { battery: 100, charging: true, wifiStrength: 3, cellularStrength: 2 }
  const adaptive = renderToStaticMarkup(<StatusGlyph {...props} layer="adaptive" />)
  const accent = renderToStaticMarkup(<StatusGlyph {...props} layer="accent" />)
  expect(adaptive).not.toContain('A50.75')
  expect(adaptive.match(/<circle/g)).toHaveLength(5)
  expect(accent).toContain('fill="#34c759"')
  expect(accent.match(/A50\.75 50\.75/g)).toHaveLength(1)
  expect(accent).not.toContain('<circle')
})

test('the charging clip encloses its whole hole in artwork coordinates', () => {
  const html = render(100, true)
  expect(html).toContain('view-box')
  const contour = html.match(
    /M(-?[\d.]+)[ ,]?(-?[\d.]+)H([\d.]+)V([\d.]+)H-?[\d.]+Z M([\d.]+) ([\d.]+)a([\d.]+) /,
  )!
  const [left, top, right, bottom, circleRight, centerY, radius] = contour.slice(1).map(Number)
  expect(left).toBeLessThan(circleRight - 2 * radius)
  expect(right).toBeGreaterThan(circleRight)
  // A hole crossing the outer contour becomes a filled area under even-odd clipping.
  expect(top).toBeLessThan(centerY - radius)
  expect(bottom).toBeGreaterThan(centerY + radius)
})

test('signal levels light Wi-Fi from the center out and cellular dots from left to right', () => {
  for (const wifi of [0, 1, 2, 3]) {
    for (const cellular of [0, 1, 2, 3, 4]) {
      const html = render(100, false, wifi, cellular)
      const opacities = [...html.matchAll(/opacity="([\d.]+)"/g)].map((match) => Number(match[1]))
      expect(opacities).toEqual([
        wifi >= 3 ? 1 : 0.25,
        wifi >= 2 ? 1 : 0.25,
        wifi >= 1 ? 1 : 0.25,
        ...[0, 1, 2, 3].map((index) => (index < cellular ? 1 : 0.25)),
      ])
    }
  }
  const charging = render(100, true, 3, 2)
  expect(charging.match(/opacity="1"/g)).toHaveLength(5)
  expect(charging.match(/opacity="0.25"/g)).toHaveLength(2)
})
