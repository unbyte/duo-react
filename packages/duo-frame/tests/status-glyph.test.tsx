import * as React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { expect, test } from "vite-plus/test"
import { StatusGlyph } from "../src/components/system-chrome/status-glyph"

function render(battery: number, charging = false) {
  return renderToStaticMarkup(<StatusGlyph battery={battery} charging={charging} />)
}

test("battery levels use continuous arcs without dash tessellation", () => {
  for (const battery of [0, 0.1, 25, 50, 75, 75.1, 99.9, 100]) {
    const html = render(battery)
    expect(html).not.toMatch(/stroke-dasharray|pathLength|NaN/)
    const paths = [...html.matchAll(/<path d="([^"]+)" stroke-width="6.5"/g)]
    expect(paths).toHaveLength(battery === 0 || battery === 100 ? 1 : 2)
    if (battery === 0) continue
    const arc = paths.at(-1)![1].match(/A47.5 47.5 0 ([01]) 1 ([\d.e+-]+) ([\d.e+-]+)/)!
    expect(Number(arc[1])).toBe(battery > 75 ? 1 : 0)
    const x = Number(arc[2]) - 52
    const y = Number(arc[3]) - 52
    expect(Math.hypot(x, y)).toBeCloseTo(47.5)
    const sweptDegrees = ((Math.atan2(y, x) * 180) / Math.PI - 150 + 360) % 360
    expect(sweptDegrees).toBeCloseTo(battery * 2.4)
  }
})

test("charging replaces Wi-Fi and retains the battery and cellular indicators", () => {
  const normal = render(50)
  const charging = render(50, true)
  expect(normal.match(/<circle/g)).toHaveLength(5)
  expect(charging.match(/<circle/g)).toHaveLength(4)
  expect(charging).toContain('d="m55 32-18 27h13l-4 22 21-32H53z"')
  expect(charging.match(/stroke-width="6.5"/g)).toHaveLength(2)
})
