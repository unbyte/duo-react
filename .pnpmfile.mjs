export const hooks = {
  readPackage(pkg) {
    // The aliased legacy renderer and types need their own React 16 dependencies.
    const peer =
      pkg.name === "react-dom" && pkg.version === "16.14.0"
        ? "react"
        : pkg.name === "@types/react-dom" && pkg.version.startsWith("16.")
          ? "@types/react"
          : undefined
    if (peer) {
      pkg.dependencies = { ...pkg.dependencies, [peer]: pkg.peerDependencies[peer] }
      delete pkg.peerDependencies[peer]
    }
    return pkg
  },
}
