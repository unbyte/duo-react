import React from 'react'
import { useBrowserLayoutEffect } from '../shared/use-browser-layout-effect'
import type { RendererSurfaceProps } from './types'

export function CanvasSurface({ renderer, width, height, children }: RendererSurfaceProps) {
  const source = React.useRef<HTMLDivElement>(null)
  useBrowserLayoutEffect(() => {
    renderer.connect(source.current!)
    return () => renderer.disconnect()
  }, [renderer])
  return (
    <canvas
      {...{ content: 'drawable' }}
      className="duo-react-content-canvas"
      data-duo-react-content-rendering="canvas"
      style={{ width, height }}
    >
      <div
        {...{ drawable: '' }}
        ref={source}
        className="duo-react-content"
        style={{ width, height }}
      >
        {children}
      </div>
    </canvas>
  )
}
