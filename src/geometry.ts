import { foldingRegions, profiles } from "./profiles/xcode-27.1";
import type {
  DuoDisplay,
  DuoInsets,
  DuoOrientation,
  DuoPlacement,
  DuoPosture,
  DuoScreenInfo,
  DuoZoom,
} from "./types";

export interface DuoGeometryOptions {
  display: DuoDisplay;
  orientation: DuoOrientation;
  placement?: DuoPlacement;
  cameraActive?: boolean;
  posture?: DuoPosture;
}

export function getDuoGeometry({
  display,
  orientation,
  placement = "full",
  cameraActive = false,
  posture = "open",
}: DuoGeometryOptions): Omit<DuoScreenInfo, "visible"> {
  validatePosture(posture);
  const profile = profiles.find(
    (entry) =>
      entry.display === display &&
      entry.orientation === orientation &&
      entry.placement === placement &&
      entry.cameraActive === (display === "inner" && cameraActive),
  );
  if (!profile)
    throw new RangeError(`No measured Duo profile for ${display}/${orientation}/${placement}.`);
  // The source repeats outer radii in native portrait order even in landscape.
  // Rotate them into the same oriented coordinates as the screen and camera.
  const [topLeft, topRight, bottomRight, bottomLeft] = profile.cornerRadii;
  const cornerRadii: DuoScreenInfo["cornerRadii"] =
    display === "outer" && orientation === "landscape-left"
      ? [bottomLeft, topLeft, topRight, bottomRight]
      : display === "outer" && orientation === "landscape-right"
        ? [topRight, bottomRight, bottomLeft, topLeft]
        : [...profile.cornerRadii];
  // Divider-facing corners are estimated from the Split View illustration, not simulator data.
  const splitRadius = 32;
  const windowCornerRadii: DuoScreenInfo["windowCornerRadii"] =
    placement === "left"
      ? [cornerRadii[0], splitRadius, splitRadius, cornerRadii[3]]
      : placement === "right"
        ? [splitRadius, cornerRadii[1], cornerRadii[2], splitRadius]
        : [...cornerRadii];
  const fold = display === "inner" ? foldingRegions[orientation] : undefined;
  const active = posture === "partially-open";
  const reservedRegions = profile.reservedRegions.map((region) => Object.freeze({ ...region }));
  if (fold && active) {
    const bounds = profile.window;
    const x = Math.max(fold.frame.x, bounds.x);
    const y = Math.max(fold.frame.y, bounds.y);
    const width = Math.min(fold.frame.x + fold.frame.width, bounds.x + bounds.width) - x;
    const height = Math.min(fold.frame.y + fold.frame.height, bounds.y + bounds.height) - y;
    if (width > 0 && height > 0) {
      reservedRegions.push(
        Object.freeze({ type: "division", x: x - bounds.x, y: y - bounds.y, width, height }),
      );
    }
  }
  return {
    display,
    orientation,
    placement,
    size: Object.freeze({ ...profile.size }),
    window: Object.freeze({ ...profile.window }),
    safeArea: Object.freeze({ ...profile.safeArea }),
    cornerRadii: Object.freeze(cornerRadii),
    windowCornerRadii: Object.freeze(windowCornerRadii),
    foldingRegion: fold
      ? Object.freeze({
          ...fold,
          active,
          frame: Object.freeze({ ...fold.frame }),
          margins: Object.freeze({ ...fold.margins }),
        })
      : undefined,
    reservedRegions: Object.freeze(reservedRegions),
  };
}

export function validatePosture(posture: DuoPosture) {
  if (posture !== "open" && posture !== "closed" && posture !== "partially-open")
    throw new RangeError("Unsupported Duo posture.");
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
