import * as React from "react";
import { resolveZoom, safeAreaStyle, validateZoom } from "./geometry";
import { ScreenContext, useBrowserLayoutEffect, useDuoState, useDuoStore } from "./provider";
import type { DuoDisplay, DuoZoom } from "./types";
import { SystemChrome } from "./system-chrome";
import { frameBezel, frameOutset, Hardware } from "./hardware";
import { orientationRotation, rotatedSize } from "./view-controls";
import { useRotation } from "./use-rotation";
import { AccessoryContext } from "./accessory-context";
import { getAccessoryLayout } from "./accessory-layout";
import "./style.css";

export interface DuoFrameProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  zoom?: DuoZoom;
  onZoomChange?: (zoom: DuoZoom) => void;
  fitPadding?: number;
  showSystemUI?: boolean;
}

function DisplaySurface({
  display,
  children,
  scale,
  showSystemUI,
}: {
  display: DuoDisplay;
  children: React.ReactNode;
  scale: number;
  showSystemUI: boolean;
}) {
  const screen = useDuoState((state) => state.screens[display]);
  const [tabBar, setTabBar] = React.useState<HTMLDivElement>();
  const [toolbar, setToolbar] = React.useState<HTMLDivElement>();
  const attachTabBar = React.useCallback(
    (node: HTMLDivElement | null) => setTabBar(node ?? undefined),
    [],
  );
  const attachToolbar = React.useCallback(
    (node: HTMLDivElement | null) => setToolbar(node ?? undefined),
    [],
  );
  const { side, ...accessoryBounds } = React.useMemo(() => getAccessoryLayout(screen), [screen]);
  const accessoryHosts = React.useMemo(() => ({ tabBar, toolbar, side }), [tabBar, toolbar, side]);
  const bounds = screen.window;
  return (
    <div
      className="duo-display"
      data-duo-display={display}
      data-duo-placement={screen.placement}
      aria-hidden={!screen.visible}
      style={{
        width: screen.size.width,
        height: screen.size.height,
        marginLeft: -screen.size.width / 2,
        marginTop: -screen.size.height / 2,
        transform: `scale(${scale}) rotate(${-orientationRotation[screen.orientation]}deg)`,
        visibility: screen.visible && scale > 0 ? "visible" : "hidden",
        borderRadius: screen.cornerRadii.map((radius) => `${radius}px`).join(" "),
        boxShadow:
          display === "inner"
            ? `0 0 0 ${frameBezel.inner - 2}px var(--duo-bezel-color), 0 0 0 ${frameBezel.inner}px var(--duo-rim-color)`
            : undefined,
      }}
    >
      <Hardware display={display} orientation={screen.orientation} />
      <div className="duo-screen">
        <div
          className="duo-window"
          data-duo-window={display}
          style={{
            left: bounds.x,
            top: bounds.y,
            width: bounds.width,
            height: bounds.height,
            borderRadius: screen.windowCornerRadii.map((radius) => `${radius}px`).join(" "),
            ...safeAreaStyle(screen.safeArea),
          }}
        >
          <ScreenContext.Provider value={display}>
            <AccessoryContext.Provider value={accessoryHosts}>{children}</AccessoryContext.Provider>
          </ScreenContext.Provider>
        </div>
        <div
          className="duo-accessory-window"
          style={{
            left: bounds.x,
            top: bounds.y,
            width: bounds.width,
            height: bounds.height,
            borderRadius: screen.windowCornerRadii.map((radius) => `${radius}px`).join(" "),
            ...safeAreaStyle(screen.safeArea),
          }}
        >
          <div
            className="duo-accessory-layout"
            data-duo-bar-axis={side === "horizontal" ? "horizontal" : "vertical"}
            style={accessoryBounds}
          >
            <div
              className="duo-accessory-host"
              data-duo-accessory-host="toolbar"
              ref={attachToolbar}
            />
            <div className="duo-accessory-host" data-duo-accessory-host="tab" ref={attachTabBar} />
          </div>
        </div>
        <SystemChrome screen={screen} showIndicators={showSystemUI} />
      </div>
    </div>
  );
}

export const DuoFrame = React.forwardRef<HTMLDivElement, DuoFrameProps>(function DuoFrame(
  {
    children,
    zoom,
    onZoomChange,
    fitPadding = 24,
    showSystemUI = true,
    className,
    style,
    ...props
  },
  forwardedRef,
) {
  const store = useDuoStore();
  const state = useDuoState((value) => value);
  const previousScreens = React.useRef(state.screens);
  useBrowserLayoutEffect(() => {
    const previous = previousScreens.current;
    previousScreens.current = state.screens;
    for (const display of ["inner", "outer"] as const) {
      if (previous[display] !== state.screens[display]) {
        store.emitWindowChange({
          display,
          previous: previous[display],
          current: state.screens[display],
        });
      }
    }
  }, [state.screens, store]);
  const root = React.useRef<HTMLDivElement>(null);
  const [size, setSize] = React.useState<{ width: number; height: number }>();
  React.useImperativeHandle(forwardedRef, () => root.current!, []);
  useBrowserLayoutEffect(() => store.connectFrame(), [store]);
  useBrowserLayoutEffect(() => {
    store.configureZoom(zoom, onZoomChange);
  }, [store, zoom, onZoomChange]);
  useBrowserLayoutEffect(() => {
    const node = root.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize((current) =>
        current?.width === width && current.height === height ? current : { width, height },
      );
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const effectiveZoom = zoom ?? state.zoom;
  validateZoom(effectiveZoom);
  if (!Number.isFinite(fitPadding) || fitPadding < 0)
    throw new RangeError("fitPadding must be a nonnegative finite number.");
  const active = state.screens[state.posture === "open" ? "inner" : "outer"];
  const rotation = useRotation(state.rotation);
  const outset = frameOutset(active.display);
  const scale = resolveZoom(
    effectiveZoom,
    size ?? { width: 0, height: 0 },
    rotatedSize(
      { width: active.size.width + outset * 2, height: active.size.height + outset * 2 },
      rotation - orientationRotation[active.orientation],
    ),
    fitPadding,
  );
  useBrowserLayoutEffect(() => {
    if (size) store.reportRenderedZoom(scale);
  }, [store, scale, size]);
  return (
    <div
      {...props}
      ref={root}
      className={["duo-frame", className].filter(Boolean).join(" ")}
      style={style}
    >
      <div className="duo-rotation" style={{ transform: `rotate(${rotation}deg)` }}>
        <DisplaySurface display={active.display} scale={scale} showSystemUI={showSystemUI}>
          {children}
        </DisplaySurface>
      </div>
    </div>
  );
});

export const DuoSafeArea = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function DuoSafeArea({ style, ...props }, ref) {
    return (
      <div
        {...props}
        ref={ref}
        style={{
          boxSizing: "border-box",
          paddingTop: "var(--duo-safe-area-inset-top, 0px)",
          paddingRight: "var(--duo-safe-area-inset-right, 0px)",
          paddingBottom: "var(--duo-safe-area-inset-bottom, 0px)",
          paddingLeft: "var(--duo-safe-area-inset-left, 0px)",
          ...style,
        }}
      />
    );
  },
);
