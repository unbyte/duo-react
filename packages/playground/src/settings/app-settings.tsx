import { Contrast, PanelTop, PaintBucket, LockKeyhole, Square } from "lucide-react"
import { IconColorSwatch } from "@tabler/icons-react"
import { useDuoActions, useDuoState, type DuoIndicatorStyle, type DuoColorMode } from "duo-react"
import { SelectSetting, ToggleSetting, ColorSetting } from "../components/setting-fields"

export interface AppSettingsProps {
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
        { value: "auto", label: "Auto" },
        { value: "light", label: "Light" },
        { value: "dark", label: "Dark" },
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
      value={hidden === undefined ? "auto" : hidden ? "hide" : "show"}
      options={[
        { value: "auto", label: "Auto" },
        { value: "show", label: "Show" },
        { value: "hide", label: "Hide" },
      ]}
      onValueChange={(value) =>
        setSystem({ prefersStatusBarHidden: value === "auto" ? undefined : value === "hide" })
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
      <BackgroundPicker backgrounds={backgrounds} onChange={onBackgroundChange} />
      <IndicatorStylePicker />
      <StatusBarPicker />
      <ToggleSetting
        icon={LockKeyhole}
        label="Outer portrait lock"
        title="Keep the outer app in portrait while rotating"
        checked={outerPortraitLocked}
        onCheckedChange={onOuterPortraitLockedChange}
      />
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
    </div>
  )
}
