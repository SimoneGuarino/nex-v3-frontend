// src\context\filtersContext.tsx
import React, { createContext, useContext, useState } from 'react';

type Nullable<T> = T | null;

interface FiltersContextValue {
  brandSelected: Nullable<string>;
  setBrandSelected: React.Dispatch<React.SetStateAction<Nullable<string>>>;

  brandPrefix: Nullable<string>;
  setBrandPrefix: React.Dispatch<React.SetStateAction<Nullable<string>>>;

  categorySelected: Nullable<string>;
  setCategorySelected: React.Dispatch<React.SetStateAction<Nullable<string>>>;

  subcategorySelected: Nullable<string>;
  setSubCategorySelected: React.Dispatch<React.SetStateAction<Nullable<string>>>;

  buyerTarget: Nullable<string>;
  setBuyerTarget: React.Dispatch<React.SetStateAction<Nullable<string>>>;

  buyerTargetObject: Nullable<Record<string, unknown>>;
  setBuyerTargetObject: React.Dispatch<React.SetStateAction<Nullable<Record<string, unknown>>>>;

  priceFilter: number;
  setPriceFilter: React.Dispatch<React.SetStateAction<number>>;

  DispWithout0: boolean;
  setDispWithout0: React.Dispatch<React.SetStateAction<boolean>>;

  dfValue: boolean;
  setdfValue: React.Dispatch<React.SetStateAction<boolean>>;

  status: boolean;
  setStatus: React.Dispatch<React.SetStateAction<boolean>>;

  panelMode: number;
  setPanelMode: React.Dispatch<React.SetStateAction<number>>;

  noteWith: boolean;
  setNoteWith: React.Dispatch<React.SetStateAction<boolean>>;

  colDistFilter: string[];
  setColDistFilter: React.Dispatch<React.SetStateAction<string[]>>;

  ADMByrData: unknown[];
  setADMByrData: React.Dispatch<React.SetStateAction<unknown[]>>;

  typeSelected: Nullable<string>;
  setTypeSelected: React.Dispatch<React.SetStateAction<Nullable<string>>>;
}

const FiltersContext = createContext<FiltersContextValue | undefined>(undefined);

export function useFiltersContext(): FiltersContextValue {
  const ctx = useContext(FiltersContext);
  if (!ctx) {
    throw new Error('useFiltersContext deve essere usato dentro a <FiltersProvider>.');
  }
  return ctx;
}

type FiltersProviderProps = { children: React.ReactNode };

export function FiltersProvider({ children }: FiltersProviderProps) {
  const [brandSelected, setBrandSelected] = useState<Nullable<string>>(null);
  const [brandPrefix, setBrandPrefix] = useState<Nullable<string>>(null);
  const [categorySelected, setCategorySelected] = useState<Nullable<string>>(null);
  const [subcategorySelected, setSubCategorySelected] = useState<Nullable<string>>(null);
  const [buyerTarget, setBuyerTarget] = useState<Nullable<string>>(null);
  const [buyerTargetObject, setBuyerTargetObject] = useState<Nullable<Record<string, unknown>>>(null);
  const [priceFilter, setPriceFilter] = useState<number>(0);
  const [DispWithout0, setDispWithout0] = useState<boolean>(true);
  const [dfValue, setdfValue] = useState<boolean>(false);
  const [status, setStatus] = useState<boolean>(false);
  const [panelMode, setPanelMode] = useState<number>(0);
  const [noteWith, setNoteWith] = useState<boolean>(false);
  const [colDistFilter, setColDistFilter] = useState<string[]>([]);
  const [ADMByrData, setADMByrData] = useState<unknown[]>([]);
  const [typeSelected, setTypeSelected] = useState<Nullable<string>>(null);

  const value: FiltersContextValue = {
    brandSelected,
    setBrandSelected,
    brandPrefix,
    setBrandPrefix,
    categorySelected,
    setCategorySelected,
    subcategorySelected,
    setSubCategorySelected,
    buyerTarget,
    setBuyerTarget,
    buyerTargetObject,
    setBuyerTargetObject,
    priceFilter,
    setPriceFilter,
    DispWithout0,
    setDispWithout0,
    dfValue,
    setdfValue,
    status,
    setStatus,
    panelMode,
    setPanelMode,
    noteWith,
    setNoteWith,
    colDistFilter,
    setColDistFilter,
    ADMByrData,
    setADMByrData,
    typeSelected,
    setTypeSelected,
  };

  return <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>;
}
