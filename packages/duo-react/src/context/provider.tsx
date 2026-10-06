import * as React from "react"
import { DuoStore, type DuoDefaults, type DuoSystemOptions } from "@duo-react/core"
import { useBrowserLayoutEffect } from "../shared/use-browser-layout-effect"
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
  const [store] = React.useState(
    () => new DuoStore(defaultState, defaultSystem, outerPortraitLocked),
  )
  useBrowserLayoutEffect(() => {
    store.configureOuterPortraitLock(outerPortraitLocked)
  }, [store, outerPortraitLocked])
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}
