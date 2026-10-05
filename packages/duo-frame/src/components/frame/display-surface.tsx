import * as React from "react"
import { AccessoryContext } from "../../context/accessory-context"
import { useDuoState } from "../../context/hooks"
import { ScreenContext } from "../../context/screen-context"
import { orientationRotation } from "../../core/rotation"
import { safeAreaStyle } from "../../core/safe-area"
import type { DuoDisplay } from "../../core/types"
import { SystemChrome, SystemMaterial } from "../system-chrome/system-chrome"
import { frameBezel, Hardware } from "./hardware"

export function DisplaySurface({
  display,
  children,
  scale,
  showSystemUI,
}: {
  display: DuoDisplay
  children: React.ReactNode
  scale: number
  showSystemUI: boolean
}) {
  const screen = useDuoState((state) => state.screens[display])
  const [barHost, setBarHost] = React.useState<HTMLDivElement>()
  const attachBarHost = React.useCallback(
    (node: HTMLDivElement | null) => setBarHost(node ?? undefined),
    [],
  )
  const accessoryHost = React.useMemo(() => ({ node: barHost }), [barHost])
  const bounds = screen.window
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
            <AccessoryContext.Provider value={accessoryHost}>{children}</AccessoryContext.Provider>
          </ScreenContext.Provider>
        </div>
        <div
          className="duo-accessory-window"
          data-duo-accessory-host=""
          ref={attachBarHost}
          style={{
            left: bounds.x,
            top: bounds.y,
            width: bounds.width,
            height: bounds.height,
            borderRadius: screen.windowCornerRadii.map((radius) => `${radius}px`).join(" "),
            ...safeAreaStyle(screen.safeArea),
          }}
        />
        {showSystemUI && screen.statusBarVisible && <SystemMaterial screen={screen} />}
      </div>
      <SystemChrome screen={screen} showIndicators={showSystemUI} scale={scale} />
    </div>
  )
}
