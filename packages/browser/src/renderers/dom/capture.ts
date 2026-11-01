import { iframeCapture } from './iframe-capture'

export async function captureDom(source: HTMLElement) {
  const { snapdom } = await import('@zumer/snapdom')
  return snapdom.toCanvas(source, {
    scale: 1,
    dpr: 1,
    fast: false,
    invalidate: true,
    plugins: [iframeCapture],
  })
}
