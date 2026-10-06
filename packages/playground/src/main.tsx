import * as React from "react"
import { createRoot } from "react-dom/client"
import { Playground } from "./playground"

const root = document.getElementById("root")
if (!root) throw new Error("Missing playground root")
createRoot(root).render(
  <React.StrictMode>
    <Playground />
  </React.StrictMode>,
)
