import * as React from "react"
import { useDuoState } from "../context/hooks"
import type { DuoDisplay } from "@duo-react/profiles"

export const ScreenContext = React.createContext<DuoDisplay | undefined>(undefined)

export function useDuoScreen() {
  const display = React.useContext(ScreenContext)
  if (!display) throw new Error("useDuoScreen must be used within DuoFrame's children.")
  return useDuoState((state) => state.screens[display])
}
