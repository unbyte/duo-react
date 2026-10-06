import * as React from "react"
import { createRoot } from "react-dom/client"
import "./styles/theme.css"
import "duo-frame/style.css"
import "./styles/app.css"
import { App } from "./app"

const root = document.getElementById("root")
if (!root) throw new Error("Missing playground root")
createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
