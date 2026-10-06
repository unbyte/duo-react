export type ResolvedIndicatorStyle = "light" | "dark"

export function chooseIndicatorStyle(pixels: Uint8ClampedArray, previous: ResolvedIndicatorStyle) {
  let luminance = 0
  let weight = 0
  const linear = (channel: number) => {
    const value = channel / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  }
  for (let index = 0; index < pixels.length; index += 4) {
    const alpha = pixels[index + 3] / 255
    luminance +=
      (0.2126 * linear(pixels[index]) +
        0.7152 * linear(pixels[index + 1]) +
        0.0722 * linear(pixels[index + 2])) *
      alpha
    weight += alpha
  }
  if (!weight) return previous
  const average = luminance / weight
  // Retain the current choice near equal black/white contrast to avoid flickering.
  const threshold = previous === "light" ? 0.189 : 0.169
  return average < threshold ? "light" : "dark"
}
