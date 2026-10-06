import { type DuoColorMode, useDuoState } from 'duo-react'
import type * as React from 'react'

function foregroundColor(background: string) {
  const channels = background
    .slice(1)
    .match(/.{2}/g)!
    .map((channel) => {
      const value = parseInt(channel, 16) / 255
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
    })
  const luminance = channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
  return luminance > 0.179 ? '#000000' : '#ffffff'
}

export function PreviewFrame({
  backgrounds,
  children,
}: {
  backgrounds: Record<DuoColorMode, string>
  children: React.ReactNode
}) {
  const colorMode = useDuoState((state) => state.system.colorMode)
  const background = backgrounds[colorMode]
  return (
    <div
      className="playground-frame absolute inset-0"
      style={
        {
          '--playground-background': background,
          '--playground-color': foregroundColor(background),
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  )
}
