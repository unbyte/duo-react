import React from 'react'

export function useLensMotion(target: number, expanded: boolean, reducedMotion: boolean) {
  const current = React.useRef({
    x: target,
    growth: 0,
    velocity: 0,
    acceleration: 0,
    deformation: 0,
    deformationVelocity: 0,
    growthVelocity: 0,
    lastTime: 0,
  })
  const [frame, setFrame] = React.useState({
    x: target,
    growth: 0,
    deformation: 0,
  })
  React.useEffect(() => {
    if (reducedMotion) {
      Object.assign(current.current, {
        x: target,
        growth: expanded ? 1 : 0,
        velocity: 0,
        acceleration: 0,
        deformation: 0,
        deformationVelocity: 0,
        growthVelocity: 0,
        lastTime: 0,
      })
      return
    }
    let request = 0
    const tick = (now: number) => {
      const state = current.current
      // Pointer updates can restart this effect between frames. Preserve the
      // frame clock so frequent events do not slow the deformation response.
      const delta = state.lastTime ? Math.min((now - state.lastTime) / 1000, 0.032) : 1 / 60
      state.lastTime = now
      const steps = 3
      for (let i = 0; i < steps; i++) {
        const dt = delta / steps
        const stiffness = 620
        const damping = 43
        state.acceleration = (target - state.x) * stiffness - state.velocity * damping
        state.velocity += state.acceleration * dt
        state.x += state.velocity * dt
        // Acceleration along travel stretches the lens; braking briefly
        // compresses it. A separate damped response smooths pointer impulses.
        const alongTravel = state.acceleration * Math.sign(state.velocity)
        const impulse = Math.min(1, Math.max(0, Math.abs(alongTravel) - 400) / 11600)
        const deformationTarget = impulse * (alongTravel >= 0 ? 60 : -30)
        state.deformationVelocity +=
          ((deformationTarget - state.deformation) * 900 - state.deformationVelocity * 42) * dt
        state.deformation += state.deformationVelocity * dt
        state.growthVelocity +=
          (((expanded ? 1 : 0) - state.growth) * 520 - state.growthVelocity * 42) * dt
        state.growth += state.growthVelocity * dt
      }
      const settled =
        Math.abs(target - state.x) < 0.015 &&
        Math.abs(state.velocity) < 0.1 &&
        Math.abs((expanded ? 1 : 0) - state.growth) < 0.002 &&
        Math.abs(state.deformation) < 0.015 &&
        Math.abs(state.deformationVelocity) < 0.1
      if (settled) {
        state.x = target
        state.growth = expanded ? 1 : 0
        state.velocity = 0
        state.acceleration = 0
        state.deformation = 0
        state.deformationVelocity = 0
        state.growthVelocity = 0
        state.lastTime = 0
      }
      setFrame({
        x: state.x,
        growth: state.growth,
        deformation: state.deformation,
      })
      if (!settled) request = requestAnimationFrame(tick)
    }
    request = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(request)
  }, [target, expanded, reducedMotion])
  return reducedMotion ? { x: target, growth: expanded ? 1 : 0, deformation: 0 } : frame
}
