// src\context\SearchDataContext.tsx
import React, { createContext, useContext, useState } from "react";

export interface SearchDataState {
  // metti qui i campi reali; esempio:
  query: string;
  results: unknown[];
}

type SearchDataContextValue = [
  SearchDataState,
  React.Dispatch<React.SetStateAction<SearchDataState>>
];

export const SearchDataContext = createContext<SearchDataContextValue | undefined>(undefined);

const initialState: SearchDataState = { query: "", results: [] };

export const SearchDataProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [state, setState] = useState<SearchDataState>(initialState);
  return (
    <SearchDataContext.Provider value={[state, setState]}>
      {children}
    </SearchDataContext.Provider>
  );
};

export function useSearchData(): SearchDataContextValue {
  const ctx = useContext(SearchDataContext);
  if (!ctx) throw new Error("useSearchData deve essere usato dentro <SearchDataProvider>.");
  return ctx;
}
