import type { BackdropSource } from '@private/browser'
import React from 'react'

export const BackdropContext = React.createContext<BackdropSource | undefined>(undefined)
export function useBackdropStore() {
  const store = React.useContext(BackdropContext)
  if (!store) throw new Error('Backdrop consumers must be inside DuoFrame.')
  return store
}
