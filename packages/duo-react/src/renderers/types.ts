import type { ContentRenderer } from '@private/browser'
import type React from 'react'

export type DuoRenderer = 'auto' | 'canvas' | 'dom'

export interface RendererSurfaceProps {
  renderer: ContentRenderer
  width: number
  height: number
  children: React.ReactNode
}
