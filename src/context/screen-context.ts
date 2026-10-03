import * as React from "react";
import type { DuoDisplay } from "../core/types";

export const ScreenContext = React.createContext<DuoDisplay | undefined>(undefined);
