import * as React from "react";
import { AccessoryContext } from "../../context/accessory-context";
import { useDuoState } from "../../context/hooks";
import { ScreenContext } from "../../context/screen-context";
import { getAccessoryLayout } from "../../core/layout/accessories";
import { orientationRotation } from "../../core/rotation";
import { safeAreaStyle } from "../../core/safe-area";
import type { DuoDisplay } from "../../core/types";
import { SystemChrome, SystemMaterial } from "../system-chrome/system-chrome";
import { frameBezel, Hardware } from "./hardware";

export function DisplaySurface({
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
  const [tabBar, setTabBar] = React.useState<HTMLDivElement>();
  const [toolbar, setToolbar] = React.useState<HTMLDivElement>();
  const attachTabBar = React.useCallback(
    (node: HTMLDivElement | null) => setTabBar(node ?? undefined),
    [],
  );
  const attachToolbar = React.useCallback(
    (node: HTMLDivElement | null) => setToolbar(node ?? undefined),
    [],
  );
  const { side, ...accessoryBounds } = React.useMemo(() => getAccessoryLayout(screen), [screen]);
  const accessoryHosts = React.useMemo(() => ({ tabBar, toolbar, side }), [tabBar, toolbar, side]);
  const bounds = screen.window;
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
            <AccessoryContext.Provider value={accessoryHosts}>{children}</AccessoryContext.Provider>
          </ScreenContext.Provider>
        </div>
        <div
          className="duo-accessory-window"
          style={{
            left: bounds.x,
            top: bounds.y,
            width: bounds.width,
            height: bounds.height,
            borderRadius: screen.windowCornerRadii.map((radius) => `${radius}px`).join(" "),
            ...safeAreaStyle(screen.safeArea),
          }}
        >
          <div
            className="duo-accessory-layout"
            data-duo-bar-axis={side === "horizontal" ? "horizontal" : "vertical"}
            style={accessoryBounds}
          >
            <div
              className="duo-accessory-host"
              data-duo-accessory-host="toolbar"
              ref={attachToolbar}
            />
            <div className="duo-accessory-host" data-duo-accessory-host="tab" ref={attachTabBar} />
          </div>
        </div>
        {showSystemUI && screen.statusBarVisible && <SystemMaterial screen={screen} />}
      </div>
      <SystemChrome screen={screen} showIndicators={showSystemUI} scale={scale} />
    </div>
  );
}
