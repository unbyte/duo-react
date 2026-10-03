import * as React from "react";
import { chooseIndicatorStyle } from "./indicator-contrast";
import { createIframeCapture } from "./iframe-capture";
import type { ResolvedIndicatorStyle } from "./indicator-contrast";
import type { DuoScreenInfo } from "./types";

const initialColors = { time: "dark", glyph: "dark", home: "dark" } as const;
const controls = ["time", "glyph", "home"] as const;
type Colors = Record<(typeof controls)[number], ResolvedIndicatorStyle>;

export function useIndicatorContrast(
  chrome: React.RefObject<HTMLDivElement>,
  screen: DuoScreenInfo,
  autoStatus: boolean,
  autoHome: boolean,
) {
  const time = React.useRef<HTMLSpanElement>(null);
  const glyph = React.useRef<HTMLSpanElement>(null);
  const home = React.useRef<HTMLDivElement>(null);
  const [colors, setColors] = React.useState<Colors>(initialColors);

  React.useEffect(() => {
    const surface = chrome.current?.parentElement;
    if (!surface || (!autoStatus && !autoHome)) return;
    const targets = { time, glyph, home };
    let stopped = false;
    let busy = false;
    let dirty = false;
    let timer = 0;
    let lastCapture = 0;
    let invalidate = false;

    const schedule = () => {
      dirty = true;
      if (stopped || busy || timer || document.hidden) return;
      timer = window.setTimeout(capture, Math.max(0, 100 - (performance.now() - lastCapture)));
    };

    const capture = async () => {
      timer = 0;
      if (stopped || document.hidden) return;
      busy = true;
      dirty = false;
      lastCapture = performance.now();
      const refreshStyles = invalidate;
      invalidate = false;
      try {
        const { snapdom } = await import("@zumer/snapdom");
        if (stopped) return;
        const width = surface.offsetWidth;
        const height = surface.offsetHeight;
        if (!width || !height) return;
        // SnapDOM captures local layout; ancestor zoom/rotation must not move the sample.
        const areas = controls.map((key) => {
          const active = key === "home" ? autoHome : autoStatus;
          const target = active ? targets[key].current : undefined;
          if (!target) return;
          let x = 0;
          let y = 0;
          let ancestor: Element | undefined = target;
          while (ancestor instanceof HTMLElement && ancestor !== surface) {
            x += ancestor.offsetLeft;
            y += ancestor.offsetTop;
            ancestor = ancestor.offsetParent ?? undefined;
          }
          if (ancestor !== surface) return;
          return { x, y, width: target.offsetWidth, height: target.offsetHeight };
        });
        const canvas = await snapdom.toCanvas(surface, {
          scale: 0.5,
          dpr: 1,
          exclude: ".duo-system",
          excludeMode: "remove",
          fast: false,
          invalidate: refreshStyles,
          plugins: [createIframeCapture(snapdom)],
        });
        if (stopped) return;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) return;
        const samples = areas.map((area) => {
          if (!area) return;
          const x = Math.max(0, Math.floor((area.x / width) * canvas.width));
          const y = Math.max(0, Math.floor((area.y / height) * canvas.height));
          const right = Math.min(
            canvas.width,
            Math.ceil(((area.x + area.width) / width) * canvas.width),
          );
          const bottom = Math.min(
            canvas.height,
            Math.ceil(((area.y + area.height) / height) * canvas.height),
          );
          return right > x && bottom > y
            ? context.getImageData(x, y, right - x, bottom - y).data
            : undefined;
        });
        setColors((previous) => {
          const next = { ...previous };
          controls.forEach((key, index) => {
            const pixels = samples[index];
            if (pixels) next[key] = chooseIndicatorStyle(pixels, previous[key]);
          });
          return controls.every((key) => next[key] === previous[key]) ? previous : next;
        });
      } catch {
        // Unreadable canvases or unsupported content retain the last valid choice.
      } finally {
        busy = false;
        if (dirty) schedule();
      }
    };

    const observer = new MutationObserver((records) => {
      if (records.some((record) => !chrome.current?.contains(record.target))) schedule();
    });
    observer.observe(surface, {
      attributes: true,
      childList: true,
      characterData: true,
      subtree: true,
    });
    const display = surface.parentElement;
    if (display) observer.observe(display, { attributes: true });
    if (display?.parentElement) observer.observe(display.parentElement, { attributes: true });
    const resize = new ResizeObserver(schedule);
    resize.observe(surface);
    window.addEventListener("scroll", schedule, true);
    window.addEventListener("resize", schedule);
    surface.addEventListener("load", schedule, true);
    document.addEventListener("visibilitychange", schedule);
    // CSSOM edits have no mutation signal; periodically refresh SnapDOM's style cache too.
    const refresh = window.setInterval(() => {
      invalidate = true;
      schedule();
    }, 500);
    schedule();
    return () => {
      stopped = true;
      window.clearTimeout(timer);
      window.clearInterval(refresh);
      observer.disconnect();
      resize.disconnect();
      window.removeEventListener("scroll", schedule, true);
      window.removeEventListener("resize", schedule);
      surface.removeEventListener("load", schedule, true);
      document.removeEventListener("visibilitychange", schedule);
    };
  }, [chrome, screen, autoStatus, autoHome]);

  return { time, glyph, home, colors };
}
