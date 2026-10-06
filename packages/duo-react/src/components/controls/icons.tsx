/*!
 * @license
 * Control artwork adapted from Lucide Icons, Copyright (c) 2026 Lucide Icons and
 * Contributors. ISC License
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

import type { DuoPlacement } from '@private/profiles'
import React from 'react'

function ControlGlyph({ children }: { children: React.ReactNode }) {
  return (
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
      focusable="false"
    >
      {children}
    </svg>
  )
}

export function DisplayIcon({ inner }: { inner: boolean }) {
  const outline = inner
    ? 'M4.5 5h15A2.5 2.5 0 0 1 22 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-15A2.5 2.5 0 0 1 2 16.5v-9A2.5 2.5 0 0 1 4.5 5Z'
    : 'M5.5 2H15a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4H5.5a.5.5 0 0 1-.5-.5v-19a.5.5 0 0 1 .5-.5Z'
  return (
    <ControlGlyph>
      <path
        d={outline}
        fill="currentColor"
        fillOpacity="0.14"
        stroke="none"
        data-duo-react-icon-tone="secondary"
      />
      <path d={outline} />
      {inner ? (
        <path d="M9.5 16.5h5" strokeWidth="1.25" />
      ) : (
        <circle cx="15.5" cy="5.5" r="0.9" fill="currentColor" stroke="none" />
      )}
    </ControlGlyph>
  )
}

export function LayoutIcon({ placement }: { placement: DuoPlacement }) {
  return (
    <ControlGlyph>
      <rect
        x={placement === 'right' ? 12 : 3}
        y="4"
        width={placement === 'full' ? 18 : 9}
        height="16"
        rx="2"
        fill="currentColor"
        fillOpacity="0.14"
        stroke="none"
        data-duo-react-icon-tone="secondary"
      />
      <rect x="3" y="4" width="18" height="16" rx="2" />
      {placement !== 'full' && <path d="M12 4v16" />}
    </ControlGlyph>
  )
}

export function PartialFoldIcon() {
  const outline =
    'M12 6 4.25 4.28A1 1 0 0 0 3 5.26v11.94a1 1 0 0 0 .78.98L12 20l8.22-1.82a1 1 0 0 0 .78-.98V5.26a1 1 0 0 0-1.25-.98L12 6Z'
  return (
    <ControlGlyph>
      <path
        d={outline}
        fill="currentColor"
        fillOpacity="0.14"
        stroke="none"
        data-duo-react-icon-tone="secondary"
      />
      <path d={outline} />
      <path d="M12 6v14" />
    </ControlGlyph>
  )
}

export function RotateLeftIcon() {
  return (
    <ControlGlyph>
      <path d="M20 9V7a2 2 0 0 0-2-2h-6" />
      <path d="m15 2-3 3 3 3" />
      <path d="M20 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2" />
    </ControlGlyph>
  )
}

export function RotateRightIcon() {
  return (
    <ControlGlyph>
      <path d="M12 5H6a2 2 0 0 0-2 2v3" />
      <path d="m9 8 3-3-3-3" />
      <path d="M4 14v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
    </ControlGlyph>
  )
}

export function FitIcon() {
  return (
    <ControlGlyph>
      <path d="M8 3H5a2 2 0 0 0-2 2v3" />
      <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
      <path d="M3 16v3a2 2 0 0 0 2 2h3" />
      <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
    </ControlGlyph>
  )
}

export function ZoomInIcon() {
  return (
    <ControlGlyph>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" x2="16.65" y1="21" y2="16.65" />
      <line x1="11" x2="11" y1="8" y2="14" />
      <line x1="8" x2="14" y1="11" y2="11" />
    </ControlGlyph>
  )
}

export function ZoomOutIcon() {
  return (
    <ControlGlyph>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" x2="16.65" y1="21" y2="16.65" />
      <line x1="8" x2="14" y1="11" y2="11" />
    </ControlGlyph>
  )
}
