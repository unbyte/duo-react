import * as React from "react";
import { createPortal } from "react-dom";
import { resolveZoom, safeAreaStyle, validateZoom } from "./geometry";
import { ScreenContext, useBrowserLayoutEffect, useDuoState, useDuoStore } from "./provider";
import type { DuoDisplay, DuoZoom } from "./types";
import { SystemChrome } from "./system-chrome";
import "./style.css";

export interface DuoFrameProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  inner: React.ReactNode;
  outer: React.ReactNode;
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
  const store = useDuoStore();
  const [host, setHost] = React.useState<HTMLDivElement>();
  const attachHost = React.useCallback((node: HTMLDivElement | null) => {
    setHost(node ?? undefined);
  }, []);
  const surface = React.useRef<HTMLDivElement>(null);
  const previous = React.useRef(screen);
  useBrowserLayoutEffect(() => {
    const node = surface.current;
    if (!node) return;
    if (screen.visible) node.removeAttribute("inert");
    else node.setAttribute("inert", "");
  }, [screen.visible]);
  useBrowserLayoutEffect(() => {
    if (previous.current !== screen) {
      const event = { display, previous: previous.current, current: screen };
      previous.current = screen;
      store.emitWindowChange(event);
    }
  }, [display, screen, store]);
  const bounds = screen.window;
  return (
    <div
      ref={surface}
      className="duo-display"
      data-duo-display={display}
      data-duo-placement={screen.placement}
      aria-hidden={!screen.visible}
      style={{
        width: screen.size.width,
        height: screen.size.height,
        marginLeft: -screen.size.width / 2,
        marginTop: -screen.size.height / 2,
        transform: `scale(${scale})`,
        visibility: screen.visible && scale > 0 ? "visible" : "hidden",
        borderRadius: screen.cornerRadii.map((radius) => `${radius}px`).join(" "),
      }}
    >
      <div
        className="duo-window"
        ref={attachHost}
        data-duo-window={display}
        style={{
          left: bounds.x,
          top: bounds.y,
          width: bounds.width,
          height: bounds.height,
          borderRadius: screen.windowCornerRadii.map((radius) => `${radius}px`).join(" "),
          ...safeAreaStyle(screen.safeArea),
        }}
      />
      <SystemChrome screen={screen} showIndicators={showSystemUI} />
      {host &&
        createPortal(
          <ScreenContext.Provider value={display}>{children}</ScreenContext.Provider>,
          host,
          display,
        )}
    </div>
  );
}

export const DuoFrame = React.forwardRef<HTMLDivElement, DuoFrameProps>(function DuoFrame(
  {
    inner,
    outer,
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
  const root = React.useRef<HTMLDivElement>(null);
  const [size, setSize] = React.useState({ width: 0, height: 0 });
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
        current.width === width && current.height === height ? current : { width, height },
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
  const scale = resolveZoom(
    effectiveZoom,
    size,
    { width: active.size.width + 24, height: active.size.height + 24 },
    fitPadding,
  );
  return (
    <div
      {...props}
      ref={root}
      className={["duo-frame", className].filter(Boolean).join(" ")}
      style={style}
    >
      <DisplaySurface display="inner" scale={scale} showSystemUI={showSystemUI}>
        {inner}
      </DisplaySurface>
      <DisplaySurface display="outer" scale={scale} showSystemUI={showSystemUI}>
        {outer}
      </DisplaySurface>
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
