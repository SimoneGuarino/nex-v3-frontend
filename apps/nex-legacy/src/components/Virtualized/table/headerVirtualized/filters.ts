//src\components\Virtualized\table\headerVirtualized\filters.ts
/**
 * Funzione che ordina gli elementi nel array in base al type definito in colonna.
 * Mantiene la logica originale (incluso whereToFindData e il caso 'multiplay').
 */
export const Filters = (
    type: string | number | unknown[] | undefined,
    field: any,
    status: number,
    multiplay: any,
    setData: React.Dispatch<React.SetStateAction<any>>,
    copyData: any,
    whereToFindData?: string | false
): void => {
    // Controlli come nell'originale
    if (!type) {
        console.warn('Type is not defined for sorting.');
        return;
    }
    if (!field) {
        console.warn('Field is not defined for sorting.');
        return;
    }
    if (status === undefined || status === null) {
        console.warn('Status is not defined for sorting.');
        return;
    }
    if (typeof type !== 'string' && typeof type !== 'number' && !Array.isArray(type)) {
        console.warn('Type must be a string, number, or array for sorting.');
        return;
    }

    const type_ = (typeof type === 'string' ? type.toLowerCase() : type) as string | number | unknown[];
    // Campo usato dalla colonna "Scadenza validità" in TableSubObj.
    // Il relativo ordinamento deve restare business e indipendente da created/updated.
    const isExpiryValiditySortField =
        !Array.isArray(field) &&
        (field === 'scadenza_validita_sort' || field === 'scadenza_validita');

    const getExpiryRank = (row: any): number => {
        const raw = row?.finestraValidita?.fine ?? row?.scadenza ?? row?.dateTo;
        if (!raw) return 3_000_000;

        const expiry = new Date(raw);
        if (Number.isNaN(expiry.getTime())) return 3_000_000;

        const now = new Date();
        const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startExpiry = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate());
        const msPerDay = 24 * 60 * 60 * 1000;
        const daysToExpiry = Math.ceil((startExpiry.getTime() - startToday.getTime()) / msPerDay);

        if (daysToExpiry >= 0 && daysToExpiry <= 5) return daysToExpiry;
        if (daysToExpiry > 5) return 1_000_000 + daysToExpiry;
        return 2_000_000 + Math.abs(daysToExpiry);
    };

    // console.log('type:', type_, 'field:', field, 'status:', status, 'multiplay:', multiplay, 'whereToFindData:', whereToFindData);

    switch (type_) {
        case 'string':
            status === 0
                ? setData((prev: any) => {
                    if (whereToFindData) {
                        const copy = [...prev[whereToFindData]];
                        let sorted: any[] = [];
                        if (Array.isArray(field)) {
                            sorted = copy.sort((a, b) => a[field[0]][field[1]].localeCompare(b[field[0]][field[1]]));
                        } else {
                            sorted = copy.sort((a, b) => a[field].localeCompare(b[field]));
                        }
                        return { ...prev, [whereToFindData]: sorted };
                    } else {
                        const copy = [...prev];
                        const sorted = copy.sort((a, b) => {
                            const aValue = a[field] != null ? a[field] : '';
                            const bValue = b[field] != null ? b[field] : '';
                            return aValue.localeCompare(bValue);
                        });
                        return sorted;
                    }
                })
                : status === 1
                    ? setData((prev: any) => {
                        if (whereToFindData) {
                            const copy = [...prev[whereToFindData]];
                            let sorted: any[] = [];
                            if (Array.isArray(field)) {
                                sorted = copy.sort((a, b) => b[field[0]][field[1]].localeCompare(a[field[0]][field[1]]));
                            } else {
                                sorted = copy.sort((a, b) => b[field].localeCompare(a[field]));
                            }
                            return { ...prev, [whereToFindData]: sorted };
                        } else {
                            const copy = [...prev];
                            const sorted = copy.sort((a, b) => {
                                const aValue = b[field] != null ? b[field] : '';
                                const bValue = a[field] != null ? a[field] : '';
                                return aValue.localeCompare(bValue);
                            });
                            return sorted;
                        }
                    })
                    : setData((prev: any) => {
                        if (whereToFindData) {
                            return { ...prev, [whereToFindData]: copyData };
                        } else {
                            return copyData;
                        }
                    });
            break;

        case 'number':
            if (isExpiryValiditySortField) {
                // Per scadenza validità ignoriamo asc/desc/reset classici e applichiamo sempre
                // l'ordinamento crescente del ranking tecnico.
                setData((prev: any) => {
                    let copy: any[];
                    if (whereToFindData) copy = [...prev[whereToFindData]];
                    else copy = [...prev];

                    const sorted = copy.sort((a, b) => {
                        const valueA = Array.isArray(field) ? parseFloat(a[field[0]][field[1]]) : parseFloat(a[field]);
                        const valueB = Array.isArray(field) ? parseFloat(b[field[0]][field[1]]) : parseFloat(b[field]);
                        return valueA > valueB ? 1 : -1;
                    });

                    if (whereToFindData) return { ...prev, [whereToFindData]: sorted };
                    else return sorted;
                });
                break;
            }

            status === 0
                ? setData((prev: any) => {
                    let copy: any[];
                    if (whereToFindData) copy = [...prev[whereToFindData]];
                    else copy = [...prev];

                    const sorted = copy.sort((a, b) => {
                        const valueA = Array.isArray(field) ? parseFloat(a[field[0]][field[1]]) : parseFloat(a[field]);
                        const valueB = Array.isArray(field) ? parseFloat(b[field[0]][field[1]]) : parseFloat(b[field]);
                        return valueA > valueB ? 1 : -1;
                    });

                    if (whereToFindData) return { ...prev, [whereToFindData]: sorted };
                    else return sorted;
                })
                : status === 1
                    ? setData((prev: any) => {
                        let copy: any[];
                        if (whereToFindData) copy = [...prev[whereToFindData]];
                        else copy = [...prev];

                        const sorted = copy.sort((a, b) => {
                            const valueA = Array.isArray(field) ? parseFloat(a[field[0]][field[1]]) : parseFloat(a[field]);
                            const valueB = Array.isArray(field) ? parseFloat(b[field[0]][field[1]]) : parseFloat(b[field]);
                            return valueA > valueB ? -1 : 1;
                        });

                        if (whereToFindData) return { ...prev, [whereToFindData]: sorted };
                        else return sorted;
                    })
                    : setData((prev: any) => {
                        if (whereToFindData) return { ...prev, [whereToFindData]: copyData };
                        else return copyData;
                    });
            break;

        case 'expiry':
            // Sort dedicato "Scadenza validità" con ciclo standard:
            // status 0 -> crescente (rank basso prima)
            // status 1 -> decrescente (rank alto prima)
            // status 2 -> reset allo stato attuale (copyData)
            status === 0
                ? setData((prev: any) => {
                    let copy: any[];
                    if (whereToFindData) copy = [...prev[whereToFindData]];
                    else copy = [...prev];

                    const sorted = copy.sort((a, b) => getExpiryRank(a) - getExpiryRank(b));
                    if (whereToFindData) return { ...prev, [whereToFindData]: sorted };
                    return sorted;
                })
                : status === 1
                    ? setData((prev: any) => {
                        let copy: any[];
                        if (whereToFindData) copy = [...prev[whereToFindData]];
                        else copy = [...prev];

                        const sorted = copy.sort((a, b) => getExpiryRank(b) - getExpiryRank(a));
                        if (whereToFindData) return { ...prev, [whereToFindData]: sorted };
                        return sorted;
                    })
                    : setData((prev: any) => {
                        if (whereToFindData) return { ...prev, [whereToFindData]: copyData };
                        return copyData;
                    });
            break;

        case 'date':
            status === 0
                ? setData((prev: any) => {
                    let copy: any[];
                    if (whereToFindData) copy = [...prev[whereToFindData]];
                    else copy = [...prev];

                    const sorted = copy.sort((a, b) => {
                        const valueA = Array.isArray(field) ? new Date(a[field[0]]?.[field[1]]).getTime() : new Date(a[field]).getTime();
                        const valueB = Array.isArray(field) ? new Date(b[field[0]]?.[field[1]]).getTime() : new Date(b[field]).getTime();
                        const safeA = Number.isFinite(valueA) ? valueA : 0;
                        const safeB = Number.isFinite(valueB) ? valueB : 0;
                        return safeA - safeB;
                    });

                    if (whereToFindData) return { ...prev, [whereToFindData]: sorted };
                    else return sorted;
                })
                : status === 1
                    ? setData((prev: any) => {
                        let copy: any[];
                        if (whereToFindData) copy = [...prev[whereToFindData]];
                        else copy = [...prev];

                        const sorted = copy.sort((a, b) => {
                            const valueA = Array.isArray(field) ? new Date(a[field[0]]?.[field[1]]).getTime() : new Date(a[field]).getTime();
                            const valueB = Array.isArray(field) ? new Date(b[field[0]]?.[field[1]]).getTime() : new Date(b[field]).getTime();
                            const safeA = Number.isFinite(valueA) ? valueA : 0;
                            const safeB = Number.isFinite(valueB) ? valueB : 0;
                            return safeB - safeA;
                        });

                        if (whereToFindData) return { ...prev, [whereToFindData]: sorted };
                        else return sorted;
                    })
                    : setData((prev: any) => {
                        if (whereToFindData) return { ...prev, [whereToFindData]: copyData };
                        else return copyData;
                    });
            break;

        case 'multiplay':
            status === 0
                ? setData((prev: any) => {
                    const copy = [...prev.dati];
                    const sorted = copy.sort((a, b) => {
                        const getValue = (item: any, obj: any) => {
                            if (obj.secKey) {
                                return parseFloat(item[obj.key]?.[obj.secKey]);
                            }
                            return parseFloat(item[obj.key]);
                        };
                        const productA = getValue(a, multiplay[0]) * getValue(a, multiplay[1]);
                        const productB = getValue(b, multiplay[0]) * getValue(b, multiplay[1]);

                        if (productA < productB) return -1;
                        if (productA > productB) return 1;
                        return 0;
                    });

                    return { ...prev, dati: sorted };
                })
                : status === 1
                    ? setData((prev: any) => {
                        const copy = [...prev.dati];
                        const sorted = copy.sort((a, b) => {
                            const getValue = (item: any, obj: any) => {
                                if (obj.secKey) {
                                    return parseFloat(item[obj.key]?.[obj.secKey]);
                                }
                                return parseFloat(item[obj.key]);
                            };
                            const productA = getValue(a, multiplay[0]) * getValue(a, multiplay[1]);
                            const productB = getValue(b, multiplay[0]) * getValue(b, multiplay[1]);

                            if (productA < productB) return 1;
                            if (productA > productB) return -1;
                            return 0;
                        });

                        return { ...prev, dati: sorted };
                    })
                    : setData((prev: any) => {
                        return { ...prev, dati: copyData };
                    });
            break;

        default:
            // no-op: tipo non gestito esplicitamente
            break;
    }
};

export default Filters;
