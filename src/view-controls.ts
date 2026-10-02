import type { DuoOrientation } from "./types";

const orientations: readonly DuoOrientation[] = ["landscape-left", "portrait", "landscape-right"];

export function rotatedOrientation(orientation: DuoOrientation, direction: "left" | "right") {
  return orientations[orientations.indexOf(orientation) + (direction === "left" ? -1 : 1)];
}
