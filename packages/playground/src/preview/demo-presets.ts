import { AtlasApp } from './atlas/atlas-app'
import { ExampleApp } from './example-content'

export const demoPresets = { minimal: ExampleApp, rich: AtlasApp }
export type DemoPreset = keyof typeof demoPresets
