import * as React from "react"
import type { DuoStore } from "@duo-react/core"

export const StoreContext = React.createContext<DuoStore | undefined>(undefined)
