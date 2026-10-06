import type * as React from 'react'
import { ScrollSurface } from '../components/scroll-surface'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip'
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
        <div className="flex items-center gap-2.5">
          <h1 className="playground-title m-0 flex items-center gap-2 whitespace-nowrap text-[13px] font-semibold">
            Duo React
          </h1>
          <TooltipProvider delay={200}>
            <div className="flex items-center gap-2.5">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <a
                      href="https://github.com/unbyte/duo-react"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Open GitHub"
                      className="inline-flex shrink-0 transition-opacity opacity-80 hover:opacity-100 focus-visible:opacity-100"
                    />
                  }
                >
                  <img
                    src="https://github.githubassets.com/favicons/favicon.svg"
                    alt=""
                    width={12}
                    height={12}
                    className="size-3"
                  />
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={8}>
                  Open GitHub
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <a
                      href="https://www.npmjs.com/package/duo-react"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Open NPM"
                      className="inline-flex shrink-0 transition-opacity opacity-80 hover:opacity-100 focus-visible:opacity-100"
                    />
                  }
                >
                  <img
                    src="https://static-production.npmjs.com/1996fcfdf7ca81ea795f67f093d7f449.png"
                    alt=""
                    width={12}
                    height={12}
                    className="size-3"
                  />
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={8}>
                  Open NPM
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>
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
