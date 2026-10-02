import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

function Preview() {
  return (
    <main>
      <p className="eyebrow">React development preview</p>
      <h1>Duo Frame</h1>
      <p>
        The Vite Plus scaffold is ready. The iPhone Duo frame and asset downloader will follow the
        design review.
      </p>
      <p>Read DESIGN.md in the project root for the proposed component API.</p>
    </main>
  );
}

const root = document.getElementById("root");

if (root) {
  createRoot(root).render(
    <StrictMode>
      <Preview />
    </StrictMode>,
  );
}
