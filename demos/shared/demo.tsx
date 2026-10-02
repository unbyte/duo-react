import * as React from "react";
import { fn } from "duo-frame";

export function Demo({ version }: { version: string }) {
  return (
    <main>
      <h1>Duo Frame</h1>
      <p>React {version}</p>
      <p>{fn()}</p>
    </main>
  );
}
