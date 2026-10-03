import * as React from "react";
import { useSyncExternalStoreWithSelector } from "use-sync-external-store/shim/with-selector";
import { createDuoStore } from "./store";
import type { DuoStore } from "./store";
import type { DuoDefaults, DuoDisplay, DuoState, DuoSystemOptions, DuoWindowChange } from "./types";

const StoreContext = React.createContext<DuoStore | undefined>(undefined);
export const ScreenContext = React.createContext<DuoDisplay | undefined>(undefined);
export const useBrowserLayoutEffect =
  typeof document === "undefined" ? React.useEffect : React.useLayoutEffect;

export interface DuoProviderProps {
  children?: React.ReactNode;
  defaultState?: DuoDefaults;
  defaultSystem?: DuoSystemOptions;
  outerPortraitLocked?: boolean;
}

export function DuoProvider({
  children,
  defaultState,
  defaultSystem,
  outerPortraitLocked = false,
}: DuoProviderProps): React.ReactElement {
  const [store] = React.useState(() =>
    createDuoStore(defaultState, defaultSystem, outerPortraitLocked),
  );
  useBrowserLayoutEffect(() => {
    store.configureOuterPortraitLock(outerPortraitLocked);
  }, [store, outerPortraitLocked]);
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useDuoStore() {
  const store = React.useContext(StoreContext);
  if (!store) throw new Error("Duo components and hooks must be inside a DuoProvider.");
  return store;
}

export function useDuoState<Value>(
  selector: (state: DuoState) => Value,
  isEqual: (left: Value, right: Value) => boolean = Object.is,
) {
  const store = useDuoStore();
  return useSyncExternalStoreWithSelector(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
    selector,
    isEqual,
  );
}

export function useDuoActions() {
  return useDuoStore().actions;
}

export function useDuoScreen() {
  const display = React.useContext(ScreenContext);
  if (!display) throw new Error("useDuoScreen must be used within DuoFrame's children.");
  return useDuoState((state) => state.screens[display]);
}

export function useDuoEvent(type: "windowchange", handler: (event: DuoWindowChange) => void) {
  const store = useDuoStore();
  const latest = React.useRef(handler);
  useBrowserLayoutEffect(() => {
    latest.current = handler;
  }, [handler]);
  React.useEffect(() => store.subscribeWindow((event) => latest.current(event)), [store, type]);
}
