import * as React from "react"

export const DuoSafeArea = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function DuoSafeArea({ style, ...props }, ref) {
    return (
      <div
        {...props}
        ref={ref}
        style={{
          boxSizing: "border-box",
          paddingTop: "var(--duo-react-safe-area-inset-top, 0px)",
          paddingRight: "var(--duo-react-safe-area-inset-right, 0px)",
          paddingBottom: "var(--duo-react-safe-area-inset-bottom, 0px)",
          paddingLeft: "var(--duo-react-safe-area-inset-left, 0px)",
          ...style,
        }}
      />
    )
  },
)
