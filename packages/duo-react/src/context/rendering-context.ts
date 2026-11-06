import React from 'react'

export type DuoRenderer = 'auto' | 'dom' | 'html-in-canvas'

export type DuoRenderingMode = 'enhanced' | 'basic'

export interface DuoRenderingOptions {
  readonly renderer?: DuoRenderer
  readonly system?: DuoRenderingMode
  readonly tabBar?: DuoRenderingMode
}

export const RenderingContext = React.createContext<Required<DuoRenderingOptions>>({
  renderer: 'auto',
  system: 'enhanced',
  tabBar: 'enhanced',
})

export function useRenderingMode(control: 'system' | 'tabBar', override?: DuoRenderingMode) {
  const rendering = React.useContext(RenderingContext)
  return override ?? rendering[control]
}
