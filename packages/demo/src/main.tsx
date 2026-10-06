import * as React from "react"
import { createRoot } from "react-dom/client"
import { Demo } from "./demo"

const root = document.getElementById("root")
if (!root) throw new Error("Missing demo root")
createRoot(root).render(
  <React.StrictMode>
    <Demo />
  </React.StrictMode>,
)
