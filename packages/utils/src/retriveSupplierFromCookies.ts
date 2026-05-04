interface ColumnsProps {
    type: string;
    label: string;
};

//controlla se la colonna è un fornitore in modo da realizzare il filtro per le colonne fornitori.
export function RetriveSupplierFromCookies(cookieName: string) {
    // Leggi il cookie con il nome specificato
    const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith(`${cookieName}=`));

    // Se il cookie è presente, estrai gli elementi supplier da columns
    if (cookieValue) {
        const storedSettings = JSON.parse(decodeURIComponent(cookieValue.split('=')[1]));

        const arr = []
        const columns: ColumnsProps[] = [
            { type: 'supplier', label: 'Esprinet' },
            { type: 'supplier', label: 'Techdata' },
            { type: 'supplier', label: 'RibaMundo' },
            { type: 'supplier', label: 'Cometa' },
            { type: 'supplier', label: 'Brevi' },
            { type: 'supplier', label: 'Runner' },
            { type: 'supplier', label: 'Also' },
            { type: 'supplier', label: 'Xpres' },
            { type: 'supplier', label: 'ComputerGross' },
            { type: 'supplier', label: 'Nexths' },
            { type: 'supplier', label: 'Travion' },
            { type: 'supplier', label: 'Ecom' },
            { type: 'supplier', label: 'Kosatec' },
            { type: "supplier", label: "Axro" },
            { type: "supplier", label: "EuroOptions" },
            { type: "supplier", label: "Ingram" },          
            { type: "supplier", label: "Trexon" },     
        ]

        for (let i = 0; i < storedSettings.length; i++) {
            const e = storedSettings[i];
            const objFound = columns.find(elm => elm.type === 'supplier' && elm.label === e)
            if (objFound) {
                arr.push({ Name: e })
            }
        }

        return arr;
    } else {
        // Ritorna un array vuoto se il cookie non è presente
        return [];
    }
}