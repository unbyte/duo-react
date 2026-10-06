import type { DuoStore } from '@private/core'
import React from 'react'

export const StoreContext = React.createContext<DuoStore | undefined>(undefined)
