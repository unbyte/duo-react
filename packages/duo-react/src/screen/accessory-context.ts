import React from 'react'

interface AccessoryHost {
  node?: HTMLDivElement
}

export const AccessoryContext = React.createContext<AccessoryHost | undefined>(undefined)

export function useAccessoryHost() {
  const host = React.useContext(AccessoryContext)
  if (!host) throw new Error("DuoTabBar and DuoToolbar must be inside DuoFrame's children.")
  return host.node
}
