import type { DuoDisplay } from '@private/profiles'
import React from 'react'
import { useDuoState } from '../context/hooks'

export const ScreenContext = React.createContext<DuoDisplay | undefined>(undefined)

export function useDuoScreen() {
  const display = React.useContext(ScreenContext)
  if (!display) throw new Error("useDuoScreen must be used within DuoFrame's children.")
  return useDuoState((state) => state.screens[display])
}
