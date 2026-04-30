//src\layouts\ordini\ordiniFB\filter\FBFiltersVI.tsx
import React, { useState, useEffect, memo } from 'react';
import { useFiltersContext } from '../../../../context/filtersContext';

interface FBFiltersVIProps<T> {
    data: T[];                   // Array di dati da filtrare
    existValue?: T | string;     // Valore iniziale selezionato
    setUTMTarget: (val: any) => void; // Funzione di callback quando cambia il filtro
    minWidth?: string;
    maxWidth?: string;
    placeholder?: string;
    type?: 'String' | 'Object' | 'Number';
    valueToTake?: string;        // Se tipo Object, proprietà da leggere
    valueToInsert?: string;      // Se tipo Object, proprietà da restituire
}

function FBFiltersVI<T extends object | string>({
    data,
    existValue,
    setUTMTarget,
    minWidth = 'w-48',
    maxWidth = 'w-full',
    placeholder = 'Seleziona…',
    type = 'String',
    valueToTake,
    valueToInsert
}: FBFiltersVIProps<T>) {

    const { setBrandSelected, setBrandPrefix, setCategorySelected, setSubCategorySelected } = useFiltersContext();

    // Stato interno del valore selezionato
    const [value, setValue] = useState<T | null>(() => {
        if (existValue === undefined) return null;
        return data.find(el => (typeof el === 'object' ? (el as any)[valueToTake!] : el) === existValue) || null;
    });

    // Array di opzioni da mostrare
    const [options, setOptions] = useState<string[]>([]);

    // Aggiorna le opzioni quando cambia data o tipo
    useEffect(() => {
        if (!data) return;

        let opts: string[] = [];
        if (type === 'String' || type === 'Number') {
            opts = data
                .map(el => String(el))
                .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
        } else if (type === 'Object' && valueToTake) {
            opts = data
                .map(elm => String((elm as any)[valueToTake]))
                .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
        }

        setOptions(opts);
    }, [data, type, valueToTake]);


    // Funzione quando cambia il filtro
    const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selected = event.target.value;

        // Reset dei filtri contestuali
        setBrandSelected(null);
        setBrandPrefix(null);
        setCategorySelected(null);
        setSubCategorySelected(null);

        setValue(selected as any);

        // Aggiorna il target UTM
        if (type === 'Object' && valueToInsert) {
            const foundIndex = data.findIndex(elm => (elm as any)[valueToTake!] === selected);
            setUTMTarget(foundIndex !== -1 ? (data[foundIndex] as any)[valueToInsert] : null);
        } else {
            setUTMTarget(selected);
        }
    };

    return (
        <div className={`flex flex-col ${minWidth} ${maxWidth} mx-auto`}>
            {typeof value === 'object' && (value as any).name && (
                <span className="text-sm font-medium mb-1">{(value as any).name}</span>
            )}

            {/* Select principale */}
            <select
                className="border border-gray-300 rounded px-3 py-1 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={value ? String(typeof value === 'object' ? (value as any)[valueToTake!] : value) : ''}
                onChange={handleChange}
            >
                <option value="">{placeholder}</option>
                {options.map((opt, idx) => (
                    <option key={idx} value={opt}>{opt}</option>
                ))}
            </select>
        </div>
    );
}

export default memo(FBFiltersVI);
