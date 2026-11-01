import React from 'react'
import { useBrowserLayoutEffect } from '../shared/use-browser-layout-effect'
import type { RendererSurfaceProps } from './types'

export function DomSurface({ renderer, width, height, children }: RendererSurfaceProps) {
  const source = React.useRef<HTMLDivElement>(null)
  useBrowserLayoutEffect(() => {
    renderer.connect(source.current!)
    return () => renderer.disconnect()
  }, [renderer])
  return (
    <div
      ref={source}
      className="duo-react-content"
      data-duo-react-content-rendering="dom"
      style={{ width, height }}
    >
      {children}
    </div>
  )
}
