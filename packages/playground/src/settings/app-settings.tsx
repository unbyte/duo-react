import { IconColorSwatch } from '@tabler/icons-react'
import { type DuoColorMode, type DuoIndicatorStyle, useDuoActions, useDuoState } from 'duo-react'
import { Contrast, Layers, LockKeyhole, PaintBucket, PanelTop, Square } from 'lucide-react'
import { ColorSetting, SelectSetting, ToggleSetting } from '../components/setting-fields'
import type { DemoPreset } from '../preview/demo-presets'

export interface AppSettingsProps {
  demo: DemoPreset
  onDemoChange: (demo: DemoPreset) => void
  backgrounds: Record<DuoColorMode, string>
  onBackgroundChange: (mode: DuoColorMode, color: string) => void
  outerPortraitLocked: boolean
  onOuterPortraitLockedChange: (locked: boolean) => void
  showBlock: boolean
  onShowBlockChange: (show: boolean) => void
  blockColor: string
  onBlockColorChange: (color: string) => void
}

function IndicatorStylePicker() {
  const { setSystem } = useDuoActions()
  const indicatorStyle = useDuoState((state) => state.system.indicatorStyles.outer.statusBar)
  return (
    <SelectSetting
      icon={Contrast}
      label="Icons"
      value={indicatorStyle}
      options={[
        { value: 'auto', label: 'Auto' },
        { value: 'light', label: 'Light' },
        { value: 'dark', label: 'Dark' },
      ]}
      onValueChange={(value) => {
        const styles = {
          statusBar: value as DuoIndicatorStyle,
          homeIndicator: value as DuoIndicatorStyle,
        }
        setSystem({ indicatorStyles: { inner: styles, outer: styles } })
      }}
    />
  )
}

function StatusBarPicker() {
  const hidden = useDuoState((state) => state.system.prefersStatusBarHidden)
  const { setSystem } = useDuoActions()
  return (
    <SelectSetting
      icon={PanelTop}
      label="Status bar"
      value={hidden === undefined ? 'auto' : hidden ? 'hide' : 'show'}
      options={[
        { value: 'auto', label: 'Auto' },
        { value: 'show', label: 'Show' },
        { value: 'hide', label: 'Hide' },
      ]}
      onValueChange={(value) =>
        setSystem({ prefersStatusBarHidden: value === 'auto' ? undefined : value === 'hide' })
      }
    />
  )
}

function BackgroundPicker({
  backgrounds,
  onChange,
}: {
  backgrounds: Record<DuoColorMode, string>
  onChange: (mode: DuoColorMode, color: string) => void
}) {
  const colorMode = useDuoState((state) => state.system.colorMode)
  return (
    <ColorSetting
      icon={PaintBucket}
      label="Background"
      ariaLabel="Background color"
      value={backgrounds[colorMode]}
      onValueChange={(value) => onChange(colorMode, value)}
    />
  )
}

export function AppSettings({
  demo,
  onDemoChange,
  backgrounds,
  onBackgroundChange,
  outerPortraitLocked,
  onOuterPortraitLockedChange,
  showBlock,
  onShowBlockChange,
  blockColor,
  onBlockColorChange,
}: AppSettingsProps) {
  return (
    <div className="playground-controls grid gap-1" role="group" aria-label="App settings">
      <div className="mb-2 border-b border-border pb-2">
        <SelectSetting
          icon={Layers}
          label="Demo"
          ariaLabel="Demo preset"
          hint="Choose a minimal layout or an interactive city guide."
          value={demo}
          options={[
            { value: 'minimal', label: 'Minimal' },
            { value: 'rich', label: 'Rich' },
          ]}
          onValueChange={(value) => {
            if (value === 'minimal' || value === 'rich') onDemoChange(value)
          }}
        />
      </div>
      {demo === 'minimal' && (
        <BackgroundPicker backgrounds={backgrounds} onChange={onBackgroundChange} />
      )}
      <IndicatorStylePicker />
      <StatusBarPicker />
      <ToggleSetting
        icon={LockKeyhole}
        label="Outer portrait lock"
        title="Keep the outer app in portrait while rotating"
        checked={outerPortraitLocked}
        onCheckedChange={onOuterPortraitLockedChange}
      />
      {demo === 'minimal' && (
        <>
          <ToggleSetting
            icon={Square}
            label="Block"
            title="Show draggable color block"
            checked={showBlock}
            onCheckedChange={onShowBlockChange}
          />
          <ColorSetting
            icon={IconColorSwatch}
            label="Block color"
            value={blockColor}
            onValueChange={onBlockColorChange}
          />
        </>
      )}
    </div>
  )
}
