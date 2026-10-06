import { getAccessoryLayout } from '@private/core'
import React from 'react'
import ReactDOM from 'react-dom'
import { useAccessoryHost } from '../../screen/accessory-context'
import { useDuoScreen } from '../../screen/screen-context'

export type DuoToolbarProps = React.HTMLAttributes<HTMLDivElement>

export const DuoToolbar = React.forwardRef<HTMLDivElement, DuoToolbarProps>(function DuoToolbar(
  { className, ...props },
  ref,
) {
  const host = useAccessoryHost()
  const screen = useDuoScreen()
  const { side, toolbarEndInset, ...bounds } = getAccessoryLayout(screen)
  if (!host) return null
  return ReactDOM.createPortal(
    <div
      className="duo-react-accessory-layout"
      data-duo-react-bar-axis={side === 'horizontal' ? 'horizontal' : 'vertical'}
      style={bounds}
    >
      <div className="duo-react-accessory-toolbar" style={{ marginRight: toolbarEndInset }}>
        <div
          {...props}
          ref={ref}
          className={['duo-react-toolbar', className].filter(Boolean).join(' ')}
          data-duo-react-bar="toolbar"
          data-duo-react-bar-placement={side === 'horizontal' ? 'top' : side}
        />
      </div>
    </div>,
    host,
  )
})
