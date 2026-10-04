import type { DuoInsets } from "./types"

export function safeAreaStyle(insets: DuoInsets) {
  return {
    "--duo-safe-area-inset-top": `${insets.top}px`,
    "--duo-safe-area-inset-right": `${insets.right}px`,
    "--duo-safe-area-inset-bottom": `${insets.bottom}px`,
    "--duo-safe-area-inset-left": `${insets.left}px`,
  }
}
