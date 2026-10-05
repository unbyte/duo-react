import type * as React from "react"

export type DuoControlsProps = React.HTMLAttributes<HTMLDivElement>
export type DuoControlGroupProps = Omit<DuoControlsProps, "children">
