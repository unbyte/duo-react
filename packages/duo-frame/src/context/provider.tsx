import * as React from "react"
import { createDuoStore } from "../core/store"
import type { DuoDefaults, DuoSystemOptions } from "../core/types"
import { useBrowserLayoutEffect } from "../hooks/use-browser-layout-effect"
import { StoreContext } from "./store-context"

export interface DuoProviderProps {
  children?: React.ReactNode
  defaultState?: DuoDefaults
  defaultSystem?: DuoSystemOptions
  outerPortraitLocked?: boolean
}

export function DuoProvider({
  children,
  defaultState,
  defaultSystem,
  outerPortraitLocked = false,
}: DuoProviderProps): React.ReactElement {
  const [store] = React.useState(() =>
    createDuoStore(defaultState, defaultSystem, outerPortraitLocked),
  )
  useBrowserLayoutEffect(() => {
    store.configureOuterPortraitLock(outerPortraitLocked)
  }, [store, outerPortraitLocked])
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}
