import * as React from "react"
import { useBackdropStore } from "./backdrop-context"
import { useBrowserLayoutEffect } from "../shared/use-browser-layout-effect"
import type { BackdropRequest } from "@duo-react/browser"

export function useBackdropRegion(getRequest: () => BackdropRequest) {
  const store = useBackdropStore()
  const [key] = React.useState(() => Symbol())
  useBrowserLayoutEffect(() => {
    store.request(key, getRequest())
  })
  useBrowserLayoutEffect(() => () => store.release(key), [store, key])
  return key
}
