import type * as React from "react";

export type DuoToolbarProps = React.HTMLAttributes<HTMLDivElement>;
export type DuoControlGroupProps = Omit<DuoToolbarProps, "children">;
