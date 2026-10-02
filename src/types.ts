export type DuoDisplay = "inner" | "outer";
export type DuoPlacement = "full" | "left" | "right";
export type DuoOrientation = "portrait" | "landscape-left" | "landscape-right";
export type DuoPosture = "open" | "closed";
export type DuoZoom = "fit" | number;

export interface DuoRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface DuoInsets {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
}

export interface DuoReservedRegion extends DuoRect {
  readonly type: "occlusion" | "division";
}

export interface DuoScreenInfo {
  readonly display: DuoDisplay;
  readonly placement: DuoPlacement;
  readonly orientation: DuoOrientation;
  readonly visible: boolean;
  readonly size: Readonly<{ width: number; height: number }>;
  readonly window: DuoRect;
  readonly safeArea: DuoInsets;
  readonly reservedRegions: readonly DuoReservedRegion[];
  readonly cornerRadii: readonly [number, number, number, number];
}

export interface DuoSystem {
  readonly time: string;
  readonly battery: number;
  readonly charging: boolean;
  readonly cameraActive: boolean;
}

export interface DuoDefaults {
  readonly posture?: DuoPosture;
  readonly orientation?: DuoOrientation;
  readonly innerPlacement?: DuoPlacement;
  readonly zoom?: DuoZoom;
}

export interface DuoState {
  readonly posture: DuoPosture;
  readonly orientation: DuoOrientation;
  readonly innerPlacement: DuoPlacement;
  readonly zoom: DuoZoom;
  readonly zoomReadOnly: boolean;
  readonly system: DuoSystem;
  readonly screens: Readonly<Record<DuoDisplay, DuoScreenInfo>>;
}

export interface DuoWindowChange {
  readonly display: DuoDisplay;
  readonly previous: DuoScreenInfo;
  readonly current: DuoScreenInfo;
}
