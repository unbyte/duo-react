import * as React from "react";
import type { DuoToolbarProps } from "./types";

export const DuoToolbar = React.forwardRef<HTMLDivElement, DuoToolbarProps>(function DuoToolbar(
  { className, ...props },
  ref,
) {
  return (
    <div
      role="group"
      aria-label="Device preview controls"
      {...props}
      ref={ref}
      className={["duo-toolbar", className].filter(Boolean).join(" ")}
    />
  );
});
