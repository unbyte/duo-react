import * as React from "react"
import { useSyncExternalStoreWithSelector } from "use-sync-external-store/shim/with-selector"
import type { DuoState, DuoWindowChange } from "@duo-react/core"
import { useBrowserLayoutEffect } from "../shared/use-browser-layout-effect"
import { StoreContext } from "./store-context"

export function useDuoStore() {
  const store = React.useContext(StoreContext)
  if (!store) throw new Error("Duo components and hooks must be inside a DuoProvider.")
  return store
}

export function useDuoState<Value>(
  selector: (state: DuoState) => Value,
  isEqual: (left: Value, right: Value) => boolean = Object.is,
) {
  const store = useDuoStore()
  return useSyncExternalStoreWithSelector(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
    selector,
    isEqual,
  )
}

export function useDuoActions() {
  return useDuoStore().actions
}

export function useDuoEvent(type: "windowchange", handler: (event: DuoWindowChange) => void) {
  const store = useDuoStore()
  const latest = React.useRef(handler)
  useBrowserLayoutEffect(() => {
    latest.current = handler
  }, [handler])
  React.useEffect(() => store.subscribeWindow((event) => latest.current(event)), [store, type])
}
