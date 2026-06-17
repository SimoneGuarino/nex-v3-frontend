import type { QuotazioneDTO } from "layouts/quotazioni/types/quotations";
import type { QuotazioneDetailsResponse } from "layouts/quotazioni/types/quotations";
import type { Customer } from "layouts/quotazioni/types/customers";
import type { CartProductDTO, ProductDoc, TextRequestCartDTO } from "layouts/quotazioni/types/qts_product";
import type { CustomerFullPayload } from "components/UI/panels/customersPanel/types";
import type { QuotationOkLinkItemDTO } from "layouts/quotazioni/fetchdata/get/getQuotationOkLinks";
import type { Role } from "tour/types";
import { Cap, CAPS } from "authz/caps";

// --------------------------------------------------
// CONSTANTS
// --------------------------------------------------
/**
 * Identificativo tecnico locale della quotazione fake.
 * Non deve mai collidere con ID reali presenti a backend.
 */
export const TOUR_QUOTATION_ID = "__tour_mock_quotazione__";

/**
 * Chiave `sessionStorage` usata dal solo tour quotazioni per sincronizzare
 * la "fase" della riga fake in pagina lista.
 *
 * Nota:
 * - `sessionStorage` resta confinato alla sessione browser corrente;
 * - fuori dal tour non viene mai letto/scritto.
 */
const TOUR_QUOTATION_LIST_PHASE_STORAGE_KEY = "__tour_mock_quotazione_list_phase__";

/**
 * Fasi supportate della riga fake nella lista quotazioni.
 *
 * - `default`: stato iniziale del tour (Buyer APERTA, CAD BOZZA)
 * - `closed_ok`: scenario finale tour, riga in stato OK + link OC/FB visibili
 */
export type TourMockQuotationListPhase = "default" | "closed_ok";

/**
 * Legge la fase corrente della riga fake dal `sessionStorage`.
 *
 * Fallback sicuro:
 * - in assenza di storage disponibile (SSR/ambienti limitati) torniamo `default`;
 * - su valori non riconosciuti normalizziamo comunque a `default`.
 */
export function getTourMockQuotationListPhase(): TourMockQuotationListPhase {
    try {
        if (typeof window === "undefined") return "default";
        const raw = window.sessionStorage.getItem(TOUR_QUOTATION_LIST_PHASE_STORAGE_KEY);
        if (raw === "closed_ok") return "closed_ok";
        return "default";
    } catch {
        return "default";
    }
}

/**
 * Salva nel `sessionStorage` la fase corrente della riga fake di lista.
 * È una mutation esclusivamente tour-only.
 */
export function setTourMockQuotationListPhase(phase: TourMockQuotationListPhase): void {
    try {
        if (typeof window === "undefined") return;
        window.sessionStorage.setItem(TOUR_QUOTATION_LIST_PHASE_STORAGE_KEY, phase);
    } catch {
        // no-op: il tour continua a funzionare anche senza persistenza locale.
    }
}

/**
 * Ripristina la fase iniziale della riga fake.
 *
 * Lo usiamo:
 * - quando il tour parte (garanzia "clean start");
 * - quando il tour termina/si chiude (niente leakage tra sessioni tour).
 */
export function resetTourMockQuotationListPhase(): void {
    setTourMockQuotationListPhase("default");
}

/**
 * JSON statico cliente (estratto dal formato customers) da usare nel tour.
 * In questo primo step lo teniamo pronto e centralizzato, anche se in lista
 * quotazioni mostriamo solo il codice cliente.
 */
export const TOUR_STATIC_CUSTOMER = {
    CodiceCliente: {
        Focelda: "054080",
        IOT: null,
    },
    CodiceFiscale: "604454743",
    PartitaIVA: "IT60443324300",
    RagioneSociale: "CLIENTE DEMO TOUR SYSTEM",
    Email: "sourcing@stockyfy.com",
    CanaleVendita: "ESTERO",
    Pagamento: "BONIFICO BANC. ANTICIPATO",
    attivo: true,
};

/**
 * JSON statico prodotto (estratto dal formato products) per i prossimi step tour.
 */
export const TOUR_STATIC_PRODUCT = {
    _id: "6978c88fb966cabfce0e8832",
    Ci: "112597",
    CodiceEAN: "4711474409577",
    CodiceProduttore: "NX.JFVET.003",
    Marca: "ACER",
    Gruppo: "NB",
    Famiglia: "NBP",
    Linea: "NBNE",
};

/**
 * Dati statici della riga prodotto mostrata nel dettaglio tour buyer.
 * Simula un item arrivato dal carrello della quotazione compilato dal commerciale.
 */
export const TOUR_STATIC_CART_PRODUCT = {
    _id: "__tour_cart_product__",
    buyerCode: "BDR",
    quantity: 1,
    priceBase: 1299.0,
    discountPercent: 5,
    finalPrice: 1234.05,
};

/**
 * Prodotto alternativo fake usato dal Buyer durante il tour per simulare
 * la proposta di sostituzione nel pannello dedicato.
 */
export const TOUR_STATIC_SUBSTITUTION_PRODUCT = {
    _id: "__tour_substitution_product__",
    codiceProduttore: "82K2028FIX",
    codiceEAN: "0197532712345",
    descrizione: "NB 15\" I5 16GB 512SSD W11 PRO",
    anteprima: "https://images.icecat.biz/img/gallery_lows/5f3d7f9f3ad7497f8dbf89b2e2e4f83f7e9f9d2f.jpg",
    marca: "LENOVO",
    linea: "NBNE",
    gruppo: "NB",
    famiglia: "NBP",
    descrizioneLinea: "NOTEBOOK ULTRABOOK TABLET",
    descrizioneGruppo: "NOTEBOOK",
    descrizioneFamiglia: "NOTEBOOK DA 11.6\" A 14\"",
    /**
     * Prezzo suggerito usato come default nella controproposta tour buyer.
     */
    prezzoDealer: 1120.06,
};

// --------------------------------------------------
// HELPERS / UTILS
// --------------------------------------------------
/**
 * Utility centralizzata per capire se l'ID corrente appartiene alla quotazione fake del tour.
 * Questa funzione viene usata in tutti i punti in cui dobbiamo decidere:
 * - se seguire il flusso API reale
 * - oppure usare il flusso locale "simulato" del tour
 */
export function isTourMockQuotationId(value: unknown): boolean {
    if (typeof value !== "string") return false;
    return value.trim() === TOUR_QUOTATION_ID;
}

/**
 * Rilevazione Buyer robusta per il runtime tour.
 * Mostriamo il mock prodotto SOLO al Buyer:
 * - ruolo testuale "Buyer"
 * - ruolo numerico che mappa a "Buyer" (da REACT_APP_ROLES)
 */
export function isBuyerViewer(hasCap?: (cap: Cap | string) => boolean): boolean {
    /**  Buyer mode alone must pass this client-side guard. */
    return (
        hasCap?.(CAPS.QUOTAZIONI_BUYER_MODE) ?? false
    );
};

// --------------------------------------------------
// CORE BUILDERS
// --------------------------------------------------
/**
 * Crea la quotazione fake in formato compatibile con la tabella Quotazioni.
 * Nota: questa riga deve esistere SOLO durante il tour.
 */
export function buildTourMockQuotation(): QuotazioneDTO & { __tourMock?: boolean } {
    return {
        _id: TOUR_QUOTATION_ID,
        titolo: "Quotazione Tour-system",
        tipologia: "STANDARD",
        stato: "BOZZA",
        valore: 0,
        agenteId: "68dd09c561f7e9e35707a7bc",
        /**
         * Campo obbligatorio in QuotazioneDTO:
         * per il tour usiamo uno snapshot minimale dell'agente.
         */
        agente: {
            nome: "Mario",
            cognome: "Rossi",
            username: "mario.rossi",
            immagini: {
                avatar: "",
                cover: "",
            },
            biografia: "",
        } as any,
        // In lista quotazioni oggi il campo cliente viene trattato come stringa.
        cliente: "054080" as any,
        prog_num: 800515516,
        created_at: new Date("2026-03-19T10:36:10.594Z") as any,
        updated_at: new Date("2026-03-19T11:00:27.595Z") as any,
        finestraValidita: {
            inizio: new Date("2026-03-19T00:00:00.000Z") as any,
            fine: new Date("2126-04-10T23:59:59.999Z") as any,
        },
        buyersProgress: [],
        extra: {},
        // Flag locale per identificare/rimuovere la riga fake senza ambiguita.
        __tourMock: true,
    };
}

/**
 * Variante role-aware della quotazione fake usata nel tour in lista.
 * Regola UX concordata:
 * - Buyer: la quotazione è già stata assegnata, quindi parte in stato "APERTA"
 * - Commerciale/Admin/Dev: resta in "BOZZA" (fase pre-assegnazione)
 */
export function buildTourMockQuotationForRole(
    role: Role,
    options?: { listPhase?: TourMockQuotationListPhase },
): QuotazioneDTO & { __tourMock?: boolean } {
    const base = buildTourMockQuotation();
    const isBuyer = role === "Buyer";
    const listPhase = options?.listPhase ?? getTourMockQuotationListPhase();

    /**
     * Scenario finale tour (role-agnostic):
     * - stato testata in `OK`
     * - presenza `final_outcome.ok_links_stats.links_count > 0`
     *
     * In questo modo, tornando alla lista nello step
     * "Visualizza FB & OC collegati", il ContextMenu mostra la voce attesa.
     */
    if (listPhase === "closed_ok") {
        return {
            ...base,
            stato: "OK",
            final_outcome: {
                outcome: "OK",
                ok_links_stats: {
                    links_count: 1,
                },
            },
        } as any;
    }

    // Default per CAD: stato BOZZA.
    if (!isBuyer) return base;

    // Default Buyer: quotazione già assegnata -> APERTA.
    return {
        ...base,
        stato: "APERTA",
    };
}

/**
 * Restituisce il payload "dettaglio quotazione" in formato identico al backend.
 * In questo modo i componenti pagina dettagli possono restare invariati:
 * leggono sempre lo stesso shape (`data` + `cliente`) indipendentemente dalla sorgente.
 */
export function buildTourMockQuotationDetailsResponse(): QuotazioneDetailsResponse {
    const quotation = buildTourMockQuotation();
    const customer: Customer = {
        ...TOUR_STATIC_CUSTOMER,
    };

    return {
        data: quotation,
        cliente: customer,
    };
}

/**
 * Variante role-aware del payload dettaglio quotazione tour.
 * - Buyer: quotazione già assegnata => stato APERTA
 * - Altri ruoli: stato BOZZA (flusso pre-assegnazione)
 */
export function buildTourMockQuotationDetailsResponseForViewer(
    hasCap?: (cap: Cap | string) => boolean,
): QuotazioneDetailsResponse {
    const payload = buildTourMockQuotationDetailsResponse();
    const isBuyer = isBuyerViewer(hasCap);
    const listPhase = getTourMockQuotationListPhase();

    /**
     * Cross-page finale tour:
     * quando la fase lista è `closed_ok`, anche il dettaglio mock deve aprirsi
     * direttamente in stato `OK` (evita regressioni APERTA su backward).
     */
    if (listPhase === "closed_ok") {
        return {
            ...payload,
            data: {
                ...payload.data,
                stato: "OK",
                final_outcome: {
                    outcome: "OK",
                    ok_links_stats: {
                        links_count: 1,
                    },
                } as any,
            },
        };
    }

    if (!isBuyer) return payload;

    return {
        ...payload,
        data: {
            ...payload.data,
            stato: "APERTA",
        },
    };
}

/**
 * Crea una riga PRODUCT fake per il buyer.
 * Obiettivo UX: mostrare la tab "Quotazione Prodotti" come item ricevuto dal
 * carrello commerciale, non come richiesta descrittiva.
 */
export function buildTourMockProductRowForBuyer(): CartProductDTO {
    /**
     * Nota:
     * per retro-compat manteniamo la signature storica senza argomenti.
     * La variante role-aware con buyer dinamico vive in `buildTourMockCartForViewer`.
     */
    return buildTourMockProductRowForBuyerWithCode(TOUR_STATIC_CART_PRODUCT.buyerCode);
}

/**
 * Normalizza il buyer code usato nel cart mock buyer.
 *
 * Regola:
 * - se arriva un codice valido dal viewer (utente loggato), lo usiamo;
 * - altrimenti fallback su valore demo statico.
 */
function resolveTourBuyerCode(viewerBuyerCode?: string | null): string {
    const normalized = String(viewerBuyerCode ?? "").trim().toUpperCase();
    return normalized || TOUR_STATIC_CART_PRODUCT.buyerCode;
}

/**
 * Builder interno della riga prodotto mock buyer con buyer code esplicito.
 */
function buildTourMockProductRowForBuyerWithCode(buyerCode: string): CartProductDTO {
    return {
        _id: TOUR_STATIC_CART_PRODUCT._id,
        product_id: TOUR_STATIC_PRODUCT._id,
        kind: "PRODUCT",
        quantita: TOUR_STATIC_CART_PRODUCT.quantity,
        codice_buyer: buyerCode,
        approvato: false,
        eventi: [
            {
                id: "__tour_event_creation__",
                type: "CREAZIONE_QUOTAZIONE",
                timestamp: "2026-03-19T10:36:10.594Z",
                actor: {
                    name: "Mario Rossi",
                    username: "mario.rossi",
                    role: "COMMERCIALE",
                },
                message: "Prodotto inserito nel carrello quotazione dal commerciale.",
                meta: null,
            },
        ],
        dettagli_prodotto: {
            codiceProduttore: TOUR_STATIC_PRODUCT.CodiceProduttore,
            codiceEAN: null,
            descrizione: "NB 14\" U7 226V 16GB 512SSD W11",
            anteprima: "https://images.icecat.biz/img/gallery_lows/17f82157259e9ecb7965f0d16fa13974361a870a.jpg",
            marca: TOUR_STATIC_PRODUCT.Marca,
            linea: TOUR_STATIC_PRODUCT.Linea,
            gruppo: TOUR_STATIC_PRODUCT.Gruppo,
            famiglia: TOUR_STATIC_PRODUCT.Famiglia,
            descrizioneLinea: "NOTEBOOK ULTRABOOK TABLET",
            descrizioneGruppo: "NOTEBOOK",
            descrizioneFamiglia: "NOTEBOOK DA 11.6\" A 14\"",
        },
        controproposte: [],
        alternativeSuggestions: [],
        quotazione: {
            prezzo_base: TOUR_STATIC_CART_PRODUCT.priceBase,
            sconto_percentuale: TOUR_STATIC_CART_PRODUCT.discountPercent,
            prezzo_finale: TOUR_STATIC_CART_PRODUCT.finalPrice,
            stato: "ATTESA_VALUTAZIONE",
        },
        updatedAt: new Date("2026-03-19T11:00:27.595Z"),
    };
}

/**
 * Cart mock role-aware per la pagina dettaglio tour.
 * - Buyer: una riga prodotto proveniente dal carrello commerciale
 * - Altri ruoli: cart vuoto
 */
export function buildTourMockCartForViewer(
    hasCap: (cap: Cap | string) => boolean,
    viewerBuyerCode?: string | null,
): Array<CartProductDTO | TextRequestCartDTO> {
    const listPhase = getTourMockQuotationListPhase();

    /**
     * Scenario finale cross-page del tour.
     *
     * Quando si torna indietro dalla lista allo step finale del dettaglio,
     * la pagina dettaglio viene rimontata e quindi riparte da questa hydration.
     * In quel momento non basta avere la testata quotazione in `OK`: anche il
     * carrello mock deve contenere la riga prodotto già conclusa, altrimenti:
     * - Buyer: il counter progresso viene ricalcolato sotto il 100%;
     * - CAD: la riga fake sparisce perché il cart iniziale per quei ruoli è vuoto.
     */
    if (listPhase === "closed_ok") {
        return buildTourMockClosedCartForViewer(hasCap, viewerBuyerCode);
    }

    if (!isBuyerViewer(hasCap)) return [];
    return [buildTourMockProductRowForBuyerWithCode(resolveTourBuyerCode(viewerBuyerCode))];
}

/**
 * Carrello mock nello stato finale del tour quotazioni.
 *
 * È volutamente role-agnostic: nello step conclusivo anche Commerciale/Admin/Dev
 * devono ritrovare la stessa riga prodotto che hanno chiuso nel percorso forward,
 * mentre il Buyer deve vedere il progresso al 100%.
 */
export function buildTourMockClosedCartForViewer(
    hasCap?: (cap: Cap | string) => boolean,
    viewerBuyerCode?: string | null,
): Array<CartProductDTO | TextRequestCartDTO> {
    const buyerCode = isBuyerViewer(hasCap)
        ? resolveTourBuyerCode(viewerBuyerCode)
        : TOUR_STATIC_CART_PRODUCT.buyerCode;

    const row = buildTourMockProductRowForBuyerWithCode(buyerCode);

    return [{
        ...row,
        approvato: true,
        quotazione: {
            ...row.quotazione,
            stato: "CONTROPROPOSTA_ACCETTATA" as any,
        },
        updatedAt: new Date("2026-03-19T12:00:00.000Z") as any,
    }];
}

/**
 * Costruisce i risultati mostrati nel pannello "Ordini collegati" durante il tour.
 *
 * Perché vive qui:
 * - il pannello `OkLinksSidePanel` si aspetta lo stesso formato del backend;
 * - durante il tour non dobbiamo chiamare API reali con l'ID fake;
 * - mantenere il dato mock vicino alla quotazione fake rende facile capire
 *   quali OC/FB vengono mostrati nello step finale.
 */
export function buildTourMockOkLinksForViewer(
    hasCap: (cap: Cap | string) => boolean,
    viewerBuyerCode?: string | null,
): QuotationOkLinkItemDTO[] {
    const closedCart = buildTourMockClosedCartForViewer(hasCap, viewerBuyerCode);
    const productRows = closedCart.filter((row) => (row.kind ?? "PRODUCT") === "PRODUCT") as CartProductDTO[];

    /**
     * Alcuni campi prezzo possono arrivare come decimal/stringa nei tipi del carrello.
     * Il pannello OC/FB invece usa numeri: normalizziamo qui, nel mock tour.
     */
    const toNumberOrNull = (value: unknown): number | null => {
        if (typeof value === "number") return Number.isFinite(value) ? value : null;
        if (typeof value === "string" && value.trim()) {
            const parsed = Number(value);
            return Number.isFinite(parsed) ? parsed : null;
        }
        return null;
    };

    return productRows.map((row, index) => ({
        _id: `__tour_ok_link_${row._id || index}__`,
        product_id: row.product_id ?? null,
        quantita: row.quantita ?? null,
        codice_buyer: row.codice_buyer ?? null,
        approvato: true,
        dettagli_prodotto: {
            codiceProduttore: row.dettagli_prodotto?.codiceProduttore ?? null,
            codiceEAN: row.dettagli_prodotto?.codiceEAN ?? null,
            descrizione: row.dettagli_prodotto?.descrizione ?? "Prodotto tour system",
            anteprima: row.dettagli_prodotto?.anteprima ?? null,
            marca: row.dettagli_prodotto?.marca ?? null,
            linea: row.dettagli_prodotto?.linea ?? null,
            gruppo: row.dettagli_prodotto?.gruppo ?? null,
            famiglia: row.dettagli_prodotto?.famiglia ?? null,
        },
        quotazione: {
            stato: "CONTROPROPOSTA_ACCETTATA",
            prezzo_base: toNumberOrNull(row.quotazione?.prezzo_base),
            sconto_percentuale: toNumberOrNull(row.quotazione?.sconto_percentuale),
            prezzo_finale: toNumberOrNull(row.quotazione?.prezzo_finale) ?? TOUR_STATIC_CART_PRODUCT.finalPrice,
        },
        final_ok_link: {
            oc: "123",
            fb: "FB-10231",
            linked_at: "2026-03-20T10:30:00.000Z",
            linked_by: "Tour system",
        },
        derivedFromAcceptedCounterproposal: Boolean((row as any).derivedFromAcceptedCounterproposal),
        originalProductLabel: (row as any).originalProductLabel ?? null,
        createdAt: "2026-03-20T10:30:00.000Z",
        updatedAt: "2026-03-20T10:30:00.000Z",
    }));
}

/**
 * Lista prodotti mock per il tour nel dettaglio quotazione.
 *
 * Regola UX concordata:
 * - Commerciale/Admin/Dev: vedono un'anteprima della "Lista prodotti"
 *   con alcune card pronte, così lo step tour risulta realistico.
 * - Buyer: NON deve vedere questa lista mock perché nel suo flusso
 *   lavora direttamente su "Quotazione Prodotti".
 */
export function buildTourMockProductsListForViewer(
    hasCap: (cap: Cap | string) => boolean,
): ProductDoc[] {
    // Buyer escluso volutamente dal seed lista prodotti.
    if (isBuyerViewer(hasCap)) return [];

    /**
     * Snapshot minimo ma completo per la ProductCard:
     * includiamo solo i campi realmente usati dalla card per mantenere
     * il mock leggero e facile da manutenere.
     */
    const base: ProductDoc = {
        _id: TOUR_STATIC_PRODUCT._id,
        codiceProduttore: TOUR_STATIC_PRODUCT.CodiceProduttore,
        codiceEAN: TOUR_STATIC_PRODUCT.CodiceEAN,
        descrizione: "NB 14\" U7 226V 16GB 512SSD W11",
        anteprima: "https://images.icecat.biz/img/gallery_lows/17f82157259e9ecb7965f0d16fa13974361a870a.jpg",
        marca: TOUR_STATIC_PRODUCT.Marca,
        linea: TOUR_STATIC_PRODUCT.Linea,
        gruppo: TOUR_STATIC_PRODUCT.Gruppo,
        famiglia: TOUR_STATIC_PRODUCT.Famiglia,
        descrizioneLinea: "NOTEBOOK ULTRABOOK TABLET",
        descrizioneGruppo: "NOTEBOOK",
        descrizioneFamiglia: "NOTEBOOK DA 11.6\" A 14\"",
        codice_buyer: null,
    };

    // Poche varianti di anteprima per rendere visivamente credibile la griglia.
    return [
        base,
        {
            ...base,
            _id: "__tour_list_product_2__",
            codiceProduttore: "ZT61042-T1E0100Z",
            descrizione: "STAMP TERMICA TRASFERIMENTO LAN BT",
            anteprima: "",
        },
        {
            ...base,
            _id: "__tour_list_product_3__",
            codiceProduttore: "ZT42163-T2E0000Z",
            descrizione: "STAMP TERMICA LAN BT USB 300DPI",
            anteprima: "",
        },
        {
            ...base,
            _id: "__tour_list_product_4__",
            codiceProduttore: "ZT41142-T5E00C0Z",
            descrizione: "STAMP TERMICA ZEBRA ZT411 MIDRANGE",
            anteprima: "",
        },
    ];
}

/**
 * Lista mock per la ricerca sostituzione lato Buyer durante il tour.
 * È filtrabile via query per simulare la UX reale della ricerca.
 */
export function buildTourMockSubstitutionSearchProductsForBuyer(
    query?: string | null,
): ProductDoc[] {
    const normalizedQuery = String(query ?? "").trim().toLowerCase();

    const candidate: ProductDoc = {
        _id: TOUR_STATIC_SUBSTITUTION_PRODUCT._id,
        codiceProduttore: TOUR_STATIC_SUBSTITUTION_PRODUCT.codiceProduttore,
        codiceEAN: TOUR_STATIC_SUBSTITUTION_PRODUCT.codiceEAN,
        descrizione: TOUR_STATIC_SUBSTITUTION_PRODUCT.descrizione,
        anteprima: TOUR_STATIC_SUBSTITUTION_PRODUCT.anteprima,
        marca: TOUR_STATIC_SUBSTITUTION_PRODUCT.marca,
        linea: TOUR_STATIC_SUBSTITUTION_PRODUCT.linea,
        gruppo: TOUR_STATIC_SUBSTITUTION_PRODUCT.gruppo,
        famiglia: TOUR_STATIC_SUBSTITUTION_PRODUCT.famiglia,
        descrizioneLinea: TOUR_STATIC_SUBSTITUTION_PRODUCT.descrizioneLinea,
        descrizioneGruppo: TOUR_STATIC_SUBSTITUTION_PRODUCT.descrizioneGruppo,
        descrizioneFamiglia: TOUR_STATIC_SUBSTITUTION_PRODUCT.descrizioneFamiglia,
        codice_buyer: null,
    } as ProductDoc;

    /**
     * Campo extra solo FE (usato dal builder della controproposta per precompilare il prezzo).
     */
    (candidate as any).prezzoDealer = TOUR_STATIC_SUBSTITUTION_PRODUCT.prezzoDealer;

    if (!normalizedQuery) return [candidate];

    const haystack = [
        candidate.descrizione,
        candidate.codiceProduttore,
        candidate.codiceEAN,
        candidate.marca,
    ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

    return haystack.includes(normalizedQuery) ? [candidate] : [];
}

/**
 * Payload mock per la `CustomersPanel` durante il tour quotazioni.
 *
 * - nel tour usiamo una quotazione fake (ID non backend);
 * - la scheda cliente, senza questo payload, prova a chiamare API reali;
 * - alcuni ruoli (es. Buyer/Commerciale) possono non essere autorizzati su quel codice
 *   e vedono pannello vuoto/non autorizzato.
 *
 * Con questo builder rendiamo la scheda cliente completamente locale nel tour,
 * replicando lo stesso approccio già usato per qts/cart mock.
 */
export function buildTourMockCustomerPanelPayload(): CustomerFullPayload {
    const nowIso = "2026-03-20T10:30:00.000Z";

    /**
     * Dataset base usato per `statement/deadlines/provisions` in modalità tour.
     * Manteniamo `loaded: true` per evitare fetch aggiuntive durante il tour.
     */
    const buildStatementDataset = (params: {
        descrizione: string;
        importo: number;
        scadenza: string;
        rif: string;
    }) => ({
        loaded: true,
        total: 1,
        items: [
            {
                Descrizione: params.descrizione,
                Numero_Riferimento: params.rif,
                Anno_Riferimento: "2026",
                Data_Doc: "20260320",
                Numero_Documento: params.rif,
                Importo: params.importo,
                Data_Scadenza: params.scadenza,
            },
        ],
        nextOfs: 1,
        pageSize: 50,
        paginated: true,
        summary: {
            saldoPartita: params.importo,
            saldoComplessivo: params.importo,
            scadenzaUltimoRecord: params.scadenza,
            annoUltimoRecord: "2026",
            descrizioneUltimoRecord: params.descrizione,
        },
    });

    return {
        // Sezione anagrafica nel formato atteso da `components/Anagrafica.tsx`.
        anagrafica: {
            CODICE_CLIENTE: TOUR_STATIC_CUSTOMER.CodiceCliente.Focelda,
            RAGIONE_SOCIALE: TOUR_STATIC_CUSTOMER.RagioneSociale,
            PARTITA_IVA: TOUR_STATIC_CUSTOMER.PartitaIVA,
            CODICE_FISCALE: TOUR_STATIC_CUSTOMER.CodiceFiscale,
            STATO_AMMINISTRATIVO: "ATTIVO",
            STATO_COMMERCIALE: "ATTIVO",
            DATA_ULTIMO_CONTATTO: "20260320",
            DESCR_ULTIMO_CONTATTO: "Cliente di esempio usato nel tour system",
        },

        // Sezione fido/profilo creditizio (shape coerente con `components/Fido.tsx`).
        creditsProfile: {
            Aggiornato: "2026-03-20T10:30:00.000Z",
            Generale: {
                Rating: "A",
                DescrizioneRating: "Affidabilità alta",
                LimiteCredito: 35000,
            },
            Anagrafica: {
                RagioneSociale: TOUR_STATIC_CUSTOMER.RagioneSociale,
                PartitaIVA: TOUR_STATIC_CUSTOMER.PartitaIVA,
                CodiceFiscale: TOUR_STATIC_CUSTOMER.CodiceFiscale,
                Indirizzo: "Via Milano 12",
                Provincia: "MI",
                Nazione: "IT",
                Telefono: "+39 02 123456",
                PecEmail: "electropedia@pec.example.com",
                CodiceCliente: TOUR_STATIC_CUSTOMER.CodiceCliente.Focelda,
                CodiceClienteIOT: "900154",
                Gruppo: "RIVENDITORI",
                FormaGiuridica: "SRL",
                Costituzione: "20140214",
                Dipendenti: 24,
                Canale: TOUR_STATIC_CUSTOMER.CanaleVendita,
                Stato: "Attivo",
                actm: "900154",
            },
            Fidi: {
                Focelda: {
                    FidoTotale: 35000,
                    FidoResiduo: 18750,
                    Dettagli: {
                        SaldoCliente: 16250,
                        AScadere: 6800,
                        Scaduto: 0,
                        Insoluti: 0,
                    },
                    Tipi: {
                        Assicurato: {
                            Valore: 12000,
                            Esito: "OK",
                            Scadenza: "2026-12-31",
                        },
                    },
                    Valori: {
                        ValoreOC: 4200,
                        ValoreFB: 1850,
                    },
                },
                IOT: {
                    FidoTotale: 12000,
                    FidoResiduo: 8300,
                    Dettagli: {
                        SaldoCliente: 3700,
                        AScadere: 1200,
                        Scaduto: 0,
                        Insoluti: 0,
                    },
                    Valori: {
                        ValoreOC: 800,
                        ValoreFB: 250,
                    },
                },
            },
        },

        // Sezione credit per anni (shape coerente con `components/Credit.tsx`).
        creditsYears: {
            Focelda: {
                "2024": 21800,
                "2024Insoluti": 0,
                "2025": 27400,
                "2025Insoluti": 0,
                Corrente: 9600,
                CorrenteInsoluti: 0,
            },
            IOT: {
                "2024": 7400,
                "2025": 8600,
                Corrente: 3200,
            },
        },

        // Sezione backorders: manteniamo una riga sample per rendere visibile la card nel tour.
        backordersSummary: {
            totalRows: 1,
            agg: {
                RESIDUO: 3,
                CONSEGNA: 2,
                TOTALE: 1549.5,
            },
        },
        backordersDetails: {
            total: 1,
            nextOfs: 1,
            items: [
                {
                    TIPO: "OC",
                    NUMERO_ORDINE: "123456",
                    NUMERO_RIGA: "1",
                    DATA_ORDINE: "20260318",
                    CODICE_PRODUTTORE: TOUR_STATIC_PRODUCT.CodiceProduttore,
                    CODICE_INTERNO: TOUR_STATIC_PRODUCT.Ci,
                    DESCRIZIONE_PRODOTTO: "NB 14\" U7 226V 16GB 512SSD W11",
                    CODICE_MAGAZZINO: "MI01",
                    PREZZO: 1549.5,
                    QUANTITA_ORDINATA: 5,
                    QUANTITA_ODINATA: 5,
                    QUANTITA_EVASA: 2,
                    QUANTITA_RESIDUA: 3,
                    QUANTITA_IN_CONSEGNA: 2,
                },
            ],
        },

        // Sezione pagamenti: una riga sample per summary/details.
        paymentsDetails: {
            total: 1,
            nextOfs: 1,
            items: [
                {
                    NUMOV: "PAG-1023",
                    DAMOV: "20/03/2026",
                    CLIFO: TOUR_STATIC_CUSTOMER.CodiceCliente.Focelda,
                    CAUSA: "BON",
                    DERIG: "Bonifico bancario",
                    IMPMO: 2450,
                    CDAGE: "AG021",
                },
            ],
        },

        /**
         * Statement completo nel mock CAD:
         * includiamo entrambi i business (focelda/iot) già "loaded"
         * per evitare richieste API durante il tour.
         */
        statement: {
            activeBusiness: "focelda",
            activeView: "statement",
            focelda: {
                statement: buildStatementDataset({
                    descrizione: "Partita aperta demo",
                    importo: 2450,
                    scadenza: "20260420",
                    rif: "STM-FOC-001",
                }),
                deadlines: buildStatementDataset({
                    descrizione: "Scadenza demo",
                    importo: 2450,
                    scadenza: "20260420",
                    rif: "DLD-FOC-001",
                }),
                provisions: buildStatementDataset({
                    descrizione: "Disposizione demo",
                    importo: 2450,
                    scadenza: "20260420",
                    rif: "PRV-FOC-001",
                }),
            },
            iot: {
                statement: buildStatementDataset({
                    descrizione: "Partita iot demo",
                    importo: 780,
                    scadenza: "20260415",
                    rif: "STM-IOT-001",
                }),
                deadlines: buildStatementDataset({
                    descrizione: "Scadenza iot demo",
                    importo: 780,
                    scadenza: "20260415",
                    rif: "DLD-IOT-001",
                }),
                provisions: buildStatementDataset({
                    descrizione: "Disposizione iot demo",
                    importo: 780,
                    scadenza: "20260415",
                    rif: "PRV-IOT-001",
                }),
            },
        },

        /**
         * Profilazione demo:
         * pochi campi valorizzati per mostrare il pannello senza rumore.
         */
        profilazioneReport: {
            "CODICE CLIENTE": TOUR_STATIC_CUSTOMER.CodiceCliente.Focelda,
            "DIFFICOLTA ECONOMICA": "N",
            "CLIENTE RISCHIOSO": "N",
            "PREZZI NON COMP.": "",
            "MOTIVO CAMBIO AGENTE": "",
            updatedAt: nowIso,
        },

        /**
         * Trackings preview usata dal box summary.
         */
        trackingDetails: {
            total: 1,
            nextOfs: 1,
            items: [
                {
                    DATA_INSERIMENTO_TRACKING: "20260319",
                    CORRIERE: "BRT",
                    NUM_FB: "FB-10231",
                    URL_TRACKING: "https://tracking.example.com/FB-10231",
                },
            ],
        },

        /**
         * Sconti cliente/categoria:
         * payload minimale ma completo per far comparire il pannello.
         */
        sconti: {
            total: 2,
            cliente: {
                total: 1,
                items: [
                    {
                        PREFISSO_FORNITORE: "ACR",
                        DESCRIZIONE_FORNITORE: "Acer",
                        DESCRIZIONE_LINEA: "Notebook",
                        DATA_INIZIO: "20260301",
                        DATA_FINE: "20261231",
                        SCONTO_1: 3,
                        SCONTO_2: 1,
                        RICARICA: 0,
                    },
                ],
            },
            categoria: {
                total: 1,
                items: [
                    {
                        CODICE_SCONTO: "SC-01",
                        PREFISSO_FORNITORE: "ACR",
                        DESCRIZIONE_LINEA: "Notebook",
                        DATA_INIZIO: "20260301",
                        DATA_FINE: "20261231",
                        SCONTO_1: 2,
                        SCONTO_2: 0.5,
                        RICARICA: 0,
                    },
                ],
            },
        },

        /**
         * Preview preventivi/acquisti:
         * sufficienti per mostrare i box summary del pannello cliente.
         */
        quotesSummary: {
            total: 1,
            items: [
                {
                    AMBIENTE: "FOCELDA",
                    TANNO: "2026",
                    TNRPR: "000123",
                    TDTPR: "20260320",
                    TCDMA: "MI01",
                    TCDAG: "AG021",
                    TSTAT: "APERTO",
                },
            ],
        },
        purchasesSummary: {
            total: 1,
            items: [
                {
                    documentDate: "20260310",
                    documentNumber: "DOC-7781",
                    articleCode: TOUR_STATIC_PRODUCT.CodiceProduttore,
                    description: "Notebook demo tour",
                    rowValue: 1549.5,
                },
            ],
        },

    };
}
