import { useSyncExternalStore } from "react";
import { getRealtimeSnapshot, subscribeRealtimeStore, type RealtimeSnapshot } from "./store";

export function useRealtimeStore(): RealtimeSnapshot {
  return useSyncExternalStore(subscribeRealtimeStore, getRealtimeSnapshot, getRealtimeSnapshot);
}

export function useRealtimeSelector<T>(selector: (snapshot: RealtimeSnapshot) => T): T {
  return useSyncExternalStore(
    subscribeRealtimeStore,
    () => selector(getRealtimeSnapshot()),
    () => selector(getRealtimeSnapshot()),
  );
}
