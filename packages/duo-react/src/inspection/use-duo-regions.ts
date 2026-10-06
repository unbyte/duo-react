import { getDuoRegions } from '@private/core'
import React from 'react'
import { useDuoState } from '../context/hooks'

export function useDuoRegions() {
  const screen = useDuoState(
    (state) => state.screens[state.posture === 'closed' ? 'outer' : 'inner'],
  )
  const cameraActive = useDuoState((state) => state.system.cameraActive)
  const posture = useDuoState((state) => state.posture)
  return React.useMemo(
    () => getDuoRegions(screen, cameraActive, posture),
    [screen, cameraActive, posture],
  )
}
