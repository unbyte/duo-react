import { profiles } from "./profiles/xcode-27.1";
import type {
  DuoDisplay,
  DuoInsets,
  DuoOrientation,
  DuoPlacement,
  DuoScreenInfo,
  DuoZoom,
} from "./types";

export interface DuoGeometryOptions {
  display: DuoDisplay;
  orientation: DuoOrientation;
  placement?: DuoPlacement;
  cameraActive?: boolean;
}

export function getDuoGeometry({
  display,
  orientation,
  placement = "full",
  cameraActive = false,
}: DuoGeometryOptions): Omit<DuoScreenInfo, "visible"> {
  const profile = profiles.find(
    (entry) =>
      entry.display === display &&
      entry.orientation === orientation &&
      entry.placement === placement &&
      entry.cameraActive === (display === "inner" && cameraActive),
  );
  if (!profile)
    throw new RangeError(`No measured Duo profile for ${display}/${orientation}/${placement}.`);
  // Divider-facing corners are estimated from the Split View illustration, not simulator data.
  const splitRadius = 32;
  const windowCornerRadii: DuoScreenInfo["windowCornerRadii"] =
    placement === "left"
      ? [profile.cornerRadii[0], splitRadius, splitRadius, profile.cornerRadii[3]]
      : placement === "right"
        ? [splitRadius, profile.cornerRadii[1], profile.cornerRadii[2], splitRadius]
        : [...profile.cornerRadii];
  return {
    display,
    orientation,
    placement,
    size: Object.freeze({ ...profile.size }),
    window: Object.freeze({ ...profile.window }),
    safeArea: Object.freeze({ ...profile.safeArea }),
    cornerRadii: Object.freeze([...profile.cornerRadii]) as DuoScreenInfo["cornerRadii"],
    windowCornerRadii: Object.freeze(windowCornerRadii),
    reservedRegions: Object.freeze(
      profile.reservedRegions.map((region) => Object.freeze({ ...region })),
    ),
  };
}

export function safeAreaStyle(insets: DuoInsets) {
  return {
    "--duo-safe-area-inset-top": `${insets.top}px`,
    "--duo-safe-area-inset-right": `${insets.right}px`,
    "--duo-safe-area-inset-bottom": `${insets.bottom}px`,
    "--duo-safe-area-inset-left": `${insets.left}px`,
  };
}

export function validateZoom(zoom: DuoZoom) {
  if (zoom !== "fit" && (typeof zoom !== "number" || !Number.isFinite(zoom) || zoom <= 0)) {
    throw new RangeError('Duo zoom must be "fit" or a positive finite number.');
  }
}

export function resolveZoom(
  zoom: DuoZoom,
  container: { width: number; height: number },
  device: { width: number; height: number },
  padding = 24,
) {
  validateZoom(zoom);
  if (container.width <= 0 || container.height <= 0) return 0;
  return zoom === "fit"
    ? Math.max(
        0,
        Math.min(
          (container.width - padding * 2) / device.width,
          (container.height - padding * 2) / device.height,
        ),
      )
    : zoom;
}
