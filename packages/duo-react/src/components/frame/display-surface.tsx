import { BackdropStore, HtmlInCanvasRenderer, supportsHtmlInCanvas } from '@private/browser'
import { orientationRotation } from '@private/core'
import { type DuoDisplay, frameBezel } from '@private/profiles'
import React from 'react'
import { BackdropContext } from '../../backdrop/backdrop-context'
import { useDuoState } from '../../context/hooks'
import { RenderingContext } from '../../context/rendering-context'
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
  const chrome = React.useRef<HTMLDivElement>(null)
  const { renderer } = React.useContext(RenderingContext)
  useBrowserLayoutEffect(() => {
    backdrop.updateScreen({ size: screen.size, visible: screen.visible })
  }, [backdrop, screen, colorMode])
  useBrowserLayoutEffect(() => {
    const screen = source.current!
    const display = screen.parentElement!
    const fallback = () => {
      display.dataset.duoReactRenderer = 'dom'
      backdrop.connect(screen, '.duo-react-chrome, .duo-react-system')
    }
    let native: HtmlInCanvasRenderer | undefined
    if (renderer !== 'dom' && supportsHtmlInCanvas()) {
      try {
        native = new HtmlInCanvasRenderer(
          screen,
          chrome.current!,
          display.querySelector<HTMLElement>('.duo-react-system')!,
          backdrop,
          fallback,
        )
        display.dataset.duoReactRenderer = 'html-in-canvas'
      } catch {
        fallback()
      }
    } else fallback()
    return () => {
      native?.dispose()
      backdrop.disconnect()
      delete display.dataset.duoReactRenderer
    }
  }, [backdrop, renderer])
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
          visibility: screen.visible && scale > 0 ? 'visible' : 'hidden',
          borderRadius: screen.cornerRadii.map((radius) => `${radius}px`).join(' '),
          boxShadow:
            display === 'inner'
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
          <div className="duo-react-chrome" ref={chrome}>
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
        </div>
        <SystemUI screen={screen} showIndicators={showSystemUI} scale={scale} />
      </div>
    </BackdropContext.Provider>
  )
}
