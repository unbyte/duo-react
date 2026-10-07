import { IconAxisX, IconBoxAlignTopLeft, IconNumber } from '@tabler/icons-react'
import type { ToolbarLayoutRequest } from 'duo-react'
import { AlignHorizontalDistributeCenter, Bell } from 'lucide-react'
import { SelectSetting } from '../components/setting-fields'
import { Input } from '../components/ui/input'
import { type BarSettings, tabBadgeOptions } from './bar-settings'
import { CountLabel, DistributionLabel, PlacementLabel } from './option-labels'

export function TabBarControls({
  settings,
  onChange,
}: {
  settings: BarSettings
  onChange: (settings: BarSettings) => void
}) {
  return (
    <div className="playground-controls grid gap-1" role="group" aria-label="Tab bar settings">
      <SelectSetting
        icon={IconNumber}
        label="Count"
        ariaLabel="Tab count"
        value={String(settings.tabbarCount)}
        options={[0, 2, 3, 4, 5].map((count) => ({
          value: String(count),
          text: count === 0 ? '0 — None' : `${count} tabs`,
          label: <CountLabel count={count} unit="tab" />,
        }))}
        onValueChange={(value) => onChange({ ...settings, tabbarCount: Number(value) })}
      />
      {settings.tabbarCount > 0 && (
        <>
          <SelectSetting
            icon={Bell}
            label="Badge"
            ariaLabel="Tab badges"
            multiple
            value={[...settings.tabbarBadges]}
            valueLabel={
              settings.tabbarBadges.length ? `${settings.tabbarBadges.length} enabled` : 'None'
            }
            options={tabBadgeOptions}
            onValueChange={(tabbarBadges) => onChange({ ...settings, tabbarBadges })}
          />
          {settings.tabbarBadges.includes('custom') && (
            <Input
              className="h-7 w-[124px] justify-self-end rounded-md bg-background px-2 py-0 text-xs/5 select-text md:text-xs"
              aria-label="Custom text"
              placeholder="Custom text"
              value={settings.customBadge}
              onChange={(event) =>
                onChange({ ...settings, customBadge: event.currentTarget.value })
              }
            />
          )}
        </>
      )}
      {settings.tabbarCount > 0 && (
        <div hidden>
          <SelectSetting
            icon={AlignHorizontalDistributeCenter}
            label="Distribution"
            value={settings.distribution}
            options={[
              {
                value: 'packed',
                text: 'Packed',
                label: <DistributionLabel distribution="packed">Packed</DistributionLabel>,
              },
              {
                value: 'edges',
                text: 'Edges',
                label: <DistributionLabel distribution="edges">Edges</DistributionLabel>,
              },
            ]}
            onValueChange={(value) =>
              onChange({ ...settings, distribution: value as BarSettings['distribution'] })
            }
          />
        </div>
      )}
    </div>
  )
}

export function ToolbarControls({
  settings,
  onChange,
}: {
  settings: BarSettings
  onChange: (settings: BarSettings) => void
}) {
  const updateToolbar = (id: string, patch: Partial<ToolbarLayoutRequest>) => {
    onChange({
      ...settings,
      toolbars: settings.toolbars.map((bar) => (bar.id === id ? { ...bar, ...patch } : bar)),
    })
  }
  return (
    <div className="playground-controls grid gap-1" role="group" aria-label="Toolbar settings">
      <SelectSetting
        icon={IconNumber}
        label="Count"
        ariaLabel="Toolbar count"
        value={String(settings.toolbarCount)}
        options={[0, 1, 2, 3].map((count) => ({
          value: String(count),
          text: count === 0 ? '0 — None' : `${count} ${count === 1 ? 'bar' : 'bars'}`,
          label: <CountLabel count={count} />,
        }))}
        onValueChange={(value) => onChange({ ...settings, toolbarCount: Number(value) })}
      />
      {settings.toolbarCount > 0 && (
        <div className="playground-toolbar-settings grid gap-2.5 mt-0.5 mb-1">
          {settings.toolbars.slice(0, settings.toolbarCount).map((bar) => (
            <fieldset
              key={bar.id}
              className="m-0 grid min-w-0 grid-cols-1 gap-2 border-0 border-l border-border py-1 pl-2.5 pr-0"
            >
              <legend className="p-0 text-[11px] text-muted-foreground">Toolbar {bar.id}</legend>
              <SelectSetting
                icon={IconBoxAlignTopLeft}
                label="Placement"
                ariaLabel={`Toolbar ${bar.id} placement`}
                value={bar.placement}
                options={[
                  {
                    value: 'top-leading',
                    text: 'Top leading',
                    label: <PlacementLabel placement="top-leading">Top leading</PlacementLabel>,
                  },
                  {
                    value: 'top-trailing',
                    text: 'Top trailing',
                    label: <PlacementLabel placement="top-trailing">Top trailing</PlacementLabel>,
                  },
                  {
                    value: 'bottom',
                    text: 'Bottom',
                    label: <PlacementLabel placement="bottom">Bottom</PlacementLabel>,
                  },
                ]}
                onValueChange={(value) =>
                  updateToolbar(bar.id, { placement: value as ToolbarLayoutRequest['placement'] })
                }
              />
              <SelectSetting
                icon={IconAxisX}
                label="Axis"
                ariaLabel={`Toolbar ${bar.id} axis`}
                value={bar.axis ?? 'adaptive'}
                options={[
                  { value: 'adaptive', label: 'Adaptive' },
                  { value: 'horizontal', label: 'Horizontal' },
                ]}
                onValueChange={(value) =>
                  updateToolbar(bar.id, { axis: value as ToolbarLayoutRequest['axis'] })
                }
              />
            </fieldset>
          ))}
        </div>
      )}
    </div>
  )
}
