import type { BackdropRequest } from '@private/browser'
import React from 'react'
import { useBrowserLayoutEffect } from '../shared/use-browser-layout-effect'
import { useBackdropStore } from './backdrop-context'

export function useBackdropRegion(getRequest: () => BackdropRequest) {
  const store = useBackdropStore()
  const [key] = React.useState(() => Symbol())
  useBrowserLayoutEffect(() => {
    store.request(key, getRequest())
  })
  useBrowserLayoutEffect(() => () => store.release(key), [store, key])
  return key
}
