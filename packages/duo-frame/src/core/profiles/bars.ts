import { sideControlMetrics } from "../layout/control-metrics"

// Measured resting offsets; allocation shares are library policy, not native item sizes.
export const barProfile = {
  horizontalInset: 20,
  top: 24,
  bottom: 21,
  bottomToolbarInset: 24,
  toolbarThickness: 48,
  tabThickness: 62,
  packedTabWidth: 400,
  edgeTabInset: 21,
  edgeTabBottom: 28,
  groupGap: 12,
  sectionGap: 16,
  railWidth: sideControlMetrics.width,
  railInset: sideControlMetrics.edgeInset,
  railTop: sideControlMetrics.innerTop,
  railBottom: 24,
} as const
