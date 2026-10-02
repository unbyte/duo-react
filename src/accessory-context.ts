import * as React from "react";

export interface AccessoryHosts {
  tabBar?: HTMLDivElement;
  toolbar?: HTMLDivElement;
  side: "left" | "right" | "horizontal";
}

export const AccessoryContext = React.createContext<AccessoryHosts | undefined>(undefined);
