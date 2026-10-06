// Reference-image pixels mapped to app CSS pixels using the provisional camera cutout.
// This matches the supplied crop's proportions, not a confirmed physical-hole measurement.
const referenceScale = 37 / 94
export const systemMetrics = {
  glyphWidth: 104 * referenceScale,
  glyphHeight: 108 * referenceScale,
  glyphTopPadding: 1.25 * referenceScale,
  timeWidth: 44,
  fontSize: 16,
  lineHeight: 20,
  gap: 7,
  top: 24,
  cameraGap: 18,
  materialEndPadding: 8,
  materialSidePadding: 5,
  homeWidth: 120,
  homeHeight: 5,
  homeBottom: 7,
  dividerWidth: 4,
  dividerHeight: 48,
} as const

// Status ink positions measured on the iOS 27.1 Duo simulator, before SVG padding.
export const statusAnchors = {
  horizontalTimeEnd: 99.5,
  horizontalTimeCenterY: 48 + 1 / 3,
  horizontalGlyphEnd: 47.5,
  horizontalGlyphTop: 27 + 2 / 3,
  sideGlyphOffset: 1 / 6,
  innerTimeTop: 30,
  outerTimeTop: 82 + 2 / 3,
  innerGlyphTop: 57,
  outerGlyphTop: 109 + 2 / 3,
} as const
