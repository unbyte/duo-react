import { CanvasRenderer, DomRenderer, supportsCanvasRenderer } from '@private/browser'
import React from 'react'
import { useBrowserLayoutEffect } from '../shared/use-browser-layout-effect'
import { CanvasSurface } from './canvas-surface'
import { DomSurface } from './dom-surface'
import type { DuoRenderer } from './types'

export function useRenderer(selection: DuoRenderer) {
  const [supported, setSupported] = React.useState(false)
  // React 16's external-store shim cannot provide a distinct hydration snapshot.
  useBrowserLayoutEffect(() => setSupported(supportsCanvasRenderer()), [])
  const [failed, setFailed] = React.useState(false)
  useBrowserLayoutEffect(() => setFailed(false), [selection])
  const onError = React.useCallback((error: unknown) => {
    console.warn('DuoFrame: native canvas rendering failed; using DOM rendering.', error)
    setFailed(true)
  }, [])
  const native = selection !== 'dom' && supported && !failed
  return React.useMemo(() => {
    if (native)
      return {
        renderer: new CanvasRenderer(onError),
        Surface: CanvasSurface,
      }
    return { renderer: new DomRenderer(), Surface: DomSurface }
  }, [native, onError])
}
