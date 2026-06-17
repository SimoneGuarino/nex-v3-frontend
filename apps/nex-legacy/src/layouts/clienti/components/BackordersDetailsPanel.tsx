// src/layouts/clienti/components/BackordersDetailsPanel.tsx
import React from "react";
import { TableVirtualized } from "components/Virtualized/table";
import { getData as getBackordersDetailsData } from "../fetchData/backorders/detailsData";
import { FDBox } from "@nex/fd-ui";
import { FDIconButton } from "@nex/fd-ui";
import { IoCloseOutline } from "react-icons/io5";


// ——————————————————————————————————————————————————————————
// TYPES & INTERFACE
// ——————————————————————————————————————————————————————————
type BackordersDetailsPanelProps = {
    open: boolean; //stato apertura modale
    onClose: () => void; //chiusura modale
    userContext: { [key: string]: any }; //contesto utente (token/permessi)
    companySelected?: any; //params.common.companySelected
    agentCode?: string | null; //params.common.agentCode
    customerCode?: string | null; //codice cliente selezionato
    customerLabel?: string | null; //ragione sociale (solo display)
};


// ——————————————————————————————————————————————————————————
// MAIN COMPONENT
// ——————————————————————————————————————————————————————————
/**
 * Modale con tabella virtualizzata dei backorders (dettaglio cliente).
 * Quando si apre: resetta paging e fa fetch prima pagina; supporta infinite scroll.
 * @returns
 */
export const BackordersDetailsPanel: React.FC<BackordersDetailsPanelProps> = ({
    open,
    onClose,
    userContext,
    companySelected,
    agentCode,
    customerCode,
    customerLabel,
}) => {
    const [rows, setRows] = React.useState<any[]>([]); //righe tabella dettaglio
    const [total, setTotal] = React.useState<number>(0); //totale record dal BE
    const [loading, setLoading] = React.useState(false); //stato loading fetch
    const offsetRef = React.useRef(0); //offset paging per infinite scroll
    const abortController = React.useRef<AbortController | null>(null); //abort fetch

    const columns = React.useMemo(
        () => [
            { key: "TIPO", label: "Tipo", sort: true, sortType: "string", type: "string", width: 80, sx: { alignItems: "center" } },
            { key: "CODICE_AGENTE", label: "Codice Agente", sort: true, sortType: "string", type: "string", width: 130, sx: { alignItems: "center" } },
            { key: "CODICE_CLIENTE", label: "Codice Cliente", sort: true, sortType: "number", type: "string", width: 130, sx: { alignItems: "center" } },
            { key: "RAGIONE_SOCIALE", label: "Ragione Sociale", sort: true, sortType: "string", type: "string", width: 200, sx: { alignItems: "center" } },
            { key: "RAGIONE_SOCIALE_2", label: "Ragione Sociale 2", sort: true, sortType: "string", type: "string", width: 200, sx: { alignItems: "center" } },
            { key: "PARTITA_IVA", label: "Partita IVA", sort: true, sortType: "number", type: "string", width: 160, sx: { alignItems: "center" } },
            { key: "NUMERO_ORDINE", label: "Numero Ordine", sort: true, sortType: "number", type: "string", width: 160, sx: { alignItems: "center" } },
            { key: "NUMERO_RIGA", label: "Numero Riga", sort: true, sortType: "number", width: 110, type: "string", sx: { alignItems: "center" } },
            { key: "DATA_ORDINE", label: "Data Ordine", sort: false, type: "string", width: 120, sx: { alignItems: "center" } },
            { key: "CODICE_MAGAZZINO", label: "Codice Magazzino", sort: true, sortType: "number", type: "string", width: 150, sx: { alignItems: "center" } },
            { key: "CODICE_INTERNO", label: "Codice Interno", sortType: "number", sort: true, type: "string", width: 200, sx: { alignItems: "center" } },
            { key: "CODICE_PRODUTTORE", label: "Codice Produttore", sort: true, type: "string", sortType: "number", width: 200, sx: { alignItems: "center" } },
            { key: "DESCRIZIONE_PRODOTTO", label: "Descrizione", sort: false, type: "string", width: 250, sx: { alignItems: "center" } },
            { key: "QUANTITA_ODINATA", label: "Quantità Ordinata", sort: false, type: "string", width: 100, sx: { alignItems: "center" } },
            { key: "QUANTITA_EVASA", label: "Quantità Evasa", sort: false, type: "string", width: 100, sx: { alignItems: "center" } },
            { key: "QUANTITA_RESIDUA", label: "Quantità Residua", sort: false, type: "string", width: 100, sx: { alignItems: "center" } },
            { key: "QUANTITA_IN_CONSEGNA", label: "In Consegna", sort: false, type: "string", width: 100, sx: { alignItems: "center" } },
            { key: "PREZZO", label: "Prezzo", sort: false, type: "eur", width: 100, sx: { alignItems: "center" } },
        ],
        []
    );

    /**
     * Costruisce il body per la rotta di dettaglio backorders (cmp + ccom + ccli).
     * @returns
     */
    const makeBody = React.useCallback(() => {
        const body: any = { cmp: companySelected };
        if (agentCode) body.ccom = agentCode;
        if (customerCode) body.ccli = customerCode;
        return body;
    }, [companySelected, agentCode, customerCode]);

    /**
     * Fetch prima pagina (quando la modale si apre).
     * Resetta offset e righe prima di chiamare il BE.
     * @returns
     */
    const fetchFirstPage = React.useCallback(async () => {
        if (!open) return;
        if (!userContext?.token) return;
        if (!customerCode) return;

        setLoading(true);
        offsetRef.current = 0;
        setRows([]);

        await getBackordersDetailsData({
            userContext,
            abortController,
            body: makeBody(),
            offset: offsetRef,
            setData: setRows,
            setErr: () => { },
            ChangeLoadStatus: () => { },
            setTotal,
        });

        setLoading(false);
    }, [open, userContext?.token, customerCode, makeBody]);

    // gestione apertura/chiusura modale
    React.useEffect(() => {
        if (open && customerCode) {
            fetchFirstPage();
        } else if (!open) {
            setRows([]);
            setTotal(0);
            offsetRef.current = 0;
        }
    }, [open, customerCode, fetchFirstPage]);

    /**
     * Infinite scroll: carica altre righe finché non raggiunge il totale.
     * @returns Promise<boolean>
     */
    const infiniteScroll = React.useCallback(() => {
        if (!userContext?.token) return Promise.resolve(false);
        if (!open) return Promise.resolve(false);
        if (loading || (total && rows.length >= total)) return Promise.resolve(false);

        return getBackordersDetailsData({
            userContext,
            abortController,
            body: makeBody(),
            offset: offsetRef,
            setData: setRows,
            setErr: () => { },
            ChangeLoadStatus: () => { },
            setTotal,
        }) as unknown as Promise<any>;
    }, [userContext?.token, open, loading, total, rows.length, makeBody]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* overlay */}
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            {/* modal */}
            <FDBox
                radius="lg"
                className="relative z-10 w-full max-w-6xl flex flex-col max-h-[90vh] "
            >
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                        Dettaglio backorders cliente{" "}
                        {customerCode ? `${customerCode}` : ""}
                        {customerLabel ? ` - ${customerLabel}` : ""}
                    </h2>

                    <FDIconButton
                        icon={IoCloseOutline({})}
                        variant="danger"
                        onClick={onClose}
                    />
                </div>

                <div className="p-4 flex-1 min-h-[300px] overflow-y-auto">
                    <TableVirtualized
                        data={rows}
                        setData={setRows}
                        columns={columns}
                        setColumns={() => { }}
                        results={total}
                        loadStatus={loading}
                        whereToFindData={false}
                        footer
                        infiniteScroll={{ func: infiniteScroll }}
                        className="h-full"
                    />
                </div>
            </FDBox>
        </div>
    );
};
