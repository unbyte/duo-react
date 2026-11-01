export function blurRegion(
  raw: HTMLCanvasElement,
  blurred: HTMLCanvasElement,
  padded: HTMLCanvasElement,
  radius: number,
) {
  if (blurred.width !== raw.width) blurred.width = raw.width
  if (blurred.height !== raw.height) blurred.height = raw.height
  const blur = blurred.getContext('2d')!
  const padding = Math.ceil(radius * 3)
  if (padded.width !== raw.width + padding * 2) padded.width = raw.width + padding * 2
  if (padded.height !== raw.height + padding * 2) padded.height = raw.height + padding * 2
  const edges = padded.getContext('2d')!
  edges.clearRect(0, 0, padded.width, padded.height)
  edges.drawImage(raw, padding, padding)
  edges.drawImage(raw, 0, 0, raw.width, 1, padding, 0, raw.width, padding)
  edges.drawImage(
    raw,
    0,
    raw.height - 1,
    raw.width,
    1,
    padding,
    padding + raw.height,
    raw.width,
    padding,
  )
  edges.drawImage(padded, padding, 0, 1, padded.height, 0, 0, padding, padded.height)
  edges.drawImage(
    padded,
    padding + raw.width - 1,
    0,
    1,
    padded.height,
    padding + raw.width,
    0,
    padding,
    padded.height,
  )
  blur.clearRect(0, 0, blurred.width, blurred.height)
  blur.filter = `blur(${radius}px)`
  blur.drawImage(padded, -padding, -padding)
}
