import { useCallback, useMemo, useState } from "react";
import { DEFAULT_PURCHASES_SORT } from "../components/PurchasesTable";
import type {
    PurchasesHeaderSortPayload,
    PurchasesQuery,
    PurchasesSortDirection,
    PurchasesSortField,
} from "../types";

/**
 * Restituisce la data odierna nel formato ISO semplificato `YYYY-MM-DD`.
 * Serve per valorizzare il range di default dei filtri data.
 */
function getTodayIsoDate(): string {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

/**
 * Restituisce la data ISO di N giorni fa (inclusiva della data odierna nel range complessivo).
 *
 * Esempio con `days = 29`:
 * - dateFrom = oggi - 29 giorni
 * - dateTo   = oggi
 * => finestra totale di 30 giorni, più stabile lato performance rispetto a range più ampi.
 */
function getIsoDateDaysAgo(days: number): string {
    const now = new Date();
    const safeDays = Number.isFinite(days) && days > 0 ? Math.floor(days) : 0;
    const target = new Date(now);
    target.setDate(target.getDate() - safeDays);

    const yyyy = target.getFullYear();
    const mm = String(target.getMonth() + 1).padStart(2, "0");
    const dd = String(target.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

/**
 * Crea la query di default della pagina acquisti.
 *
 * Scelta progettuale:
 * usiamo una finestra dinamica di 30 giorni (oggi-29 -> oggi) invece del classico
 * "inizio anno -> oggi", perché il dataset acquisti cresce continuamente e un range
 * troppo esteso aumenta costo query, tempi di risposta e rischio timeout.
 *
 * Nota:
 * il range resta comunque modificabile dall'utente nel pannello filtri.
 */
export function createDefaultPurchasesQuery(): PurchasesQuery {
    return {
        env: "",
        agentCodes: [],
        customerCodes: [],
        brandCodes: [],
        lineCodes: [],
        groupCodes: [],
        familyCodes: [],
        dateFrom: getIsoDateDaysAgo(29),
        dateTo: getTodayIsoDate(),
        sortField: "dataDocumento",
        sortDirection: "desc",
    };
}

/**
 * Costruisce lo stato iniziale dei filtri partendo da `location.state`.
 * Se la navigazione arriva da scheda cliente con `customerCode`, il range date viene lasciato vuoto.
 */
function buildInitialQueryFromLocationState(state: any): PurchasesQuery {
    const defaults = createDefaultPurchasesQuery();
    const customerCode = String(state?.customerCode ?? "").trim();

    if (customerCode) {
        return {
            ...defaults,
            customerCodes: [customerCode],
            dateFrom: "",
            dateTo: "",
        };
    }

    return defaults;
}

/**
 * Determina se l'utente può vedere/selezionare il filtro Agente lato frontend.
 * Il backend resta l'autorità finale, ma questa regola riduce confusione in UI.
 */
export function canSelectAgentByContext(userContext: any): boolean {
    const roleRaw = userContext?.details?.ruolo ?? userContext?.ruolo;
    const actorRoleRaw = userContext?.details?.actorRole ?? userContext?.actorRole;

    const roleLabel = String(roleRaw ?? "").trim().toLowerCase();
    const actorRole = Number(actorRoleRaw);

    const isAdminByRoleNumber = Number.isFinite(actorRole) && (actorRole === 0 || actorRole === 1);
    const isAdminByRoleLabel = ["admin", "dev", "amministrativo", "amministrazione"].includes(roleLabel);

    const caps = Array.isArray(userContext?.details?.caps)
        ? userContext.details.caps
        : Array.isArray(userContext?.caps)
            ? userContext.caps
            : [];

    const canByCap = caps.includes("fido.purchases.agent.select") || caps.includes("purchases.customers.agent.select");
    return isAdminByRoleNumber || isAdminByRoleLabel || canByCap;
}

/**
 * Mappa le chiavi di ordinamento della tabella (frontend) sui campi sort attesi dal backend.
 */
const sortFieldByColumn: Record<string, PurchasesSortField> = {
    environment: "ambiente",
    warehouse: "magazzino",
    documentNumber: "numeroDocumento",
    articleCode: "codiceArticolo",
    description: "descrizione",
    quantity: "quantita",
    unitPrice: "prezzo",
    rowValue: "valore",
    brand: "brand",
    documentDate: "dataDocumento",
    customerName: "ragioneSociale",
};

/**
 * Hook che centralizza lo stato dei filtri della pagina:
 * - `draftQuery`: filtri in modifica nel pannello;
 * - `appliedQuery`: filtri realmente applicati alla tabella;
 * - `sortState`: stato ordinamento visivo della tabella.
 */
export function usePurchasesQueryState(args: {
    locationState: any;
    userContext: any;
}) {
    const { locationState, userContext } = args;

    const initialQuery = useMemo(() => buildInitialQueryFromLocationState(locationState), [locationState]);
    const canSelectAgent = useMemo(() => canSelectAgentByContext(userContext), [userContext]);

    const [draftQuery, setDraftQuery] = useState<PurchasesQuery>(initialQuery);
    const [appliedQuery, setAppliedQuery] = useState<PurchasesQuery>(initialQuery);
    const [sortState, setSortState] = useState<PurchasesHeaderSortPayload>(DEFAULT_PURCHASES_SORT);

    /**
     * Aggiorna solo una porzione dei filtri in bozza mantenendo immutabilita.
     */
    const patchDraftQuery = useCallback((patch: Partial<PurchasesQuery>) => {
        setDraftQuery((prev) => ({ ...prev, ...patch }));
    }, []);

    /**
     * Traduce l'evento di sort della tabella in sort backend e lo applica ai filtri attivi.
     */
    const handleSortChange = useCallback((payload: PurchasesHeaderSortPayload) => {
        setSortState(payload);

        const mapped = sortFieldByColumn[String(payload.columnKey || "").trim()];
        if (!mapped || payload.sortDirection === 0) {
            setAppliedQuery((prev) => ({ ...prev, sortField: "dataDocumento", sortDirection: "desc" }));
            return;
        }

        const direction: PurchasesSortDirection = payload.sortDirection === 1 ? "asc" : "desc";
        setAppliedQuery((prev) => ({ ...prev, sortField: mapped, sortDirection: direction }));
    }, []);

    /**
     * Copia i filtri in bozza nei filtri applicati.
     * Manteniamo il sort corrente per non perdere l'ordinamento impostato dall'utente.
     */
    const applyDraftFilters = useCallback(() => {
        setAppliedQuery((prev) => ({
            ...draftQuery,
            sortField: prev.sortField,
            sortDirection: prev.sortDirection,
        }));
    }, [draftQuery]);

    /**
     * Ripristina i filtri ai valori di default mantenendo l'ordinamento corrente.
     */
    const resetFilters = useCallback(() => {
        const defaults = createDefaultPurchasesQuery();

        setDraftQuery(defaults);
        setAppliedQuery((prev) => ({
            ...defaults,
            sortField: prev.sortField,
            sortDirection: prev.sortDirection,
        }));
    }, []);

    return {
        draftQuery,
        appliedQuery,
        sortState,
        canSelectAgent,
        patchDraftQuery,
        handleSortChange,
        applyDraftFilters,
        resetFilters,
    };
}
