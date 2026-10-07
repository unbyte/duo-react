import { type DuoDefaults, DuoStore, type DuoSystemOptions } from '@private/core'
import React from 'react'
import { useBrowserLayoutEffect } from '../shared/use-browser-layout-effect'
import { type DuoRenderingOptions, RenderingContext } from './rendering-context'
import { StoreContext } from './store-context'

export interface DuoProviderProps {
  children?: React.ReactNode
  defaultState?: DuoDefaults
  defaultSystem?: DuoSystemOptions
  outerPortraitLocked?: boolean
  rendering?: DuoRenderingOptions
}

export function DuoProvider({
  children,
  defaultState,
  defaultSystem,
  outerPortraitLocked = false,
  rendering,
}: DuoProviderProps): React.ReactElement {
  const [store] = React.useState(
    () => new DuoStore(defaultState, defaultSystem, outerPortraitLocked),
  )
  useBrowserLayoutEffect(() => {
    store.configureOuterPortraitLock(outerPortraitLocked)
  }, [store, outerPortraitLocked])
  const system = rendering?.system ?? 'enhanced'
  const tabBar = rendering?.tabBar ?? 'enhanced'
  const modes = React.useMemo(() => ({ system, tabBar }), [system, tabBar])
  return (
    <StoreContext.Provider value={store}>
      <RenderingContext.Provider value={modes}>{children}</RenderingContext.Provider>
    </StoreContext.Provider>
  )
}
