import * as React from "react";
import { useBrowserLayoutEffect } from "./provider";
import { rotationStart } from "./view-controls";

export function useRotation(target: number) {
  const [rotation, setRotation] = React.useState(target);
  const current = React.useRef(target);
  const previousTarget = React.useRef(target);
  useBrowserLayoutEffect(() => {
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const from = rotationStart(current.current, previousTarget.current, target);
    previousTarget.current = target;
    current.current = from;
    const start = performance.now();
    let pending = 0;
    const apply = (value: number) => {
      current.current = value;
      setRotation(value);
    };
    const finish = () => {
      if (!motion.matches) return;
      cancelAnimationFrame(pending);
      apply(target);
    };
    const tick = (now: number) => {
      const progress = Math.max(0, Math.min(1, (now - start) / 240));
      apply(progress === 1 ? target : from + (target - from) * (1 - (1 - progress) ** 3));
      if (progress < 1) pending = requestAnimationFrame(tick);
    };
    if (motion.matches || from === target) apply(target);
    else pending = requestAnimationFrame(tick);
    motion.addEventListener("change", finish);
    return () => {
      cancelAnimationFrame(pending);
      motion.removeEventListener("change", finish);
    };
  }, [target]);
  return rotation;
}
