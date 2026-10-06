import * as React from "react"
import type { BackdropStore } from "../backdrop/store"

export const BackdropContext = React.createContext<BackdropStore | undefined>(undefined)
export function useBackdropStore() {
  const store = React.useContext(BackdropContext)
  if (!store) throw new Error("Backdrop consumers must be inside DuoFrame.")
  return store
}
