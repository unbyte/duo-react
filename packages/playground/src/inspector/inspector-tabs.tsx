import { cn } from 'cn'
import type * as React from 'react'
import { ScrollSurface } from '../components/scroll-surface'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { TooltipProvider } from '../components/ui/tooltip'

interface InspectorTabsProps {
  value: string
  onValueChange: (value: string) => void
  sections: readonly { value: string; label: string; content: React.ReactNode }[]
}

const inspectorTabs = 'flex min-h-0 min-w-0 flex-1 flex-col gap-0'
const inspectorHeading =
  'flex h-11 shrink-0 items-center gap-2.5 border-b border-border px-3.5 @max-[280px]:gap-[5px] @max-[280px]:px-2.5'
const inspectorTabList =
  'box-border -mb-px flex w-auto min-w-0 flex-1 self-stretch gap-0 rounded-none border-0 bg-transparent p-0 group-data-horizontal/tabs:h-auto'
const inspectorTab =
  'h-full flex-1 cursor-pointer rounded-none border-0 border-b-2 border-b-transparent bg-transparent px-1.5 py-0 text-xs/normal font-medium text-muted-foreground after:content-none aria-selected:border-b-primary aria-selected:bg-transparent aria-selected:text-[#2165c5] @max-[280px]:px-[3px] @max-[280px]:text-[11px]'
const inspectorBody = 'flex min-h-0 min-w-0 flex-1 overflow-hidden bg-transparent text-xs/normal'
const inspectorContent = 'box-border min-h-full min-w-0! p-3.5'

export function InspectorTabs({ value, onValueChange, sections }: InspectorTabsProps) {
  return (
    <TooltipProvider delay={200}>
      <Tabs
        value={value}
        onValueChange={(next) => onValueChange(String(next))}
        className={cn('playground-inspector-tabs', inspectorTabs)}
      >
        <div className={cn('playground-inspector-heading', inspectorHeading)}>
          <TabsList
            variant="line"
            activateOnFocus
            className={cn('playground-state-tabs', inspectorTabList)}
            aria-label="Inspector sections"
          >
            {sections.map((section) => (
              <TabsTrigger className={inspectorTab} key={section.value} value={section.value}>
                {section.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {sections.map((section) => (
          <TabsContent
            key={section.value}
            value={section.value}
            keepMounted
            className={cn('playground-inspector-body', inspectorBody)}
            data-inspector-section={section.value}
          >
            <ScrollSurface
              className="playground-inspector-scroll flex-1"
              contentClassName={cn(
                'playground-inspector-content',
                inspectorContent,
                section.value === 'bars' && 'flex flex-col [&>.playground-toggle]:shrink-0',
                section.value === 'states' && 'flex h-full',
              )}
            >
              {section.content}
            </ScrollSurface>
          </TabsContent>
        ))}
      </Tabs>
    </TooltipProvider>
  )
}
