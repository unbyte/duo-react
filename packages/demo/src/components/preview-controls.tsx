import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import {
  DuoControls,
  DuoDisplayControls,
  DuoRotationControls,
  DuoZoomControls,
  useDuoActions,
  useDuoState,
} from "duo-frame"

const previewControls =
  "pointer-events-none absolute left-(--demo-sidebar-space) right-(--demo-inspector-space) bottom-[calc(var(--demo-bottom-space)+max(16px,env(safe-area-inset-bottom)))] z-2 flex flex-wrap justify-center gap-1.5 bg-transparent px-2 py-1 transition-[left,right] duration-220 ease-[ease] motion-reduce:transition-none"
const previewControlGroup =
  "pointer-events-auto flex gap-0.5 rounded-full border border-[#d8dfe7] bg-white/90 p-[3px] shadow-[0_3px_12px_#18283b0a,0_12px_28px_#18283b0a] backdrop-blur-[16px]"

function PlacementControls() {
  const state = useDuoState((value) => value)
  const { setInnerPlacement } = useDuoActions()
  return (
    <div
      role="group"
      aria-label="Inner layout"
      aria-hidden={state.posture === "closed"}
      data-duo-control-group="layout"
      className={`demo-control-group ${previewControlGroup}`}
    >
      {(["left", "full", "right"] as const).map((placement) => (
        <button
          key={placement}
          type="button"
          aria-label={
            placement === "full"
              ? "Full width"
              : `${placement === "left" ? "Left" : "Right"} layout`
          }
          data-duo-action={`layout-${placement}`}
          aria-pressed={state.innerPlacement === placement}
          disabled={
            state.posture === "closed" ||
            (placement !== "full" && state.screens.inner.orientation.startsWith("portrait"))
          }
          onClick={() => setInnerPlacement(placement)}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect
              x={placement === "right" ? 12 : 3}
              y="4"
              width={placement === "full" ? 18 : 9}
              height="16"
              rx="2"
              fill="currentColor"
              fillOpacity="0.14"
              stroke="none"
            />
            <rect x="3" y="4" width="18" height="16" rx="2" />
            {placement !== "full" && <path d="M12 4v16" />}
          </svg>
        </button>
      ))}
    </div>
  )
}

export function PreviewControls() {
  const showPlacement = useDuoState((state) => state.posture !== "closed")
  const reducedMotion = useReducedMotion()
  const layout = reducedMotion ? false : "position"
  const transition = { duration: reducedMotion ? 0 : 0.2, ease: "easeOut" } as const

  return (
    <DuoControls className={`demo-preview-controls ${previewControls}`}>
      <AnimatePresence initial={false} mode="popLayout">
        <motion.div
          key="posture"
          layout={layout}
          transition={transition}
          className="demo-animated-control shrink-0"
        >
          <DuoDisplayControls className={`demo-control-group ${previewControlGroup}`} />
        </motion.div>
        <motion.div
          key="rotation"
          layout={layout}
          transition={transition}
          className="demo-animated-control shrink-0"
        >
          <DuoRotationControls className={`demo-control-group ${previewControlGroup}`} />
        </motion.div>
        {showPlacement && (
          <motion.div
            key="placement"
            layout={layout}
            initial={{ opacity: 0, y: reducedMotion ? 0 : 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reducedMotion ? 0 : 6 }}
            transition={transition}
            className="demo-animated-control demo-placement-controls shrink-0"
          >
            <PlacementControls />
          </motion.div>
        )}
        <motion.div
          key="zoom"
          layout={layout}
          transition={transition}
          className="demo-animated-control shrink-0"
        >
          <DuoZoomControls className={`demo-control-group ${previewControlGroup}`} />
        </motion.div>
      </AnimatePresence>
    </DuoControls>
  )
}
