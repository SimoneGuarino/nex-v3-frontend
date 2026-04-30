import React, { memo, useCallback, useEffect, useState } from 'react';

type KeyItem = { key: string };

type EProp = {
    /** Array di chiavi da ispezionare dentro elm[colIndex.key][colIndex.label] */
    key: KeyItem[];
};

type ColIndex = {
    key: string;   // chiave di primo livello in elm
    label: string; // chiave di secondo livello in elm[colIndex.key]
};

type NestedLabelData = {
    Siae: number;
    Raee: number;
    Disponibili?: number;
    /** altre chiavi dinamiche che contengono valori numerici (o numeri in stringa) */
    [priceKey: string]: number | string | undefined;
};

type Elm = {
    Prezzo: number;
    /** struttura dinamica: elm[colIndex.key][colIndex.label] -> NestedLabelData */
    [outer: string]: Record<string, NestedLabelData> | any;
};

type AddZeroesFn = (value: number, siae: number, raee: number) => React.ReactNode;

type TypeSupplierEurProps = {
    e: EProp;
    elm: Elm;
    colIndex: ColIndex;
    addZeroes: AddZeroesFn;
};

function TypeSupplierEur({ e, elm, colIndex, addZeroes }: TypeSupplierEurProps): JSX.Element {
    const [arr, setArr] = useState<number[]>([]);

    const chooseLowestValue = useCallback(() => {
        const base = (elm as any)[colIndex.key]?.[colIndex.label] as NestedLabelData | undefined;
        if (!base) return;

        e.key.forEach((value) => {
            const raw = base[value.key];
            if (raw !== 0 && raw !== null && raw !== undefined) {
                const num = typeof raw === 'string' ? parseFloat(raw) : (raw as number);
                setArr((prev) => [...prev, num]);
            }
        });
        // dipendenze vuote per fedeltà all'originale
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        chooseLowestValue();
    }, [elm, chooseLowestValue]);

    if (arr.length === 0) {
        return <span style={{ color: '#b4b4b4' }}>/</span>;
    }

    const base = (elm as any)[colIndex.key][colIndex.label] as NestedLabelData;
    const minVal = Math.min(...arr);
    const threshold = minVal + base.Siae + base.Raee;

    // notare: il codice originale usa l'operatore bitwise & qui sotto; lo lascio invariato per fedeltà
    const makeRed =
        elm.Prezzo > threshold &&
        (base.Disponibili !== 0) && (base.Disponibili !== undefined);

    return (
        <span style={makeRed ? { color: '#d74040', fontWeight: '600' } : {}}>
            {addZeroes(minVal, base.Siae, base.Raee)}
        </span>
    );
}

export default memo(TypeSupplierEur);
