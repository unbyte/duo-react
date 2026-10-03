import * as React from "react";
import { createPortal } from "react-dom";
import { AccessoryContext } from "./accessory-context";

export type DuoBarProps = React.HTMLAttributes<HTMLDivElement>;

function Bar({
  kind,
  forwardedRef,
  className,
  ...props
}: DuoBarProps & {
  kind: "tabBar" | "toolbar";
  forwardedRef: React.ForwardedRef<HTMLDivElement>;
}) {
  const hosts = React.useContext(AccessoryContext);
  if (!hosts) throw new Error("DuoTabBar and DuoAppToolbar must be inside DuoFrame's children.");
  const host = hosts[kind];
  if (!host) return null;
  const placement =
    hosts.side === "horizontal" ? (kind === "tabBar" ? "bottom" : "top") : hosts.side;
  return createPortal(
    <div
      {...props}
      ref={forwardedRef}
      className={["duo-app-bar", className].filter(Boolean).join(" ")}
      data-duo-bar={kind === "tabBar" ? "tab" : "toolbar"}
      data-duo-bar-placement={placement}
    />,
    host,
  );
}

export const DuoTabBar = React.forwardRef<HTMLDivElement, DuoBarProps>(
  function DuoTabBar(props, ref) {
    return <Bar {...props} kind="tabBar" forwardedRef={ref} />;
  },
);

export const DuoAppToolbar = React.forwardRef<HTMLDivElement, DuoBarProps>(
  function DuoAppToolbar(props, ref) {
    return <Bar {...props} kind="toolbar" forwardedRef={ref} />;
  },
);
