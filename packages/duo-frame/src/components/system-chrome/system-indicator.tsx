import * as React from "react"
import { useBrowserLayoutEffect } from "../../hooks/use-browser-layout-effect"
import type { DuoIndicatorStyle } from "../../core/types"

let nextIndicatorId = 0

export function SystemIndicator({
  width,
  height,
  appearance,
  scale,
  className,
  style,
  children,
}: {
  width: number
  height: number
  appearance: DuoIndicatorStyle
  scale: number
  className: string
  style?: React.CSSProperties
  children: React.ReactNode
}) {
  const [id, setId] = React.useState<string>()
  useBrowserLayoutEffect(() => {
    setId(`duo-indicator-${nextIndicatorId++}`)
  }, [])
  // Average over a broad neighborhood even for short controls such as the time label.
  const blurX = Math.max(width / 4, 16)
  const blurY = Math.max(height / 4, 16)
  // Leave room for three standard deviations around the center sample.
  const padding = Math.ceil(Math.max(16, blurX * 3 - width / 2, blurY * 3 - height / 2))
  const filterWidth = width + padding * 2
  const filterHeight = height + padding * 2
  // Keep the center patch rasterizable when the frame is scaled down.
  const sampleSize = Math.min(width, height, 2 / scale)
  const automatic = appearance === "auto" && id !== undefined
  return (
    <span
      className={`duo-indicator ${className}`}
      data-duo-indicator-style={appearance}
      data-duo-resolved-style={appearance === "auto" ? undefined : appearance}
      style={{ width, height, ...style }}
    >
      {automatic && (
        <>
          <svg width={0} height={0} className="duo-indicator-defs" focusable="false">
            <defs>
              <filter
                id={`${id}-contrast`}
                x="0"
                y="0"
                width="100%"
                height="100%"
                primitiveUnits="objectBoundingBox"
                colorInterpolationFilters="linearRGB"
              >
                <feGaussianBlur
                  in="SourceGraphic"
                  stdDeviation={`${blurX / filterWidth} ${blurY / filterHeight}`}
                  result="blur"
                />
                <feFlood
                  x={(filterWidth - sampleSize) / 2 / filterWidth}
                  y={(filterHeight - sampleSize) / 2 / filterHeight}
                  width={sampleSize / filterWidth}
                  height={sampleSize / filterHeight}
                />
                <feComposite width={1} height={1} />
                <feTile result="sample" />
                <feComposite in="blur" in2="sample" operator="in" />
                <feMorphology operator="dilate" radius={1} />
                {/* Discrete transfer switches at 0.5; the bias puts luminance cutoff at 0.18. */}
                <feColorMatrix
                  type="matrix"
                  values="0.2126 0.7152 0.0722 0 0.32 0.2126 0.7152 0.0722 0 0.32 0.2126 0.7152 0.0722 0 0.32 0 0 0 0 1"
                />
                <feComponentTransfer>
                  <feFuncR type="discrete" tableValues="1 0" />
                  <feFuncG type="discrete" tableValues="1 0" />
                  <feFuncB type="discrete" tableValues="1 0" />
                </feComponentTransfer>
              </filter>
              <mask
                id={`${id}-artwork`}
                maskUnits="userSpaceOnUse"
                x={0}
                y={0}
                width={filterWidth}
                height={filterHeight}
                style={{ maskType: "alpha" }}
              >
                <g transform={`translate(${padding} ${padding})`}>{children}</g>
              </mask>
            </defs>
          </svg>
          <span
            className="duo-indicator-auto"
            style={{
              inset: -padding,
              backdropFilter: `url(#${id}-contrast)`,
              WebkitBackdropFilter: `url(#${id}-contrast)`,
              maskImage: `url(#${id}-artwork)`,
              WebkitMaskImage: `url(#${id}-artwork)`,
            }}
          />
        </>
      )}
      <span className="duo-indicator-fixed" data-auto={automatic || undefined}>
        {children}
      </span>
    </span>
  )
}
