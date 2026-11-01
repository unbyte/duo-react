import { orientationRotation } from '@private/core'
import { type DuoDisplay, frameBezel } from '@private/profiles'
import React from 'react'
import { BackdropContext } from '../../backdrop/backdrop-context'
import { useDuoState } from '../../context/hooks'
import type { DuoRenderer } from '../../renderers/types'
import { useRenderer } from '../../renderers/use-renderer'
import { AccessoryContext } from '../../screen/accessory-context'
import { safeAreaStyle } from '../../screen/safe-area'
import { ScreenContext } from '../../screen/screen-context'
import { useBrowserLayoutEffect } from '../../shared/use-browser-layout-effect'
import { SystemMaterial, SystemUI } from '../system/system'
import { Hardware } from './hardware'

export function DisplaySurface({
  display,
  children,
  scale,
  showSystemUI,
  renderer,
}: {
  display: DuoDisplay
  children: React.ReactNode
  scale: number
  showSystemUI: boolean
  renderer: DuoRenderer
}) {
  const screen = useDuoState((state) => state.screens[display])
  const colorMode = useDuoState((state) => state.system.colorMode)
  const { renderer: contentRenderer, Surface } = useRenderer(renderer)
  useBrowserLayoutEffect(() => {
    contentRenderer.updateScreen({ size: screen.size, visible: screen.visible && scale > 0, scale })
  }, [contentRenderer, screen, colorMode, scale])
  const [barHost, setBarHost] = React.useState<HTMLDivElement>()
  const attachBarHost = React.useCallback(
    (node: HTMLDivElement | null) => setBarHost(node ?? undefined),
    [],
  )
  const accessoryHost = React.useMemo(() => ({ node: barHost }), [barHost])
  const bounds = screen.window
  return (
    <BackdropContext.Provider value={contentRenderer.backdrop}>
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
          visibility: screen.visible && scale > 0 ? 'visible' : 'hidden',
          borderRadius: screen.cornerRadii.map((radius) => `${radius}px`).join(' '),
          boxShadow:
            display === 'inner'
              ? `0 0 0 ${frameBezel.inner - 2}px var(--duo-react-bezel-color), 0 0 0 ${frameBezel.inner}px var(--duo-react-rim-color)`
              : undefined,
        }}
      >
        <Hardware display={display} orientation={screen.orientation} />
        <div className="duo-react-screen">
          <Surface renderer={contentRenderer} width={screen.size.width} height={screen.size.height}>
            <div
              className="duo-react-window"
              data-duo-react-window={display}
              style={{
                left: bounds.x,
                top: bounds.y,
                width: bounds.width,
                height: bounds.height,
                borderRadius: screen.windowCornerRadii.map((radius) => `${radius}px`).join(' '),
                ...safeAreaStyle(screen.safeArea),
              }}
            >
              <ScreenContext.Provider value={display}>
                <AccessoryContext.Provider value={accessoryHost}>
                  {children}
                </AccessoryContext.Provider>
              </ScreenContext.Provider>
            </div>
          </Surface>
          <div
            className="duo-react-accessory-window"
            data-duo-react-accessory-host=""
            ref={attachBarHost}
            style={{
              left: bounds.x,
              top: bounds.y,
              width: bounds.width,
              height: bounds.height,
              borderRadius: screen.windowCornerRadii.map((radius) => `${radius}px`).join(' '),
              ...safeAreaStyle(screen.safeArea),
            }}
          />
          {showSystemUI && screen.statusBarVisible && <SystemMaterial screen={screen} />}
        </div>
        <SystemUI screen={screen} showIndicators={showSystemUI} scale={scale} />
      </div>
    </BackdropContext.Provider>
  )
}
