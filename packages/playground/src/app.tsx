import { type BarsLayout, DuoFrame, type DuoInsets, DuoProvider, DuoRegionMask } from 'duo-react'
import * as React from 'react'
import { StateInspector } from './inspector/state-inspector'
import { ExampleApp, ExampleBars, tabItems } from './preview/example-content'
import { PreviewCanvas } from './preview/preview-canvas'
import { PreviewControls } from './preview/preview-controls'
import { PreviewFrame } from './preview/preview-frame'
import { type BarSettings, barRequest, initialBarSettings } from './settings/bar-settings'
import { SettingsPanel } from './settings/settings-panel'

export function App() {
  const [selectedTab, setSelectedTab] = React.useState('home')
  const [backgrounds, setBackgrounds] = React.useState({ light: '#ffffff', dark: '#111111' })
  const [regionsPinned, setRegionsPinned] = React.useState(false)
  const [highlightedRegionId, setHighlightedRegionId] = React.useState<string>()
  const [showBarBounds, setShowBarBounds] = React.useState(false)
  const [barSettings, setBarSettings] = React.useState(initialBarSettings)
  const updateBarSettings = (next: BarSettings) => {
    setBarSettings(next)
    if (
      next.tabbarCount > 0 &&
      !tabItems.slice(0, next.tabbarCount).some((item) => item.id === selectedTab)
    )
      setSelectedTab('home')
  }
  const [barsLayout, setBarsLayout] = React.useState<BarsLayout>()
  const request = React.useMemo(() => barRequest(barSettings), [barSettings])
  const [showBlock, setShowBlock] = React.useState(true)
  const [blockColor, setBlockColor] = React.useState('#0066ff')
  const [outerPortraitLocked, setOuterPortraitLocked] = React.useState(false)
  const [inspectorOpen, setInspectorOpen] = React.useState(false)
  const [fitPadding, setFitPadding] = React.useState<DuoInsets>({
    top: 24,
    right: 24,
    bottom: 98,
    left: 296,
  })
  const updateFitPadding = React.useCallback((next: DuoInsets) => {
    setFitPadding((current) =>
      current.top === next.top &&
      current.right === next.right &&
      current.bottom === next.bottom &&
      current.left === next.left
        ? current
        : next,
    )
  }, [])
  const frame = React.useRef<HTMLDivElement>(null)
  const inspectorToggle = React.useRef<HTMLButtonElement>(null)
  const closeInspector = React.useCallback(() => {
    setInspectorOpen(false)
    inspectorToggle.current?.focus({ preventScroll: true })
  }, [])
  return (
    <DuoProvider
      defaultSystem={{ colorMode: 'light', cameraActive: true }}
      outerPortraitLocked={outerPortraitLocked}
    >
      <div
        className="playground group/playground relative isolate h-dvh overflow-hidden [--playground-sidebar-width:272px] [--playground-inspector-width:min(320px,42vw)] [--playground-sidebar-space:var(--playground-sidebar-width)] [--playground-inspector-space:0px] [--playground-bottom-space:0px] data-[inspector-open=true]:[--playground-inspector-space:var(--playground-inspector-width)] max-[1200px]:[--playground-sidebar-width:248px] max-[960px]:[--playground-sidebar-width:224px] max-sm:[--playground-sidebar-space:0px] max-sm:[--playground-inspector-space:0px] max-sm:data-[inspector-open=true]:[--playground-inspector-space:0px] max-sm:[--playground-bottom-space:35dvh]"
        data-inspector-open={inspectorOpen}
      >
        <div className="playground-workspace relative h-full">
          <SettingsPanel
            backgrounds={backgrounds}
            onBackgroundChange={(mode, color) =>
              setBackgrounds((current) => ({ ...current, [mode]: color }))
            }
            outerPortraitLocked={outerPortraitLocked}
            onOuterPortraitLockedChange={setOuterPortraitLocked}
            showBlock={showBlock}
            onShowBlockChange={setShowBlock}
            blockColor={blockColor}
            onBlockColorChange={setBlockColor}
            barSettings={barSettings}
            onBarSettingsChange={updateBarSettings}
            inspectorOpen={inspectorOpen}
            onInspectorOpenChange={(open) => (open ? setInspectorOpen(true) : closeInspector())}
            inspectorToggleRef={inspectorToggle}
          />
          <main
            className="playground-preview absolute inset-0 overflow-hidden"
            aria-label="Device preview"
          >
            <PreviewCanvas onFitPaddingChange={updateFitPadding}>
              <PreviewFrame backgrounds={backgrounds}>
                <DuoFrame
                  ref={frame}
                  fitPadding={fitPadding}
                  style={{ width: '100%', height: '100%' }}
                  aria-label="Duo layout preview"
                >
                  <ExampleApp
                    showBlock={showBlock}
                    blockColor={blockColor}
                    selectedTab={selectedTab}
                  />
                  <ExampleBars
                    request={request}
                    showBounds={showBarBounds}
                    onLayout={setBarsLayout}
                    selectedId={selectedTab}
                    onSelect={setSelectedTab}
                    tabCount={barSettings.tabbarCount}
                  />
                </DuoFrame>
                <DuoRegionMask
                  frameRef={frame}
                  theme="light"
                  highlightedRegionId={highlightedRegionId}
                  onHighlightedRegionChange={setHighlightedRegionId}
                  data-overlay-pinned={regionsPinned}
                />
              </PreviewFrame>
              <PreviewControls />
            </PreviewCanvas>
          </main>
          <StateInspector
            open={inspectorOpen}
            request={request}
            layout={barsLayout}
            regionsPinned={regionsPinned}
            onRegionsPinnedChange={setRegionsPinned}
            showBarBounds={showBarBounds}
            onShowBarBoundsChange={setShowBarBounds}
            highlightedRegionId={highlightedRegionId}
            onHoveredRegionChange={setHighlightedRegionId}
            onClose={closeInspector}
          />
        </div>
      </div>
    </DuoProvider>
  )
}
