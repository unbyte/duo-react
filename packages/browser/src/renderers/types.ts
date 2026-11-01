import type { DuoSize } from '@private/profiles'
import type { BackdropSource } from './backdrop/types'

export interface RendererScreen {
  readonly size: DuoSize
  readonly visible: boolean
  readonly scale?: number
}

export interface ContentRenderer {
  readonly backdrop: BackdropSource
  updateScreen(screen: RendererScreen): void
  connect(source: HTMLElement): void
  disconnect(): void
}
