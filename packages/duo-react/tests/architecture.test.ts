import { readFileSync, readdirSync } from "node:fs"
import { dirname, relative, resolve, sep } from "node:path"
import { fileURLToPath } from "node:url"
import { expect, test } from "vite-plus/test"

const packageRoot = fileURLToPath(new URL("../../", import.meta.url))
const owners = ["profiles", "core", "browser", "duo-react"] as const
const allowedPackages = {
  profiles: [],
  core: ["@duo-react/profiles"],
  browser: ["@duo-react/profiles", "@zumer/snapdom"],
  "duo-react": [
    "@duo-react/profiles",
    "@duo-react/core",
    "@duo-react/browser",
    "@zumer/snapdom",
    "react",
    "react-dom",
    "use-sync-external-store",
  ],
} satisfies Record<(typeof owners)[number], readonly string[]>
const sourcePaths = new Set(
  owners.flatMap((owner) =>
    readdirSync(resolve(packageRoot, owner, "src"), { recursive: true, encoding: "utf8" }).map(
      (path) => `${owner}/src/${path.split(sep).join("/")}`,
    ),
  ),
)
const modules = new Map(
  [...sourcePaths]
    .filter((path) => /\.tsx?$/.test(path) && !path.endsWith(".d.ts"))
    .map((path) => [path, readFileSync(resolve(packageRoot, path), "utf8")]),
)
const dependencies = new Map<string, string[]>()
for (const [path, source] of modules) {
  const imports = Array.from(
    source.matchAll(/(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s*)["']([^"']+)["']/g),
    (match) => match[1],
  )
  const owner = path.split("/")[0] as (typeof owners)[number]
  dependencies.set(
    path,
    imports.map((specifier) => {
      if (!specifier.startsWith(".")) {
        const packageName = specifier.startsWith("@")
          ? specifier.split("/").slice(0, 2).join("/")
          : specifier.split("/")[0]
        expect(
          allowedPackages[owner] as readonly string[],
          `${path} imports forbidden package ${specifier}`,
        ).toContain(packageName)
        const internal = owners.find((candidate) => specifier === `@duo-react/${candidate}`)
        if (internal) return `${internal}/src/index.ts`
        expect(specifier, `${path} must use the private package entry`).not.toMatch(
          /^@duo-react\/[^/]+\//,
        )
        return specifier
      }
      const target = relative(packageRoot, resolve(packageRoot, dirname(path), specifier))
        .split(sep)
        .join("/")
      expect(
        target.startsWith(`${owner}/src/`),
        `${path} bypasses a package boundary with ${specifier}`,
      ).toBe(true)
      const resolved = [target, `${target}.ts`, `${target}.tsx`, `${target}/index.ts`].find(
        (name) => sourcePaths.has(name),
      )
      if (!resolved) throw new Error(`${path} imports missing module ${specifier}`)
      expect(resolved, `${path} must import its internal owner directly`).not.toBe(
        `${owner}/src/index.ts`,
      )
      return resolved
    }),
  )
}

test("package manifests and compiler settings preserve the dependency direction", () => {
  for (const owner of owners) {
    const manifest = JSON.parse(
      readFileSync(resolve(packageRoot, owner, "package.json"), "utf8"),
    ) as {
      private: boolean
      dependencies?: Record<string, string>
      peerDependencies?: Record<string, string>
      devDependencies?: Record<string, string>
    }
    expect(manifest.private).toBe(true)
    for (const dependency of Object.keys({
      ...manifest.dependencies,
      ...manifest.peerDependencies,
    })) {
      expect(allowedPackages[owner] as readonly string[]).toContain(dependency)
    }
    for (const dependency of allowedPackages[owner].filter((name) =>
      name.startsWith("@duo-react/"),
    )) {
      expect(manifest.dependencies?.[dependency] ?? manifest.devDependencies?.[dependency]).toBe(
        "workspace:*",
      )
      if (owner === "duo-react") expect(manifest.dependencies?.[dependency]).toBeUndefined()
    }
    if (owner === "profiles" || owner === "core") {
      const config = JSON.parse(
        readFileSync(resolve(packageRoot, owner, "tsconfig.json"), "utf8"),
      ) as {
        compilerOptions: { lib: string[]; types: string[] }
      }
      expect(config.compilerOptions.lib).toEqual(["ES2023"])
      expect(config.compilerOptions.types).toEqual([])
    }
  }
})

test("imports, including type imports, follow responsibility ownership inside each package", () => {
  for (const [path, imports] of dependencies) {
    const owner = path.split("/")[0]
    const local = path.split("/").slice(2).join("/")
    let allowed: RegExp
    if (local === "index.ts") continue
    if (owner === "profiles") allowed = /^profiles\/src\//
    else if (owner === "browser") allowed = /^(?:browser\/src\/|profiles\/src\/|@zumer\/snapdom$)/
    else if (owner === "core") {
      if (local.startsWith("geometry/")) allowed = /^(?:core\/src\/geometry\/|profiles\/src\/)/
      else if (local.startsWith("layout/"))
        allowed = /^(?:core\/src\/(?:layout|geometry)\/|profiles\/src\/)/
      else if (local.startsWith("preview/")) allowed = /^(?:core\/src\/preview\/|profiles\/src\/)/
      else if (local.startsWith("state/"))
        allowed = /^(?:core\/src\/(?:state|geometry|preview)\/|profiles\/src\/)/
      else throw new Error(`Unclassified core module ${path}`)
    } else {
      if (local.startsWith("components/")) allowed = /^(?!duo-react\/src\/index\.ts$).+/
      else if (local.startsWith("context/"))
        allowed =
          /^(?:duo-react\/src\/(?:context|shared)\/|core\/src\/|react$|use-sync-external-store\/)/
      else if (local.startsWith("screen/"))
        allowed = /^(?:duo-react\/src\/(?:screen|context|shared)\/|profiles\/src\/|react$)/
      else if (local.startsWith("bars/"))
        allowed = /^(?:duo-react\/src\/(?:bars|screen|shared)\/|core\/src\/|react$)/
      else if (local.startsWith("backdrop/"))
        allowed = /^(?:duo-react\/src\/(?:backdrop|shared)\/|browser\/src\/|react$)/
      else if (local.startsWith("inspection/"))
        allowed = /^(?:duo-react\/src\/(?:inspection|context|shared)\/|core\/src\/|react$)/
      else if (local.startsWith("shared/")) allowed = /^(?:duo-react\/src\/shared\/|react$)/
      else throw new Error(`Unclassified React module ${path}`)
    }
    for (const dependency of imports)
      expect(dependency, `${path} must not depend on ${dependency}`).toMatch(allowed)
  }
})

test("every implementation module is reachable from the React entry without import cycles", () => {
  const visited = new Set<string>()
  function visit(path: string, ancestors: readonly string[]) {
    if (ancestors.includes(path))
      throw new Error(`Import cycle: ${[...ancestors, path].join(" → ")}`)
    if (visited.has(path)) return
    for (const dependency of dependencies.get(path) ?? []) {
      if (modules.has(dependency)) visit(dependency, [...ancestors, path])
    }
    visited.add(path)
  }
  visit("duo-react/src/index.ts", [])
  expect([...modules.keys()].filter((path) => !visited.has(path))).toEqual([])
})
