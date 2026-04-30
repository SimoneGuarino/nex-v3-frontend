/**
 * Questo file controlla lo stato dark/light della TimelineList e TimelineItem.
 * Assunzione: il valore del contesto è un boolean (true = dark).
 * Se invece passi un oggetto (es. { dark: boolean }), cambia il tipo TimelineContextValue.
 */

import { createContext, useContext, type ReactNode } from "react";

// Se nel tuo progetto passi un oggetto, sostituisci con:
// type TimelineContextValue = { dark: boolean };
type TimelineContextValue = boolean;

// Il valore iniziale è undefined per restare fedele al comportamento originale
// (useContext può restituire undefined se usato fuori dal provider).
const Timeline = createContext<TimelineContextValue | undefined>(undefined);

interface TimelineProviderProps {
  children: ReactNode;
  value: TimelineContextValue;
}

// Provider del contesto Timeline
function TimelineProvider({ children, value }: TimelineProviderProps) {
  return <Timeline.Provider value={value}>{children}</Timeline.Provider>;
}

// Hook custom per usare il contesto
function useTimeline(): TimelineContextValue | undefined {
  return useContext(Timeline);
}

export { TimelineProvider, useTimeline };
