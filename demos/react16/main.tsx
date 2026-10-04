import * as React from "react"
import { render } from "react-dom"
import { Demo } from "@duo-frame/demo-shared"

const root = document.getElementById("root")
if (!root) throw new Error("Missing demo root")
render(
  <React.StrictMode>
    <Demo />
  </React.StrictMode>,
  root,
)
