import React from 'react'

export const useBrowserLayoutEffect =
  typeof document === 'undefined' ? React.useEffect : React.useLayoutEffect
