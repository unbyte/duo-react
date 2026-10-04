import * as React from "react"
import type { DuoStore } from "../core/store"

export const StoreContext = React.createContext<DuoStore | undefined>(undefined)
