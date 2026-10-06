import * as React from "react"
import { BackdropStore } from "@duo-react/browser"
import { BackdropContext } from "../../backdrop/backdrop-context"
import { useBrowserLayoutEffect } from "../../shared/use-browser-layout-effect"
import { AccessoryContext } from "../../screen/accessory-context"
import { useDuoState } from "../../context/hooks"
import { ScreenContext } from "../../screen/screen-context"
import { orientationRotation } from "@duo-react/core"
import { safeAreaStyle } from "../../screen/safe-area"
import { type DuoDisplay, frameBezel } from "@duo-react/profiles"
import { SystemUI, SystemMaterial } from "../system/system"
import { Hardware } from "./hardware"

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
  const colorMode = useDuoState((state) => state.system.colorMode)
  const [backdrop] = React.useState(() => new BackdropStore())
  const source = React.useRef<HTMLDivElement>(null)
  useBrowserLayoutEffect(() => {
    backdrop.updateScreen({ size: screen.size, visible: screen.visible })
  }, [backdrop, screen, colorMode])
  React.useEffect(() => {
    backdrop.connect(
      source.current!,
      ".duo-react-accessory-window, .duo-react-status-material, .duo-react-system",
    )
    return () => backdrop.disconnect()
  }, [backdrop])
  const [barHost, setBarHost] = React.useState<HTMLDivElement>()
  const attachBarHost = React.useCallback(
    (node: HTMLDivElement | null) => setBarHost(node ?? undefined),
    [],
  )
  const accessoryHost = React.useMemo(() => ({ node: barHost }), [barHost])
  const bounds = screen.window
  return (
    <BackdropContext.Provider value={backdrop}>
      <div
        className="duo-react-display"
        data-duo-react-display={display}
        data-duo-react-color-mode={colorMode}
        data-duo-react-placement={screen.placement}
        aria-hidden={!screen.visible}
        style={{
          colorScheme: colorMode,
          width: screen.size.width,
          height: screen.size.height,
          marginLeft: -screen.size.width / 2,
          marginTop: -screen.size.height / 2,
          transform: `scale(${scale}) rotate(${-orientationRotation[screen.orientation]}deg)`,
          visibility: screen.visible && scale > 0 ? "visible" : "hidden",
          borderRadius: screen.cornerRadii.map((radius) => `${radius}px`).join(" "),
          boxShadow:
            display === "inner"
              ? `0 0 0 ${frameBezel.inner - 2}px var(--duo-react-bezel-color), 0 0 0 ${frameBezel.inner}px var(--duo-react-rim-color)`
              : undefined,
        }}
      >
        <Hardware display={display} orientation={screen.orientation} />
        <div className="duo-react-screen" ref={source}>
          <div
            className="duo-react-window"
            data-duo-react-window={display}
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
              <AccessoryContext.Provider value={accessoryHost}>
                {children}
              </AccessoryContext.Provider>
            </ScreenContext.Provider>
          </div>
          <div
            className="duo-react-accessory-window"
            data-duo-react-accessory-host=""
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
        <SystemUI screen={screen} showIndicators={showSystemUI} />
      </div>
    </BackdropContext.Provider>
  )
}
