import * as React from "react"

export interface AccessoryHosts {
  tabBar?: HTMLDivElement
  toolbar?: HTMLDivElement
  side: "left" | "right" | "horizontal"
}

export const AccessoryContext = React.createContext<AccessoryHosts | undefined>(undefined)

export function useAccessoryHosts() {
  const hosts = React.useContext(AccessoryContext)
  if (!hosts) throw new Error("DuoTabBar and DuoAppToolbar must be inside DuoFrame's children.")
  return hosts
}
