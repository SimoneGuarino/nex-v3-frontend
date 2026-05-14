import type { Step } from "tour/types";

/**
 * Registry unico dei selector `data-tour` della scheda cliente.
 *
 * Perché esiste:
 * - evita stringhe duplicate tra tour globale e lock config;
 * - rende più facile aggiornare i selector in un solo punto;
 * - prepara la riusabilità della scheda cliente in più contesti.
 */
export const CUSTOMER_PANEL_TOUR_SELECTORS = {
    panel: '[data-tour="scheda-cliente"]',
    anagrafica: '[data-tour="scheda-cliente-anagrafica"]',
    profilazione: '[data-tour="scheda-cliente-profilazione"]',
    fido: '[data-tour="scheda-cliente-fido"]',
    statement: '[data-tour="scheda-cliente-statement"]',
    credit: '[data-tour="scheda-cliente-dati-creditizi"]',
    sconti: '[data-tour="scheda-cliente-sconti"]',
    backorders: '[data-tour="scheda-cliente-backorders"]',
    preventivi: '[data-tour="scheda-cliente-preventivi"]',
    acquistiCliente: '[data-tour="scheda-cliente-acquisti"]',
    payments: '[data-tour="scheda-cliente-pagamenti"]',
    trakings: '[data-tour="scheda-cliente-trakings"]',
    close: '[data-tour="scheda-cliente-close"]',
} as const;

/**
 * Step globale di ingresso nella scheda cliente.
 *
 * Nota:
 * questo step resta volutamente "globale", così può essere riusato
 * in tour diversi (quotazioni, clienti, ecc.) senza duplicazioni.
 */
export const CUSTOMER_PANEL_GLOBAL_OPEN_STEP: Step = {
    selector: CUSTOMER_PANEL_TOUR_SELECTORS.panel,
    title: "Scheda cliente",
    description:
        "La Scheda Cliente è il pannello che raccoglie in un unico punto le informazioni principali del cliente: dati anagrafici, contatti, stato operativo, profilo creditizio, pagamenti e documenti collegati. Serve per avere una vista completa e aggiornata, così da prendere decisioni più rapide e lavorare con maggiore precisione.",
    side: "left",
    important:
        "Presto la scheda cliente sarà disponibile ovunque in NEX. Durante il tour ti mostreremo la scheda cliente all’interno del flusso di quotazione ma tieni presente che potrai accedervi anche da altri contesti, dove verrà specificato nel dettaglio il contesto di ogni pannello interno della scheda.",
};

/**
 * Step principali dei pannelli interni della scheda cliente.
 *
 * In questa prima fase includiamo solo i pannelli:
 * - anagrafica
 * - fido
 * - dati creditizi
 * - backorders
 * - pagamenti
 */
export const CUSTOMER_PANEL_MAIN_STEPS: Step[] = [
    {
        selector: CUSTOMER_PANEL_TOUR_SELECTORS.anagrafica,
        title: "Anagrafica cliente",
        description:
            "Il pannello Anagrafica mostra una sintesi dei dati principali come ragione sociale, codici identificativi, partita IVA/codice fiscale, sede, contatti, stato aziendale e informazioni interne come canale, gruppo, stati amministrativo/commerciale e ultimo contatto.",
        side: "left",
        /**
         * Tour quotazioni:
         * i pannelli interni della scheda cliente sono guidati solo per i ruoli CAD.
         * Buyer vede la scheda ma non i dettagli interni, quindi questi step vengono esclusi.
         */
        roles: ["Commerciale", "Admin", "Dev"],
    },
    /**
     * ESEMPIO STEP ANNIDATI SU ANAGRAFICA (lasciati commentati volutamente):
     *
     * Quando vorrai aggiungere sotto-step più dettagliati per un pannello,
     * usa questo schema:
     *
     * 1) aggiungi nel componente UI reale i `data-tour` specifici
     *    (es. bottone dettagli, box identificativi, ecc.);
     * 2) opzionale ma consigliato: registra i selector in `CUSTOMER_PANEL_TOUR_SELECTORS`;
     * 3) decommenta/aggiungi qui gli step in ordine logico;
     * 4) se vuoi mantenere lock interazioni durante questi step,
     *    aggiungi i nuovi selector anche in `CUSTOMER_PANEL_CONTENT_STEP_SELECTORS`.
     *
     * Nota:
     * i selector qui sotto sono placeholder intenzionali e vanno agganciati
     * a elementi realmente presenti nel DOM prima di attivarli.
     */
    // {
    //     selector: '[data-tour="scheda-cliente-anagrafica-details-btn"]',
    //     title: "Apri i dettagli anagrafica",
    //     description: "Clicca su Dettagli per aprire la vista completa della sezione Anagrafica.",
    //     side: "left",
    //     advanceOn: { selector: '[data-tour="scheda-cliente-anagrafica-details-btn"]', event: "click" },
    //     afterAdvanceWaitFor: '[data-tour="scheda-cliente-anagrafica-identificativi"]',
    //     blockNextUntilAdvance: true,
    // },
    // {
    //     selector: '[data-tour="scheda-cliente-anagrafica-identificativi"]',
    //     title: "Box Identificativi",
    //     description: "In questo box trovi gli identificativi principali del cliente (codici e dati fiscali).",
    //     side: "left",
    //     enterWaitFor: '[data-tour="scheda-cliente-anagrafica-identificativi"]',
    //     enterDelayMs: 120,
    // },
    {
        selector: CUSTOMER_PANEL_TOUR_SELECTORS.profilazione,
        title: "Profilazione cliente",
        description:
            "Il pannello Profilazione è un pannello riassuntivo delle segnalazioni sul cliente: mostra se sono presenti report attivi come cambio agente, modifica pagamento, difficoltà economiche, cliente rischioso, problemi di resi, trasporto o amministrativi.",
        side: "left",
        roles: ["Commerciale", "Admin", "Dev"],
    },
    {
        selector: CUSTOMER_PANEL_TOUR_SELECTORS.fido,
        title: "Fido cliente",
        description:
            "Il pannello Fido è un riepilogo del fido cliente: mostra limite di credito, rating, saldo e fido residuo, con focus sui valori principali Focelda.",
        side: "left",
        roles: ["Commerciale", "Admin", "Dev"],
    },
    {
        selector: CUSTOMER_PANEL_TOUR_SELECTORS.credit,
        title: "Dati Creditizi cliente",
        description:
            "Il pannello Dati Creditizi offre una panoramica dei dati creditizi del cliente: mostra l’esposizione corrente, gli insoluti correnti e il valore dell’ultimo anno disponibile.",
        side: "left",
        roles: ["Commerciale", "Admin", "Dev"],
    },
    {
        selector: CUSTOMER_PANEL_TOUR_SELECTORS.statement,
        title: "Statement cliente",
        description:
            "Il pannello Statement è un pannello riassuntivo della situazione contabile del cliente: mostra estratto conto, scadenze e insoluti, storico disposizioni, saldi principali e ultimo record disponibile per Focelda o IOT.",
        side: "left",
        roles: ["Commerciale", "Admin", "Dev"],
    },
    {
        selector: CUSTOMER_PANEL_TOUR_SELECTORS.sconti,
        title: "Sconti cliente",
        description:
            "Il pannello Sconti è un pannello riassuntivo degli sconti commerciali del cliente: mostra gli sconti disponibili per cliente e per categoria, con totale, fornitore, linea e periodo di validità.",
        side: "left",
        roles: ["Commerciale", "Admin", "Dev"],
    },
    {
        selector: CUSTOMER_PANEL_TOUR_SELECTORS.backorders,
        title: "Backorders cliente",
        description:
            "Il pannello Backorders raccoglie la sintesi dei backorders del cliente: mostra le righe d’ordine ancora aperte, le quantità residue, quelle in consegna e il valore totale aggregato.",
        side: "left",
        roles: ["Commerciale", "Admin", "Dev"],
    },
    {
        selector: CUSTOMER_PANEL_TOUR_SELECTORS.preventivi,
        title: "Preventivi cliente",
        description:
            "Il pannello Preventivi mostra il numero totale di preventivi del cliente e una preview delle ultime righe disponibili con data, numero preventivo, magazzino, agente e stato.",
        side: "left",
        roles: ["Commerciale", "Admin", "Dev"],
    },
    {
        selector: CUSTOMER_PANEL_TOUR_SELECTORS.acquistiCliente,
        title: "Acquisti cliente",
        description:
            "Il pannello Acquisti cliente mostra il numero totale di acquisti e una preview delle ultime righe disponibili con data, documento, articolo, descrizione e valore.",
        side: "left",
        roles: ["Commerciale", "Admin", "Dev"],
    },
    {
        selector: CUSTOMER_PANEL_TOUR_SELECTORS.payments,
        title: "Pagamenti cliente",
        description:
            "Il pannello Pagamenti è un pannello riassuntivo dei pagamenti del cliente: mostra il totale dei movimenti disponibili e una preview con data, numero movimento, causale e imponibile.",
        side: "left",
        roles: ["Commerciale", "Admin", "Dev"],
    },
    {
        selector: CUSTOMER_PANEL_TOUR_SELECTORS.trakings,
        title: "Trakings cliente",
        description:
            "Il pannello Trackings è un pannello riassuntivo delle spedizioni del cliente: mostra il totale dei tracking disponibili e una preview con data, corriere, numero FB e link di tracking.",
        side: "left",
        roles: ["Commerciale", "Admin", "Dev"],
    },
];

/**
 * Step globale di uscita dalla scheda cliente.
 *
 * Nota:
 * lo manteniamo separato perché nel tour è uno step guidato (click obbligatorio).
 */
export const CUSTOMER_PANEL_GLOBAL_CLOSE_STEP: Step = {
    selector: CUSTOMER_PANEL_TOUR_SELECTORS.close,
    title: "Chiudi la scheda cliente",
    description: "Clicca la X in alto per chiudere il pannello.",
    side: "bottom",
    advanceOn: { selector: CUSTOMER_PANEL_TOUR_SELECTORS.close, event: "click" },
    enterWaitFor: CUSTOMER_PANEL_TOUR_SELECTORS.close,
    enterDelayMs: 400,
    blockNextUntilAdvance: true,
};

/**
 * Selector degli step contenuto scheda (open + pannelli principali).
 *
 * Uso tipico:
 * - lock interazioni durante gli step interni della scheda;
 * - regole centralizzate per evitare mismatch tra tour e UI lock.
 */
export const CUSTOMER_PANEL_CONTENT_STEP_SELECTORS: string[] = [
    CUSTOMER_PANEL_TOUR_SELECTORS.panel,
    CUSTOMER_PANEL_TOUR_SELECTORS.anagrafica,
    CUSTOMER_PANEL_TOUR_SELECTORS.fido,
    CUSTOMER_PANEL_TOUR_SELECTORS.credit,
    CUSTOMER_PANEL_TOUR_SELECTORS.backorders,
    CUSTOMER_PANEL_TOUR_SELECTORS.payments,
    CUSTOMER_PANEL_TOUR_SELECTORS.trakings,
    CUSTOMER_PANEL_TOUR_SELECTORS.statement,
    CUSTOMER_PANEL_TOUR_SELECTORS.sconti,
    CUSTOMER_PANEL_TOUR_SELECTORS.preventivi,
    CUSTOMER_PANEL_TOUR_SELECTORS.acquistiCliente,
    CUSTOMER_PANEL_TOUR_SELECTORS.profilazione,
];

/**
 * Selector dedicato allo step di chiusura scheda cliente.
 */
export const CUSTOMER_PANEL_CLOSE_STEP_SELECTOR = CUSTOMER_PANEL_TOUR_SELECTORS.close;

/**
 * Composizione standard degli step scheda cliente.
 *
 * Ordine applicato:
 * 1) apertura globale scheda
 * 2) pannelli principali
 * 3) chiusura globale scheda
 *
 * In questo modo il file tour globale resta più snello e mantiene un ruolo
 * di orchestrazione ad alto livello.
 */
export function buildCustomerPanelTourSteps(): Step[] {
    return [
        CUSTOMER_PANEL_GLOBAL_OPEN_STEP,
        ...CUSTOMER_PANEL_MAIN_STEPS,
        CUSTOMER_PANEL_GLOBAL_CLOSE_STEP,
    ];
}
