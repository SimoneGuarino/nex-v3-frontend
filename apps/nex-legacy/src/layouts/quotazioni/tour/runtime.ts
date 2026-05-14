import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type { CartProductDTO, ProductDoc, TextRequestCartDTO } from "../types/qts_product";
import type { QuotazioneDTO } from "../types/quotations";
import type { ClosureDraft } from "../types/closure";
import { getRolesMappedByIndex } from "utils/ruoli/index";
import {
    TOUR_STATIC_PRODUCT,
    TOUR_STATIC_SUBSTITUTION_PRODUCT,
    buildTourMockClosedCartForViewer,
    buildTourMockCartForViewer,
    buildTourMockCustomerPanelPayload,
    buildTourMockProductsListForViewer,
    buildTourMockQuotationDetailsResponseForViewer,
    buildTourMockSubstitutionSearchProductsForBuyer,
    getTourMockQuotationListPhase,
    setTourMockQuotationListPhase,
    isBuyerViewer,
    isTourMockQuotationId,
} from "./mockQuotation";

// --------------------------------------------------
// TYPES
// --------------------------------------------------
/**
 * Set minimo dei setter che la pagina dettagli usa durante l'hydration iniziale.
 * Lo teniamo esplicito per rendere chiaro quali stati vengono "seedati" nel ramo tour.
 */
type HydrateTourQuotationDetailsStateParams = {
    viewerRole?: string | null;
    /**
     * Codice buyer del viewer corrente.
     * Serve solo nel mock tour buyer per allineare la riga fake
     * alla stessa ownership usata dalla UI reale.
     */
    viewerBuyerCode?: string | null;
    setQts: Dispatch<SetStateAction<QuotazioneDTO | null>>;
    setCustomer: Dispatch<SetStateAction<any>>;
    setCart: Dispatch<SetStateAction<Array<CartProductDTO | TextRequestCartDTO>>>;
    setRaw: Dispatch<SetStateAction<any[]>>;
    setSearchItems: Dispatch<SetStateAction<any[]>>;
    setSearchCartItems: Dispatch<SetStateAction<any[]>>;
    setInpagination: Dispatch<SetStateAction<any>>;
    setErrorMsg: Dispatch<SetStateAction<string | null>>;
    setLoading: Dispatch<SetStateAction<{ [key: string]: boolean | Map<string, boolean> }>>;
};

// --------------------------------------------------
// RUNTIME GUARDS
// --------------------------------------------------
/**
 * Espone un nome semantico "runtime" per la verifica ID tour.
 * Anche se internamente delega a `mockQuotation.ts`, mantenerla qui semplifica
 * l'uso nel hook dettagli senza spargere dipendenze.
 */
export function isTourDetailsRuntimeActive(quotationId: unknown): boolean {
    return isTourMockQuotationId(quotationId);
}

// --------------------------------------------------
// RUNTIME HYDRATION
// --------------------------------------------------
/**
 * Inietta nello stato pagina dettaglio i dati fake del tour con shape compatibile backend.
 * Obiettivo:
 * - evitare chiamate API con ID non ObjectId
 * - mantenere i componenti UI invariati (ricevono comunque qts/customer/cart)
 * - pulire eventuali stati residuali di ricerca/paginazione
 */
export function hydrateTourQuotationDetailsState({
    viewerRole,
    viewerBuyerCode,
    setQts,
    setCustomer,
    setCart,
    setRaw,
    setSearchItems,
    setSearchCartItems,
    setInpagination,
    setErrorMsg,
    setLoading,
}: HydrateTourQuotationDetailsStateParams): void {
    /**
     * Adattamento visualizzazione per ruolo:
     * - Buyer: entra nel dettaglio dopo assegnazione, quindi NON in BOZZA.
     * - CAD (Commerciale/Admin/Dev): resta BOZZA, coerente con flusso di apertura/assegnazione.
     *
     * Nota:
     * applichiamo questa normalizzazione solo nel runtime tour mock,
     * senza toccare minimamente i flussi reali backend.
     */
    const payload = buildTourMockQuotationDetailsResponseForViewer(viewerRole);
    const mockCart = buildTourMockCartForViewer(viewerRole, viewerBuyerCode);
    const mockProductsList = buildTourMockProductsListForViewer(viewerRole);

    // Seed principale: dettaglio quotazione + anagrafica cliente.
    setQts((prev) => {
        /**
         * Guard anti-override:
         * se un'azione tour ha già impostato uno stato locale del mock (es. OK/DA_CHIUDERE),
         * non lo sovrascriviamo con il payload iniziale role-aware dell'hydration.
         *
         * Questo evita regressioni nei passaggi cross-page con step finali.
         */
        if (prev && (prev as any).__tourMock) return prev;
        return payload.data;
    });
    setCustomer(payload.cliente);

    // Seed secondario: cart role-aware.
    // Buyer vede subito una riga prodotto proveniente dal carrello commerciale;
    // CAD resta con cart vuoto nel flusso pre-assegnazione.
    setCart(mockCart);
    /**
     * Seed lista prodotti role-aware:
     * - CAD (Commerciale/Admin/Dev): mostriamo alcune card mock in "Lista prodotti";
     * - Buyer: array vuoto, perchÃ© nel suo tour il focus Ã¨ su "Quotazione Prodotti".
     */
    setRaw(mockProductsList);

    // Reset esplicito dei dati derivati da ricerche precedenti.
    setSearchItems([]);
    setSearchCartItems([]);
    setInpagination(undefined);

    // Nel ramo mock non c'Ã¨ errore: azzeriamo eventuale messaggio legacy.
    setErrorMsg(null);

    // Spegniamo tutti i flag loading usati dalla pagina, cosÃ¬ la UI resta stabile.
    setLoading((prev) => ({
        ...prev,
        general_data: false,
        cart: false,
        table_of_products: false,
        loadingMore: false,
        search: false,
        search_replace_products: false,
    }));
}

/**
 * Determina se il viewer corrente appartiene al gruppo CAD
 * (Commerciale/Admin/Dev), anche quando il ruolo arriva come indice numerico.
 *
 * - il comportamento richiesto Ã¨ limitato a CAD;
 * - centralizziamo qui la regola per evitare condizioni duplicate nei componenti.
 */
function isCommercialAdminDevViewer(viewerRole?: string | null): boolean {
    const roleRaw = String(viewerRole ?? "").trim();
    const roleNorm = roleRaw.toLowerCase();

    if (
        roleNorm === "commerciale" ||
        roleNorm === "admin" ||
        roleNorm === "dev"
    ) {
        return true;
    }

    if (/^\d+$/.test(roleRaw)) {
        const mapped = String(getRolesMappedByIndex()[roleRaw] ?? "").trim().toLowerCase();
        return mapped === "commerciale" || mapped === "admin" || mapped === "dev";
    }

    return false;
}

/**
 * Intercetta l'add-to-cart nel dettaglio quotazione fake durante il tour.
 *
 * Cosa fa:
 * - opera solo se siamo su ID tour mock + ruolo CAD (Commerciale/Admin/Dev);
 * - aggiorna il carrello locale senza chiamare API backend (niente validazione ObjectId);
 * - incrementa quantitÃ  se il prodotto fake Ã¨ giÃ  presente.
 * - consente il flusso del tour fake senza appesantire `useDetailsQuotation` con logica dedicata.
 *
 * Ritorno:
 * - `true` se la mutation Ã¨ stata gestita dal runtime tour;
 * - `false` se il caller deve proseguire col flusso reale.
 */
export function tryAddProductToTourMockCart(params: {
    quotationId: unknown;
    viewerRole?: string | null;
    product: ProductDoc;
    setCart: Dispatch<SetStateAction<Array<CartProductDTO | TextRequestCartDTO>>>;
}): boolean {
    const { quotationId, viewerRole, product, setCart } = params;

    if (!isTourDetailsRuntimeActive(quotationId)) return false;
    if (!isCommercialAdminDevViewer(viewerRole)) return false;
    if (!product?._id) return false;

    setCart((prev) => {
        const index = prev.findIndex(
            (item) => item.kind === "PRODUCT" && (item as CartProductDTO).product_id === product._id,
        );

        if (index === -1) {
            const nextRow: CartProductDTO = {
                _id: `__tour_cart_product_${product._id}`,
                product_id: product._id,
                kind: "PRODUCT",
                quantita: 1,
                codice_buyer: "BDR",
                approvato: false,
                eventi: [],
                dettagli_prodotto: {
                    codiceProduttore: product.codiceProduttore ?? null,
                    codiceEAN: product.codiceEAN ?? null,
                    descrizione: product.descrizione ?? "N/A",
                    anteprima: product.anteprima ?? null,
                    marca: product.marca ?? "N/A",
                    linea: product.linea ?? null,
                    gruppo: product.gruppo ?? null,
                    famiglia: product.famiglia ?? null,
                    descrizioneLinea: product.descrizioneLinea ?? null,
                    descrizioneGruppo: product.descrizioneGruppo ?? null,
                    descrizioneFamiglia: product.descrizioneFamiglia ?? null,
                },
                controproposte: [],
                alternativeSuggestions: [],
                quotazione: {
                    stato: "ATTESA_VALUTAZIONE",
                },
            };
            return [...prev, nextRow];
        }

        const next = [...prev];
        const existing = next[index] as CartProductDTO;
        next[index] = {
            ...existing,
            quantita: (existing.quantita ?? 0) + 1,
        };
        return next;
    });

    return true;
}

/**
 * Cleanup del loader "add to cart" usato nel dettaglio quotazione.
 *
 * - il ramo tour puÃ² uscire con early-return dopo `tryAddProductToTourMockCart`;
 * - in quel caso non passiamo dai callback API reali che normalmente spengono il loader;
 * - centralizzare qui evita che la logica speciale tour resti sparsa nel hook.
 */
export function clearTourAddToCartLoading(params: {
    setLoading: Dispatch<SetStateAction<{ [key: string]: boolean | Map<string, boolean> }>>;
    productId: string;
}): void {
    const { setLoading, productId } = params;
    if (!productId) return;

    setLoading((prev) => {
        const nextMap = new Map(prev.adding_to_cart as Map<string, boolean>);
        nextMap.delete(productId);
        return {
            ...prev,
            adding_to_cart: nextMap,
        };
    });
}

/**
 * Fornisce risultati mock per la ricerca "proponi sostituzione" lato Buyer.
 *
 * Nota:
 * - attivo solo nel runtime tour (quotazione mock)
 * - attivo solo per Buyer
 * - attivo solo nel contesto sostituzione (deciso dal caller)
 */
export function getTourMockSubstitutionSearchResults(params: {
    quotationId: unknown;
    viewerRole?: string | null;
    isSubstitutionContext: boolean;
    query?: string;
}): ProductDoc[] | null {
    const { quotationId, viewerRole, isSubstitutionContext, query } = params;

    if (!isTourDetailsRuntimeActive(quotationId)) return null;
    const isBuyer = isBuyerViewer(viewerRole);
    const isCad = isCommercialAdminDevViewer(viewerRole);
    if (!isBuyer && !isCad) return null;

    // Contesto sostituzione: prodotto demo usato nel flusso proposta/controproposta.
    if (isSubstitutionContext) {
        return buildTourMockSubstitutionSearchProductsForBuyer(query);
    }

    // Contesto catalogo (AS panel): solo CAD, mai Buyer.
    if (!isCad) return null;

    const catalog = buildTourMockProductsListForViewer(viewerRole);
    const normalizedQuery = String(query ?? "").trim().toLowerCase();
    if (!normalizedQuery) return catalog;

    return catalog.filter((product) => {
        const haystack = [
            product.codiceProduttore,
            product.codiceEAN,
            product.descrizione,
            product.marca,
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

        return haystack.includes(normalizedQuery);
    });
}

/**
 * Intercetta il cambio stato della quotazione fake nel dettaglio tour.
 *
 * Obiettivo:
 * - evitare chiamate API con ID mock durante i passaggi "apri/richiudi";
 * - aggiornare subito la card stato in UI, mantenendo il tour fluido.
 *
 * Ritorno:
 * - `true`  => stato quotazione aggiornato localmente;
 * - `false` => il caller deve proseguire con il flusso reale.
 */
export function tryUpdateTourMockQuotationState(params: {
    quotationId: unknown;
    qts?: QuotazioneDTO | null;
    nextState: QuotazioneDTO["stato"];
    setQts: Dispatch<SetStateAction<QuotazioneDTO | null>>;
}): boolean {
    const { quotationId, qts, nextState, setQts } = params;

    /**
     * Guard runtime robusta:
     * - caso standard: route con ID mock noto;
     * - fallback: quotazione locale marcata come mock (`__tourMock`),
     *   utile quando il test usa una fake quotazione con id non valido/mancante.
     */
    const isTourMockById = isTourDetailsRuntimeActive(quotationId);
    const isTourMockByFlag = Boolean((qts as any)?.__tourMock);
    if (!isTourMockById && !isTourMockByFlag) return false;

    /**
     * Sync lista tour (cross-page):
     * - quando la testata fake passa a `OK` marchiamo la fase finale;
     * - negli altri stati torniamo alla fase `default`.
     *
     * In questo modo sia CAD che Buyer trovano la riga lista coerente
     * con il punto del flusso in cui si trovano.
     */
    const currentListPhase = getTourMockQuotationListPhase();
    if (nextState === "OK") {
        setTourMockQuotationListPhase("closed_ok");
    } else if (currentListPhase !== "closed_ok") {
        /**
         * Regola anti-downgrade:
         * una volta raggiunto `closed_ok` non torniamo a `default` nella stessa
         * sessione tour, così gli step finali restano coerenti anche su backward.
         *
         * Il reset a `default` avviene già nei punti lifecycle dedicati:
         * - avvio tour (step 0)
         * - chiusura tour (remove mock + reset fase).
         */
        setTourMockQuotationListPhase("default");
    }

    setQts((prev) => {
        if (!prev) return prev;
        /**
         * Tour CAD:
         * quando la fake quotazione passa da BOZZA ad APERTA
         * non vogliamo mostrare il banner "Validità quotazione".
         *
         * Per evitare il banner, rimuoviamo la finestra validità dal mock
         * in questa transizione specifica.
         */
        const shouldDropValidityWindow =
            prev.stato === "BOZZA" &&
            nextState === "APERTA";

        if (shouldDropValidityWindow) {
            const { finestraValidita: _omitValidityWindow, ...rest } = prev as any;
            return {
                ...rest,
                stato: nextState,
                updated_at: new Date() as any,
            };
        }

        return {
            ...prev,
            stato: nextState,
            updated_at: new Date() as any,
        };
    });

    return true;
}

/**
 * Intercetta il cambio stato della riga prodotto nel dettaglio quotazione fake.
 *
 * Obiettivo:
 * - durante il tour non chiamare API reali con ID mock;
 * - aggiornare stato/updatedAt solo in memoria locale, mantenendo la UX coerente;
 * - abilitare il flusso buyer di invio controproposta senza backend.
 *
 * Ritorno:
 * - `true`  => mutation gestita localmente nel runtime tour;
 * - `false` => il caller deve proseguire con la mutation reale (API).
 */
export function tryUpdateTourMockQtsProductState(params: {
    quotationId: unknown;
    viewerRole?: string | null;
    idDoc: string;
    nextState: string;
    setCart: Dispatch<SetStateAction<Array<CartProductDTO | TextRequestCartDTO>>>;
    setOpenProductQtsSettings: Dispatch<SetStateAction<CartProductDTO | TextRequestCartDTO | null>>;
}): boolean {
    const {
        quotationId,
        viewerRole,
        idDoc,
        nextState,
        setCart,
        setOpenProductQtsSettings,
    } = params;

    /**
     * Guard runtime:
     * - il branch Ã¨ attivo solo su quotazione fake tour;
     * - abilitiamo Buyer + CAD, così anche lo step "Accetta" commerciale non chiama API su ID mock.
     */
    if (!isTourDetailsRuntimeActive(quotationId)) return false;
    if (!isBuyerViewer(viewerRole) && !isCommercialAdminDevViewer(viewerRole)) return false;
    if (!idDoc) return false;

    const updatedAt = new Date().toISOString();

    // 1) Sincronizza il carrello locale.
    setCart((prev) => {
        if (!Array.isArray(prev) || prev.length === 0) return prev;
        return prev.map((item) => {
            if (item._id !== idDoc) return item;
            return {
                ...item,
                quotazione: {
                    ...item.quotazione,
                    stato: nextState as any,
                },
                updatedAt: updatedAt as any,
            };
        });
    });

    // 2) Sincronizza il pannello prodotto attualmente aperto.
    setOpenProductQtsSettings((prev) => {
        if (!prev || prev._id !== idDoc) return prev;
        return {
            ...prev,
            quotazione: {
                ...prev.quotazione,
                stato: nextState as any,
            },
            updatedAt: updatedAt as any,
        };
    });

    /**
     * Mutation gestita interamente lato FE:
     * nessuna API, nessun evento timeline remoto.
     * Lo step tour avanza comunque perchÃ© lo stato locale Ã¨ giÃ  aggiornato.
     */
    return true;
}

/**
 * Prepara lo scenario CAD "controproposta inviata dal buyer" nel runtime tour.
 *
 * Cosa fa:
 * - forza la prima riga prodotto fake in stato `CONTROPROPOSTA_INVIATA`;
 * - garantisce almeno una controproposta demo, cosÃ¬ compare il badge
 *   "1 controproposta" cliccabile dal commerciale/admin/dev.
 *
 * Nota:
 * - mutation solo locale (niente API);
 * - idempotente: se lo scenario Ã¨ giÃ  pronto, non sporca ulteriormente lo stato.
 */
export function prepareTourMockCommercialCounterproposalRuntime(params: {
    quotationId: unknown;
    qts?: QuotazioneDTO | null;
    setCart: Dispatch<SetStateAction<Array<CartProductDTO | TextRequestCartDTO>>>;
    setOpenProductQtsSettings: Dispatch<SetStateAction<CartProductDTO | TextRequestCartDTO | null>>;
}): boolean {
    const { quotationId, qts, setCart, setOpenProductQtsSettings } = params;

    const isTourMockById = isTourDetailsRuntimeActive(quotationId);
    const isTourMockByFlag = Boolean((qts as any)?.__tourMock);
    if (!isTourMockById && !isTourMockByFlag) return false;

    const nowIso = new Date().toISOString();
    let targetDocId: string | null = null;

    /**
     * Factory locale della proposta demo usata nel percorso CAD.
     * Manteniamo il builder vicino alla mutation per evitare duplicazioni nel hook.
     */
    const buildDemoProposal = (params: { quotationProductDocId: string; buyerCode?: string | null }) => ({
        _id: "__tour_commercial_counterproposal__",
        quotation_id: String(quotationId ?? ""),
        quotation_product_docId: params.quotationProductDocId,
        product_id: TOUR_STATIC_SUBSTITUTION_PRODUCT._id,
        quantita: 1,
        codice_buyer: params.buyerCode ?? "BDR",
        stato: "ATTESA_VALUTAZIONE",
        approvato: false,
        dettagli_prodotto: {
            descrizione: TOUR_STATIC_SUBSTITUTION_PRODUCT.descrizione,
            anteprima: TOUR_STATIC_SUBSTITUTION_PRODUCT.anteprima,
            marca: TOUR_STATIC_SUBSTITUTION_PRODUCT.marca,
            codiceProduttore: TOUR_STATIC_SUBSTITUTION_PRODUCT.codiceProduttore,
            codiceEAN: TOUR_STATIC_SUBSTITUTION_PRODUCT.codiceEAN,
            linea: TOUR_STATIC_SUBSTITUTION_PRODUCT.linea,
            gruppo: TOUR_STATIC_SUBSTITUTION_PRODUCT.gruppo,
            famiglia: TOUR_STATIC_SUBSTITUTION_PRODUCT.famiglia,
            descrizioneLinea: TOUR_STATIC_SUBSTITUTION_PRODUCT.descrizioneLinea,
            descrizioneGruppo: TOUR_STATIC_SUBSTITUTION_PRODUCT.descrizioneGruppo,
            descrizioneFamiglia: TOUR_STATIC_SUBSTITUTION_PRODUCT.descrizioneFamiglia,
        },
        quotazione: {
            prezzo_finale: TOUR_STATIC_SUBSTITUTION_PRODUCT.prezzoDealer,
            scadenza: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
        note: [],
        createdBy: {
            nome: "Buyer Demo",
            username: "buyer.demo",
            ruolo: "BUYER",
        },
        createdAt: nowIso,
        updatedAt: nowIso,
    });

    setCart((prev) => {
        if (!Array.isArray(prev) || prev.length === 0) return prev;

        const firstProduct = prev.find((item) => (item.kind ?? "PRODUCT") === "PRODUCT") as CartProductDTO | undefined;
        if (!firstProduct) return prev;
        targetDocId = firstProduct._id;

        const hasAnyProposal = Array.isArray(firstProduct.controproposte) && firstProduct.controproposte.length > 0;
        const alreadyInCounterproposalState = firstProduct.quotazione?.stato === "CONTROPROPOSTA_INVIATA";
        if (alreadyInCounterproposalState && hasAnyProposal) return prev;

        const demoProposal = buildDemoProposal({
            quotationProductDocId: firstProduct._id,
            buyerCode: firstProduct.codice_buyer ?? "BDR",
        }) as any;

        return prev.map((item) => {
            if (item._id !== firstProduct._id) return item;
            return {
                ...item,
                quotazione: {
                    ...item.quotazione,
                    stato: "CONTROPROPOSTA_INVIATA",
                },
                controproposte: hasAnyProposal ? item.controproposte : [demoProposal],
                updatedAt: nowIso as any,
            };
        });
    });

    setOpenProductQtsSettings((prev) => {
        if (!prev || (prev.kind ?? "PRODUCT") !== "PRODUCT") return prev;
        if (targetDocId && prev._id !== targetDocId) return prev;

        const hasAnyProposal = Array.isArray(prev.controproposte) && prev.controproposte.length > 0;
        const alreadyInCounterproposalState = prev.quotazione?.stato === "CONTROPROPOSTA_INVIATA";
        if (alreadyInCounterproposalState && hasAnyProposal) return prev;

        const fallbackProposal = buildDemoProposal({
            quotationProductDocId: prev._id,
            buyerCode: (prev as CartProductDTO).codice_buyer ?? "BDR",
        }) as any;

        return {
            ...prev,
            quotazione: {
                ...prev.quotazione,
                stato: "CONTROPROPOSTA_INVIATA",
            },
            controproposte: hasAnyProposal ? prev.controproposte : [fallbackProposal],
            updatedAt: nowIso as any,
        };
    });

    return true;
}

/**
 * Prepara la controproposta demo CAD e salva (una sola volta) lo snapshot
 * del carrello "prima della controproposta".
 *
 * PerchÃ© esiste:
 * - mantiene nel runtime tour anche la logica di snapshot/restore;
 * - lascia `useDetailsQuotation.ts` piÃ¹ leggero e focalizzato.
 */
export function prepareTourMockCommercialCounterproposalWithSnapshotRuntime(params: {
    quotationId: unknown;
    qts?: QuotazioneDTO | null;
    cart: Array<CartProductDTO | TextRequestCartDTO>;
    snapshotRef: MutableRefObject<Array<CartProductDTO | TextRequestCartDTO>>;
    setCart: Dispatch<SetStateAction<Array<CartProductDTO | TextRequestCartDTO>>>;
    setOpenProductQtsSettings: Dispatch<SetStateAction<CartProductDTO | TextRequestCartDTO | null>>;
}): boolean {
    const { cart, snapshotRef } = params;

    // Salva lo stato "pre-controproposta" solo al primo ingresso nello step.
    if (snapshotRef.current.length === 0) {
        snapshotRef.current = Array.isArray(cart) ? [...cart] : [];
    }

    return prepareTourMockCommercialCounterproposalRuntime(params);
}

/**
 * Ripristina lo snapshot pre-controproposta nel flusso CAD tour.
 *
 * Effetto:
 * - riga prodotto torna a "In attesa di valutazione";
 * - il badge "1 controproposta" sparisce finchÃ© non rientriamo nello step successivo.
 */
export function restoreTourMockBeforeCommercialCounterproposalStepRuntime(params: {
    quotationId: unknown;
    qts?: QuotazioneDTO | null;
    snapshotRef: MutableRefObject<Array<CartProductDTO | TextRequestCartDTO>>;
    setCart: Dispatch<SetStateAction<Array<CartProductDTO | TextRequestCartDTO>>>;
    setOpenProductQtsSettings: Dispatch<SetStateAction<CartProductDTO | TextRequestCartDTO | null>>;
}): boolean {
    const { quotationId, qts, snapshotRef, setCart, setOpenProductQtsSettings } = params;

    const isTourMockById = isTourDetailsRuntimeActive(quotationId);
    const isTourMockByFlag = Boolean((qts as any)?.__tourMock);
    if (!isTourMockById && !isTourMockByFlag) return false;

    const snapshot = snapshotRef.current;
    if (!Array.isArray(snapshot) || snapshot.length === 0) return false;

    setCart([...snapshot]);
    setOpenProductQtsSettings((prev) => {
        if (!prev) return prev;
        const restoredMatch = snapshot.find((item) => item._id === prev._id);
        return (restoredMatch as CartProductDTO | TextRequestCartDTO | undefined) ?? prev;
    });

    // Consuma lo snapshot: verrÃ  ricreato al prossimo ingresso nello step label.
    snapshotRef.current = [];
    return true;
}

/**
 * Salva lo snapshot "pre-accettazione commerciale" della riga fake.
 *
 * Uso:
 * - chiamata nello step `quotazioni-product-accetta` prima del click;
 * - serve a rendere ripetibile il blocco quando l'utente torna indietro.
 */
export function snapshotTourMockBeforeCommercialAcceptanceRuntime(params: {
    quotationId: unknown;
    qts?: QuotazioneDTO | null;
    cart: Array<CartProductDTO | TextRequestCartDTO>;
    snapshotRef: MutableRefObject<Array<CartProductDTO | TextRequestCartDTO>>;
}): boolean {
    const { quotationId, qts, cart, snapshotRef } = params;

    const isTourMockById = isTourDetailsRuntimeActive(quotationId);
    const isTourMockByFlag = Boolean((qts as any)?.__tourMock);
    if (!isTourMockById && !isTourMockByFlag) return false;

    if (snapshotRef.current.length === 0) {
        snapshotRef.current = Array.isArray(cart) ? [...cart] : [];
    }

    return true;
}

/**
 * Ripristina lo snapshot pre-accettazione commerciale nel tour fake.
 *
 * Effetto:
 * - la riga torna in `CONTROPROPOSTA_INVIATA`;
 * - il bottone "Accetta" torna visibile se si naviga indietro.
 */
export function restoreTourMockBeforeCommercialAcceptanceRuntime(params: {
    quotationId: unknown;
    qts?: QuotazioneDTO | null;
    snapshotRef: MutableRefObject<Array<CartProductDTO | TextRequestCartDTO>>;
    setCart: Dispatch<SetStateAction<Array<CartProductDTO | TextRequestCartDTO>>>;
    setOpenProductQtsSettings: Dispatch<SetStateAction<CartProductDTO | TextRequestCartDTO | null>>;
    setQts?: Dispatch<SetStateAction<QuotazioneDTO | null>>;
}): boolean {
    const { quotationId, qts, snapshotRef, setCart, setOpenProductQtsSettings, setQts } = params;

    const isTourMockById = isTourDetailsRuntimeActive(quotationId);
    const isTourMockByFlag = Boolean((qts as any)?.__tourMock);
    if (!isTourMockById && !isTourMockByFlag) return false;

    const snapshot = snapshotRef.current;
    if (!Array.isArray(snapshot) || snapshot.length === 0) return false;

    setCart([...snapshot]);
    setOpenProductQtsSettings((prev) => {
        if (!prev) return prev;
        const restoredMatch = snapshot.find((item) => item._id === prev._id);
        return (restoredMatch as CartProductDTO | TextRequestCartDTO | undefined) ?? prev;
    });

    /**
     * Step-back CAD (`quotazioni-chiudi-quotazione` -> `quotazioni-product-accetta`):
     * oltre alla riga prodotto dobbiamo ripristinare anche lo stato testata quotazione.
     *
     * Se resta `DA_CHIUDERE`, la UI mantiene il contesto "chiusura richiesta"
     * e lo step "Accetta" non risulta realmente ripetibile.
     */
    if (typeof setQts === "function") {
        setQts((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                stato: "APERTA",
                updated_at: new Date() as any,
            };
        });
    }

    snapshotRef.current = [];
    return true;
}

/**
 * Imposta la fake quotazione in stato "DA_CHIUDERE" nel flusso CAD.
 *
 * Uso:
 * - step `quotazioni-chiudi-quotazione` per Commerciale/Admin/Dev.
 * - nessuna mutation API: solo update locale del mock tour.
 */
export function markTourMockQuotationReadyToCloseRuntime(params: {
    quotationId: unknown;
    qts?: QuotazioneDTO | null;
    setQts: Dispatch<SetStateAction<QuotazioneDTO | null>>;
}): boolean {
    const { quotationId, qts, setQts } = params;

    const isTourMockById = isTourDetailsRuntimeActive(quotationId);
    const isTourMockByFlag = Boolean((qts as any)?.__tourMock);
    if (!isTourMockById && !isTourMockByFlag) return false;

    setQts((prev) => {
        /**
         * Fallback robusto:
         * se lo stato non è ancora hydrato (prev=null), costruiamo una base mock valida
         * e applichiamo comunque `DA_CHIUDERE`.
         */
        const base = prev ?? buildTourMockQuotationDetailsResponseForViewer(undefined).data;
        return {
            ...base,
            stato: "DA_CHIUDERE",
            updated_at: new Date() as any,
        };
    });

    return true;
}

/**
 * Bundle di callback tour-only per il flusso CAD:
 * - prepara/ripristina la controproposta buyer;
 * - salva/ripristina snapshot pre-accettazione commerciale.
 *
 * Obiettivo:
 * mantenere `useDetailsQuotation.ts` leggero, spostando nel runtime tour
 * anche la composizione delle callback usate dalla pagina dettaglio.
 */
export function buildTourCadMockStepCallbacks(params: {
    quotationId: unknown;
    qts?: QuotazioneDTO | null;
    cart: Array<CartProductDTO | TextRequestCartDTO>;
    commercialCounterproposalSnapshotRef: MutableRefObject<Array<CartProductDTO | TextRequestCartDTO>>;
    commercialAcceptanceSnapshotRef: MutableRefObject<Array<CartProductDTO | TextRequestCartDTO>>;
    setQts: Dispatch<SetStateAction<QuotazioneDTO | null>>;
    setCart: Dispatch<SetStateAction<Array<CartProductDTO | TextRequestCartDTO>>>;
    setOpenProductQtsSettings: Dispatch<SetStateAction<CartProductDTO | TextRequestCartDTO | null>>;
}): {
    prepareTourMockCommercialCounterproposal: () => void;
    restoreTourMockBeforeCommercialCounterproposalStep: () => void;
    snapshotTourMockBeforeCommercialAcceptanceStep: () => void;
    restoreTourMockBeforeCommercialAcceptanceStep: () => void;
    markTourMockQuotationReadyToCloseStep: () => void;
} {
    const {
        quotationId,
        qts,
        cart,
        commercialCounterproposalSnapshotRef,
        commercialAcceptanceSnapshotRef,
        setQts,
        setCart,
        setOpenProductQtsSettings,
    } = params;

    return {
        prepareTourMockCommercialCounterproposal: () => {
            prepareTourMockCommercialCounterproposalWithSnapshotRuntime({
                quotationId,
                qts,
                cart,
                snapshotRef: commercialCounterproposalSnapshotRef,
                setCart,
                setOpenProductQtsSettings,
            });
        },
        restoreTourMockBeforeCommercialCounterproposalStep: () => {
            restoreTourMockBeforeCommercialCounterproposalStepRuntime({
                quotationId,
                qts,
                snapshotRef: commercialCounterproposalSnapshotRef,
                setCart,
                setOpenProductQtsSettings,
            });
        },
        snapshotTourMockBeforeCommercialAcceptanceStep: () => {
            snapshotTourMockBeforeCommercialAcceptanceRuntime({
                quotationId,
                qts,
                cart,
                snapshotRef: commercialAcceptanceSnapshotRef,
            });
        },
        restoreTourMockBeforeCommercialAcceptanceStep: () => {
            restoreTourMockBeforeCommercialAcceptanceRuntime({
                quotationId,
                qts,
                snapshotRef: commercialAcceptanceSnapshotRef,
                setCart,
                setOpenProductQtsSettings,
                // Ripristina anche stato testata quotazione nello step back su "Accetta".
                setQts,
            });
        },
        markTourMockQuotationReadyToCloseStep: () => {
            markTourMockQuotationReadyToCloseRuntime({
                quotationId,
                qts,
                setQts,
            });
        },
    };
}

/**
 * Completa localmente la quotazione fake nel tour (step buyer "close counter").
 *
 * Effetto:
 * - forza tutte le righe del carrello in stato terminale "done";
 * - sincronizza il pannello prodotto aperto;
 * - imposta la quotazione fake a stato finale "OK".
 *
 * Nota:
 * funzione idempotente e solo FE (nessuna API backend).
 */
export function completeTourMockClosureFromBuyerCounterRuntime(params: {
    quotationId: unknown;
    qts?: QuotazioneDTO | null;
    setQts: Dispatch<SetStateAction<QuotazioneDTO | null>>;
    setCart: Dispatch<SetStateAction<Array<CartProductDTO | TextRequestCartDTO>>>;
    setOpenProductQtsSettings: Dispatch<SetStateAction<CartProductDTO | TextRequestCartDTO | null>>;
}): boolean {
    const { quotationId, qts, setQts, setCart, setOpenProductQtsSettings } = params;

    const isTourMockById = isTourDetailsRuntimeActive(quotationId);
    const isTourMockByFlag = Boolean((qts as any)?.__tourMock);
    if (!isTourMockById && !isTourMockByFlag) return false;

    const doneState = "CONTROPROPOSTA_ACCETTATA" as const;
    const nowIso = new Date().toISOString();

    setCart((prev) => {
        /**
         * Fallback importante per il ritorno indietro cross-page.
         *
         * Nel flusso CAD la pagina dettaglio, appena rimontata, può partire con
         * cart vuoto perché lo scenario iniziale CAD è BOZZA senza prodotti.
         * Lo step `quotazioni-end`, però, rappresenta la quotazione già chiusa:
         * se non ricreiamo qui la riga finale, il tour mostra una card OK senza
         * prodotto associato. Per il Buyer lo stesso fallback garantisce che il
         * progresso resti al 100% anche dopo backward/remount.
         */
        if (!Array.isArray(prev) || prev.length === 0) {
            return buildTourMockClosedCartForViewer(undefined);
        }

        return prev.map((item) => ({
            ...item,
            quotazione: {
                ...item.quotazione,
                stato: doneState as any,
            },
            updatedAt: nowIso as any,
        }));
    });

    setOpenProductQtsSettings((prev) => {
        if (!prev) return prev;
        return {
            ...prev,
            quotazione: {
                ...prev.quotazione,
                stato: doneState as any,
            },
            updatedAt: nowIso as any,
        };
    });

    setQts((prev) => {
        /**
         * Fallback robusto:
         * se lo stato non è ancora hydrato (prev=null), creiamo una base mock
         * e forziamo comunque lo stato finale `OK`.
         */
        const base = prev ?? buildTourMockQuotationDetailsResponseForViewer(undefined).data;
        return {
            ...base,
            stato: "OK",
            updated_at: new Date() as any,
        };
    });

    /**
     * Sincronizzazione cross-page tour:
     * quando il buyer completa la chiusura nello step "close counter",
     * marchiamo la riga fake della lista come scenario finale `OK`.
     *
     * Questo consente, tornando alla lista, di mantenere:
     * - stato riga = OK
     * - voce ContextMenu "Visualizza FB & OC collegati" disponibile.
     */
    setTourMockQuotationListPhase("closed_ok");

    return true;
}

/**
 * Prepara lo scenario tour buyer "quotazione pronta da chiudere".
 *
 * Effetto:
 * - porta le righe prodotto fake in stato terminale (valutazione completata),
 *   così il gate riconosce i prodotti come completati;
 * - imposta la quotazione fake in "DA_CHIUDERE" (non ancora finalizzata).
 */
export function prepareTourMockBuyerReadyToCloseRuntime(params: {
    quotationId: unknown;
    qts?: QuotazioneDTO | null;
    setQts: Dispatch<SetStateAction<QuotazioneDTO | null>>;
    setCart: Dispatch<SetStateAction<Array<CartProductDTO | TextRequestCartDTO>>>;
    setOpenProductQtsSettings: Dispatch<SetStateAction<CartProductDTO | TextRequestCartDTO | null>>;
}): boolean {
    const { quotationId, qts, setQts, setCart, setOpenProductQtsSettings } = params;

    const isTourMockById = isTourDetailsRuntimeActive(quotationId);
    const isTourMockByFlag = Boolean((qts as any)?.__tourMock);
    if (!isTourMockById && !isTourMockByFlag) return false;

    const doneState = "VALUTAZIONE_COMPLETATA" as const;
    const nowIso = new Date().toISOString();

    setCart((prev) => {
        if (!Array.isArray(prev) || prev.length === 0) return prev;
        return prev.map((item) => ({
            ...item,
            quotazione: {
                ...item.quotazione,
                stato: doneState as any,
            },
            updatedAt: nowIso as any,
        }));
    });

    setOpenProductQtsSettings((prev) => {
        if (!prev) return prev;
        return {
            ...prev,
            quotazione: {
                ...prev.quotazione,
                stato: doneState as any,
            },
            updatedAt: nowIso as any,
        };
    });

    setQts((prev) => {
        /**
         * Fallback robusto:
         * se lo stato non è ancora hydrato (prev=null), prepariamo comunque
         * la testata mock nello stato `DA_CHIUDERE`.
         */
        const base = prev ?? buildTourMockQuotationDetailsResponseForViewer(undefined).data;
        return {
            ...base,
            stato: "DA_CHIUDERE",
            updated_at: new Date() as any,
        };
    });

    return true;
}

/**
 * Bundle di callback tour-only per il flusso Buyer/CAD nel dettaglio:
 * - prepara lo scenario "pronta da chiudere";
 * - completa la chiusura nel passo counter;
 * - resetta il carrello fake quando si torna allo step "Aggiungi prodotto".
 *
 * Obiettivo:
 * mantenere `useDetailsQuotation.ts` compatto, con la logica tour
 * concentrata nella cartella `tour/`.
 */
export function buildTourBuyerMockStepCallbacks(params: {
    quotationId: unknown;
    qts?: QuotazioneDTO | null;
    cart: Array<CartProductDTO | TextRequestCartDTO>;
    buyerBeforeSubmitSnapshotRef: MutableRefObject<{
        cart: Array<CartProductDTO | TextRequestCartDTO>;
        qts: QuotazioneDTO | null;
    } | null>;
    setQts: Dispatch<SetStateAction<QuotazioneDTO | null>>;
    setCart: Dispatch<SetStateAction<Array<CartProductDTO | TextRequestCartDTO>>>;
    setOpenProductQtsSettings: Dispatch<SetStateAction<CartProductDTO | TextRequestCartDTO | null>>;
}): {
    prepareTourMockBuyerReadyToCloseStep: () => void;
    completeTourMockBuyerClosureCounterStep: () => void;
    resetTourMockCartForAddProductStep: () => void;
    snapshotTourMockBuyerBeforeSubmitStep: () => void;
    restoreTourMockBuyerBeforeSubmitStep: () => void;
} {
    const { quotationId, qts, cart, buyerBeforeSubmitSnapshotRef, setQts, setCart, setOpenProductQtsSettings } = params;

    /**
     * Clonazione profonda tour-only per snapshot/restore buyer.
     *
     * Motivo:
     * lo spread superficiale non basta quando lo stato contiene oggetti annidati
     * (es. proposta sostituzione, quotazione prodotto): rischiamo aliasing tra
     * snapshot e stato live, con restore incompleto nei passi backward.
     */
    const cloneTourValue = <T,>(value: T): T => {
        try {
            if (typeof structuredClone === "function") {
                return structuredClone(value);
            }
        } catch {
            // Fallback JSON qui sotto.
        }
        return JSON.parse(JSON.stringify(value)) as T;
    };

    return {
        prepareTourMockBuyerReadyToCloseStep: () => {
            prepareTourMockBuyerReadyToCloseRuntime({
                quotationId,
                qts,
                setQts,
                setCart,
                setOpenProductQtsSettings,
            });
        },
        completeTourMockBuyerClosureCounterStep: () => {
            completeTourMockClosureFromBuyerCounterRuntime({
                quotationId,
                qts,
                setQts,
                setCart,
                setOpenProductQtsSettings,
            });
        },
        resetTourMockCartForAddProductStep: () => {
            // Guard runtime: reset valido solo nel contesto quotazione fake del tour.
            if (!isTourDetailsRuntimeActive(quotationId) && !(qts as any)?.__tourMock) return;
            // Stato atteso dello step "Aggiungi prodotto": carrello vuoto.
            setCart([]);
            // Chiusura pannello prodotto per evitare residui UI dai passi successivi.
            setOpenProductQtsSettings(null);
        },
        snapshotTourMockBuyerBeforeSubmitStep: () => {
            // Guard runtime: salviamo snapshot solo sul mock tour.
            if (!isTourDetailsRuntimeActive(quotationId) && !(qts as any)?.__tourMock) return;
            // Snapshot one-shot: il primo ingresso nello step è quello "pre-invio".
            if (buyerBeforeSubmitSnapshotRef.current) return;
            buyerBeforeSubmitSnapshotRef.current = {
                // Snapshot profondo: evita riferimenti condivisi con lo stato corrente.
                cart: cloneTourValue(Array.isArray(cart) ? cart : []),
                qts: qts ? cloneTourValue(qts) : null,
            };
        },
        restoreTourMockBuyerBeforeSubmitStep: () => {
            // Guard runtime: restore solo su mock tour.
            if (!isTourDetailsRuntimeActive(quotationId) && !(qts as any)?.__tourMock) return;
            const snapshot = buyerBeforeSubmitSnapshotRef.current;
            if (!snapshot) return;

            // Restore profondo: riporta davvero lo stato pre-submit.
            setCart(cloneTourValue(Array.isArray(snapshot.cart) ? snapshot.cart : []));
            setQts(snapshot.qts ? cloneTourValue(snapshot.qts) : null);

            // Ri-allinea il pannello prodotto aperto al contenuto dello snapshot.
            setOpenProductQtsSettings((prev) => {
                if (Array.isArray(snapshot.cart) && snapshot.cart.length > 0) {
                    const byPrev = prev ? snapshot.cart.find((item) => item._id === prev._id) : null;
                    if (byPrev) return byPrev as CartProductDTO | TextRequestCartDTO;
                    const firstProduct = snapshot.cart.find((item) => (item.kind ?? "PRODUCT") === "PRODUCT");
                    if (firstProduct) return firstProduct as CartProductDTO | TextRequestCartDTO;
                }
                return prev;
            });

            /**
             * Importante:
             * NON consumiamo lo snapshot dopo il restore.
             *
             * Motivo:
             * - lo step submit buyer può essere ripetuto più volte (avanti/indietro);
             * - consumando lo snapshot, al ciclo successivo non avremmo più il
             *   baseline "pre-invio" e il bottone resterebbe su "Aggiorna proposta".
             *
             * Lasciando lo snapshot disponibile, ogni ritorno backward allo step
             * ripristina sempre "Proponi prodotto" in modo coerente.
             */
        },
    };
}

/**
 * Riga minima usata dal wizard chiusura per il mapping OC/FB.
 * La definiamo qui per mantenere auto-contenuta la logica tour runtime.
 */
export type TourClosureProductRow = {
    quotation_product_docId: string;
};

/**
 * Risultato calcolato dalla regia tour del wizard chiusura.
 *
 * - `nextStep`: step che il wizard deve mostrare.
 * - `nextDraft`: eventuale bozza aggiornata (es. prefill OC demo).
 */
export type TourClosureWizardOrchestrationResult = {
    nextStep: number;
    nextDraft?: ClosureDraft;
} | null;

/**
 * Regia runtime per i passi finali del wizard "Chiusura quotazione".
 *
 * Obiettivi:
 * - quando il tour è sullo step "Avanti", garantire step A + esito OK;
 * - quando il tour è sullo step OC/FB, garantire step B + OC demo precompilato.
 *
 * Nota:
 * funzione pura, senza side-effect: decide solo "cosa applicare".
 */
export function computeTourClosureWizardOrchestration(params: {
    isTourOpen: boolean;
    activeStepSelector?: string;
    stepEsito: number;
    stepMapping: number;
    draft: ClosureDraft;
    productRows: TourClosureProductRow[];
}): TourClosureWizardOrchestrationResult {
    const {
        isTourOpen,
        activeStepSelector,
        stepEsito,
        stepMapping,
        draft,
        productRows,
    } = params;

    if (!isTourOpen) return null;

    if (activeStepSelector === '[data-tour="quotazioni-chiusura-OK-avanti"]') {
        if (draft.finalOutcome === "OK") {
            return { nextStep: stepEsito };
        }
        return {
            nextStep: stepEsito,
            nextDraft: {
                ...draft,
                finalOutcome: "OK",
            },
        };
    }

    const isOkMappingOrConfirmStep =
        activeStepSelector === '[data-tour="quotazioni-chiusura-OK-OC-FB"]' ||
        activeStepSelector === '[data-tour="quotazioni-chiusura-OK-conferma"]';

    if (!isOkMappingOrConfirmStep) {
        return null;
    }

    const currentLinks = Array.isArray(draft.okLinks) ? draft.okLinks : [];
    const byDocId = new Map(currentLinks.map((link) => [link.quotation_product_docId, link]));
    const rowDocIds = new Set(productRows.map((row) => row.quotation_product_docId));
    let changed = false;

    // Garantiamo un valore OC demo sui prodotti senza associazione OC/FB.
    const normalizedForRows = productRows.map((row) => {
        const current = byDocId.get(row.quotation_product_docId);
        if (!current) {
            changed = true;
            return {
                quotation_product_docId: row.quotation_product_docId,
                oc: "123",
            };
        }

        const hasOc = Boolean((current.oc ?? "").trim());
        const hasFb = Boolean((current.fb ?? "").trim());
        if (hasOc || hasFb) return current;

        changed = true;
        return {
            ...current,
            oc: "123",
        };
    });

    // Manteniamo eventuali link extra che non appartengono alle righe correnti.
    const extraLinks = currentLinks.filter((link) => !rowDocIds.has(link.quotation_product_docId));
    const nextOkLinks = [...normalizedForRows, ...extraLinks];

    if (!changed && draft.finalOutcome === "OK") {
        return { nextStep: stepMapping };
    }

    return {
        nextStep: stepMapping,
        nextDraft: {
            ...draft,
            finalOutcome: "OK",
            okLinks: nextOkLinks,
        },
    };
}

/**
 * Restituisce il payload mock della `CustomersPanel` solo quando siamo
 * nel runtime tour del dettaglio quotazione.
 *
 * - manteniamo un unico "gateway" per decidere se usare dati fake o reali;
 * - la pagina dettaglio resta pulita: passa semplicemente il risultato al panel.
 */
export function getTourCustomerPanelMockPayload(quotationId: unknown) {
    if (!isTourDetailsRuntimeActive(quotationId)) return null;
    return buildTourMockCustomerPanelPayload();
}

/**
 * Direzione di navigazione tra step tour nel dettaglio quotazione.
 * La esportiamo dal runtime per evitare logica sparsa nel componente pagina.
 */
export type TourStepNavigationDirection = "forward" | "backward" | "none";

/**
 * Calcola la direzione di navigazione tour partendo da indice corrente/precedente.
 *
 * Regole:
 * - tour chiuso => "none"
 * - indice cresce => "forward"
 * - indice cala => "backward"
 * - indice invariato => "none"
 */
export function computeTourStepNavigationDirection(params: {
    isTourOpen: boolean;
    currentStepIndex: number;
    previousStepIndex: number;
}): TourStepNavigationDirection {
    const { isTourOpen, currentStepIndex, previousStepIndex } = params;

    if (!isTourOpen) return "none";
    if (currentStepIndex > previousStepIndex) return "forward";
    if (currentStepIndex < previousStepIndex) return "backward";
    return "none";
}

/**
 * Reason supportati dal ContextMenu nel dettaglio quotazione.
 * Manteniamo il tipo vicino all'helper tour che lo usa.
 */
export type TourContextMenuCloseReason =
    | "clickAway"
    | "escapeKeyDown"
    | "backdropClick"
    | "itemClick";

/**
 * Durante lo step filtri della LISTA quotazioni ignoriamo alcune chiusure
 * automatiche del menu contestuale.
 *
 * Perché:
 * - nello step `quotazioni-filter-2` il tour blocca le interazioni esterne;
 * - i click su overlay/backdrop del tour potrebbero chiudere il menu filtri
 *   e rompere il focus guidato.
 *
 * Nota:
 * - regola selector-driven (nessun branch per ruolo);
 * - fuori dallo step target il comportamento resta invariato.
 */
export function shouldIgnoreTourListFiltersClose(params: {
    isTourOpen: boolean;
    activeStepSelector?: string;
    reason?: TourContextMenuCloseReason;
}): boolean {
    const { isTourOpen, activeStepSelector, reason } = params;

    if (!isTourOpen || !reason) return false;
    if (activeStepSelector !== '[data-tour="quotazioni-filter-2"]') return false;

    return (
        reason === "backdropClick" ||
        reason === "clickAway" ||
        reason === "escapeKeyDown"
    );
}

/**
 * Durante lo step filtri del tour ignoriamo alcune chiusure automatiche del menu,
 * altrimenti i click sull'overlay del tour possono rubare il focus allo step.
 */
export function shouldIgnoreTourFiltersClose(params: {
    isTourOpen: boolean;
    isProductsFiltersPanelStep: boolean;
    reason?: TourContextMenuCloseReason;
}): boolean {
    const { isTourOpen, isProductsFiltersPanelStep, reason } = params;

    if (!isTourOpen || !reason) return false;
    if (!isProductsFiltersPanelStep) return false;

    return (
        reason === "backdropClick" ||
        reason === "clickAway" ||
        reason === "escapeKeyDown"
    );
}

/**
 * Flag UI tour per la pagina dettaglio quotazione.
 *
 * Obiettivo:
 * - mantenere le regole role/index in un unico punto condiviso;
 * - ridurre condizioni duplicate nel componente pagina.
 */
export function computeQuotazioniDetailsTourUiFlags(params: {
    isTourOpen: boolean;
    tourIndex: number;
    role?: string | null;
}): {
    isCad: boolean;
    isBuyer: boolean;
    lockInteractions: boolean;
    shouldDisableTourSendNoteButton: boolean;
} {
    const { isTourOpen, tourIndex, role } = params;
    const normalizedRole = String(role ?? "").trim();
    const isCad =
        normalizedRole === "Commerciale" ||
        normalizedRole === "Admin" ||
        normalizedRole === "Dev";
    const isBuyer = normalizedRole === "Buyer";

    /**
     * Lock pannello cliente:
     * - CAD: step 16,17,20
     * - Buyer: step 11,12,14
     */
    const lockInteractions =
        isTourOpen &&
        ((isCad && (tourIndex === 16 || tourIndex === 17 || tourIndex === 20)) ||
            (isBuyer && (tourIndex === 11 || tourIndex === 12 || tourIndex === 14)));

    /**
     * Lock tour-only sul bottone "Invia nota" nel pannello prodotto:
     * - CAD: step 22
     * - Buyer: step 36
     */
    const shouldDisableTourSendNoteButton =
        isTourOpen &&
        ((isCad && tourIndex === 22) || (isBuyer && tourIndex === 36));

    return {
        isCad,
        isBuyer,
        lockInteractions,
        shouldDisableTourSendNoteButton,
    };
}

/**
 * Reset selezione sostituzione buyer nello step back del tour.
 * Lo centralizziamo qui per evitare dipendenze dirette della pagina da costanti mock.
 */
export function resetTourBuyerSubstitutionSelection(params: {
    openProductQtsSettings: CartProductDTO | TextRequestCartDTO | null;
    selectSubstitutionProductForCurrent: (product: any) => void;
}): void {
    const { openProductQtsSettings, selectSubstitutionProductForCurrent } = params;

    // Se il pannello prodotto non è aperto (o non è riga prodotto), non c'è nulla da resettare.
    if (!openProductQtsSettings || openProductQtsSettings.kind !== "PRODUCT") return;

    // Ripristino selezione al prodotto demo statico del tour.
    selectSubstitutionProductForCurrent({
        _id: TOUR_STATIC_SUBSTITUTION_PRODUCT._id,
    } as any);
}

/**
 * Ripristina lo scenario "pre-apertura" della quotazione fake nel tour.
 *
 * Obiettivo:
 * - rendere ripetibile lo step `quotazioni-open` quando l'utente torna indietro;
 * - mantenere in runtime tour la logica mock (stato + carrello snapshot).
 */
export function restoreTourMockBeforeOpenRuntime(params: {
    quotationId: unknown;
    qts?: QuotazioneDTO | null;
    tourMockCartBeforeOpenSnapshot: Array<CartProductDTO | TextRequestCartDTO>;
    setQts: Dispatch<SetStateAction<QuotazioneDTO | null>>;
    setCart: Dispatch<SetStateAction<Array<CartProductDTO | TextRequestCartDTO>>>;
}): void {
    const { quotationId, qts, tourMockCartBeforeOpenSnapshot, setQts, setCart } = params;

    // Guard runtime: eseguiamo solo su quotazione mock del tour.
    if (!isTourDetailsRuntimeActive(quotationId) && !(qts as any)?.__tourMock) return;

    // Riporta la quotazione nello stato atteso dello step "Apri quotazione".
    setQts((prev) => {
        if (!prev) return prev;
        return {
            ...prev,
            stato: "BOZZA",
            updated_at: new Date() as any,
        };
    });

    // Ripristina il carrello allo snapshot salvato prima dell'apertura.
    if (Array.isArray(tourMockCartBeforeOpenSnapshot) && tourMockCartBeforeOpenSnapshot.length > 0) {
        setCart([...tourMockCartBeforeOpenSnapshot]);
    }
}

/**
 * Seed della barra "Ricerca mirata" nello step `quotazioni-AS-panel` del dettaglio.
 *
 * Obiettivo:
 * - mostrare subito un prodotto demo nei risultati;
 * - rendere visibile l'icona carrello durante il tour CAD.
 *
 * Guard:
 * - attivo solo sul dettaglio mock tour (`/quotazioni/__tour_mock_quotazione__`);
 * - attivo solo per Commerciale/Admin/Dev;
 * - mai per Buyer, così non alteriamo il suo flusso.
 */
export function runTourCadAsPanelSeedSearchRuntime(params: {
    quotationId: unknown;
    viewerRole?: string | null;
    searchDebounced: (query: string) => void;
}): boolean {
    const { quotationId, viewerRole, searchDebounced } = params;

    // Guard runtime: se non siamo nel dettaglio mock tour non facciamo nulla.
    if (!isTourDetailsRuntimeActive(quotationId)) return false;
    // Guard ruolo: la seed è richiesta solo per Commerciale/Admin/Dev.
    if (!isCommercialAdminDevViewer(viewerRole)) return false;

    // Query demo del prodotto fake principale usato nel tour quotazioni.
    searchDebounced(TOUR_STATIC_PRODUCT.CodiceProduttore);
    return true;
}

