import { sideControlMetrics } from './controls'

// Measured resting offsets; allocation shares are library policy, not native item sizes.
export const barProfile = {
  horizontalInset: 20,
  top: 24,
  bottom: 21,
  bottomToolbarInset: 24,
  toolbarThickness: sideControlMetrics.width,
  tabThickness: 62,
  packedTabWidth: 400,
  edgeTabInset: 21,
  edgeTabBottom: 28,
  groupGap: 12,
  sectionGap: 16,
  // Held tab clearance for the calibrated two-to-five-item presentations.
  tabExpansion: 64,
  railWidth: sideControlMetrics.width,
  railInset: sideControlMetrics.edgeInset,
  railTop: sideControlMetrics.innerTop,
  railBottom: 24,
} as const

// Resting tab presentations calibrated for two through five destinations.
export const tabProfile = {
  horizontalPitch: 86,
  horizontalPadding: 16,
  horizontalItemLength: 94,
  horizontalFourItemLength: 108,
  verticalPitch: 50,
  verticalPadding: 12,
  itemOverlap: 8,
  horizontalInset: 4,
  verticalInset: 2,
  horizontalLensCross: 54,
  verticalLensCross: 44,
} as const
