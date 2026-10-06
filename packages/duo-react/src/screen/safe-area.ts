import type { DuoInsets } from '@private/profiles'

export function safeAreaStyle(insets: DuoInsets) {
  return {
    '--duo-react-safe-area-inset-top': `${insets.top}px`,
    '--duo-react-safe-area-inset-right': `${insets.right}px`,
    '--duo-react-safe-area-inset-bottom': `${insets.bottom}px`,
    '--duo-react-safe-area-inset-left': `${insets.left}px`,
  }
}
