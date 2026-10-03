import * as React from "react";
import { chooseIndicatorStyle } from "./indicator-contrast";
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
      let clonedFrame: Element | undefined;
      try {
        const { default: render } = await import("html2canvas");
        if (stopped) return;
        const bounds = surface.getBoundingClientRect();
        if (!bounds.width || !bounds.height) return;
        const areas = controls.map((key) => {
          const active = key === "home" ? autoHome : autoStatus;
          return active ? targets[key].current?.getBoundingClientRect() : undefined;
        });
        const canvas = await render(surface, {
          backgroundColor: null,
          scale: 0.5,
          logging: false,
          useCORS: true,
          imageTimeout: 1000,
          ignoreElements: (element) => element.classList.contains("duo-system"),
          onclone: (document) => {
            clonedFrame = document.defaultView?.frameElement ?? undefined;
          },
        });
        if (stopped) return;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) return;
        const samples = areas.map((area) => {
          if (!area) return;
          const x = Math.max(
            0,
            Math.floor(((area.left - bounds.left) / bounds.width) * canvas.width),
          );
          const y = Math.max(
            0,
            Math.floor(((area.top - bounds.top) / bounds.height) * canvas.height),
          );
          const right = Math.min(
            canvas.width,
            Math.ceil(((area.right - bounds.left) / bounds.width) * canvas.width),
          );
          const bottom = Math.min(
            canvas.height,
            Math.ceil(((area.bottom - bounds.top) / bounds.height) * canvas.height),
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
        clonedFrame?.remove();
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
    // Canvas/video frames and stylesheet-driven animations need periodic refreshes.
    const refresh = window.setInterval(schedule, 500);
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
