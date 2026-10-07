import type { IndicatorSample } from '@private/browser'
import type { DuoIndicatorStyle } from '@private/core'
import type { DuoRect } from '@private/profiles'
import React from 'react'
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/shim/with-selector'
import { useBackdropStore } from '../../backdrop/backdrop-context'
import { useBackdropRegion } from '../../backdrop/use-backdrop-region'
import { useRenderingMode } from '../../context/rendering-context'
import { useBrowserLayoutEffect } from '../../shared/use-browser-layout-effect'

interface IndicatorContent {
  width: number
  height: number
  appearance: DuoIndicatorStyle
  className: string
  style?: React.CSSProperties
  children: React.ReactNode
  foreground?: React.ReactNode
}

interface IndicatorProps extends IndicatorContent {
  scale: number
  sample: IndicatorSample
  area: DuoRect
}

export function SystemIndicator(props: IndicatorProps) {
  const mode = useRenderingMode('system')
  if (mode === 'enhanced') return <SampledIndicator {...props} />
  return <CssIndicator {...props} />
}

function SampledIndicator(props: IndicatorProps) {
  const { area, sample, appearance } = props
  const store = useBackdropStore()
  useBackdropRegion(() => ({ area, blur: 0, indicator: sample }))
  const resolved = useSyncExternalStoreWithSelector(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
    (snapshot) => (appearance === 'auto' ? snapshot.colors[sample] : appearance),
  )
  return <Indicator {...props} resolved={resolved} />
}

let nextIndicatorId = 0

function CssIndicator(props: IndicatorContent & { scale: number }) {
  const { width, height, appearance, scale, children } = props
  const [id, setId] = React.useState<string>()
  useBrowserLayoutEffect(() => {
    setId(`duo-react-indicator-${nextIndicatorId++}`)
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
  const automatic = appearance === 'auto' && id !== undefined
  return (
    <Indicator
      {...props}
      resolved={appearance === 'auto' ? undefined : appearance}
      automatic={
        automatic ? (
          <>
            <svg width={0} height={0} className="duo-react-indicator-defs" focusable="false">
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
                  style={{ maskType: 'alpha' }}
                >
                  <g transform={`translate(${padding} ${padding})`}>{children}</g>
                </mask>
              </defs>
            </svg>
            <span
              className="duo-react-indicator-auto"
              style={{
                inset: -padding,
                backdropFilter: `url(#${id}-contrast)`,
                WebkitBackdropFilter: `url(#${id}-contrast)`,
                maskImage: `url(#${id}-artwork)`,
                WebkitMaskImage: `url(#${id}-artwork)`,
              }}
            />
          </>
        ) : undefined
      }
    />
  )
}

function Indicator({
  width,
  height,
  appearance,
  className,
  style,
  children,
  foreground,
  resolved,
  automatic,
}: IndicatorContent & {
  resolved?: Exclude<DuoIndicatorStyle, 'auto'>
  automatic?: React.ReactNode
}) {
  return (
    <span
      className={`duo-react-indicator ${className}`}
      data-duo-react-indicator-style={appearance}
      data-duo-react-resolved-style={resolved}
      style={{ width, height, ...style }}
    >
      {automatic}
      <span className="duo-react-indicator-fixed" data-auto={automatic ? true : undefined}>
        {children}
      </span>
      {foreground && <span className="duo-react-indicator-foreground">{foreground}</span>}
    </span>
  )
}
