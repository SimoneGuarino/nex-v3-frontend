import React, { useCallback, useMemo, useRef, useState } from "react";
import { enqueueSnackbar } from "components/MessageBox";
import { SearchItem, writeRecent } from "components/UI/search/FDSearchPanel";
import { FiltersType, Pagination, ProductDoc, CartProductDTO, SearchResponse, ContropropostaDTO, ProductEventType, ProductEventDTO, TextRequestCartDTO, QuotationeCart, CommercialAlternativeSuggestionDTO } from "layouts/quotazioni/types/qts_product";
import { SearchProductsAPI } from "../fetchdata/get/searchProducts";
import { CategoryListAPI } from "../fetchdata/get/categoryList";
import { AddProductsToCartAPI, AddProductsResponse, DeleteProductsToCartAPI, UpdateQtsProductStateAPI, ReassignQtsProductBuyerAPI, CreateTextRequestAPI, CreateCommercialAlternativeSuggestionAPI, DeleteCommercialAlternativeSuggestionAPI } from "../fetchdata/cart/products";
import { useParams } from "react-router-dom";
import { useUserContext } from "context/UserContext";
import { getOwnQuotationDetailsData } from "../fetchdata/get/getOwnQuotationDetailsData";
import { getCartData } from "../fetchdata/cart/getCartData";
import { QuotazioneDetailsResponse, QuotazioneDTO, RigaStato, stateProductLabels, Stato } from "layouts/quotazioni/types/quotations";
import { OpenQuotationAPI } from "../fetchdata/post/editQuotationState";
import { SearchCartProductsAPI } from "../fetchdata/get/searchCartProducts";
import { ImportFromFileSummary, UploadCartFromFileAPI } from "../fetchdata/cart/UploadCartFromFileAPI";
import { AddProductEventAPI } from "../fetchdata/post/productEvents";
import { clearCartData } from "../fetchdata/cart/clearCartData";
import SendLogs from "logs";
import { Notifications } from "utils/notifications/notifications";
import { CapitalizeFirstLetter } from "utils/string/capitalize";
import { EditQuotationValidityAPI } from "../fetchdata/post/editQuotationWindowValidity";
import { EditQuotationCustomerAPI } from "../fetchdata/post/editQuotationCustomer";
import { ClosureDraft } from "../types/closure";
import { getCartProduct } from "../fetchdata/cart/getCartProduct";
import { GetQuotationOkLinksAPI } from "../fetchdata/get/getQuotationOkLinks";
import { CheckAdminPermissions } from "utils";
import { FDSelectOption } from "components/UI/input/FDSelect";


// ——————————————————————————————————————————————————————————
// TYPES & INTERFACES
// ——————————————————————————————————————————————————————————
type fetchSearchParams = {
    query: string;
    signal: AbortController;
    fromScroll?: boolean;
    offset?: number;
};
export type ScopeTab = 'quotazioni' | 'prodotti' | 'descrivi_necessita';
type SearchResponseWithPagination = SearchResponse & { pagination?: Pagination };
type CacheEntry = { ts: number; data: SearchResponseWithPagination };

type PriceQuotePayloadFE = {
    prezzo_base?: CartProductDTO["quotazione"]["prezzo_base"];
    sconto_percentuale?: CartProductDTO["quotazione"]["sconto_percentuale"];
    prezzo_finale?: CartProductDTO["quotazione"]["prezzo_finale"];
    validita_offerta?: string | null;
    scadenza?: string | null;
    stato?: RigaStato;
};

export type UpdateQtsProductBodyFE = {
    newState: RigaStato;
    mode: "PRICE" | "SUBSTITUTION" | "SUBSTITUTION_APPROVED" | "STATE_ONLY";
    expectedState?: RigaStato;
    expectedUpdatedAt?: string;
    quotazione?: PriceQuotePayloadFE;
    substitution?: Omit<ContropropostaDTO, "_id">[];
    approvedIdDocs?: string[];
};

export type CreateTextRequestPayload = {
    codice_buyer: string;
    descrizione: string;    // testo libero del commerciale (“descrivi la necessità”)
    titolo?: string | null;  // opzionale, se vuoi un titolo breve
    note?: string | null;   // eventuali note interne
};

type DuplicateQuotationCandidate = {
    _id: string;
    codice?: string;
    cig?: string;
    cup?: string;
    stato?: string;
    created_at?: string;
};

// Stati ammessi per il workflow lato quotazioni (metadato toState/fromState).
// Nota: questi sono gli unici valori considerati per generare copy esplicativa.
type ProductWorkflowState =
    | "ATTESA_VALUTAZIONE"
    | "VALUTAZIONE_COMPLETATA"
    | "VALUTAZIONE_RIFIUTATA"
    | "ATTESA_APPROVAZIONE"
    | "CONTROPROPOSTA_RICHIESTA"
    | "CONTROPROPOSTA_INVIATA"
    | "CONTROPROPOSTA_ACCETTATA"
    | "CONTROPROPOSTA_RIFIUTATA";

type NotificationAudience = "BUYER" | "REQUESTER" | "BOTH";

type ProductEventNotifyOptions = {
    /**
     * Abilita/disabilita l’invio notifica per questo singolo evento.
     * Default: true (per backward-compat con il comportamento storico).
     */
    enabled?: boolean;
    /** Override forzato dell’audience (di default viene dedotta da actorRole + eventType). */
    audience?: NotificationAudience;
    /** Namespace logico usato in SendLogs per analytics/audit. */
    logScope?: string;
    /** Abilita la notifica snackbar per questo evento ad evento completo */
    notifyMessage?: {
        tags?: string[]; // tags extra da aggiungere alla notifica (es. per styling differente)
        header?: string;
    }
    enqueueSnackbar?: {
        message: string;
        type?: "info" | "success" | "warning" | "error";
    }
};

type CategoryDataItem = {
    _id: string;
    Marca?: string;
    Categories?: CategoryLine[];
    PrefissiFornitore?: string[];
};

export type CategoryLine = {
    Linea?: string;
    DescrizioneLinea?: string;
    SubCategory?: CategoryGroup[];
};

export type CategoryGroup = {
    Gruppo?: string;
    DescrizioneGruppo?: string;
};

export type CategoryIndex = {
    prefissoOptions: FDSelectOption[];

    allLineaOptions: FDSelectOption[];
    allGruppoOptions: FDSelectOption[];

    gruppiByLinea: Map<string, Map<string, FDSelectOption>>;
    lineeByGruppo: Map<string, Map<string, FDSelectOption>>;
};


// ——————————————————————————————————————————————————————————
// CONSTANTS
// ——————————————————————————————————————————————————————————
const DEBOUNCE_MS = 280;                 // finestra di debounce
const CACHE_TTL_MS = 60_000;             // 60s di cache
const CACHE_MAX = 50;                    // LRU size cap
const lru = new Map<string, CacheEntry>(); // chiave: query+filtri
export const DONE_PRODUCT_STATES = new Set<string>([
    "VALUTAZIONE_COMPLETATA",
    "VALUTAZIONE_RIFIUTATA",
    "CONTROPROPOSTA_ACCETTATA",
    "CONTROPROPOSTA_RIFIUTATA"
]);
export const DONE_QUOTATION_STATES = new Set<string>([
    "OK",
    "KO"
]);


// ——————————————————————————————————————————————————————————
// HELPERS
// ——————————————————————————————————————————————————————————
function setLRU(key: string, val: CacheEntry) {
    lru.set(key, val);
    if (lru.size > CACHE_MAX) {
        // rimuovi l’entry più vecchia
        const oldest = [...lru.entries()].reduce((a, b) => (a[1].ts < b[1].ts ? a : b))[0];
        lru.delete(oldest);
    }
};

function cleanOptionalString(value: unknown): string | undefined {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}

function toFiniteNumber(value: unknown): number | undefined {
    const normalized = typeof value === "number" ? value : Number(value);
    return Number.isFinite(normalized) ? normalized : undefined;
}

function stripNullishDeep<T>(value: T): T {
    if (Array.isArray(value)) {
        return value
            .map((entry) => stripNullishDeep(entry))
            .filter((entry) => entry !== undefined && entry !== null) as unknown as T;
    }

    if (value && typeof value === "object" && !(value instanceof Date)) {
        const entries = Object.entries(value as Record<string, unknown>)
            .filter(([, v]) => v !== null && v !== undefined)
            .map(([k, v]) => [k, stripNullishDeep(v)])
            .filter(([, v]) => !(typeof v === "string" && v.trim() === ""));
        return Object.fromEntries(entries) as T;
    }

    return value;
}

function buildSubstitutionPayloadItem(params: {
    substitution: ContropropostaDTO;
    quotationId: string;
    quotationProductDocId: string;
    fallbackBuyerCode: string | null;
}): Omit<ContropropostaDTO, "_id"> | null {
    const { substitution, quotationId, quotationProductDocId, fallbackBuyerCode } = params;

    const productId = cleanOptionalString(substitution?.product_id);
    if (!productId) return null;

    const prezzoFinale = toFiniteNumber(substitution?.quotazione?.prezzo_finale);
    const prezzoBase = toFiniteNumber(substitution?.quotazione?.prezzo_base);
    const sconto = toFiniteNumber(substitution?.quotazione?.sconto_percentuale);
    const quantity = toFiniteNumber(substitution?.quantita);

    // Il backend rifiuta diversi campi stringa null.
    return stripNullishDeep({
        quotation_id: cleanOptionalString(substitution?.quotation_id) ?? quotationId,
        quotation_product_docId:
            cleanOptionalString(substitution?.quotation_product_docId) ?? quotationProductDocId,
        product_id: productId,
        quantita: quantity && quantity > 0 ? Math.floor(quantity) : 1,
        codice_buyer:
            cleanOptionalString(substitution?.codice_buyer) ??
            cleanOptionalString(fallbackBuyerCode),
        stato: substitution?.stato ?? "ATTESA_VALUTAZIONE",
        ...(typeof substitution?.round === "number" ? { round: substitution.round } : {}),
        dettagli_prodotto: {
            descrizione: cleanOptionalString(substitution?.dettagli_prodotto?.descrizione),
            anteprima: cleanOptionalString(substitution?.dettagli_prodotto?.anteprima),
            marca: cleanOptionalString(substitution?.dettagli_prodotto?.marca),
            codiceProduttore: cleanOptionalString(substitution?.dettagli_prodotto?.codiceProduttore),
            codiceEAN: cleanOptionalString(substitution?.dettagli_prodotto?.codiceEAN),
            linea: cleanOptionalString(substitution?.dettagli_prodotto?.linea),
            gruppo: cleanOptionalString(substitution?.dettagli_prodotto?.gruppo),
            famiglia: cleanOptionalString(substitution?.dettagli_prodotto?.famiglia),
            descrizioneLinea: cleanOptionalString(substitution?.dettagli_prodotto?.descrizioneLinea),
            descrizioneGruppo: cleanOptionalString(substitution?.dettagli_prodotto?.descrizioneGruppo),
            descrizioneFamiglia: cleanOptionalString(substitution?.dettagli_prodotto?.descrizioneFamiglia),
        },
        quotazione: {
            ...(prezzoBase !== undefined ? { prezzo_base: prezzoBase } : {}),
            ...(sconto !== undefined ? { sconto_percentuale: sconto } : {}),
            prezzo_finale: prezzoFinale ?? 0,
            validita_offerta: cleanOptionalString(substitution?.quotazione?.validita_offerta),
            scadenza: cleanOptionalString(substitution?.quotazione?.scadenza),
        },
        createdBy: {
            nome: cleanOptionalString(substitution?.createdBy?.nome),
            username: cleanOptionalString(substitution?.createdBy?.username),
            ruolo: cleanOptionalString(substitution?.createdBy?.ruolo),
        },
        createdAt: substitution?.createdAt,
        updatedAt: substitution?.updatedAt,
    }) as Omit<ContropropostaDTO, "_id">;
}


// ——————————————————————————————————————————————————————————
// NOTIFICATIONS (event → audience + copy) 
// ——————————————————————————————————————————————————————————
function isBuyerRole(role: unknown): boolean {
    return typeof role === "string" && role.toUpperCase().includes("BUYER");
};

function getCurrentUserBuyerCode(userState: any): string | null {
    const raw =
        userState?.details?.codici?.buyer ??
        userState?.details?.buyerCode ??
        userState?.details?.buyer_code ??
        null;

    const normalized = raw ? String(raw).trim().toUpperCase() : "";
    return normalized || null;
}

function stateLabel(s?: RigaStato | null): string {
    if (!s) return "N/A";
    return stateProductLabels?.[s] ?? s;
};

function isProductWorkflowState(v: unknown): v is ProductWorkflowState {
    return (
        v === "ATTESA_VALUTAZIONE" ||
        v === "VALUTAZIONE_COMPLETATA" ||
        v === "VALUTAZIONE_RIFIUTATA" ||
        v === "ATTESA_APPROVAZIONE" ||
        v === "CONTROPROPOSTA_RICHIESTA" ||
        v === "CONTROPROPOSTA_INVIATA" ||
        v === "CONTROPROPOSTA_ACCETTATA" ||
        v === "CONTROPROPOSTA_RIFIUTATA"
    );
}

function workflowStateMessage(toState: ProductWorkflowState): string {
    switch (toState) {
        case "ATTESA_VALUTAZIONE":
            return "Il prodotto è ora in attesa di valutazione da parte del buyer.";
        case "VALUTAZIONE_COMPLETATA":
            return "La valutazione del prodotto è stata completata.";
        case "VALUTAZIONE_RIFIUTATA":
            return "La valutazione del prodotto è stata rifiutata.";
        case "ATTESA_APPROVAZIONE":
            return "Il prodotto è ora in attesa di approvazione.";
        case "CONTROPROPOSTA_RICHIESTA":
            return "È stata richiesta una controproposta per il prodotto.";
        case "CONTROPROPOSTA_INVIATA":
            return "È stata inviata una controproposta per il prodotto.";
        case "CONTROPROPOSTA_ACCETTATA":
            return "La controproposta è stata accettata.";
        case "CONTROPROPOSTA_RIFIUTATA":
            return "La controproposta è stata rifiutata.";
        default: {
            // exhaustive
            const _exhaustive: never = toState;
            return String(_exhaustive);
        }
    }
}
/**
 * Restituisce l'entry se valida, altrimenti null
 * @param key 
 * @returns SearchResponse | null
 */
function getLRU(key: string): SearchResponseWithPagination | null {
    const hit = lru.get(key);
    if (!hit) return null;
    if (Date.now() - hit.ts > CACHE_TTL_MS) { lru.delete(key); return null; }
    // touch
    lru.delete(key); lru.set(key, hit);
    return hit.data;
};
/**
 * Costruisce un evento di timeline con metadati standard.
 */
const buildProductEvent = (params: {
    type: ProductEventType;
    message?: string;
    actorRole: string;
    actorName: string | null;
    actorUsername: string | null;
    meta?: ProductEventDTO["meta"];
}): ProductEventDTO => {
    const now = new Date().toISOString();

    return {
        id: `local-${now}-${Math.random().toString(36).slice(2)}`,
        type: params.type,
        timestamp: now,
        actor: {
            name: params.actorName,
            username: params.actorUsername,
            role: params.actorRole,
        },
        message: params.message ?? null,
        meta: params.meta ?? null,
    };
};

export const normalizeKey = (value: unknown): string => {
    return String(value ?? "").trim();
};

export const toOptionLabel = (value: string, description?: string): string => {
    return description ? `${value} - ${description}` : value;
};


// ——————————————————————————————————————————————————————————
// HOOK
// ——————————————————————————————————————————————————————————
export function useDetailsQuotation() {
    const { id: quotationIdParam } = useParams<{ id: string }>(); // id della quotazione dal path
    const quotationId = quotationIdParam || "";

    const [userState] = useUserContext();

    const [cart, setCart] = useState<Array<CartProductDTO | TextRequestCartDTO>>([]); // carrello prodotti
    const [raw, setRaw] = useState<Array<any>>([]); // conteggio risultati grezzi

    // per mostrare/nascondere il pannello impostazioni prodotti quotazione, seleziona il prodotto corrente
    const [openProductQtsSettings, setOpenProductQtsSettings] = useState<CartProductDTO | TextRequestCartDTO | null>(null);
    const [openCustomersDetails, setOpenCustomersDetails] = useState<boolean>(false); // per mostrare/nascondere il pannello dettagli cliente
    const [openFilters, setOpenFilters] = useState<boolean>(false); // per mostrare/nascondere il pannello filtri
    const [openSearch, setOpenSearch] = useState<boolean | { from: ScopeTab | "propose_qts_products"; bool: boolean }>(false); // per mostrare/nascondere il pannello di ricerca
    const contextMenuRef = useRef<HTMLDivElement>(null); // per posizionare il context menu

    const [view, setView] = useState<'grid' | 'list'>('grid'); // modalità di visualizzazione: grid/list
    const [scope, setScope] = useState<ScopeTab>('quotazioni'); // tab attivo - "quotazioni" | "prodotti" | "descrivi_necessita"
    const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');

    const [searchItems, setSearchItems] = useState<Array<any>>([]); // items filtrati dalla ricerca per i prodotti totali
    const [searchCartItems, setSearchCartItems] = useState<Array<any>>([]); // items filtrati dalla ricerca per i prodotti nel carrello
    const [highlightedItemId, setHighlightedItemId] = useState<string[]>([]); // id degli items evidenziati nel carrello
    const [recentSearch, setRecentSearch] = useState<string[]>(() => {// ricerche recenti
        const rec = localStorage.getItem("fd_qts_products_recent_q");
        return rec ? JSON.parse(rec) : [];
    });
    const [categoryData, setCategoryData] = useState<any[]>([]); // dati delle categorie per i filtri

    const [uploadingFromFile, setUploadingFromFile] = useState(false); // stato di upload da file
    const [loading, setLoading] = useState<{ [key: string]: boolean | Map<string, boolean> }>({
        general_data: false,
        cart: false, // stato per il tracciamento del loading del carrello
        change_validity_window: false, // stato per il tracciamento del loading della modifica della finestra di validità
        table_of_products: false,
        loadingMore: false,
        search_replace_products: false, // stato per il tracciamento del loading della ricerca sostitutiva dei prodotti
        get_quotation_ok_links: false, // stato per il tracciamento del loading dei link "OK" per OC/FB associati alla quotazione
        adding_to_cart: new Map<string, boolean>(), // stato per il tracciamento del loading dell'aggiunta al carrello
        adding_to_alternatives_category: new Map<string, boolean>(), // stato per il tracciamento del loading dell'aggiunta delle alternative commerciali
        add_product_note: false, // stato per il tracciamento del loading dell'invio della nota del prodotto
        agents_alternatives: new Map<string, boolean>(), // stato per il tracciamento del loading dell'assegnazione degli agenti alle alternative commerciali
    }); // stato di caricamento della ricerca
    const [loadingSearch, setLoadingSearch] = useState<boolean>(false); // stato di caricamento della ricerca
    const [filters, setFilters] = useState<FiltersType>({
        marca: null,
        linea: null,
        gruppo: null,
        famiglia: null,
        raggruppamento: null,
    }); // filtri applicati alla ricerca dei prodotti
    const [searchQuery, setSearchQuery] = useState<string>(""); // query di ricerca
    const [inpagination, setInpagination] = useState<Pagination>(); // stato della paginazione

    const [customer, setCustomer] = useState<any>(null); // dettagli relativi al cliente
    const [qts, setQts] = useState<QuotazioneDTO | null>(null); // dettagli quotazione

    const [currentProposalNote, setCurrentProposalNote] = useState<string>(""); // nota per la proposta corrente
    const [assigningBuyer, setAssigningBuyer] = useState(false); // stato di assegnazione buyer sul singolo prodotto
    const [reportingAnomaly, setReportingAnomaly] = useState(false); // loading invio segnalazione anomalia scheda

    // per gestire l'apertura del pannello dei link "OK" (es. ordine, MEPA) associati alla quotazione
    const [openOkLinksPanel, setOpenOkLinksPanel] = useState(false);
    const [okLinks, setOkLinks] = useState<any[]>([]);

    const [errorMsg, setErrorMsg] = useState<string | null>(null); // messaggio di errore generico
    const inflight = useRef<AbortController | null>(null); // 1 sola fetch attiva
    const abortdebounceRef = useRef<AbortController | null>(null); // per abortire fetch debounced
    const abortDirectRef = useRef<AbortController | null>(null); // per abortire fetch dirette
    const abortQtsRef = useRef<AbortController | null>(null); // per abortire fetch dettagli quotazione
    const abortCartRef = useRef<AbortController | null>(null); // per abortire fetch carrello
    const abortUploadFileRef = useRef<AbortController | null>(null); // per abortire fetch carrello
    const debounceId = useRef<number | null>(null);
    const lastSentKey = useRef<string>(""); // per dedupe richieste identiche
    const lastApplied = useRef(0);  // ultima risposta applicata
    const seq = useRef(0);          // id sequenziale richieste inviate

    const CheckAdminDev = CheckAdminPermissions({
        userRole: userState?.details?.ruolo ?? "N/A",
        permissions: userState?.details?.permissions,
        rolesToCheck: [0, 1],
        panelToCheck: 'dettagli_quotazione',
    });

    /**
    * Stati prodotto considerati "completati" ai fini della chiusura quotazione.
    * Nota: se in futuro aggiungi nuovi stati terminali, li metti qui.
    */
    // Stati modale
    const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
    const [duplicateCandidates, setDuplicateCandidates] = useState<DuplicateQuotationCandidate[]>([]);

    // Tiene memoria dell’ultima richiesta di apertura bloccata per duplicato
    const pendingOpenRef = useRef<{ id: string; state: string } | null>(null);

    // Evita doppia gestione error (snackbar + modale)
    const duplicateHandledRef = useRef(false);
    const isPassiveBid = qts?.tipologia === "BID_PASSIVO";

    // ——————————————————————————————————————————————————————————
    // FETCHES
    // ——————————————————————————————————————————————————————————
    /**
     * Funzione per eseguire la ricerca dei prodotti presenti sul database
     * @param query La query di ricerca
     * @param signal Il segnale di abort
     * @param fromScroll Indica se la ricerca è stata chiamata dallo scroll (per paginazione)
     * @returns SearchResponse
     */
    const fetchSearch = useCallback(async ({ query, signal, fromScroll, offset }: fetchSearchParams) => {
        const params = new URLSearchParams();

        if (query.trim() !== "") params.set("sstr", query.trim());

        if (fromScroll && typeof offset === "number") {
            params.set("ofs", String(offset));
        };

        //componi i parametri di filtro
        Object.entries(filters).forEach(([k, v]) => {
            if (v !== null && v !== undefined) {
                params.set(k, (v as any)[k === "famiglia" ? k : CapitalizeFirstLetter(k)]);
            }
        });

        const data = await SearchProductsAPI({
            abortController: signal,
            quotationId,
            query: params.toString(),
            ChangeLoadStatus: () => { }
        });

        return {
            items: data?.items || [],
            pagination: (data as any)?.pagination,
            counts: { raw: 0, flat: 0 }
        };
    }, [filters, quotationId]);

    /**
     * Funzione per eseguire la ricerca dei prodotti presenti nel carrello (nella quotazione)
     * @param query La query di ricerca
     * @param signal Il segnale di abort
     * @param fromScroll Indica se la ricerca è stata chiamata dallo scroll (per paginazione)
     * @returns SearchResponse
     */
    const fetchSearchOnCart = useCallback(async ({ query, signal, fromScroll, offset }: fetchSearchParams): Promise<SearchResponseWithPagination> => {
        const params = new URLSearchParams();

        if (query.trim() !== "") {
            params.set("sstr", query.trim());
        };

        if (fromScroll && typeof offset === "number") {
            params.set("ofs", String(offset));
        };

        //componi i parametri di filtro
        Object.entries(filters).forEach(([k, v]) => {
            if (v !== null && v !== undefined) {
                params.set(k, (v as any)[k === "famiglia" ? k : CapitalizeFirstLetter(k)]);
            }
        });

        const data = await SearchCartProductsAPI({
            abortController: signal,
            quotationId,
            query: params.toString(),
            ChangeLoadStatus: () => { }
        });

        return {
            items: data?.items || [],
            pagination: (data as any)?.pagination,
            counts: { raw: 0, flat: 0 }
        };
    }, [quotationId, filters]);

    /** Recupera le informazioni dei brand-linea-gruppo-famiglia */
    const fetchCategories = () => {
        CategoryListAPI({ abortController: new AbortController(), setCategoryData })
    };

    /** fetch details */
    const fetchDetails = ({ avoidCartFetch = false, avoidProductFetch = false, avoidCategoriesFetch = false }:
        { avoidCartFetch?: boolean, avoidProductFetch?: boolean, avoidCategoriesFetch?: boolean }) => {
        getOwnQuotationDetailsData({
            abortController: (abortQtsRef.current = new AbortController()),
            user: userState,
            quotationId,
            HandleComplete: (res: QuotazioneDetailsResponse) => {
                if (res) {
                    if (res.data) {
                        setQts(res.data)
                    };
                    if (res.cliente) {
                        setCustomer(res.cliente)
                    };

                    if (!avoidCartFetch) fetchCart();
                    if (!avoidProductFetch) runSearch("", false);
                    if (!avoidCategoriesFetch) fetchCategories();
                }
            },
            HandleError: (msg) => setErrorMsg(String(msg || "Errore nel recupero dettagli.")),
            ChangeLoadStatus: ({ bool }) => setLoading(prev => ({ ...prev, general_data: Boolean(bool) })),
        });
    };

    /** fetch cart */
    const fetchCart = () => {
        setLoading(prev => ({ ...prev, cart: true }));
        return getCartData({
            abortController: (abortCartRef.current = new AbortController()),
            quotationId,
            HandleComplete: (res: { data: CartProductDTO[] }) => {
                if (res && Array.isArray(res.data)) {
                    setCart(res.data);
                };
            },
            HandleError: (msg) => setErrorMsg(String(msg || "Errore nel recupero del carrello.")),
            ChangeLoadStatus: ({ bool }) => setLoading(prev => ({ ...prev, cart: Boolean(bool) })),
        });
    };

    const fetchQuotationOkLinks = useCallback(() => {
        if (!quotationId) return;

        GetQuotationOkLinksAPI({
            abortController: new AbortController(),
            quotationId,
            ChangeLoadStatus: ({ bool }) =>
                setLoading((prev) => ({ ...prev, get_quotation_ok_links: Boolean(bool) })),
        }).then((res) => {
            if (res?.data) {
                setOkLinks(res.data);
            }
        });
    }, [quotationId]);


    // ——————————————————————————————————————————————————————————
    // FILTERS BUILDERS ON PRODUCT
    // ——————————————————————————————————————————————————————————
    const buildCategoryIndex = (categoryData: CategoryDataItem[]): CategoryIndex => {
        const prefissiSet = new Set<string>();

        const allLineeMap = new Map<string, FDSelectOption>();
        const allGruppiMap = new Map<string, FDSelectOption>();

        const gruppiByLinea = new Map<string, Map<string, FDSelectOption>>();
        const lineeByGruppo = new Map<string, Map<string, FDSelectOption>>();

        for (const brandItem of categoryData) {
            if (Array.isArray(brandItem.PrefissiFornitore)) {
                for (const prefisso of brandItem.PrefissiFornitore) {
                    const value = normalizeKey(prefisso);

                    if (value) {
                        prefissiSet.add(value);
                    }
                }
            }

            if (!Array.isArray(brandItem.Categories)) continue;

            for (const category of brandItem.Categories) {
                const lineaValue = normalizeKey(category.Linea);
                const lineaDescription = normalizeKey(category.DescrizioneLinea);

                if (!lineaValue) continue;

                const lineaOption: FDSelectOption = {
                    value: lineaValue,
                    label: toOptionLabel(lineaValue, lineaDescription),
                };

                if (!allLineeMap.has(lineaValue)) {
                    allLineeMap.set(lineaValue, lineaOption);
                }

                if (!gruppiByLinea.has(lineaValue)) {
                    gruppiByLinea.set(lineaValue, new Map<string, FDSelectOption>());
                }

                if (!Array.isArray(category.SubCategory)) continue;

                for (const subCategory of category.SubCategory) {
                    const gruppoValue = normalizeKey(subCategory.Gruppo);
                    const gruppoDescription = normalizeKey(subCategory.DescrizioneGruppo);

                    if (!gruppoValue) continue;

                    const gruppoOption: FDSelectOption = {
                        value: gruppoValue,
                        label: toOptionLabel(gruppoValue, gruppoDescription),
                    };

                    if (!allGruppiMap.has(gruppoValue)) {
                        allGruppiMap.set(gruppoValue, gruppoOption);
                    }

                    gruppiByLinea.get(lineaValue)?.set(gruppoValue, gruppoOption);

                    if (!lineeByGruppo.has(gruppoValue)) {
                        lineeByGruppo.set(gruppoValue, new Map<string, FDSelectOption>());
                    }

                    lineeByGruppo.get(gruppoValue)?.set(lineaValue, lineaOption);
                }
            }
        }

        return {
            prefissoOptions: Array.from(prefissiSet, (prefisso) => ({
                value: prefisso,
                label: prefisso,
            })),

            allLineaOptions: Array.from(allLineeMap.values()),
            allGruppoOptions: Array.from(allGruppiMap.values()),

            gruppiByLinea,
            lineeByGruppo,
        };
    };

    const categoryIndex = useMemo<CategoryIndex>(() => {
        if (!isPassiveBid || !Array.isArray(categoryData)) {
            return {
                prefissoOptions: [],
                allLineaOptions: [],
                allGruppoOptions: [],
                gruppiByLinea: new Map(),
                lineeByGruppo: new Map(),
            };
        }

        return buildCategoryIndex(categoryData);
    }, [categoryData, isPassiveBid]);


    // ——————————————————————————————————————————————————————————
    // SEARCH HANDLERS
    // ——————————————————————————————————————————————————————————
    /** Funzione richiamanta quando selezioni un elemento dal pannello di ricerca */
    const handleSelectFromSearch = async (it: SearchItem<any>) => {
        const r = it.payload as ProductDoc;

        // Nel pannello di ricerca mirata non facciamo add/remove al click riga:
        // la gestione avviene solo dal pulsante carrello a destra.
        if (
            openSearch &&
            typeof openSearch === "object" &&
            (openSearch.from === "quotazioni" || openSearch.from === "prodotti")
            && qts?.stato !== "BOZZA"
        ) {
            const documentProd = r as CartProductDTO;
            //controlla se il prodotto è già nel carrello per eventualmente aggiornare la quantità
            const existingProduct = cart.find(item => (item.kind === "PRODUCT" ? (item as CartProductDTO).product_id : (item as TextRequestCartDTO)._id) === documentProd._id);

            setHighlightedItemId([documentProd._id]);

            if (existingProduct) {
                setCart((prevCart: Array<CartProductDTO | TextRequestCartDTO>) => {
                    const newCart = prevCart.filter(item => item.kind === "PRODUCT" ?
                        (item as CartProductDTO).product_id !== documentProd._id : (item as TextRequestCartDTO)._id !== documentProd._id);
                    newCart.unshift(existingProduct); // sposta in prima posizione
                    return newCart;
                });
            } else {
                //recupera il prodotto dal carrello in maniera completa
                const item = await getCartProduct({
                    abortController: (abortCartRef.current = new AbortController()),
                    quotationId,
                    _id: documentProd._id,
                    isProduct: documentProd.kind === "PRODUCT",
                    HandleError: (msg) => setErrorMsg(String(msg || "Errore nel recupero del carrello.")),
                    ChangeLoadStatus: ({ bool }) => setLoading(prev => ({ ...prev, cart: Boolean(bool) })),
                });

                setCart((prevCart: any) => [item, ...prevCart]);
            };

            setOpenSearch(false);
            return;
        };

        if (
            openSearch &&
            typeof openSearch === "object" &&
            (openSearch.from === "quotazioni" || openSearch.from === "prodotti")
        ) {
            return;
        };

        addToCart(r);
        setOpenSearch(false);
    };

    // salva la ricerca corrente quando confermi
    const commitSearchIfNeeded = useCallback((q: string) => {
        if (!q.trim()) return;
        setRecentSearch((prev: string[]) => {
            const copy = [...prev];
            const next = [q, ...copy].slice(0, 4);
            writeRecent("fd_qts_products_recent_q", next);
            return next;
        });
    }, [recentSearch]);

    // serializza parametri => chiave cache/req
    const buildKey = useCallback((query: string, fromScroll?: boolean, offset?: number) => {
        return JSON.stringify({
            q: query.trim(),
            offset: fromScroll ? (offset ?? 0) : 0,
        });
    }, []);

    // applica in modo sicuro (solo ultima risposta)
    const applyResponse = useCallback(({ ticket, resp, fromDebounced, fromScroll, fromCart, applyResponseOnCart }:
        { ticket: number, resp: SearchResponseWithPagination, fromDebounced: boolean, fromScroll?: boolean, fromCart?: boolean, applyResponseOnCart?: boolean }) => {
        if (ticket < lastApplied.current) return;  // risposta vecchia → ignora
        lastApplied.current = ticket;

        if (resp?.pagination) {
            setInpagination(resp.pagination);
        } else {
            if (!fromScroll) setInpagination(undefined);
        };

        if (fromDebounced) {
            /*if (fromCart) {
                setSearchCartItems((prev: any[]) => fromScroll ? [...prev, ...resp.items] : resp.items);
            } else */if (applyResponseOnCart) {
                setCart((prev: any[]) => fromScroll ? [...prev, ...resp.items] : resp.items);
            } else {
                setSearchItems((prev: any[]) => fromScroll ? [...prev, ...resp.items] : resp.items);
            };
        } else {
            setRaw((prev: any[]) => fromScroll ? [...prev, ...resp.items] : resp.items);
        };
    }, []);

    // esegue una ricerca IMMEDIATA (non debounced), rispettando abort & latest-only
    const runSearch = useCallback(async (query: string, fromDebounced: boolean, fromScroll?: boolean) => {
        const offset = fromScroll ? (inpagination?.nextOffset ?? undefined) : undefined;
        const baseKey = buildKey(query, fromScroll, offset);

        const srcTag = fromDebounced ? "debounced" : "direct";
        //componi la chiave unica + sorgente + filtri
        const filtersPart = Object.entries(filters)
            .filter(([_, v]) => v !== null && v !== undefined)
            .map(([k, v]) => `${k}=${(v as any)[k === "famiglia" ? k : CapitalizeFirstLetter(k)]}`)
            .join("::");
        const key = `${baseKey}::src=${srcTag}`;
        const fullBaseKey = filtersPart ? `${key}::${filtersPart}` : key;

        //controlla se la query è identica all'ultima inviata e che i filtri non siano cambiati
        if (lastSentKey.current === fullBaseKey) return;

        /*const cached = getLRU(fullBaseKey);
        if (cached) {
            applyResponse({ ticket: seq.current, resp: cached, fromDebounced, fromScroll });
            lastSentKey.current = fullBaseKey;
            return;
        };*/

        if (inflight.current) inflight.current.abort();

        if (!fromScroll) setInpagination(undefined);

        let ac: AbortController;

        if (fromDebounced) {
            setLoadingSearch(true);
            setLoading(prev => ({ ...prev, search_replace_products: true }));
            abortdebounceRef.current = new AbortController();
            ac = abortdebounceRef.current;
            inflight.current = ac;
            commitSearchIfNeeded(query);
        } else {
            if (fromScroll) {
                setLoading(prev => ({ ...prev, loadingMore: true }));
            } else {
                setLoading(prev => ({ ...prev, table_of_products: true }));
            }
            abortDirectRef.current = new AbortController();
            ac = abortDirectRef.current;
            inflight.current = ac;
        };

        const ticket = ++seq.current;
        lastSentKey.current = fullBaseKey;

        try {
            const resp = await fetchSearch({ query, signal: ac, fromScroll, offset });
            setLRU(fullBaseKey, { ts: Date.now(), data: resp });
            applyResponse({ ticket, resp, fromDebounced, fromScroll });
        } catch (err: any) {
            if (err?.name === "AbortError") return;
            console.log(err);
            if (ticket === seq.current) enqueueSnackbar(err?.message ?? "Errore di rete", { type: "error" });
        } finally {
            if (ticket === seq.current) {
                if (fromDebounced) {
                    setLoadingSearch(false);
                    setLoading(prev => ({ ...prev, search: false, search_replace_products: false }));
                } else {
                    if (fromScroll) {
                        setLoading(prev => ({ ...prev, loadingMore: false }));
                    } else {
                        setLoading(prev => ({ ...prev, table_of_products: false }));
                    }
                }
                inflight.current = null;
            }
        };
    }, [
        applyResponse,
        buildKey,
        fetchSearch,
        commitSearchIfNeeded,
        inpagination,
        filters
    ]);

    const runSearchOnCart = useCallback(async (query: string, fromScroll?: boolean, fromCart: boolean = true, applyResponseOnCart: boolean = false) => {
        const offset = fromScroll ? (inpagination?.nextOffset ?? undefined) : undefined;
        const baseKey = buildKey(query, fromScroll, offset);

        const srcTag = "debounced::cart";
        //componi la chiave unica + sorgente + filtri
        const filtersPart = Object.entries(filters)
            .filter(([_, v]) => v !== null && v !== undefined)
            .map(([k, v]) => `${k}=${(v as any)[k === "famiglia" ? k : CapitalizeFirstLetter(k)]}`)
            .join("::");
        const key = `${baseKey}::src=${srcTag}`;
        const fullBaseKey = filtersPart ? `${key}::${filtersPart}` : key;

        if (lastSentKey.current === fullBaseKey) return;

        const cached = getLRU(fullBaseKey);
        if (cached) {
            applyResponse({ ticket: seq.current, resp: cached, fromDebounced: true, fromScroll, fromCart, applyResponseOnCart });
            lastSentKey.current = fullBaseKey;
            setLoadingSearch(false);
            setLoading(prev => ({ ...prev, search: false }));
            return;
        }

        if (inflight.current) inflight.current.abort();
        if (!fromScroll) setInpagination(undefined);

        setLoadingSearch(true);
        abortdebounceRef.current = new AbortController();
        const ac = abortdebounceRef.current;
        inflight.current = ac;

        const ticket = ++seq.current;
        lastSentKey.current = fullBaseKey;

        try {
            const resp = await fetchSearchOnCart({ query, signal: ac, fromScroll, offset });
            setLRU(fullBaseKey, { ts: Date.now(), data: resp });
            applyResponse({ ticket, resp, fromDebounced: true, fromScroll, fromCart, applyResponseOnCart });
        } catch (err: any) {
            if (err?.name === "AbortError") return;
            console.log(err);
            if (ticket === seq.current) enqueueSnackbar(err?.message ?? "Errore di rete", { type: "error" });
        } finally {
            if (ticket === seq.current) {
                setLoadingSearch(false);
                setLoading(prev => ({ ...prev, search: false }));
                inflight.current = null;
            };
        };
    }, [applyResponse, buildKey, fetchSearchOnCart, inpagination, filters]);

    /** versione DEBOUNCED chiamata ad ogni tasto (usata da FDSearchPanel → DocumentsSearch → index) 
     * @param nextQ la query di ricerca da eseguire
     * @param fromCart indica se la ricerca debba essere eseguita sui prodotti del carrello (true) o su tutti i prodotti (false, default)
    */
    const searchDebounced = useCallback((nextQ: string, fromCart?: boolean) => {
        setLoading(prev => ({ ...prev, search: true }));
        setSearchQuery(nextQ);
        if (debounceId.current) window.clearTimeout(debounceId.current);
        debounceId.current = window.setTimeout(() => {
            if (qts?.stato !== "BOZZA" && fromCart) {
                runSearchOnCart(nextQ);
            } else {
                runSearch(nextQ, true);
            };
        }, DEBOUNCE_MS) as unknown as number;
    }, [runSearch, filters]);


    /** Funzione per cambiare stato della quotazione in base allo stato attuale e al completamento effettivo */
    const HandleQuotationState = useCallback((params?: {
        isCompleted?: boolean,
        isRefused?: boolean,
        closed_reason?: string,
        nextState?: Stato,
        forceOpen?: boolean,
        closureDraft?: ClosureDraft
    }) => {
        if (!qts) {
            enqueueSnackbar("Quotazione non valida, prova a ricaricare la pagina o contatta l'assistenza", { type: 'error' });
            return;
        };
        //controlla se ci sono prodotti nel carrello che hanno buyer non assegnato
        const productsWithoutBuyer = cart.filter(item => !item.codice_buyer || item.codice_buyer.trim() === "");
        if (productsWithoutBuyer.length > 0) {
            enqueueSnackbar(`Non è possibile aprire la quotazione. Ci sono ${productsWithoutBuyer.length} prodotti senza buyer assegnato.`, { type: 'error' });
            return;
        };

        // se è una quotazione BID_PASSIVO, controlla che i prodotti (con kind = "PRODUCT") nel carrello abbiano tutti un buyer assegnato, un prefisso, linea e gruppo valorizzati, 
        // altrimenti non si può procedere con l'apertura, segnaliamo all'utente quali sono i prodotti che non rispettano i requisiti
        if (qts.tipologia === "BID_PASSIVO") {
            const invalidProducts = cart.filter(item => item.kind === "PRODUCT" && (() => {
                const details = (item as CartProductDTO).dettagli_prodotto;
                const hasBuyer = item.codice_buyer && item.codice_buyer.trim() !== "";
                const hasPrefisso = details.prefisso && details.prefisso.trim() !== "";
                const hasLinea = details.linea && details.linea.trim() !== "";
                const hasGruppo = details.gruppo && details.gruppo.trim() !== "";
                return !(hasBuyer && hasPrefisso && hasLinea && hasGruppo);
            })());

            if ((invalidProducts).length > 0) {
                const sample = (invalidProducts as CartProductDTO[]).slice(0, 5).map(p => `- ${p.dettagli_prodotto?.codiceProduttore || p.product_id}`).join("\n");
                enqueueSnackbar(`Non è possibile aprire la quotazione. Ci sono ${invalidProducts.length} 
                    prodotti che non rispettano i requisiti per l'apertura di una quotazione BID_PASSIVO. 
                    Esempio:\n${sample}\nRisolvi i problemi sui prodotti e riprova.`, { type: 'error' });
                return;
            }
        };

        let extraParams: { closed_reason?: string, forceOpen?: boolean, closureDraft?: ClosureDraft } = {};
        //controlla la tipologia della quotazione, se è di tipo BID_PASSIVO allora la quotazione passa ad uno stato di VALIDAZIONE da parte del buyer
        const nextState = params?.nextState ?? (!params?.isRefused ?
            qts.stato === "BOZZA" ?
                /* @disable 00001A_STATUS_VALIDATION
                Motivi aziendali: 
                Stato di validazione della quotazione da parte del buyer solo per le BID_PASSIVO, 
                altrimenti si apre direttamente la quotazione (stato APERTA)
                
                qts.tipologia === "BID_PASSIVO" ?
                    "VALIDAZIONE" : */"APERTA"
                : qts.stato === "APERTA" ?
                    params?.isCompleted ?
                        "OK" : "KO"
                    : "APERTA" :
            "KO");

        if (params?.isRefused && /*qts.stato === "VALIDAZIONE" &&*/ qts.tipologia === "BID_PASSIVO" && params.isRefused) {
            extraParams.closed_reason = params.closed_reason;
        };

        if (params?.forceOpen) {
            extraParams = { ...extraParams, forceOpen: true };
        };

        if (params?.closureDraft) {
            extraParams = { ...extraParams, closureDraft: params.closureDraft };
        };

        OpenQuotationAPI({
            abortController: new AbortController(),
            quotationId,
            state: `${qts.stato}:${nextState}`,
            extraParams,
            duplicateCheck: {
                setDuplicateModalOpen,
                setDuplicateCandidates,
                pendingOpenRef,
            },
            HandleComplete: (_: any) => {
                enqueueSnackbar("Il cambio di stato della quotazione è stato completato con successo.", { type: 'success' });
                //cambia lo stato della quotazione in locale
                setQts((prev) => {
                    if (!prev) return prev;
                    return { ...prev, stato: nextState };
                });
            },
            HandleError: (msg) => {
                enqueueSnackbar(msg, { type: 'error' });
            },
            ChangeLoadStatus: () => { },
        });
    }, [qts, quotationId, cart]);

    const closeDuplicateModal = useCallback(() => {
        setDuplicateModalOpen(false);
        setDuplicateCandidates([]);
        duplicateHandledRef.current = false;
    }, []);

    const continueOpenAfterDuplicate = useCallback(async () => {
        // chiudo la modale
        setDuplicateModalOpen(false);

        const pending = pendingOpenRef.current;
        if (!pending) return;

        // ritento la stessa apertura forzando
        await HandleQuotationState({
            nextState: "APERTA",
            forceOpen: true,
        });
    }, [HandleQuotationState]);


    // ——————————————————————————————————————————————————————————
    // HANDLERS
    // ——————————————————————————————————————————————————————————
    const handleLoading = (key: string, bool: boolean) => {
        setLoading((prev) => ({ ...prev, [key]: bool }));
    };

    /** Funzione richiamata al cambio di tab (scope) */
    const handleScopeChange = (newScope: ScopeTab) => {
        setScope(newScope);
        setHighlightedItemId([]);
        // reset ricerca
        setSearchQuery("");
        setSearchItems([]);
        setSearchCartItems([]);
        setInpagination(undefined);
    };

    /** Apertura del pannello delle impostazioni della quotazione */
    const handleOpenQtsSettings = (item: CartProductDTO | TextRequestCartDTO) => {
        setOpenProductQtsSettings(item);
    };

    /** Importazione del carrello da file */
    const handleImportCartFromFile = (file: File | null) => {
        if (!file) return;
        if (!quotationId) {
            enqueueSnackbar("Quotazione non valida", { type: "error" });
            return;
        }

        // opzionale: controllo stato quotazione lato FE (qts.stato === "BOZZA")
        if (qts && qts.stato !== "BOZZA") {
            enqueueSnackbar("Puoi importare prodotti solo su quotazioni in stato BOZZA.", { type: "warning" });
            return;
        }

        setUploadingFromFile(true);

        UploadCartFromFileAPI({
            quotationId,
            file,
            abortController: abortUploadFileRef,
            onComplete: async (res: ImportFromFileSummary) => {
                setUploadingFromFile(false);

                const { summary } = res;
                const { importedCount, invalidRows, notFound } = summary;

                enqueueSnackbar(
                    `Importazione completata. Prodotti importati: ${importedCount}. Righe non valide: ${invalidRows.length}. Codici non trovati: ${notFound.length}.`,
                    { type: importedCount > 0 ? "success" : "warning" }
                );

                // 1) ricarico il carrello dal BE per avere la situazione aggiornata
                const newCart = await fetchCart();
                setCart(newCart?.data || []);

                // 2) evidenzio temporaneamente i product_id appena importati
                // NB: dovresti farti restituire dal BE anche gli _id dei QtsProducts o almeno i product_id
                // per ora, ipotizziamo che nel summary ci sia un array "importedProductIds"
                if ((summary as any).importedProductIds) {
                    setHighlightedItemId((summary as any).importedProductIds);
                } else {
                    // fallback: niente highlight
                    setHighlightedItemId([]);
                };
            },
            onError: (msg: string) => {
                setUploadingFromFile(false);
                enqueueSnackbar(msg, { type: "error" });
            },
        });
    };

    /** Aggiornamento della finestra di validità della quotazione (modificabile solo in stato BOZZA, la proprietà fine) */
    const handleUpdateValidityWindow = async (range: { fine?: string }) => {
        if (!qts) {
            enqueueSnackbar("Quotazione non valida, prova a ricaricare la pagina o contatta l'assistenza", { type: 'error' });
            return;
        };

        console.log(range.fine);

        let payload: { [key: string]: string | Date } = {};

        //valida la data di fine (deve essere una data futura)
        //inoltre la data inserida deve essere una data valida (es. non 31/02/2024) altrimenti il BE restituisce un errore di validazione
        if (range.fine && new Date(range.fine) >= new Date()) {
            /*// aggiungi l'ora attuale alla data di fine per evitare problemi di fuso orario e considerare la fine del giorno
            const now = new Date();
            const selectedDate = new Date(range.fine);
            selectedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());*/
            payload.fine = range.fine;
        };

        console.log("Payload inviato al BE:", payload);

        EditQuotationValidityAPI({
            abortController: new AbortController(),
            user: userState,
            quotationId,
            payload,
            HandleComplete: (res: any) => {
                enqueueSnackbar("Finestra di validità aggiornata con successo.", { type: 'success' });
                // aggiorna localmente la quotazione con la nuova finestra di validità
                setQts((prev) => {
                    if (!prev) return prev;
                    // se non c'è più la data di fine, rimuovi la finestra di validità
                    if (!range.fine) {
                        const { others, finestraValidita } = prev || {};
                        return others;
                    } else {
                        return { ...prev, finestraValidita: { ...prev.finestraValidita, fine: new Date(range.fine) } };
                    };
                });
            },
            HandleError: (msg: string) => {
                enqueueSnackbar(msg, { type: 'error' });
            },
        });
    };

    /**
     * Sostituisce il cliente placeholder BID_PASSIVO con un cliente reale.
     * Dopo il salvataggio ricarichiamo i dettagli quotazione per:
     * - ottenere il nuovo profilo cliente completo dal BE;
     * - riabilitare il pannello "Vedi dettagli cliente" senza refresh pagina.
     * Nota: i vincoli business (solo proprietario, solo una volta, stati ammessi)
     * sono enforced lato BE; qui gestiamo solo validazioni base input + UX.
     */
    const handleReplacePlaceholderCustomer = async (customerCode: string) => {
        if (!qts) {
            enqueueSnackbar("Quotazione non valida, prova a ricaricare la pagina o contatta l'assistenza", { type: "error" });
            return;
        }

        const code = String(customerCode ?? "").trim();
        if (!code) {
            enqueueSnackbar("Inserisci un codice cliente valido.", { type: "warning" });
            return;
        }

        EditQuotationCustomerAPI({
            abortController: new AbortController(),
            user: userState,
            quotationId,
            payload: { cliente: code },
            HandleComplete: async () => {
                enqueueSnackbar("Cliente quotazione aggiornato con successo.", { type: "success" });
                // Refresh puntuale: aggiorna sia `qts` che `customer` in base al nuovo cliente reale.
                await fetchDetails({ avoidCartFetch: true, avoidProductFetch: true, avoidCategoriesFetch: true });
            },
            HandleError: (msg: string) => {
                enqueueSnackbar(msg, { type: "error" });
            },
        });
    };

    /**
     * Funzione per assegnare il buyer al prodotto aperto nel pannello dettagli
     * @param buyerCode Il codice del buyer da assegnare
     * @returns void
     */
    const handleAssignBuyer = async (buyerCode: string | null): Promise<{ shouldClosePanel: boolean; shouldExitQuotation: boolean; kind: "reassigned" | "assigned" | "noop"; } | void> => {
        if (!userState?.details) return { shouldClosePanel: false, shouldExitQuotation: false, kind: "noop" };

        if (!openProductQtsSettings) {
            enqueueSnackbar("Nessun prodotto selezionato per assegnare il buyer.", {
                type: "error",
            });
            return { shouldClosePanel: false, shouldExitQuotation: false, kind: "noop" };
        };

        const normalizedBuyerCode = buyerCode ? String(buyerCode).trim().toUpperCase() : null;
        const currentRow = cart.find((item) => item._id === openProductQtsSettings._id) as (CartProductDTO | TextRequestCartDTO | undefined);
        if (!currentRow) {
            enqueueSnackbar(
                "Impossibile trovare il prodotto nel carrello per assegnare il buyer.",
                { type: "error" },
            );
            return { shouldClosePanel: false, shouldExitQuotation: false, kind: "noop" };
        }

        const prevBuyerCode = currentRow.codice_buyer ?? null;
        if (prevBuyerCode === normalizedBuyerCode) {
            enqueueSnackbar("Il buyer selezionato coincide con quello già assegnato.", { type: "warning" });
            return { shouldClosePanel: false, shouldExitQuotation: false, kind: "noop" };
        }

        const user = userState.details;
        const actorRole = user?.ruolo ?? "SYSTEM";
        const actorIsBuyer = isBuyerRole(actorRole);
        const isBuyerReassignmentFlow = actorIsBuyer && !!prevBuyerCode && !!normalizedBuyerCode;

        setAssigningBuyer(true);

        if (isBuyerReassignmentFlow) {
            const currentUserBuyerCode = getCurrentUserBuyerCode(userState);

            const patchReassignedRow = (row: CartProductDTO | TextRequestCartDTO) => {
                const baseRow: any = {
                    ...row,
                    codice_buyer: normalizedBuyerCode,
                    approvato: false,
                    quotazione: {
                        ...(row.quotazione ?? {}),
                        stato: "ATTESA_VALUTAZIONE",
                    },
                };

                delete baseRow?.quotazione?.prezzo_base;
                delete baseRow?.quotazione?.sconto_percentuale;
                delete baseRow?.quotazione?.prezzo_finale;
                delete baseRow?.quotazione?.validita_offerta;
                delete baseRow?.quotazione?.scadenza;

                if (baseRow.kind === "PRODUCT") {
                    baseRow.controproposte = (baseRow.controproposte ?? []).map((cp: any) => ({
                        ...cp,
                        approvato: false,
                        stato: "CONTROPROPOSTA_RIFIUTATA",
                    }));
                }

                return baseRow;
            };

            return await new Promise((resolve) => {
                ReassignQtsProductBuyerAPI({
                    abortController: new AbortController(),
                    user: userState,
                    quotationId,
                    idDoc: openProductQtsSettings._id,
                    newBuyerCode: normalizedBuyerCode,
                    HandleComplete: async () => {
                        const nextCart = cart.map((p) => (
                            p._id === openProductQtsSettings._id ? patchReassignedRow(p) : p
                        ));

                        const hasRemainingRowsForCurrentBuyer = !!currentUserBuyerCode && nextCart.some((item) => {
                            const buyerCode = item?.codice_buyer ? String(item.codice_buyer).trim().toUpperCase() : "";
                            return buyerCode === currentUserBuyerCode;
                        });

                        setCart(nextCart);
                        setOpenProductQtsSettings(null);

                        enqueueSnackbar("Quotazione girata al nuovo buyer con successo.", {
                            type: "success",
                        });

                        await fetchCart();

                        resolve({
                            shouldClosePanel: true,
                            shouldExitQuotation: !!currentUserBuyerCode && !hasRemainingRowsForCurrentBuyer,
                            kind: "reassigned" as const,
                        });
                    },
                    HandleError: (msg: string) => {
                        enqueueSnackbar(msg, { type: "error" });
                        resolve({ shouldClosePanel: false, shouldExitQuotation: false, kind: "noop" as const });
                    },
                }).finally(() => {
                    setAssigningBuyer(false);
                });
            });
        }

        const productId = openProductQtsSettings.kind === "PRODUCT" ? (openProductQtsSettings as CartProductDTO).product_id : null;
        const currentItem = cart.find((item) => item.kind === "PRODUCT" && (item as CartProductDTO).product_id === productId) as CartProductDTO | undefined;
        if (!currentItem) {
            setAssigningBuyer(false);
            enqueueSnackbar(
                "Impossibile trovare il prodotto nel carrello per assegnare il buyer.",
                { type: "error" },
            );
            return { shouldClosePanel: false, shouldExitQuotation: false, kind: "noop" };
        }

        const payload: any = {
            product_id: productId,
            quantita: currentItem.quantita ?? 1,
            codice_buyer: normalizedBuyerCode,
        };

        return await new Promise((resolve) => {
            AddProductsToCartAPI({
                abortController: new AbortController(),
                user: userState,
                quotationId,
                item: payload,
                HandleComplete: () => {
                    setCart((prev) =>
                        prev.map((p) =>
                            p.kind === "PRODUCT" && (p as CartProductDTO).product_id === productId
                                ? { ...p, codice_buyer: normalizedBuyerCode }
                                : p,
                        ),
                    );

                    setOpenProductQtsSettings((prev) =>
                        prev ? { ...prev, codice_buyer: normalizedBuyerCode } : prev,
                    );

                    if (prevBuyerCode !== normalizedBuyerCode) {
                        const fromLabel = prevBuyerCode ?? "Non assegnato";
                        const toLabel = normalizedBuyerCode ?? "Non assegnato";

                        appendEventToCurrentProduct("CAMBIO_BUYER", {
                            message: `Buyer cambiato da "${fromLabel}" a "${toLabel}".`,
                            meta: {
                                prevBuyerCode,
                                newBuyerCode: normalizedBuyerCode ?? null,
                            },
                        });
                    }

                    enqueueSnackbar("Buyer aggiornato per il prodotto.", {
                        type: "success",
                    });
                    resolve({ shouldClosePanel: false, shouldExitQuotation: false, kind: "assigned" as const });
                },
                HandleError: (msg: string) => {
                    enqueueSnackbar(msg, { type: "error" });
                    resolve({ shouldClosePanel: false, shouldExitQuotation: false, kind: "noop" as const });
                },
            }).finally(() => {
                setAssigningBuyer(false);
            });
        });
    };

    /**
     * Funzione per assegnare altri dettagli del prodotto (es. Prefisso, Linea, Gruppo) al prodotto aperto nel pannello dettagli.
     * @param from Il dettaglio da modificare (es. "prefisso", "linea", "gruppo")
     * @param value Il nuovo valore del dettaglio da assegnare
     * @returns void
     */
    const handleAssignExtraProductsDetails = async (from: keyof CartProductDTO['dettagli_prodotto'], value: CartProductDTO['dettagli_prodotto'][keyof CartProductDTO['dettagli_prodotto']]) => {
        if (!userState?.details) return { shouldClosePanel: false, shouldExitQuotation: false, kind: "noop" };

        if (from !== "prefisso" && from !== "linea" && from !== "gruppo") {
            enqueueSnackbar("Dettaglio prodotto non modificabile.", {
                type: "error",
            });
            return { shouldClosePanel: false, shouldExitQuotation: false, kind: "noop" };
        };

        if (!openProductQtsSettings) {
            enqueueSnackbar("Nessun prodotto selezionato per assegnare il buyer.", {
                type: "error",
            });
            return { shouldClosePanel: false, shouldExitQuotation: false, kind: "noop" };
        };

        const openProductQtsSettings_ = openProductQtsSettings as CartProductDTO;

        const productId = openProductQtsSettings_.kind === "PRODUCT" ? openProductQtsSettings_.product_id : null;
        const currentItem = cart.find((item) => item.kind === "PRODUCT" && (item as CartProductDTO).product_id === productId) as CartProductDTO | undefined;
        if (!currentItem) {
            setAssigningBuyer(false);
            enqueueSnackbar(
                "Impossibile trovare il prodotto nel carrello per assegnare il buyer.",
                { type: "error" },
            );
            return { shouldClosePanel: false, shouldExitQuotation: false, kind: "noop" };
        }
        const payload: any = {
            product_id: productId,
            quantita: currentItem.quantita ?? 1,
            [from]: value ?? "N/A",
        };

        return await new Promise((resolve) => {
            AddProductsToCartAPI({
                abortController: new AbortController(),
                user: userState,
                quotationId,
                item: payload,
                HandleComplete: () => {
                    setCart((prev) =>
                        prev.map((p) =>
                            p.kind === "PRODUCT" && (p as CartProductDTO).product_id === productId
                                ? { ...p, dettagli_prodotto: { ...(p as CartProductDTO).dettagli_prodotto, [from]: value } }
                                : p,
                        ),
                    );

                    setOpenProductQtsSettings((prev) =>
                        prev ? { ...prev, dettagli_prodotto: { ...(prev as CartProductDTO).dettagli_prodotto, [from]: value } } : prev,
                    );

                    if (openProductQtsSettings_?.dettagli_prodotto ? openProductQtsSettings_.dettagli_prodotto[from] : null !== value) {
                        const fromLabel = openProductQtsSettings_?.dettagli_prodotto ? openProductQtsSettings_.dettagli_prodotto[from] : "N/A";
                        const toLabel = value ?? "N/A";

                        appendEventToCurrentProduct(`CAMBIO_DETTAGLI_PRODOTTO`, {
                            message: `${from} cambiato da "${fromLabel}" a "${toLabel}".`,
                            meta: {
                                prev: openProductQtsSettings_?.dettagli_prodotto ? openProductQtsSettings_.dettagli_prodotto[from] : null,
                                new: value ?? null,
                            },
                        });
                    };

                    enqueueSnackbar("Dettagli prodotto aggiornati.", {
                        type: "success",
                    });
                    resolve({ shouldClosePanel: false, shouldExitQuotation: false, kind: "assigned" as const });
                },
                HandleError: (msg: string) => {
                    enqueueSnackbar(msg, { type: "error" });
                    resolve({ shouldClosePanel: false, shouldExitQuotation: false, kind: "noop" as const });
                },
            }).finally(() => {
                setAssigningBuyer(false);
            });
        });
    };

    /**
     * Side-effect dispatcher (Notify + Audit Log) per gli eventi di prodotto.
     *
     * - appendEventToCurrentProduct resta focused su state + persistenza evento.
     * - Notify/Logs vivono in una funzione dedicata, così da mantenere il command pulito e testabile.
     */
    const dispatchProductEventSideEffects = useCallback(
        (params: {
            options: { message?: string; meta?: ProductEventDTO["meta"]; notify?: ProductEventNotifyOptions };
            product: CartProductDTO;
            qts: QuotazioneDTO | null;
            customer: any;
        }) => {
            if (!userState?.details) return;

            const notify = params.options.notify;

            if (notify && notify.enqueueSnackbar && notify.enqueueSnackbar.message) {
                enqueueSnackbar(notify.enqueueSnackbar.message, { type: notify.enqueueSnackbar.type ?? "info" });
            };

            if (notify?.enabled === false) return;

            const user = userState.details;
            const actorRole = user?.ruolo ?? "SYSTEM";
            const actorIsBuyer = isBuyerRole(actorRole);
            const actorRoleLabel = CheckAdminDev ? "Administratore" : actorIsBuyer ? "Buyer" : "Commerciale";
            const actorDisplay =
                [user?.nome, (user as any)?.cognome].filter(Boolean).join(" ") || user?.username || "Sistema";

            const productCode = params.product?.dettagli_prodotto?.codiceProduttore ?? "N/A";
            const customerCode = params.customer?.CodiceCliente?.Focelda ?? "N/A";
            const customerName =
                params.customer?.RagioneSociale ?? params.customer?.ragione_sociale ?? null;
            const quotationTitle = params.qts?.titolo ?? `Quotazione ${quotationId}`;

            const metaFrom = (params.options.meta as any)?.fromState;
            const metaTo = (params.options.meta as any)?.toState;

            // Default audience: notifichiamo il "counterpart" dell'azione.
            // - Buyer action  → notifica al richiedente
            // - Commerciale action → notifica al buyer assegnato
            const audience: NotificationAudience =
                notify?.audience ?? (CheckAdminDev ? "BOTH" : actorIsBuyer ? "REQUESTER" : "BUYER");

            // Copy per CAMBIO_STATO basata su toState (stato attuale), come da vincolo.
            const stateCopy = isProductWorkflowState(metaTo)
                ? workflowStateMessage(metaTo)
                : (metaTo ? `Stato aggiornato: "${stateLabel(metaFrom)}" → "${stateLabel(metaTo)}".` : null);

            const message =
                stateCopy ?? params.options.message ??
                "Aggiornamento sulla quotazione.";

            // Payload di notifica: target esplicito e compatibile in modo incrementale.
            // - BUYER → buyers_codes_target
            // - REQUESTER → users_ids_target (richiede supporto BE se non già presente)
            const body_: any = {
                desc: `
                    ${(notify?.notifyMessage?.header) ?? "<p>Aggiornamento per la <strong>Richiesta di Quotazione</strong></p>"}
                    <p style="font-size: 0.9em; margin: 1em">
                    <strong>Titolo:</strong> ${quotationTitle}<br/>
                      <strong>${actorRoleLabel}:</strong> ${actorDisplay}<br/>
                      <strong>Cliente:</strong> ${customerCode}${customerName ? ` - ${customerName}` : ""}<br/>
                      <strong>Prodotto:</strong> ${productCode}
                    </p>
                    <p>${message}</p>
                `,
                modality: "Singola",
                timerMode: false,
                type: "Info",
                user_from: user.username,
                user_from_details: { nome: 'Sistema', fullName: 'Sistema', system: true },
                buyers_codes_target:
                    audience === "BUYER" || audience === "BOTH"
                        ? [params.product.codice_buyer].filter(Boolean)
                        : [],
                users_ids_target:
                    audience === "REQUESTER" || audience === "BOTH"
                        ? [params.qts?.agenteId].filter(Boolean)
                        : [],
                usersTargetStatus: "Tutti",
                tags: notify?.notifyMessage?.tags ?? ["quotazioni", "prodotti-quotazione"],
            };

            const logScope = notify?.logScope ?? `quotazioni/${quotationId}`;
            SendLogs(userState.token, "Notification", logScope, null, null, body_);
            /**
             * Nota implementativa: idealmente, vorremmo una funzione di alto livello come `sendProductEventNotification`
             * @DEVELOPER_NOTE che incapsula tutta la logica di costruzione del messaggio, audience, e invio, così da mantenere il command handler pulito e focalizzato solo sulla logica di business.
             */

            return Notifications({ _id: user._id, body: body_, userToken: userState.token });
        },
        [quotationId, userState, CheckAdminDev],
    );

    const isRequester = useMemo(() => {
        // ipotesi ragionevole: l’utente che crea è agenteId === userState.details.username o id.
        // Qui NON posso essere certo perché non vedo nel DTO i campi creatore.
        return String(qts?.agenteId ?? "") === String(userState?.details?._id ?? "");
    }, [qts?.agenteId, userState?.details?._id]);


    // ——————————————————————————————————————————————————————————
    // CALCULATIONS
    // ——————————————————————————————————————————————————————————
    /**
    * Funzione che calcola il valore percentuale di progresso della quotazione
    * basato sul numero di prodotti quotati (nel carrello) con stato:
    * - ATTESA_VALUTAZIONE equivale a 0 punti
    * - ATTESA_APPROVAZIONE equivale a 50 punti
    * - VALUTAZIONE_COMPLETATA equivale a 100 punti
    *  rispetto al totale dei prodotti.
    * @returns Percentuale di progresso totale (0-100)
    */
    /**
     * Calcolo progress ottimizzato:
     * - O(n) una sola volta
     * - zero allocazioni inutili
     * - riutilizzabile da UI + handler
     */
    const progressSnapshot = useMemo(() => {
        const items = cart ?? []; // <-- o la tua lista reale dei prodotti quotazione (quotations_products)
        const total = items.length;

        // Se non ci sono prodotti, non ha senso chiudere (o puoi decidere che è chiudibile)
        if (total === 0) {
            return {
                total: 0,
                done: 0,
                remaining: 0,
                percentage: 0,
                allDone: false,
            };
        }

        let done = 0;

        for (let i = 0; i < items.length; i++) {
            const st = (items[i] as any)?.quotazione?.stato; // <-- adegua se il campo si chiama diversamente
            if (st && DONE_PRODUCT_STATES.has(st)) done++;
        };

        const remaining = total - done;
        const percentage = Math.round((done / total) * 100);

        return {
            total,
            done,
            remaining,
            percentage,
            allDone: remaining === 0,
        };
    }, [cart]);

    /**
     * API legacy: manteniamo il nome getProgressPercentage, ma ora è O(1).
     * Così non devi cambiare tutte le chiamate esistenti.
     */
    const getProgressPercentage = useCallback(() => {
        return progressSnapshot.percentage;
    }, [progressSnapshot.percentage]);

    /**
     * API comoda: sapere se è già tutto completato.
     */
    const areAllProductsDone = progressSnapshot.allDone;


    // ——————————————————————————————————————————————————————————
    // CART OPERATIONS
    // ——————————————————————————————————————————————————————————
    /** Aggiunge un prodotto al carrello
     * @param ProductDoc Il prodotto da aggiungere
     */
    const addToCart = (ProductDoc: ProductDoc) => {
        if (!ProductDoc._id) { enqueueSnackbar("Ops.. il prodotto non presenta l'id e quindi non risulta essere valido", { type: 'error' }); return; }
        setLoading(prev => {
            const nextMap = new Map(prev.adding_to_cart as Map<string, boolean>);
            nextMap.set(ProductDoc._id, true);

            return {
                ...prev,
                adding_to_cart: nextMap,
            };
        });

        let obj_product: any = {
            product_id: ProductDoc._id,
            quantita: 1,
            kind: "PRODUCT",
            dettagli_prodotto: {
                codiceProduttore: ProductDoc.codiceProduttore,
                codiceEAN: ProductDoc.codiceEAN,
                descrizione: ProductDoc.descrizione ?? "N/A",
                anteprima: ProductDoc.anteprima,
                marca: ProductDoc.marca ?? "N/A",
                linea: ProductDoc.linea,
                gruppo: ProductDoc.gruppo,
                famiglia: ProductDoc.famiglia,
                descrizioneLinea: ProductDoc.descrizioneLinea,
                descrizioneGruppo: ProductDoc.descrizioneGruppo,
                descrizioneFamiglia: ProductDoc.descrizioneFamiglia,
            },
            quotazione: {
                stato: "ATTESA_VALUTAZIONE",
            },
            codice_buyer: ProductDoc.codice_buyer,
            note: [],
        };
        //controlla se il prodotto è già nel carrello per eventualmente aggiornare la quantità
        const existingProduct = cart.find(item => item.kind === "PRODUCT" && (item as CartProductDTO).product_id === ProductDoc._id) as CartProductDTO | undefined;
        if (existingProduct && existingProduct.quantita) {
            // Aggiorna la quantità se il prodotto esiste già nel carrello
            obj_product.quantita += existingProduct.quantita++;
        }

        // chiama l'API per aggiungere il prodotto al carrello
        AddProductsToCartAPI({
            abortController: new AbortController(),
            user: userState,
            quotationId,
            HandleComplete: (res: AddProductsResponse) => {
                setCart((prevCart: Array<CartProductDTO | TextRequestCartDTO>) => {
                    const newCart = [...prevCart];
                    const index = prevCart.findIndex(i => i.kind === "PRODUCT" && (i as CartProductDTO).product_id === ProductDoc._id);

                    if (index !== -1) {
                        const existing = newCart[index] as CartProductDTO;
                        newCart[index] = {
                            ...existing,
                            quantita: existing.quantita,
                        };
                    } else {
                        if (res && res._id) {
                            enqueueSnackbar("Prodotto aggiunto al carrello.", { type: 'success' });
                            newCart.push({ _id: res._id, ...obj_product }); //aggiungi al carrello
                        } else {
                            enqueueSnackbar("Errore nell'aggiunta del prodotto al carrello.", { type: 'error' });
                        };
                    };

                    return newCart;
                });
                // rimuovi il loading state per questo prodotto
                setLoading(prev => {
                    const nextMap = new Map(prev.adding_to_cart as Map<string, boolean>);
                    nextMap.delete(ProductDoc._id);

                    return {
                        ...prev,
                        adding_to_cart: nextMap,
                    };
                });
            },
            HandleError: (msg) => {
                enqueueSnackbar(msg, { type: 'error' });
            },
            item: obj_product,
        });
    };

    /**
     * Funzione per creare una nuova richiesta testuale collegata alla quotazione
     * @param payload L'oggetto contenente la descrizione, la nota opzionale e il codice buyer
     */
    const addTextToCart = useCallback(
        async (payload: CreateTextRequestPayload) => {
            if (!quotationId) return;

            const normalizedBuyerCode = String(payload.codice_buyer ?? "").trim();
            if (!normalizedBuyerCode) {
                setErrorMsg("Seleziona un buyer prima di descrivere la necessità.");
                return;
            };

            // safety FE: massimo 1 TEXT_REQUEST per quotazione
            // Nota evolutiva:
            // in passato il FE limitava a una sola TEXT_REQUEST per quotazione.
            // Il nuovo flusso consente piu' righe descrittive, quindi il controllo
            // storico resta commentato come riferimento del cambio logico.
            // const hasTextRequest = cart?.some((p: any) => p.kind === "TEXT_REQUEST");
            // if (hasTextRequest) {
            //     setErrorMsg("Esiste già una richiesta testuale per questa quotazione.");
            //     return;
            // };

            setErrorMsg(null);

            // abortiamo eventuali richieste sul carrello in corso
            abortCartRef.current?.abort();
            const ac = new AbortController();
            abortCartRef.current = ac;

            try {
                handleLoading("cart", true);

                const data = await CreateTextRequestAPI({
                    abortController: ac,
                    quotationId,
                    payload: {
                        ...payload,
                        codice_buyer: normalizedBuyerCode,
                    },
                });

                if (!data || (data && !data._id)) {
                    throw new Error("Risposta del server non valida.");
                };

                const obj_product = {
                    _id: data._id,
                    kind: "TEXT_REQUEST",
                    quotazione: {
                        stato: "ATTESA_VALUTAZIONE",
                    },
                    textRequest: {
                        titolo: payload.titolo || "Richiesta Testuale",
                        descrizione: payload.descrizione,
                    },
                    codice_buyer: normalizedBuyerCode,
                } as TextRequestCartDTO;

                // setCart([obj_product]); // sostituisce il carrello con la sola richiesta testuale
                // // cambia tab in modo da bloccare l'aggiunta di altri prodotti e ulteriori descrizioni testuali
                // handleScopeChange("quotazioni");
                // HandleQuotationState();

                // permettiamo più righe TEXT_REQUEST nella stessa quotazione.
                // Per questo non sostituiamo il carrello e non apriamo qui la quotazione:
                // l'apertura avviene una sola volta dal bottone "Apri Quotazione" del form.
                // Non sostituiamo il carrello: appendiamo la nuova riga alle precedenti.
                // L'apertura della quotazione avviene una sola volta dal submit finale
                // del form, dopo il salvataggio di tutte le necessità compilate.
                setCart((prev) => [...prev, obj_product]);
            } catch (err: any) {
                if (err?.name === "AbortError") return;

                console.error("[handleCreateTextRequest] errore:", err);
                const apiMsg =
                    err?.response?.data?.msg ?? err?.msg ??
                    "Ops, sembra che ci sia stato un problema nel salvataggio della richiesta testuale.";
                setErrorMsg(apiMsg);
            } finally {
                handleLoading("cart", false);
                abortCartRef.current = null;
            };
        },
        [
            quotationId,
            setCart,
            setErrorMsg,
        ],
    );

    /**
     * Rimuove un prodotto dal carrello
     * @param productId L'id del prodotto da rimuovere
     */
    const removeFromCart = (productId: string) => {
        if (!productId) { enqueueSnackbar("Ops.. il prodotto non presenta l'id e quindi non risulta essere valido", { type: 'error' }); return; }
        DeleteProductsToCartAPI({
            abortController: new AbortController(),
            user: userState,
            quotationId,
            product_id: productId,
            HandleComplete: (_: AddProductsResponse) => {
                enqueueSnackbar("Prodotto rimosso dal carrello.", { type: 'success' });
                setCart((prevCart: Array<CartProductDTO | TextRequestCartDTO>) => {
                    const index = prevCart.findIndex(item => item.kind === "PRODUCT" && (item as CartProductDTO).product_id === productId);
                    if (index === -1) return prevCart; // nessun cambio

                    const next = [...prevCart];
                    next.splice(index, 1); // rimuove mantenendo l'ordine degli altri

                    return next;
                });
            },
            HandleError: (msg) => {
                enqueueSnackbar(msg, { type: 'error' });
            },
        });
    };

    /**
     * Aggiorna la quantità di un prodotto nel carrello
     * @param productId L'id del prodotto da aggiornare
     * @param quantity La nuova quantità
     */
    const updateCartItemQuantity = (productId: string, quantity: number) => {
        if (!productId) { enqueueSnackbar("Ops.. il prodotto non presenta l'id e quindi non risulta essere valido", { type: 'error' }); return; }

        let obj_product: any = {
            product_id: productId,
            quantita: quantity,
        };
        AddProductsToCartAPI({
            abortController: new AbortController(),
            user: userState,
            quotationId,
            HandleComplete: (_: AddProductsResponse) => {
                setCart(prev => {
                    const index = prev.findIndex(i => i.kind === "PRODUCT" && (i as CartProductDTO).product_id === productId);
                    if (index === -1) return prev; // nessun cambio
                    const next = [...prev];

                    if (quantity <= 0) {
                        // rimuovi ma senza spostare gli altri
                        //next.splice(index, 1);
                        removeFromCart(productId);
                    } else {
                        next[index] = {
                            ...next[index],
                            quantita: quantity,
                        };
                    };

                    return next;
                });
            },
            HandleError: (msg) => {
                enqueueSnackbar(msg, { type: 'error' });
            },
            item: obj_product,
        });
    };

    /** Svuota il carrello */
    const clearCart = useCallback(() => {
        if (!quotationId) return;

        // opzionale: stesso vincolo che hai altrove
        if (qts && qts.stato !== "BOZZA") {
            enqueueSnackbar("Puoi svuotare il carrello solo su quotazioni in stato BOZZA.", { type: "warning" });
            return;
        }

        setErrorMsg(null);

        // abort richieste carrello in corso
        try { abortCartRef.current?.abort(); } catch { }
        const ac = new AbortController();
        abortCartRef.current = ac;

        // optimistic UI
        setCart([]);
        setHighlightedItemId([]);
        setOpenProductQtsSettings(null);

        handleLoading("cart", true);

        clearCartData({
            abortController: ac,
            user: userState,
            quotationId,
            HandleComplete: async () => {
                enqueueSnackbar("Carrello svuotato.", { type: "success" });
                await fetchCart(); // riallinea con DB (importante)
            },
            HandleError: async (msg) => {
                enqueueSnackbar(msg || "Errore durante lo svuotamento del carrello.", { type: "error" });
                await fetchCart(); // rollback “soft” riallineando dal BE
            },
        }).finally(() => {
            handleLoading("cart", false);
        });
    }, [quotationId, qts?.stato, userState, fetchCart]);



    // ——————————————————————————————————————————————————————————
    // OPERATIONS ON QTS PRODUCTS
    // ——————————————————————————————————————————————————————————
    /**
     * Funzione che gestisce il cambio di stato di una quotazione di un prodotto
     * @param new_state Il nuovo stato della quotazione
     */
    const changeQtsProductState = (new_state: RigaStato) => {
        setCart((prevCart: Array<CartProductDTO | TextRequestCartDTO>) => {
            if (!openProductQtsSettings) {
                enqueueSnackbar("Nessun prodotto selezionato per la quotazione con valore.", { type: 'error' });
                return prevCart
            };
            const findIndex = prevCart.findIndex(item =>
                //(item as CartProductDTO).product_id === (openProductQtsSettings as CartProductDTO)?.product_id);
                item._id === openProductQtsSettings._id);

            if (findIndex === -1) {
                enqueueSnackbar("Impossibile trovare il prodotto nel carrello.", { type: 'error' });
                return prevCart;
            };
            const copyCart = [...prevCart];
            copyCart[findIndex] = { ...openProductQtsSettings, quotazione: { ...openProductQtsSettings.quotazione, stato: new_state } };
            return copyCart;
        });

        setOpenProductQtsSettings((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                quotazione: {
                    ...prev.quotazione,
                    stato: new_state,
                },
            };
        });
    };

    const syncCurrentProductRemoteMetadata = (args: { updatedAt?: string; newState?: RigaStato }) => {
        if (!openProductQtsSettings) return;
        const { updatedAt, newState } = args;
        const currentId = openProductQtsSettings._id;

        setCart((prevCart: Array<CartProductDTO | TextRequestCartDTO>) =>
            prevCart.map((item) => {
                if (item._id !== currentId) return item;
                return {
                    ...item,
                    ...(updatedAt ? { updatedAt } : {}),
                    ...(newState ? { quotazione: { ...item.quotazione, stato: newState } } : {}),
                };
            })
        );

        setOpenProductQtsSettings((prev) => {
            if (!prev || prev._id !== currentId) return prev;
            return {
                ...prev,
                ...(updatedAt ? { updatedAt } : {}),
                ...(newState ? { quotazione: { ...prev.quotazione, stato: newState } } : {}),
            };
        });
    };

    /**
     * Funzione per sincronizzare localmente i metadati di una quotazione di prodotto dopo un aggiornamento remoto.
     * @param args
     */
    const syncQuotationRemoteMetadata = (args: {
        quotationState?: string | null;
        quotationValue?: number | null;
    }) => {
        const { quotationState, quotationValue } = args;

        setQts((prev) => {
            if (!prev) return prev;

            return {
                ...prev,
                ...(quotationState ? { stato: quotationState as any } : {}),
                ...(typeof quotationValue === "number" && Number.isFinite(quotationValue)
                    ? { valore: quotationValue }
                    : {}),
            };
        });
    };

    /**
     * Costruisce il payload per UpdateQtsProductStateAPI
     * in base allo stato richiesto e ai dati del prodotto corrente.
    */
    const buildUpdateBodyForState = (
        state: RigaStato,
        document: CartProductDTO | TextRequestCartDTO,
    ): UpdateQtsProductBodyFE | null => {
        const quot = document.quotazione ?? {};
        const substitutions = document.controproposte ?? [];

        // default: solo cambio stato
        const expectedUpdatedAt = (document as any)?.updatedAt
            ? new Date((document as any).updatedAt).toISOString()
            : undefined;

        const base: UpdateQtsProductBodyFE = {
            newState: state,
            mode: "STATE_ONLY",
            expectedState: document?.quotazione?.stato,
            ...(expectedUpdatedAt ? { expectedUpdatedAt } : {}),
        };

        // 1) Stati legati alla valutazione prezzo del prodotto originale
        if (state === "ATTESA_APPROVAZIONE" ||
            state === "VALUTAZIONE_COMPLETATA" ||
            state === "VALUTAZIONE_RIFIUTATA"
        ) {
            const quotazionePayload: PriceQuotePayloadFE = {
                prezzo_base: quot.prezzo_base,
                prezzo_finale: quot.prezzo_finale,
                sconto_percentuale: quot.sconto_percentuale,
                validita_offerta: quot.validita_offerta ?? undefined,
                scadenza: quot.scadenza ?? undefined,
            };

            const hasQuotazionePayload = Object.values(quotazionePayload).some((value) => {
                if (value === undefined || value === null) return false;
                if (typeof value === "string" && value.trim() === "") return false;
                return true;
            });

            return {
                ...base,
                mode: "PRICE",
                ...(hasQuotazionePayload ? { quotazione: quotazionePayload } : {}),
            };
        };

        //funzione che disattiva tutte le controproposte attive impostando attivo e approvato come false,
        // ma lasciando approvato e attivo su true solo se state è CONTROPROPOSTA_ACCETTATA e la controproposta è quella accettata
        const deactivateSubstitutions = (acceptedSubstitutionId: string | null) => {
            return substitutions.filter(sub => sub.stato === "ATTESA_VALUTAZIONE")?.map(sub => {
                const { approvato, ...rest } = sub;
                return {
                    ...rest,
                    stato: acceptedSubstitutionId === rest._id ?
                        "CONTROPROPOSTA_ACCETTATA" as RigaStato
                        : "CONTROPROPOSTA_RIFIUTATA" as RigaStato,
                }
            });
        };

        // se lo stato è CONTROPROPOSTA_ACCETTATA,
        // invia al BE solo la controproposta accettata, impostando le altre come rifiutate
        if (state === "CONTROPROPOSTA_ACCETTATA") {
            const acceptedSubstitution = substitutions?.find(sub => sub.approvato);
            if (!acceptedSubstitution) {
                enqueueSnackbar(
                    "Nessuna controproposta accettata trovata per questo prodotto.",
                    { type: "error" },
                );
                return null;
            };

            // 1) aggiorna il carrello disattivando le altre controproposte
            const acceptedSubstitutionId = acceptedSubstitution ? acceptedSubstitution._id : null;
            const updatedSubstitutions = deactivateSubstitutions(acceptedSubstitutionId);

            setCart((prevCart: Array<CartProductDTO | TextRequestCartDTO>) => {
                const findIndex = prevCart.findIndex(item =>
                    item._id === document._id);
                if (findIndex === -1) {
                    return prevCart;
                };
                const copyCart = [...prevCart];
                const currentItem = copyCart[findIndex] as CartProductDTO;
                copyCart[findIndex] = {
                    ...currentItem,
                    controproposte: updatedSubstitutions
                };
                return copyCart;
            });

            // 2) aggiorna pannello aperto
            setOpenProductQtsSettings((prev: any) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    controproposte: updatedSubstitutions
                };
            });

            return {
                ...base,
                mode: "SUBSTITUTION_APPROVED",
                approvedIdDocs: [acceptedSubstitution._id]
            };
        }

        // 2) Stati legati alla controproposta
        if (state === "CONTROPROPOSTA_INVIATA") {
            // filtra solo le controproposte attive e le normalizza per il payload API.
            const active = substitutions
                ?.filter((sub) => sub.stato === "ATTESA_VALUTAZIONE")
                .map((sub) =>
                    buildSubstitutionPayloadItem({
                        substitution: sub,
                        quotationId,
                        quotationProductDocId: document._id,
                        fallbackBuyerCode: document.codice_buyer ?? null,
                    }),
                )
                .filter((sub): sub is Omit<ContropropostaDTO, "_id"> => Boolean(sub));

            // sicurezza: deve esserci almeno 1 controproposta attiva
            if (!active || (active && Array.isArray(active) && active.length === 0)) {
                enqueueSnackbar(
                    "Nessuna controproposta disponibile per questo prodotto.",
                    { type: "error" },
                );
                return null;
            };

            return {
                ...base,
                mode: "SUBSTITUTION",
                substitution: active,
            };
        };

        if (state === "CONTROPROPOSTA_RICHIESTA" ||
            state === "CONTROPROPOSTA_RIFIUTATA"
        ) {
            // aggiorna lo stato delle controproposte esistenti per disattivarle e rifiutarle tutte.
            const updatedSubstitutions = substitutions?.map(sub => ({
                ...sub,
                approvato: false,
                stato: "CONTROPROPOSTA_RIFIUTATA" as RigaStato,
            }));

            setCart((prevCart: Array<CartProductDTO | TextRequestCartDTO>) => {
                const findIndex = prevCart.findIndex(item =>
                    item._id === document._id);
                if (findIndex === -1) {
                    return prevCart;
                };
                const copyCart = [...prevCart];
                const currentItem = copyCart[findIndex] as CartProductDTO;
                copyCart[findIndex] = {
                    ...currentItem,
                    controproposte: updatedSubstitutions
                };
                return copyCart;
            });

            // 2) aggiorna pannello aperto
            setOpenProductQtsSettings((prev: any) => {
                if (!prev) return prev;

                return {
                    ...prev,
                    controproposte: updatedSubstitutions
                };
            });

            return {
                ...base,
                mode: "SUBSTITUTION",
            };
        };

        // 3) Stati puramente "di workflow" (richiesta controproposta, ecc.)
        // → non modificano prezzo/controproposta, solo stato
        // "CONTROPROPOSTA_RICHIESTA", eventuali altri
        return base;
    };

    /** Funzione che gestisce il salvataggio delle modifiche riportate quotazione del prodotto */
    const handleReqQtsProductsChangeState = (state: RigaStato) => {
        if (!openProductQtsSettings) return;

        const prevState = openProductQtsSettings.quotazione.stato;
        const idDoc = openProductQtsSettings._id;
        const body = buildUpdateBodyForState(state, openProductQtsSettings);

        if (!body) return; // es: nessuna controproposta attiva

        // optimistic update: aggiorno subito lo stato in memoria
        changeQtsProductState(state);

        const abortController = new AbortController();

        UpdateQtsProductStateAPI({
            abortController,
            user: userState,
            quotationId,
            idDoc,
            body,
            HandleComplete: async (response) => {
                syncCurrentProductRemoteMetadata({ updatedAt: response?.updatedAt, newState: state });

                syncQuotationRemoteMetadata({
                    quotationState: response?.quotationState ?? null,
                    quotationValue: response?.quotationValue ?? null,
                });

                // tutto ok → gestisco snackbar + eventi come prima
                switch (state) {
                    case "ATTESA_APPROVAZIONE":
                        enqueueSnackbar(prevState === "ATTESA_APPROVAZIONE" ? "Proposta di quotazione aggiornata con successo." : "Proposta di quotazione inviata con successo.", {
                            type: "success",
                        });
                        appendEventToCurrentProduct("CAMBIO_STATO", {
                            message: `Stato cambiato da ${prevState} a ${state}`,
                            meta: { fromState: prevState, toState: state },
                        });
                        break;

                    case "VALUTAZIONE_COMPLETATA":
                        enqueueSnackbar("Quotazione accettata con successo.", {
                            type: "success",
                        });
                        appendEventToCurrentProduct("CAMBIO_STATO", {
                            message: `Stato cambiato da ${prevState} a ${state}`,
                            meta: { fromState: prevState, toState: state },
                        });
                        break;

                    case "VALUTAZIONE_RIFIUTATA":
                        enqueueSnackbar("Quotazione rifiutata con successo.", {
                            type: "success",
                        });
                        appendEventToCurrentProduct("CAMBIO_STATO", {
                            message: `Stato cambiato da ${prevState} a ${state}`,
                            meta: { fromState: prevState, toState: state },
                        });
                        break;

                    case "CONTROPROPOSTA_INVIATA":
                        enqueueSnackbar(prevState === "CONTROPROPOSTA_INVIATA" ? "Controproposta aggiornata con successo." : "Controproposta inviata con successo.", {
                            type: "success",
                        });
                        appendEventToCurrentProduct("PROPOSTA_SOSTITUZIONE", {
                            message: `Stato cambiato da ${prevState} a ${state}`,
                            meta: { fromState: prevState, toState: state },
                        });
                        break;

                    case "CONTROPROPOSTA_ACCETTATA":
                        enqueueSnackbar("Controproposta accettata con successo.", {
                            type: "success",
                        });
                        appendEventToCurrentProduct("ACCETTAZIONE_SOSTITUZIONE", {
                            message: `Stato cambiato da ${prevState} a ${state}`,
                            meta: { fromState: prevState, toState: state },
                        });
                        break;

                    case "CONTROPROPOSTA_RIFIUTATA":
                        enqueueSnackbar("Controproposta rifiutata con successo.", {
                            type: "success",
                        });
                        appendEventToCurrentProduct("RIFIUTO_SOSTITUZIONE", {
                            message: `Stato cambiato da ${prevState} a ${state}`,
                            meta: { fromState: prevState, toState: state },
                        });
                        break;

                    case "CONTROPROPOSTA_RICHIESTA":
                        enqueueSnackbar(
                            "Richiesta di controproposta inviata con successo.",
                            { type: "success" },
                        );
                        appendEventToCurrentProduct("RICHIESTA_SOSTITUZIONE", {
                            message: `Stato cambiato da ${prevState} a ${state}`,
                            meta: { fromState: prevState, toState: state },
                        });
                        break;
                };

                // se c’è una nota di quotazione, la aggiungo come evento
                if (currentProposalNote && currentProposalNote.trim().length > 0) {
                    appendEventToCurrentProduct("NOTA", {
                        message: currentProposalNote,
                    });
                    setCurrentProposalNote(""); // resetta la nota dopo l’invio
                };

                // logica di avanzamento quotazione: se sono requester e sto passando a uno stato che implica "done", 
                // verifico se posso chiudere la quotazione.
                if (isRequester && (response && response.quotationState === "DA_CHIUDERE" && response.autoCompleted)) {
                    setQts((prev) => {
                        if (!prev) return prev;
                        return { ...prev, stato: "DA_CHIUDERE" };
                    });
                };
            },
            HandleError: async (msg: string) => {
                // rollback stato in memoria in caso di errore
                changeQtsProductState(prevState);
                enqueueSnackbar(msg, { type: "error" });
                if (msg?.includes("stata aggiornata") || msg?.includes("Ricarica i dati")) {
                    setOpenProductQtsSettings(null);
                    fetchDetails({ avoidCategoriesFetch: true });
                    return;
                }
                await fetchCart();
            },
        });
    };

    /**
     * Funzione che gestisce l'invio di una nota collegata alla quotazione del prodotto aperto.
     * La nota viene salvata come evento collegato al prodotto, viene inviata la notifica se la quotazione non è in stato BOZZA e viene mostrata una snackbar di conferma.
     * La nota viene resettata dopo l'invio.
     * @returns
     */
    const sendProductNote = () => {
        if (!openProductQtsSettings) {
            enqueueSnackbar("Nessun prodotto selezionato per l'invio della nota.", { type: 'error' });
            return;
        };

        if (!currentProposalNote || currentProposalNote.trim().length === 0) {
            enqueueSnackbar("La nota è vuota. Inserisci un messaggio prima di inviare.", { type: 'error' });
            return;
        };

        // se c’è una nota di quotazione, la aggiungo come evento
        if (currentProposalNote && currentProposalNote.trim().length > 0) {
            appendEventToCurrentProduct("NOTA", {
                message: currentProposalNote,
                loading: "add_product_note",
                notify: {
                    enabled: (qts && qts.stato !== "BOZZA") ?? false,
                    notifyMessage: {
                        header: "<p>Inserita una nuova Nota per la <strong>Richiesta di Quotazione</strong></p>",
                        tags: ["quotazioni", "prodotti-quotazione", "note"]
                    },
                    enqueueSnackbar: {
                        message: "Nota inviata con successo.",
                        type: "success",
                    }
                }
            });
            setCurrentProposalNote(""); // resetta la nota dopo l’invio
        };
    }

    /**
     * Aggiunge un evento al CartProductDTO corrente (pannello aperto)
     * e sincronizza cart + snapshot quotazione.
     *
     * Puoi riutilizzarla in:
     *  - changeQtsProductState
     *  - selezione prodotto in sostituzione
     *  - accetta/rifiuta controproposta
    */
    const appendEventToCurrentProduct = (
        type: ProductEventType,
        options: {
            message?: string;
            meta?: ProductEventDTO["meta"];
            loading?: string; // opzionale, se vuoi mostrare uno stato di caricamento specifico per questo evento
            notify?: ProductEventNotifyOptions;
        } = {},
    ) => {
        if (!openProductQtsSettings) return;
        const user = userState?.details;
        if (!user) { return; };

        if (options.loading && typeof options.loading == "string" && options.loading.trim() !== "") {
            // se viene passato uno stato di loading specifico per questo evento, lo mostro in UI.
            setLoading((prev) => ({
                ...prev,
                [options.loading!]: true,
            }));
        };

        const actorRole = user?.ruolo ?? "SYSTEM";
        const actorName = user?.nome ?? null;
        const actorUsername = user?.username ?? null;
        const event = buildProductEvent({
            type,
            message: options.message,
            actorRole,
            actorName,
            actorUsername,
            meta: options.meta,
        });

        const currentId = openProductQtsSettings._id;

        // 1) aggiorna cart locale
        setCart((prev) => {
            const idx = prev.findIndex((p) => p._id === currentId);
            if (idx === -1) return prev;

            const target = prev[idx] as CartProductDTO;
            const updated: CartProductDTO = {
                ...target,
                eventi: [...(target.eventi ?? []), event],
            };

            const clone = [...prev];
            clone[idx] = updated;
            return clone;
        });

        // 2) aggiorna pannello aperto
        setOpenProductQtsSettings((prev) => {
            if (!prev) return prev;

            return {
                ...prev,
                eventi: [...(prev.eventi ?? []), event],
            };
        });

        // 4) persistenza asincrona dell’evento sul BE
        const productSnapshot = openProductQtsSettings as CartProductDTO;
        const qtsSnapshot = qts;
        const customerSnapshot = customer;
        const abortController = new AbortController();
        AddProductEventAPI({
            abortController,
            user: userState,
            quotationId,
            idDoc: openProductQtsSettings._id,
            event: {
                type,
                message: options.message ?? null,
                meta: options.meta ?? null,
            },
            HandleComplete: () => {
                // opzionale: resync da BE in futuro
                if (!userState.details) return;
                if (options.loading && typeof options.loading == "string" && options.loading.trim() !== "") {
                    // se viene passato uno stato di loading specifico per questo evento, lo mostro in UI.
                    setLoading((prev) => ({
                        ...prev,
                        [options.loading!]: false,
                    }));
                };
                return dispatchProductEventSideEffects({
                    options,
                    product: productSnapshot,
                    qts: qtsSnapshot,
                    customer: customerSnapshot,
                });
            },
            HandleError: (msg) => {
                console.error(
                    "[appendEventToCurrentProduct] errore nel salvataggio evento:",
                    msg,
                );
            },
        });
    };

    /**
     * Salva la segnalazione anomalia scheda nel flusso eventi prodotto.
     * Manteniamo il salvataggio via eventi per evitare nuove collection/API:
     * il BE persiste già gli eventi su Mongo, quindi integrazione minima.
     *
     * Contratto payload:
     * - original: snapshot completo della scheda al momento apertura form
     * - patch: differenze rispetto allo snapshot originale
     * - note: motivo obbligatorio della segnalazione
     *
     * Effetto funzionale:
     * - NON aggiorna subito i dati prodotto master
     * - crea una "richiesta di correzione" tracciata in timeline
     */
    const handleReportProductAnomaly = async (payload: {
        note: string;
        original: Record<string, any>;
        patch: Record<string, any>;
    }) => {
        if (!openProductQtsSettings) {
            enqueueSnackbar("Apri prima un prodotto della quotazione.", { type: "error" });
            return;
        }

        const note = payload.note?.trim();
        if (!note) {
            enqueueSnackbar("La nota e obbligatoria per inviare la segnalazione.", { type: "error" });
            return;
        }

        setReportingAnomaly(true);

        AddProductEventAPI({
            abortController: new AbortController(),
            user: userState,
            quotationId,
            idDoc: openProductQtsSettings._id,
            event: {
                type: "SEGNALAZIONE_ANOMALIA_SCHEDA",
                message: "Segnalazione anomalia scheda prodotto",
                meta: {
                    anomalyOriginal: payload.original ?? null,
                    anomalyPatch: payload.patch ?? null,
                    anomalyNote: note,
                },
            },
            HandleComplete: () => {
                enqueueSnackbar("Segnalazione inviata correttamente.", { type: "success" });
                // Resync per avere subito la timeline aggiornata in UI.
                fetchCart();
            },
            HandleError: (msg) => {
                enqueueSnackbar(msg || "Errore durante l'invio della segnalazione.", { type: "error" });
            },
        }).finally(() => {
            setReportingAnomaly(false);
        });
    };

    /**
     * Costruisce un oggetto ContropropostaDTO con base il prodotto 
     * selezionato collegato al prodotto in quotazione.
    */
    const buildSubstitutionProposal = useCallback(
        (base: CartProductDTO | TextRequestCartDTO, replacement: ProductDoc): ContropropostaDTO => {
            const tempID =
                typeof crypto !== "undefined" && "randomUUID" in crypto
                    ? crypto.randomUUID()
                    : `tmp_${Date.now()}_${Math.random().toString(16).slice(2)}`;

            return {
                _id: tempID,
                quotation_id: quotationId,
                quotation_product_docId: base._id,
                product_id: replacement._id,

                quantita: 1,
                codice_buyer: base.codice_buyer ?? null,

                stato: "ATTESA_VALUTAZIONE",
                dettagli_prodotto: {
                    descrizione:
                        (replacement as any).descrizioneEstesa ??
                        replacement.descrizione ?? null,
                    anteprima:
                        (replacement as any).anteprima ?? null,
                    marca:
                        (replacement as any).marca ??
                        (replacement as any).Marca ?? null,
                    codiceProduttore:
                        (replacement as any).codiceProduttore ??
                        (replacement as any).CodiceProduttore ?? null,
                    codiceEAN:
                        (replacement as any).codiceEAN ??
                        (replacement as any).CodiceEAN ?? null,
                    linea: (replacement as any).linea,
                    gruppo: (replacement as any).gruppo,
                    famiglia: (replacement as any).famiglia,
                    descrizioneLinea: (replacement as any).descrizioneLinea,
                    descrizioneGruppo: (replacement as any).descrizioneGruppo,
                    descrizioneFamiglia: (replacement as any).descrizioneFamiglia,
                },
                quotazione: {
                    prezzo_finale: 0,
                },
                createdBy: {
                    nome: userState?.details?.nome ?? null,
                    username: userState?.details?.username ?? null,
                    ruolo: userState?.details?.ruolo ?? null,
                },
                createdAt: new Date(),
                updatedAt: new Date(),
            };
        },
        [],
    );

    /**
     * Seleziona & Deseleziona un prodotto dalla ricerca viene aggiunto come 
     * controproposta al prodotto attualmente aperto nel pannello di destra.
     * - Aggiorna il carrello (`cart`)
     * - Aggiorna il prodotto aperto (`openProductQtsSettings`)
     * - Sincronizza lo snapshot della quotazione (`qts`) per coerenza
     * - Imposta lo stato a "CONTROPROPOSTA_RICHIESTA"
    */
    const selectSubstitutionProductForCurrent = useCallback((replacement: ProductDoc) => {
        if (!openProductQtsSettings) {
            enqueueSnackbar(
                "Nessun prodotto selezionato: apri prima un prodotto per proporre una sostituzione.",
                { type: "error" },
            );
            return;
        };

        const replacementId = String(replacement?._id ?? "").trim();
        if (!replacementId) {
            enqueueSnackbar("Impossibile gestire la sostituzione: prodotto non valido.", { type: "error" });
            return;
        }

        const currentProduct = openProductQtsSettings;
        const currentDocId = currentProduct._id;
        const normalizedReplacement = { ...replacement, _id: replacementId } as ProductDoc;
        const currentProposals = currentProduct.controproposte ?? [];

        const isEditableProposal = (cp: ContropropostaDTO) =>
            cp?.stato === "ATTESA_VALUTAZIONE" && !cp?.approvato;

        const matchesByProposalId = (cp: ContropropostaDTO) => String(cp?._id ?? "") === replacementId;
        const matchesByProductId = (cp: ContropropostaDTO) => String(cp?.product_id ?? "") === replacementId;
        const matchesTarget = (cp: ContropropostaDTO) => matchesByProposalId(cp) || matchesByProductId(cp);
        const matchesExistingProposalId = currentProposals.some((cp) => matchesByProposalId(cp));
        const replacementHasProductDetails =
            !!cleanOptionalString((replacement as any)?.descrizioneEstesa) ||
            !!cleanOptionalString((replacement as any)?.descrizione) ||
            !!cleanOptionalString((replacement as any)?.codiceProduttore) ||
            !!cleanOptionalString((replacement as any)?.marca);

        const isAlreadySelected = currentProposals.some(
            (cp) => isEditableProposal(cp) && matchesTarget(cp),
        );

        // Se riceviamo solo un proposalId senza dati prodotto e quella proposta non
        // e modificabile, evitiamo di creare una card locale "vuota".
        if (!isAlreadySelected && matchesExistingProposalId && !replacementHasProductDetails) {
            return;
        }

        const nextControproposte: ContropropostaDTO[] = isAlreadySelected
            ? currentProposals.filter((cp) => !(isEditableProposal(cp) && matchesTarget(cp)))
            : [
                ...currentProposals
                    .filter((cp) => !cp.approvato)
                    // safety net: se esistono duplicati locali sullo stesso prodotto, li comprimiamo
                    .filter((cp) => !(isEditableProposal(cp) && matchesByProductId(cp))),
                buildSubstitutionProposal(currentProduct, normalizedReplacement),
            ];

        // 1) Aggiorna il prodotto aperto
        setOpenProductQtsSettings((prev) => {
            if (!prev || prev._id !== currentDocId) return prev;
            return {
                ...prev,
                controproposte: nextControproposte,
            };
        });

        // 2) Mantiene sincronizzato il carrello
        setCart((prev) => {
            if (!prev || !Array.isArray(prev) || prev.length === 0) return prev;
            return prev.map((item) => {
                if (item._id !== currentDocId) return item;
                return {
                    ...item,
                    controproposte: nextControproposte,
                };
            });
        });
    },
        [buildSubstitutionProposal, openProductQtsSettings, setCart, setOpenProductQtsSettings],
    );

    /**
     * Funzione che gestisce la modifica del prezzo proposto nella quotazione del prodotto aperto nel pannello delle impostazioni
     * in modo poi da poter essere salvato successivamente nella funzione se viene cliccato il btn
     * @param e Evento di cambiamento dell'input
     * @returns void
     */
    /**
     * Gestisce la selezione/deselezione di un prodotto come alternativa commerciale per il prodotto attualmente aperto nel pannello di destra.
     * - Se il prodotto non è già suggerito come alternativa, lo aggiunge come suggerimento commerciale.
     * - Se il prodotto è già suggerito, lo rimuove dai suggerimenti commerciali.
     */
    const toggleCommercialAlternativeForCurrent = useCallback(async (replacement: ProductDoc & { suggestionId?: string }) => {
        if (!openProductQtsSettings || openProductQtsSettings.kind !== "PRODUCT") {
            enqueueSnackbar("Apri prima un prodotto della quotazione per gestire le alternative commerciali.", { type: "error" });
            return;
        };

        if (qts?.stato !== "BOZZA") {
            enqueueSnackbar("Le alternative commerciali possono essere gestite solo quando la quotazione è in BOZZA.", { type: "warning" });
            return;
        };

        // controlla se il prodotto non è già in loading per le alternative commerciali, per evitare richieste duplicate in caso di click ripetuti
        const isLoadingAlternative = (loading.agents_alternatives as Map<string, boolean>)?.get(replacement._id);
        if (isLoadingAlternative) {
            enqueueSnackbar("Operazione in corso su questo prodotto, attendi prima di riprovare.", { type: "info" });
            return;
        };

        // Imposta loading specifico per questo prodotto in sostituzione
        // (in questo modo possiamo mostrare uno spinner solo sul prodotto interessato, senza bloccare tutta la UI)
        setLoading(prev => {
            const nextMap = new Map(prev.agents_alternatives as Map<string, boolean>);
            nextMap.set(replacement._id, true);

            return {
                ...prev,
                agents_alternatives: nextMap,
            };
        });

        const currentProduct = openProductQtsSettings as CartProductDTO;
        const existing = currentProduct.alternativeSuggestions?.find((item) => item.product_id === replacement._id) ?? null;

        const payload = {
            product_id: replacement._id,
            quantita: currentProduct.quantita,
            codice_buyer: currentProduct.codice_buyer ?? null,
            note: null,
            dettagli_prodotto: {
                descrizione: (replacement as any).descrizioneEstesa ?? replacement.descrizione ?? null,
                anteprima: (replacement as any).anteprima ?? null,
                marca: (replacement as any).marca ?? (replacement as any).Marca ?? null,
                codiceProduttore: (replacement as any).codiceProduttore ?? (replacement as any).CodiceProduttore ?? null,
                codiceEAN: (replacement as any).codiceEAN ?? (replacement as any).CodiceEAN ?? null,
                linea: (replacement as any).linea ?? null,
                gruppo: (replacement as any).gruppo ?? null,
                famiglia: (replacement as any).famiglia ?? null,
                descrizioneLinea: (replacement as any).descrizioneLinea ?? null,
                descrizioneGruppo: (replacement as any).descrizioneGruppo ?? null,
                descrizioneFamiglia: (replacement as any).descrizioneFamiglia ?? null,
            },
        };

        const syncCurrentProductFromServer = async (): Promise<CartProductDTO | undefined> => {
            const cartResponse = await fetchCart();
            const refreshedCurrent = (cartResponse?.data ?? []).find(
                (item) => item._id === currentProduct._id && item.kind === "PRODUCT",
            ) as CartProductDTO | undefined;

            if (refreshedCurrent) {
                setOpenProductQtsSettings(refreshedCurrent);
            }

            // rimuovi il loading state per questo prodotto
            setLoading(prev => {
                const nextMap = new Map(prev.agents_alternatives as Map<string, boolean>);
                nextMap.delete(replacement._id);

                return {
                    ...prev,
                    agents_alternatives: nextMap,
                };
            });
            return refreshedCurrent;
        };

        const abortController = new AbortController();

        if (existing) {
            let suggestionId: string | null = (existing as any)?._id ?? replacement.suggestionId ?? null;

            if (!suggestionId) {
                const refreshedCurrent = await syncCurrentProductFromServer();
                suggestionId =
                    refreshedCurrent?.alternativeSuggestions?.find((item) => item.product_id === replacement._id)?._id ?? null;
            }

            if (!suggestionId) {
                enqueueSnackbar("Impossibile identificare l'alternativa da rimuovere. Ricarica i dati e riprova.", { type: "warning" });
                return;
            }

            DeleteCommercialAlternativeSuggestionAPI({
                abortController,
                user: userState,
                quotationId,
                idDoc: currentProduct._id,
                suggestionId,
                HandleComplete: async () => {
                    await syncCurrentProductFromServer();
                },
                HandleError: (msg) => enqueueSnackbar(msg || "Errore durante la rimozione dell'alternativa commerciale.", { type: "error" }),
            });
            return;
        }

        CreateCommercialAlternativeSuggestionAPI({
            abortController,
            user: userState,
            quotationId,
            idDoc: currentProduct._id,
            payload,
            HandleComplete: async () => {
                await syncCurrentProductFromServer();
            },
            HandleError: (msg) => enqueueSnackbar(msg || "Errore durante il salvataggio dell'alternativa commerciale.", { type: "error" }),
        });
    }, [openProductQtsSettings, qts?.stato, userState, quotationId, fetchCart]);

    /**
     * Gestisce la creazione di una controproposta a partire da un suggerimento commerciale selezionato per il prodotto attualmente aperto.
     * - Recupera il suggerimento commerciale selezionato tramite suggestionId
     * - Costruisce una controproposta basata sui dati del suggerimento commerciale
     * - Aggiunge la controproposta al prodotto aperto e aggiorna lo stato locale
     */
    const createCounterProposalFromCommercialSuggestionForCurrent = useCallback((suggestionId: string) => {
        if (!openProductQtsSettings) return;

        const currentProduct = openProductQtsSettings as CartProductDTO;
        const suggestion = currentProduct.alternativeSuggestions?.find((item) => item._id === suggestionId);
        if (!suggestion) return;

        const replacement = {
            _id: suggestion.product_id,
            descrizione: suggestion.dettagli_prodotto?.descrizione ?? null,
            anteprima: suggestion.dettagli_prodotto?.anteprima ?? null,
            marca: suggestion.dettagli_prodotto?.marca ?? null,
            codiceProduttore: suggestion.dettagli_prodotto?.codiceProduttore ?? null,
            codiceEAN: suggestion.dettagli_prodotto?.codiceEAN ?? null,
            linea: suggestion.dettagli_prodotto?.linea ?? null,
            gruppo: suggestion.dettagli_prodotto?.gruppo ?? null,
            famiglia: suggestion.dettagli_prodotto?.famiglia ?? null,
            descrizioneLinea: suggestion.dettagli_prodotto?.descrizioneLinea ?? null,
            descrizioneGruppo: suggestion.dettagli_prodotto?.descrizioneGruppo ?? null,
            descrizioneFamiglia: suggestion.dettagli_prodotto?.descrizioneFamiglia ?? null,
        } as ProductDoc;

        selectSubstitutionProductForCurrent(replacement);
    }, [openProductQtsSettings, selectSubstitutionProductForCurrent]);

    const handleProposeQtsProductsPrice = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!openProductQtsSettings) return;
        const raw = e.target.value.trim();
        const normalized = raw.replace(",", ".");
        const parsed = normalized === "" ? undefined : Number(normalized);

        setOpenProductQtsSettings((prevState: CartProductDTO | TextRequestCartDTO | null) => {
            if (!prevState) return prevState;
            const copy = { ...prevState };
            copy.quotazione = {
                ...copy.quotazione,
                prezzo_finale: Number.isFinite(parsed) ? parsed : undefined,
            };
            return copy;
        });
    };

    const handleDirectQuoteExpiryChange = useCallback((value: string) => {
        if (!openProductQtsSettings) return;

        const nextExpiry = value ? new Date(value).toISOString() : null;

        setOpenProductQtsSettings((prevState: CartProductDTO | TextRequestCartDTO | null) => {
            if (!prevState) return prevState;
            return {
                ...prevState,
                quotazione: {
                    ...prevState.quotazione,
                    scadenza: nextExpiry ?? undefined,
                },
            };
        });
    }, [openProductQtsSettings]);

    /**
     * Gestisce la modifica del testo della nota collegata alla proposta
     * di sostituzione del prodotto corrente.
     * @param value Testo completo della nota inserito dall'utente
     * @returns void
    */
    const handleChangeProposalNote = useCallback((value: string) => {
        setCurrentProposalNote(value);
    }, []);


    /**
     * Funzione per gestire il recupero delle timeline eventi del prodotto corrente aperto (Dettagli avanzati / storico)
     * con possibilità di filtrare per tipo di evento o per esclusione di tipo di evento
     * @param includeTypes Array di tipi di evento da includere
     * @param excludeTypes Array di tipi di evento da escludere
     * @return Array di eventi filtrati
     */
    const getFilteredEventsForCurrentProduct = ({ includeTypes = [], excludeTypes = [] }: {
        includeTypes?: ProductEventType[],
        excludeTypes?: ProductEventType[],
    }): ProductEventDTO[] => {
        if (!openProductQtsSettings || !openProductQtsSettings.eventi) return [];
        return openProductQtsSettings.eventi.filter((event) => {
            const isIncluded =
                includeTypes.length === 0 || includeTypes.includes(event.type);
            const isExcluded = excludeTypes.includes(event.type);
            return isIncluded && !isExcluded;
        }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); // ordina per data decrescente
    };

    /**
     * Aggiorna in *bozza* i dati della controproposta attiva
     * (quantità, prezzo proposto, note) per il prodotto attualmente aperto.
     *
     * NON tocca la quantità reale del prodotto, NON chiama API.
     * La persistenza effettiva avviene solo quando si usa
     * `proposeQtsProductsPrice` / "Invia proposta al commerciale".
    */
    const updateSubstitutionDraft = useCallback(
        (patch: { quantity?: number; price?: number; expiry?: string | null; note?: string, _id: string }) => {
            if (!openProductQtsSettings) return;

            // helper che aggiorna l'array controproposta del prodotto corrente
            const patchControproposte = (c: ContropropostaDTO[]): ContropropostaDTO[] => {
                if (!c || !Array.isArray(c) || c.length === 0) {
                    return c;
                };

                const updated = c.map((cp) => {
                    const isActive = cp.stato === "ATTESA_VALUTAZIONE" && cp._id === patch._id;
                    if (!isActive) return cp;

                    return {
                        ...cp,
                        // quantità proposta nella controproposta
                        quantita: patch.quantity ?? cp.quantita ?? 1,
                        // nota legata a questa proposta
                        note: patch.note ?? [],
                        // prezzo proposto al commerciale in bozza
                        quotazione: {
                            ...cp.quotazione,
                            prezzo_finale: patch.price ?? cp.quotazione.prezzo_finale ?? 0,
                            scadenza: patch.expiry !== undefined ? patch.expiry : (cp.quotazione?.scadenza ?? undefined),
                        }
                    };
                });

                return updated;
            };

            // 1) aggiorna carrello in memoria
            setCart((prev) => {
                if (!prev || !prev.length) return prev;
                return prev.map((p) => {
                    const isCurrent = p._id === openProductQtsSettings._id;
                    if (!isCurrent) return p;
                    return { ...p, controproposte: patchControproposte(p.controproposte ?? []) };
                });
            });

            // 2) aggiorna prodotto aperto nel pannello
            setOpenProductQtsSettings((prev) => {
                if (!prev) return prev;
                return { ...prev, controproposte: patchControproposte(prev.controproposte ?? []) };
            });
        },
        [openProductQtsSettings, setCart, setOpenProductQtsSettings, setQts],
    );

    /**
     * Imposta la controproposta *selezionata* per il prodotto attualmente aperto.
     *
     * Uso tipico (lato commerciale): quando arrivano più proposte in controproposta,
     * il commerciale deve sceglierne una. Qui marchiamo come `attivo=true` solo quella
     * selezionata e disattiviamo le altre.
     *
     * Nota: non effettua chiamate API; la persistenza avviene quando il commerciale
     * accetta la controproposta (es. stato `CONTROPROPOSTA_ACCETTATA`).
     */
    const setActiveCounterProposalForCurrent = useCallback(
        (proposalId: string) => {
            if (!openProductQtsSettings) return;

            const patchControproposte = (c: ContropropostaDTO[]): ContropropostaDTO[] => {
                if (!c || !Array.isArray(c) || c.length === 0) {
                    return c;
                }

                const updated = c.map((cp) => {
                    // non toccare eventuali proposte non attive (storico)
                    if (cp.stato !== "ATTESA_VALUTAZIONE") return cp;

                    return { ...cp, approvato: cp._id === proposalId };
                });

                return updated;
            };

            // 1) aggiorna carrello in memoria
            setCart((prev) => {
                if (!prev || !prev.length) return prev;
                return prev.map((p) => {
                    const isCurrent = p._id === openProductQtsSettings._id;
                    if (!isCurrent) return p;
                    return { ...p, controproposte: patchControproposte(p.controproposte ?? []) };
                });
            });

            // 2) aggiorna prodotto aperto nel pannello
            setOpenProductQtsSettings((prev) => {
                if (!prev) return prev;
                return { ...prev, controproposte: patchControproposte(prev.controproposte ?? []) };
            });
        },
        [openProductQtsSettings, setCart, setOpenProductQtsSettings],
    );


    // ——————————————————————————————————————————————————————————
    // RETURN HOOK
    // ——————————————————————————————————————————————————————————
    return {
        CheckAdminDev,

        quotationId,
        userState,
        isRequester,

        fetchDetails,

        openProductQtsSettings, setOpenProductQtsSettings, handleOpenQtsSettings,
        openFilters, setOpenFilters,
        openSearch, setOpenSearch,
        openCustomersDetails, setOpenCustomersDetails,
        contextMenuRef,

        scope, setScope, handleScopeChange,
        view, setView,
        density, setDensity,

        raw,
        filters, setFilters,
        cart,
        highlightedItemId,
        categoryData,

        customer,
        qts, setQts,
        errorMsg, setErrorMsg,

        loading, setLoading,
        loadingSearch, setLoadingSearch,
        getProgressPercentage, areAllProductsDone,
        inpagination, setInpagination,

        recentSearch, setRecentSearch,
        searchQuery, setSearchQuery,
        searchItems, setSearchItems,
        searchCartItems, setSearchCartItems,

        // pannelli di dettaglio links OC/FB
        openOkLinksPanel, setOpenOkLinksPanel,
        okLinks, setOkLinks,
        fetchQuotationOkLinks,

        searchDebounced,
        runSearch, runSearchOnCart,
        handleSelectFromSearch,
        //operazioni sulla quotazione
        HandleQuotationState,

        //operazioni carrello
        addToCart, addTextToCart,
        removeFromCart,
        updateCartItemQuantity,
        clearCart,
        handleImportCartFromFile,

        handleReqQtsProductsChangeState,
        handleProposeQtsProductsPrice,
        handleDirectQuoteExpiryChange,
        selectSubstitutionProductForCurrent,
        toggleCommercialAlternativeForCurrent,
        createCounterProposalFromCommercialSuggestionForCurrent,
        updateSubstitutionDraft,
        appendEventToCurrentProduct,
        onChangeProposalNote: handleChangeProposalNote, currentProposalNote,
        getFilteredEventsForCurrentProduct, // funzione per ottenere eventi filtrati
        setActiveCounterProposalForCurrent, // funzione per settare la controproposta attiva in fase di accettazione/rifiuto
        handleUpdateValidityWindow, // funzione per aggiornare in bozza la finestra di validità dell'offerta
        handleReplacePlaceholderCustomer, // sostituisce il cliente placeholder con cliente reale su BID_PASSIVO
        sendProductNote, // funzione per inviare la nota legata alla proposta di sostituzione indipendentemente dall'invio della controproposta stessa

        //abort controllers
        abortQtsRef,
        abortCartRef,
        abortDeleteRef: abortDirectRef,

        // gestione buyer assegnato
        assigningBuyer,
        handleAssignBuyer,
        handleAssignExtraProductsDetails,
        // gestione segnalazioni anomalia scheda prodotto
        reportingAnomaly,
        handleReportProductAnomaly,

        // gestione duplicazione quotazione
        duplicateModalOpen,
        duplicateCandidates,
        closeDuplicateModal,
        continueOpenAfterDuplicate,

        categoryIndex,
    };
};