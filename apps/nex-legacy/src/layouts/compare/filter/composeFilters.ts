// tipi accettati dai parametri (coprono sia stringa che oggetto o null/undefined)
type BrandSelected = { Brand: string } | string | null | undefined;
type CategorySelected = { Linea?: string | null | undefined } | string | null | undefined;
type SubcategorySelected = { Gruppo?: string | null | undefined } | string | null | undefined;
type CodiceListino = { codice?: string | number } | null | undefined;

/**
 * Costruisce la query string dei filtri.
 * Nota: mantiene la logica originale con sostituzione " " -> "%" sul brand (wildcard backend),
 * e "&" -> "%26" per evitare rotture.
 */
export function ComposeFilters({
    brandSelected,
    brandPrefix,
    categorySelected,
    subcategorySelected,
    priceFilter,
    DispWithout0,
    dfValue,
    noteWith,
    codicePromo,
    codiceListino
}: {
    brandSelected?: BrandSelected,
    brandPrefix?: string | null | undefined,
    categorySelected?: CategorySelected,
    subcategorySelected?: SubcategorySelected,
    priceFilter?: number | undefined,
    DispWithout0?: boolean,
    dfValue?: boolean,
    noteWith?: boolean,
    codicePromo?: string | null | undefined,
    codiceListino?: CodiceListino
}): string {
    const queryArr: string[] = Array(11).fill('');

    // --- brand ---
    const brandName =
        typeof brandSelected === 'string'
            ? brandSelected
            : brandSelected && typeof brandSelected === 'object' && 'Brand' in brandSelected
                ? String((brandSelected as any).Brand ?? '')
                : null;

    if (brandName) {
        // wildcard: spazio -> "%", escape "&"
        const brandEscapeSpace = brandName.replace(/ /g, '%');
        const brandEscapeAnd = brandEscapeSpace.replace(/&/g, '%26');
        queryArr[0] = 'brand=' + brandEscapeAnd;

        if (brandPrefix !== null && brandPrefix !== undefined) {
            queryArr[6] = 'prx=' + String(brandPrefix);
        }
    }

    // --- categoria ---
    const cat =
        typeof categorySelected === 'string'
            ? categorySelected
            : categorySelected && typeof categorySelected === 'object'
                ? (categorySelected as any).Linea
                : null;
    if (cat !== null && cat !== undefined) {
        queryArr[1] = 'cat=' + String(cat);
    }

    // --- sottocategoria ---
    const scat =
        typeof subcategorySelected === 'string'
            ? subcategorySelected
            : subcategorySelected && typeof subcategorySelected === 'object'
                ? (subcategorySelected as any).Gruppo
                : null;
    if (scat !== null && scat !== undefined) {
        queryArr[2] = 'scat=' + String(scat);
    }

    // --- prezzo ---
    if (!(priceFilter == 0 || priceFilter === undefined)) {
        queryArr[3] = 'dfval=' + String(priceFilter);
        // --- dfcat ---
        queryArr[4] = 'dfcat=' + (dfValue ? '0' : '1'); //type of value category | 0 -> Euro, 1 -> Percentage
    }
    

    // --- promo / disponibilità ---
    if (codicePromo && codicePromo.trim() !== '') {
        queryArr[8] = 'scd=' + codicePromo;
    } else if (DispWithout0) {
        queryArr[5] = 'disp=1';
    }

    // --- listino ---
    const cdl = codiceListino && typeof codiceListino === 'object' ? (codiceListino as any).codice : null;
    if (cdl) {
        queryArr[9] = 'cdl=' + String(cdl);
    };

    // --- note with ---
    if (noteWith) {
        queryArr[7] = 'nt=1';
    };

    // rimuovi entry con spazi (coerente con codice originale) e vuote
    const query = queryArr.filter((s) => s !== '' && s.indexOf(' ') === -1).join('&');

    return query;
}

export default ComposeFilters;