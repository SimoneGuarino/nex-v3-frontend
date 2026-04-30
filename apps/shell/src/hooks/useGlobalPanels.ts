import { useSyncExternalStore } from "react";
import {
  getGlobalPanelState,
  subscribeGlobalPanels,
  type NexGlobalPanelState,
} from "@nex/shared-platform";

export function useGlobalPanels(): NexGlobalPanelState {
  return useSyncExternalStore(subscribeGlobalPanels, getGlobalPanelState, getGlobalPanelState);
}

export function useIsGlobalPanelOpen(panel: Exclude<NexGlobalPanelState["openPanel"], null>): boolean {
  return useSyncExternalStore(
    subscribeGlobalPanels,
    () => getGlobalPanelState().openPanel === panel,
    () => getGlobalPanelState().openPanel === panel,
  );
}
