// src/layouts/compare/virtualziedTable/fetchData/data.ts
import { RetriveSupplierFromCookies } from "utils/retriveSupplierFromCookies";
import { FetchData } from "examples/Fetch";
import type { MutableRefObject, Dispatch, SetStateAction } from "react";

// ---- tipi locali ----
type DataRetriveProps = {
    abortController: MutableRefObject<AbortController | null>;
    buyerTarget: string | null;
    query: string;
    offset: MutableRefObject<number>;

    setSearchDataContext: Dispatch<SetStateAction<SearchDataShape>>;
    setPanelMode: Dispatch<SetStateAction<number>>;
    WarehouseRetriveData: WarehouseRetriveFn;
    setImpTableStatus: Dispatch<SetStateAction<boolean>>;
    ChangeLoadStatus: (params: { from: string; bool: boolean }) => void;
    setErr: Dispatch<SetStateAction<boolean>>;
};

// shape dello stato dati usato nel comparatore (minimo sufficiente)
type SearchDataShape = {
    dati?: unknown[];
    dataLength?: number;
    // altri campi possibili (warehouseToT, ecc.)
    [k: string]: unknown;
};

// callback per arricchire colonne/warehouse dopo la tabella
type WarehouseRetriveFn = ({ queryColumns, query }: { queryColumns: { Name: string }[]; query: string; buyerIDTarget?: string | null }) => void;

// risposta attesa dall’endpoint table
type TableResponse = {
    data: unknown[];
    dataLength?: number;
};

// ---- funzione ----
export async function DataRetrive({ buyerTarget, query, offset, abortController,
    setSearchDataContext, setPanelMode, WarehouseRetriveData, setImpTableStatus, setErr, ChangeLoadStatus }: DataRetriveProps): Promise<void> {
    // corpo richiesta
    const bodyToSend: {
        __dist?: Array<{ Name: string }>;
        byid?: string | null;
    } = {
        __dist: RetriveSupplierFromCookies("stored_settings"),
    };

    if (buyerTarget) {
        bodyToSend.byid = buyerTarget;
    }

    try {
        const res = await FetchData<TableResponse>(
            `${import.meta.env.VITE_API_PRODUCTS}table?${query}`,
            "POST",
            bodyToSend,
            abortController
        );

        setSearchDataContext((prev) => ({ ...prev, dati: res.data }));
        setImpTableStatus(false);

        // 0 => Compare && 1 => Exclude (modalità pannello)
        setPanelMode(0);
        ChangeLoadStatus({ from: 'table', bool: false });
        offset.current++;

        // dopo la tabella, recupero dati magazzino/categorie
        // WarehouseRetriveData({ queryColumns: RetriveSupplierFromCookies("stored_settings"), query });

        // [FIX] Propaghiamo anche il buyerTarget al retrive di warehouse/categorie,
        // così i KPI restano coerenti con la tabella (soprattutto al primo load da URL con byid).
        WarehouseRetriveData({
            queryColumns: RetriveSupplierFromCookies("stored_settings"),
            query,
            buyerIDTarget: buyerTarget, // <-- usa lo stesso buyer della tabella
        });
    } catch (error) {
        console.error(error);
        setErr(true);
    }
}