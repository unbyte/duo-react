import type { DuoOrientation } from "./types";

export const orientationRotation: Record<DuoOrientation, number> = {
  portrait: 0,
  "landscape-left": 90,
  "portrait-upside-down": 180,
  "landscape-right": 270,
};

export function orientationAtRotation(rotation: number): DuoOrientation {
  const index = (((rotation / 90) % 4) + 4) % 4;
  return (["portrait", "landscape-left", "portrait-upside-down", "landscape-right"] as const)[
    index
  ];
}

export function nearestRotation(rotation: number, orientation: DuoOrientation) {
  const target = orientationRotation[orientation];
  return target + Math.round((rotation - target) / 360) * 360;
}

export function rotatedSize(size: { width: number; height: number }, rotation: number) {
  const radians = ((rotation % 360) * Math.PI) / 180;
  const cos = Math.abs(Math.cos(radians));
  const sin = Math.abs(Math.sin(radians));
  return {
    width: size.width * cos + size.height * sin,
    height: size.width * sin + size.height * cos,
  };
}
