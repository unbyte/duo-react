import * as React from "react"
import { useBackdropStore } from "../context/backdrop-context"
import { useBrowserLayoutEffect } from "../hooks/use-browser-layout-effect"
import type { BackdropRequest } from "./store"

export function useBackdropRegion(getRequest: () => BackdropRequest) {
  const store = useBackdropStore()
  const [key] = React.useState(() => Symbol())
  useBrowserLayoutEffect(() => {
    store.request(key, getRequest())
  })
  useBrowserLayoutEffect(() => () => store.release(key), [store, key])
  return key
}
