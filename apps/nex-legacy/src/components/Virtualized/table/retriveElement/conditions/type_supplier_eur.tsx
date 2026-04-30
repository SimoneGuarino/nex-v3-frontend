import React, { useEffect } from 'react';

type EItem = { key: string };

interface TypeSupplierEurProps {
  e: { key: EItem[];[k: string]: any };
  elm: any;
  colIndex: { key: string; label: string;[k: string]: any };
  addZeroes: (value: number, siae?: number, raee?: number) => React.ReactNode;
  addingValue?: any;
  /** opzionale: il chiamante lo passa, lo tolleriamo */
  indexRow?: number;
}

function TypeSupplierEur(props: TypeSupplierEurProps): JSX.Element {
  const { e, elm, colIndex, addZeroes } = props;
  const prop = elm?.[colIndex.key]?.[colIndex.label];

  const chooseLowestValue = React.useCallback((): number[] => {
    if (!elm) return [];
    const arr: number[] = [];
    e.key.forEach((value) => {
      const val = elm?.[colIndex.key]?.[colIndex.label]?.[value.key];
      if (val !== 0 && val !== null && val !== undefined) {
        arr.push(parseFloat(val));
      }
    });
    return arr;
  }, [elm, e.key, colIndex.key, colIndex.label]);

  useEffect(() => {
    chooseLowestValue();
  }, [elm, chooseLowestValue]);

  const lows = chooseLowestValue();
  return lows.length > 0 ? (
    <span
      style={
        elm?.Prezzo > (Math.min(...lows) + (prop?.Siae ?? 0) + (prop?.Raee ?? 0)) &&
          (prop?.Disponibili !== 0) && (prop?.Disponibili !== undefined)
          ? { color: '#d74040', fontWeight: 600 }
          : {}
      }
    >
      {addZeroes(Math.min(...lows), prop?.Siae, prop?.Raee)}
    </span>
  ) : (
    <span style={{ color: '#b4b4b4' }}>/</span>
  );
}

export default TypeSupplierEur;
