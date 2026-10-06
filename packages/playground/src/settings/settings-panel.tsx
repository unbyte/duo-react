import type * as React from 'react'
import { ScrollSurface } from '../components/scroll-surface'
import { InspectorToggle } from '../inspector/inspector-controls'
import { AppSettings, type AppSettingsProps } from './app-settings'
import { TabBarControls, ToolbarControls } from './bar-controls'
import type { BarSettings } from './bar-settings'
import { SettingsSection } from './settings-section'
import { SystemSettings } from './system-settings'

export function SettingsPanel({
  barSettings,
  onBarSettingsChange,
  inspectorOpen,
  onInspectorOpenChange,
  inspectorToggleRef,
  ...appSettings
}: AppSettingsProps & {
  barSettings: BarSettings
  onBarSettingsChange: (settings: BarSettings) => void
  inspectorOpen: boolean
  onInspectorOpenChange: (open: boolean) => void
  inspectorToggleRef: React.Ref<HTMLButtonElement>
}) {
  return (
    <aside
      className="playground-sidebar @container absolute inset-y-0 left-0 z-10 box-border flex w-(--playground-sidebar-width) min-h-0 min-w-0 flex-col border-r border-border bg-white/90 backdrop-blur-[20px] backdrop-saturate-[125%] max-sm:inset-x-0 max-sm:top-auto max-sm:h-(--playground-bottom-space) max-sm:w-full max-sm:border-r-0 max-sm:border-t max-sm:group-data-[inspector-open=true]/playground:bg-transparent max-sm:group-data-[inspector-open=true]/playground:backdrop-filter-none"
      aria-label="Playground settings"
    >
      <div className="playground-sidebar-heading box-border flex h-11 shrink-0 items-center justify-between gap-2 border-b border-border px-3 max-sm:group-data-[inspector-open=true]/playground:bg-white/90 max-sm:group-data-[inspector-open=true]/playground:backdrop-blur-[20px] max-sm:group-data-[inspector-open=true]/playground:backdrop-saturate-[125%]">
        <h1 className="playground-title m-0 flex items-center gap-2 text-[13px] font-semibold">
          <img src="/favicon.svg" alt="" width={16} height={16} className="size-4 shrink-0" />
          Duo React
        </h1>
        <InspectorToggle
          buttonRef={inspectorToggleRef}
          open={inspectorOpen}
          onOpenChange={onInspectorOpenChange}
        />
      </div>
      <ScrollSurface className="playground-sidebar-scroll min-h-0 flex-1 max-sm:group-data-[inspector-open=true]/playground:invisible">
        <SettingsSection title="System">
          <SystemSettings />
        </SettingsSection>
        <SettingsSection title="App">
          <AppSettings {...appSettings} />
        </SettingsSection>
        <SettingsSection title="Tab bar">
          <TabBarControls settings={barSettings} onChange={onBarSettingsChange} />
        </SettingsSection>
        <SettingsSection title="Toolbars">
          <ToolbarControls settings={barSettings} onChange={onBarSettingsChange} />
        </SettingsSection>
      </ScrollSurface>
    </aside>
  )
}
