import React, { createContext, useContext, useState } from "react";

export interface GSettingsMode {
  Manutenzione: boolean;
  // aggiungi qui eventuali altre proprietà in futuro
}

export type GSettingsContextType = {
  GSettingsMode: GSettingsMode;
  setGSettingsMode: React.Dispatch<React.SetStateAction<GSettingsMode>>;
  canAccess: boolean;
  setCanAccess: React.Dispatch<React.SetStateAction<boolean>>;
};

const GSettingsContext = createContext<GSettingsContextType | undefined>(undefined);

export function useGSettingsContext(): GSettingsContextType {
  const ctx = useContext(GSettingsContext);
  if (!ctx) {
    throw new Error("useGSettingsContext deve essere usato dentro GSettingsProvider");
  }
  return ctx;
}

type ProviderProps = { children: React.ReactNode };

export function GSettingsProvider({ children }: ProviderProps) {
  const [GSettingsMode, setGSettingsMode] = useState<GSettingsMode>({ Manutenzione: false });
  const [canAccess, setCanAccess] = useState<boolean>(false);

  return (
    <GSettingsContext.Provider
      value={{ GSettingsMode, setGSettingsMode, canAccess, setCanAccess }}
    >
      {children}
    </GSettingsContext.Provider>
  );
}

/**
 * funzione per aggiornamenti generali
 * - field è una chiave di GSettingsMode
 * - value è il tipo associato a quella chiave
 */
export type SetGeneralSettingsFn = <K extends keyof GSettingsMode>(
  field: K,
  value: GSettingsMode[K]
) => void;

export default GSettingsContext;
