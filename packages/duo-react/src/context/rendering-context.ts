import React from 'react'

export type DuoRenderingMode = 'enhanced' | 'basic'

export interface DuoRenderingOptions {
  readonly system?: DuoRenderingMode
  readonly tabBar?: DuoRenderingMode
}

export const RenderingContext = React.createContext<Required<DuoRenderingOptions>>({
  system: 'enhanced',
  tabBar: 'enhanced',
})

export function useRenderingMode(control: keyof DuoRenderingOptions, override?: DuoRenderingMode) {
  const rendering = React.useContext(RenderingContext)
  return override ?? rendering[control]
}
