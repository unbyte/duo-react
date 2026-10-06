import * as React from "react"
import { Battery, BatteryCharging, Clock, Signal, SunMoon, Sun, Moon, Wifi } from "lucide-react"
import { useDuoActions, useDuoState, type DuoColorMode } from "duo-frame"
import { SelectSetting, ToggleSetting, RangeSetting, TimeInput } from "../components/setting-fields"
import { LevelLabel, ChoiceLabel } from "./option-labels"

function TimeControls() {
  const [mode, setMode] = React.useState("automatic")
  const [specifiedTime, setSpecifiedTime] = React.useState("09:41")
  const { setSystem } = useDuoActions()

  React.useEffect(() => {
    if (mode === "specified") {
      if (specifiedTime) setSystem({ time: specifiedTime })
      return
    }
    const sync = () => {
      const now = new Date()
      const hours = String(now.getHours()).padStart(2, "0")
      const minutes = String(now.getMinutes()).padStart(2, "0")
      setSystem({ time: `${hours}:${minutes}` })
    }
    sync()
    const timer = window.setInterval(sync, 1000)
    window.addEventListener("focus", sync)
    document.addEventListener("visibilitychange", sync)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener("focus", sync)
      document.removeEventListener("visibilitychange", sync)
    }
  }, [mode, specifiedTime, setSystem])

  return (
    <>
      <SelectSetting
        icon={Clock}
        label="Time"
        ariaLabel="Time mode"
        value={mode}
        options={[
          { value: "automatic", label: "Automatic" },
          { value: "specified", label: "Manual" },
        ]}
        onValueChange={setMode}
      />
      {mode === "specified" && <TimeInput value={specifiedTime} onValueChange={setSpecifiedTime} />}
    </>
  )
}

export function SystemSettings() {
  const { colorMode, battery, charging, wifiStrength, cellularStrength } = useDuoState(
    (state) => state.system,
  )
  const { setSystem } = useDuoActions()
  return (
    <div className="playground-controls grid gap-1" role="group" aria-label="System settings">
      <SelectSetting
        icon={SunMoon}
        label="Appearance"
        value={colorMode}
        options={[
          { value: "light", text: "Light", label: <ChoiceLabel icon={Sun}>Light</ChoiceLabel> },
          { value: "dark", text: "Dark", label: <ChoiceLabel icon={Moon}>Dark</ChoiceLabel> },
        ]}
        onValueChange={(value) => setSystem({ colorMode: value as DuoColorMode })}
      />
      <TimeControls />
      <RangeSetting
        icon={Battery}
        label="Battery"
        value={battery}
        onValueChange={(value) => setSystem({ battery: value })}
      />
      <ToggleSetting
        icon={BatteryCharging}
        label="Charging"
        checked={charging}
        onCheckedChange={(value) => setSystem({ charging: value })}
      />
      <SelectSetting
        icon={Wifi}
        label="Wi-Fi"
        value={String(wifiStrength)}
        options={["None", "Weak", "Medium", "Strong"].map((label, value) => ({
          value: String(value),
          text: `${value} — ${label}`,
          label: (
            <LevelLabel level={value} maximum={3}>
              {label}
            </LevelLabel>
          ),
        }))}
        onValueChange={(value) => setSystem({ wifiStrength: Number(value) })}
      />
      <SelectSetting
        icon={Signal}
        label="Cellular"
        value={String(cellularStrength)}
        options={["None", "Weak", "Fair", "Good", "Strong"].map((label, value) => ({
          value: String(value),
          text: `${value} — ${label}`,
          label: (
            <LevelLabel level={value} maximum={4}>
              {label}
            </LevelLabel>
          ),
        }))}
        onValueChange={(value) => setSystem({ cellularStrength: Number(value) })}
      />
    </div>
  )
}
