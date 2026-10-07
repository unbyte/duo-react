import { cn } from 'cn'
import {
  type BarsLayout,
  type BarsLayoutRequest,
  DuoSafeArea,
  DuoTabBar,
  useBars,
  useDuoState,
} from 'duo-react'
import { Home, Library, Search, Settings } from 'lucide-react'
import * as React from 'react'
import { tabBadgeOptions } from '../settings/bar-settings'
import { DraggableBlock } from './draggable-block'

export const tabItems = [
  { id: 'home', icon: <Home />, label: 'Home' },
  { id: 'library', icon: <Library />, label: 'Library', selectedColor: '#af52de' },
  { id: 'settings', icon: <Settings />, label: 'Settings', selectedColor: '#ff9500' },
  { id: 'search', icon: <Search />, label: 'Search' },
  {
    id: 'favorites',
    icon: <img src="/icons/heart-inactive.png" width={27} height={27} alt="" draggable={false} />,
    selectedIcon: <img src="/icons/heart.png" width={27} height={27} alt="" draggable={false} />,
    label: 'Favorites',
    selectedColor: '#ff2d55',
  },
]

export function ExampleApp({
  showBlock,
  blockColor,
  selectedTab,
}: {
  showBlock: boolean
  blockColor: string
  selectedTab: string
}) {
  return (
    <DuoSafeArea className="playground-app relative h-full overflow-auto text-base text-[color:var(--playground-color)] bg-[var(--playground-background)]">
      <div className="playground-content relative p-6">
        <h2 className="m-0 text-xl">{tabItems.find((item) => item.id === selectedTab)?.label}</h2>
      </div>
      <DraggableBlock visible={showBlock} color={blockColor} />
    </DuoSafeArea>
  )
}

export function ExampleBars({
  request,
  showBounds,
  onLayout,
  selectedId,
  onSelect,
  tabCount,
  tabBadges,
  customBadge,
}: {
  request: BarsLayoutRequest
  showBounds: boolean
  onLayout: (layout: BarsLayout) => void
  selectedId: string
  onSelect: (id: string) => void
  tabCount: number
  tabBadges: readonly string[]
  customBadge: string
}) {
  const items = React.useMemo(
    () =>
      tabItems.slice(0, tabCount).map((item, index) => {
        const option = tabBadgeOptions[index]
        return {
          ...item,
          badge: tabBadges.includes(option.value)
            ? option.value === 'custom'
              ? customBadge
              : option.badge
            : undefined,
        }
      }),
    [tabCount, tabBadges, customBadge],
  )
  const bars = useBars(request)
  const colorMode = useDuoState((state) => state.system.colorMode)
  const [counts, setCounts] = React.useState<Readonly<Record<string, number>>>({})
  React.useEffect(() => onLayout(bars), [bars, onLayout])

  return (
    <div
      className="playground-bars-layer pointer-events-none absolute inset-0"
      data-show-bounds={showBounds}
    >
      {bars.toolbars.map((bar) => (
        <div
          key={bar.id}
          data-show-bounds={showBounds}
          {...bar.containerProps}
          className="playground-bar-area pointer-events-none data-[show-bounds=true]:outline data-[show-bounds=true]:outline-dashed data-[show-bounds=true]:outline-[#0879ed] data-[show-bounds=true]:outline-offset-[-1px] data-[show-bounds=true]:bg-[#0879ed0d]"
          data-playground-bar={bar.id}
        >
          <div
            className={cn(
              'playground-app-bar pointer-events-auto box-border flex min-h-0 min-w-0 max-h-full max-w-full gap-1 overflow-auto rounded-[28px] bg-[#f0f3f8] p-0.5 text-foreground [flex-direction:inherit]',
              colorMode === 'dark' && 'bg-[#2c2c2e] text-[#f4f4f4]',
            )}
          >
            <button
              className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full border-0 bg-transparent p-0 text-inherit focus-visible:outline-offset-[-2px]"
              type="button"
              aria-label={`Toolbar ${bar.id} action: ${counts[bar.id] ?? 0}`}
              title={`Toolbar ${bar.id}: clicked ${counts[bar.id] ?? 0} times`}
              onClick={() =>
                setCounts((current) => ({ ...current, [bar.id]: (current[bar.id] ?? 0) + 1 }))
              }
            >
              {bar.id}
              {!!counts[bar.id] && <small className="text-[10px]">{counts[bar.id]}</small>}
            </button>
          </div>
        </div>
      ))}
      {bars.tabbar && (
        <DuoTabBar
          layout={bars.tabbar}
          items={items}
          selectedId={selectedId}
          onSelect={onSelect}
          className="playground-bar-area pointer-events-none data-[show-bounds=true]:outline data-[show-bounds=true]:outline-dashed data-[show-bounds=true]:outline-[#0879ed] data-[show-bounds=true]:outline-offset-[-1px] data-[show-bounds=true]:bg-[#0879ed0d]"
          data-show-bounds={showBounds}
          data-playground-bar="tabs"
        />
      )}
    </div>
  )
}
