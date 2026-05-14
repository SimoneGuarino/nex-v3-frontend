import type { Dispatch, SetStateAction } from "react";
import {
    buildTourMockQuotation,
    buildTourMockQuotationForRole,
    getTourMockQuotationListPhase,
    resetTourMockQuotationListPhase,
} from "./mockQuotation";
import type { Role } from "tour/types";

/**
 * LEGENDA RAPIDA (open / close / lock pannelli)
 * --------------------------------------------------
 * Queste funzioni sono helper UI usati nelle actions degli step.
 *
 * openProductPanel() = apertura pannello "Quotazione prodotto"
 * closeProductPanel() = chiusura pannello "Quotazione prodotto"
 *
 * setProductPanelIntroUi() = lock del pannello "Quotazione prodotto"
 * setProductPanelUi() = pannello prodotto aperto e interagibile (unlock)
 *
 * setProductSheetInternalUi() = scheda prodotto aperta con X bloccata (lock chiusura)
 * setProductSheetCloseUi() = scheda prodotto aperta con X abilitata
 *
 * openAdvancedPanel() / closeAdvancedPanel() = apertura/chiusura "Dettagli avanzati / storico"
 * openSubstitutionPanel() / closeSubstitutionPanel() = apertura/chiusura "Proponi prodotto in sostituzione"
 *
 * openTourClosureWizard() / closeTourClosureWizard() = apertura/chiusura wizard "Chiusura quotazione"
 */

// --------------------------------------------------
// TYPES
// --------------------------------------------------
type SetRaw = Dispatch<SetStateAction<any[]>>;
type SetBoolean = Dispatch<SetStateAction<boolean>>;
type SetDetailsSearch = Dispatch<
    SetStateAction<
        boolean | { from: "quotazioni" | "prodotti" | "descrivi_necessita" | "propose_qts_products"; bool: boolean }
    >
>;

/**
 * Firma actions compatibile con useSectionTour/TourProvider.
 */
type TourActionFn = (
    currStep?: number,
    skip?: (to: number) => void,
    reqFromBack?: boolean
) => void;

//Tipi per i parametri di costruzione delle actions del tour quotazioni.
type BuildQuotazioniTourActionsParams = {
    role: Role;
    setRaw: SetRaw;
    setCreateOpen: SetBoolean;
    setOpenFilters: SetBoolean;
    setOpenSearch: SetBoolean;
    navigateToList?: () => void;
};

//Tipi per i parametri di costruzione delle actions dei passi della pagina dettaglio quotazione.
type BuildQuotazioniDetailsStepActionsParams = {
    role: Role;
    setOpenFilters: SetBoolean;
    setOpenSearch: SetDetailsSearch;
    setOpenCustomersDetails: SetBoolean;
    /**
     * Callback opzionale per cambiare tab/scope nel dettaglio quotazione.
     *
     * Scope supportati in questa regia:
     * - "descrivi_necessita" (tab Necessità)
     * - "prodotti" (tab Lista Prodotti)
     * - "quotazioni" (tab Quotazione Prodotti)
     */
    setDetailsScope?: (next: "descrivi_necessita" | "prodotti" | "quotazioni") => void;
    /**
     * Setter del pannello "Quotazione prodotto" nel dettaglio quotazione.
     *
     * È opzionale per non toccare i flussi esistenti.
     * Se presente, il tour può aprire/chiudere il pannello prodotto.
     */
    setOpenProductQtsSettings?: Dispatch<SetStateAction<any | null>>;
    /**
     * Ritorna la prima riga prodotto da aprire nel tour.
     *
     * La pagina decide come trovarla (es. nel carrello).
     */
    getFirstCartProductForTour?: () => any | null;
    /**
     * Setter UI tour del pannello prodotto: lock del pannello principale.
     */
    setTourProductPanelLock?: SetBoolean;
    /**
     * Setter UI tour della scheda prodotto: disabilita la X.
     */
    setTourProductSheetCloseDisabled?: SetBoolean;
    /**
     * Setter UI tour della scheda prodotto: open/close.
     */
    setTourProductSheetMode?: Dispatch<SetStateAction<"keep" | "open" | "close">>;
    /**
     * Setter UI tour del pannello secondario "Dettagli avanzati / storico".
     */
    setTourProductSecondaryPanelMode?: Dispatch<SetStateAction<"keep" | "open" | "close">>;
    /**
     * Setter UI tour del pannello "Proponi prodotto in sostituzione".
     */
    setTourProductSubstitutionPanelMode?: Dispatch<SetStateAction<"keep" | "open" | "close">>;
    /**
     * Setter UI tour del bottone "Chiudi ricerca" nella sostituzione.
     */
    setTourSubstitutionCloseDisabled?: SetBoolean;
    /**
     * Callback opzionale per precompilare/innescare la ricerca sostituzione.
     */
    runTourSubstitutionSeedSearch?: () => void;
    /**
     * Callback opzionale CAD tour-only:
     * seed della barra "Ricerca mirata" nello step `quotazioni-AS-panel`
     * del dettaglio quotazione fake.
     */
    runTourCadAsPanelSeedSearch?: () => void;
    /**
     * Callback opzionale per resettare la selezione del prodotto sostitutivo
     * quando l'utente torna indietro nel tour.
     */
    runTourSubstitutionResetSelection?: () => void;
    /**
     * Lock UI tour dell'intero pannello ricerca sostituzione.
     */
    setTourSubstitutionSearchPanelLock?: SetBoolean;
    /**
     * Lock UI tour del box "Prodotti inseriti nella proposta".
     */
    setTourSubstitutionProposalsBoxLock?: SetBoolean;
    /**
     * Lock UI tour del pannello "Proposta di sostituzione".
     */
    setTourSubstitutionProposalPanelLock?: SetBoolean;
    /**
     * Callback opzionale: apre il wizard di chiusura quotazione nel tour.
     */
    openTourClosureWizard?: () => void;
    /**
     * Callback opzionale: chiude il wizard di chiusura quotazione nel tour.
     */
    closeTourClosureWizard?: () => void;
    /**
     * Selector dello step attivo: usato per regie resilienti a riordino indici.
     */
    activeStepSelector?: string;
    /**
     * Direzione dell'ultima navigazione tour nel dettaglio.
     * Serve per distinguere logiche "Avanti" vs "Indietro".
     */
    navigationDirection?: "forward" | "backward" | "none";
    /**
     * Callback opzionale per ripristinare lo stato "pre-apertura"
     * della quotazione fake quando si torna indietro allo step `quotazioni-open`.
     */
    restoreTourMockBeforeOpenStep?: () => void;
    /**
     * Callback opzionale per preparare la demo "controproposta buyer inviata"
     * nel flusso CAD prima dello step Azioni Commerciale.
     */
    runTourPrepareCommercialCounterproposal?: () => void;
    /**
     * Callback opzionale per ripristinare la riga fake nello stato
     * "pre-controproposta" quando si torna allo step stato quotazione.
     */
    restoreTourMockBeforeCommercialCounterproposalStep?: () => void;
    /**
     * Callback opzionale per salvare lo snapshot prima dello step
     * "Accetta" nel flusso CAD.
     */
    snapshotTourMockBeforeCommercialAcceptanceStep?: () => void;
    /**
     * Callback opzionale per ripristinare la UI pre-accettazione
     * quando si torna indietro sullo step "Accetta" CAD.
     */
    restoreTourMockBeforeCommercialAcceptanceStep?: () => void;
    /**
     * Callback opzionale buyer tour-only:
     * prepara lo scenario "quotazione pronta da chiudere".
     */
    runTourPrepareBuyerReadyToCloseStep?: () => void;
    /**
     * Callback opzionale CAD tour-only:
     * porta la fake quotazione in stato "DA_CHIUDERE".
     */
    runTourMarkCadQuotationReadyToCloseStep?: () => void;
    /**
     * Callback opzionale buyer tour-only:
     * completa la fake quotazione nello step "quotazioni-close-counter".
     */
    runTourCompleteBuyerClosureCounterStep?: () => void;
    /**
     * Callback opzionale CAD tour-only:
     * resetta il carrello fake a vuoto quando si torna allo step "Aggiungi prodotto".
     */
    runTourResetCartForAddProductStep?: () => void;
    /**
     * Callback opzionale buyer tour-only:
     * snapshot stato "pre-invio" nello step submit della sostituzione.
     */
    runTourSnapshotBuyerBeforeSubmitStep?: () => void;
    /**
     * Callback opzionale buyer tour-only:
     * restore stato "pre-invio" quando si torna indietro allo step submit.
     */
    runTourRestoreBuyerBeforeSubmitStep?: () => void;
};

// --------------------------------------------------
// ROW HELPERS / UTILS
// --------------------------------------------------
/**
 * Verifica se una riga della tabella corrisponde alla quotazione fake del tour.
 */
export function isTourMockQuotation(row: any): boolean {
    if (!row || typeof row !== "object") return false;
    return row.__tourMock === true;
}

// --------------------------------------------------
// LIST HELPERS
// --------------------------------------------------
/**
 * Inserisce la quotazione fake in testa alla lista, senza duplicarla.
 */
export function injectTourMockQuotation(setRaw: SetRaw, role?: Role): void {
    /**
     * La riga fake di lista è role-aware:
     * - Buyer => APERTA
     * - altri ruoli => BOZZA
     *
     * Se il ruolo non è disponibile manteniamo il comportamento storico (BOZZA).
     */
    /**
     * La costruzione della riga fake usa anche la "fase" corrente del tour:
     * - `default`          => stato iniziale per ruolo
     * - `closed_ok`        => stato finale tour (OK + link OC/FB disponibili)
     */
    const listPhase = getTourMockQuotationListPhase();
    const mockRow = role
        ? buildTourMockQuotationForRole(role, { listPhase })
        : buildTourMockQuotation();

    /**
     * Estrae in modo robusto il numero link OC/FB da una riga.
     * Serve per confronti idempotenti prima di fare setState.
     */
    const getOkLinksCount = (row: any): number => {
        const count = Number(row?.final_outcome?.ok_links_stats?.links_count ?? 0);
        return Number.isFinite(count) ? count : 0;
    };

    /**
     * Determina se la riga fake già presente è allineata allo scenario richiesto.
     * Se è già allineata, evitiamo `setRaw` per non innescare re-render inutili.
     */
    const isAlreadyAligned = (row: any): boolean => {
        const sameState = String(row?.stato ?? "") === String(mockRow?.stato ?? "");
        const sameOkLinks = getOkLinksCount(row) === getOkLinksCount(mockRow);
        return sameState && sameOkLinks;
    };

    setRaw((prev) => {
        const rows = Array.isArray(prev) ? prev : [];
        const existingIndex = rows.findIndex((r) => isTourMockQuotation(r));

        // Prima iniezione: prepend semplice in testa.
        if (existingIndex === -1) return [mockRow, ...rows];

        /**
         * Sync idempotente:
         * se la riga fake esiste già, aggiorniamo i campi tour-driven
         * (stato/final_outcome) mantenendo eventuali campi locali aggiuntivi.
         */
        const existing = rows[existingIndex];

        // Idempotenza hard: se non cambia nulla, restituiamo la stessa reference.
        if (isAlreadyAligned(existing)) return rows;

        /**
         * Aggiorniamo solo i campi realmente tour-driven della fase lista:
         * - `stato`
         * - `final_outcome` (presenza/assenza + links_count)
         *
         * Evitiamo merge completo di `mockRow` per non riscrivere campi statici
         * (es. date create con `new Date()`) che causerebbero re-render continui.
         */
        const nextRows = [...rows];
        const nextState = String(mockRow?.stato ?? "");
        const nextLinksCount = getOkLinksCount(mockRow);
        const base = { ...existing, stato: nextState } as any;

        if (nextLinksCount > 0) {
            base.final_outcome = {
                ...(base.final_outcome ?? {}),
                outcome: "OK",
                ok_links_stats: {
                    ...(base.final_outcome?.ok_links_stats ?? {}),
                    links_count: nextLinksCount,
                },
            };
        } else if (base.final_outcome) {
            // Nello scenario default rimuoviamo il blocco finale tour-only.
            const { final_outcome: _omitFinalOutcome, ...rest } = base;
            nextRows[existingIndex] = rest;
            return nextRows;
        }

        nextRows[existingIndex] = base;
        return nextRows;
    });
}

/**
 * Rimuove la quotazione fake dalla lista quotazioni.
 */
export function removeTourMockQuotation(setRaw: SetRaw): void {
    // Cleanup completo del tour-list: rimuoviamo anche la fase persistita.
    resetTourMockQuotationListPhase();
    setRaw((prev) => {
        const rows = Array.isArray(prev) ? prev : [];
        return rows.filter((r) => !isTourMockQuotation(r));
    });
}

// --------------------------------------------------
// TOUR FACTORY
// --------------------------------------------------
/**
 * Factory centralizzata delle actions del tour quotazioni.
 * Obiettivo del primo step:
 * - iniettare il JSON statico in tabella quando il tour parte
 * - tenere la UI lineare (chiudiamo pannelli secondari)
 * - fornire helper di cleanup richiamabile dalla pagina
 */
export function buildQuotazioniTourActions({
    role,
    setRaw,
    setCreateOpen,
    setOpenFilters,
    setOpenSearch,
    navigateToList,
}: BuildQuotazioniTourActionsParams): {
    actions: Record<number, TourActionFn>;
    injectMockQuotation: () => void;
    removeMockQuotation: () => void;
} {
    /**
     * Shortcut usato sia dagli step che dalla pagina.
     */
    const injectMockQuotation = () => injectTourMockQuotation(setRaw, role);

    /**
     * Shortcut usato nel cleanup quando il tour termina/si chiude.
     */
    const removeMockQuotation = () => removeTourMockQuotation(setRaw);

    const commonActions: Record<number, TourActionFn> = {
        // Step 0 (welcome): prepara la scena del tour e inietta la quotazione fake.
        0: () => {
            /**
             * Hard reset della fase prima dell'iniezione:
             * ogni nuovo avvio tour deve partire da BOZZA/APERTA, mai da OK.
             */
            resetTourMockQuotationListPhase();
            injectMockQuotation();
        },
    };

    const commercialAdminDevActions: Record<number, TourActionFn> = {
        1: () => { setCreateOpen(false) },
        2: () => { setCreateOpen(true); },
        5: () => { setCreateOpen(true); },
        6: () => { setCreateOpen(false); setOpenFilters(false) },
        7: () => { setOpenFilters(true); },
        8: () => { setOpenFilters(false); setOpenSearch(false); },
        9: () => { setOpenSearch(true); },
        11: () => { setOpenSearch(true); },
        12: () => { setOpenSearch(false); },
    };

    const buyerActions: Record<number, TourActionFn> = {
        1: () => { setOpenFilters(false); },
        2: () => { setOpenFilters(true); },
        3: () => { setOpenFilters(false); setOpenSearch(false); },
        4: () => { setOpenSearch(true); },
        6: () => { setOpenSearch(true); },
        7: () => { setOpenSearch(false); },
    };

    const isCommercialAdminDev =
        role === "Commerciale" || role === "Admin" || role === "Dev";

    /**
     * Step-index di riferimento per la transizione lista -> dettagli
     * e per il ritorno indietro dal dettaglio al blocco tabella.
     *
     * Nota:
     * - gli indici sono diversi tra CAD e Buyer perché i ruoli CAD hanno
     *   gli step iniziali di "Nuova quotazione" che il Buyer non vede.
     */
    const detailsMenuStep = isCommercialAdminDev ? 15 : 10; // step "quotazione-details-2" (voce menu Apri Dettagli)
    const settingsStep = detailsMenuStep - 1;               // step "quotazione-details" (menu impostazioni riga)

    const crossPageActions: Record<number, TourActionFn> = {
        /**
         * Gestione "Indietro" dal primo blocco della pagina dettagli.
         *
         * Dinamica runtime:
         * - Quando l'utente è nel dettaglio e preme "Indietro", il TourProvider
         *   richiama l'action dello step precedente passando `reqFromBack = true`.
         * - In quel caso rientriamo alla lista quotazioni e saltiamo allo step
         *   "Impostazioni Quotazione", così il tour resta coerente nel contesto tabella.
         */
        [detailsMenuStep]: (_curr, skip, reqFromBack) => {
            if (!reqFromBack) return;
            if (typeof navigateToList !== "function") return;
            if (typeof skip !== "function") return;

            navigateToList();
            /**
             * Piccolo delay tecnico:
             * lasciamo un tick extra al router per montare di nuovo la pagina lista
             * prima di forzare lo skip allo step target.
             * Questo riduce i casi in cui il popover perde il focus perché il nodo
             * non è ancora nel DOM quando il tour tenta il posizionamento.
             */
            setTimeout(() => skip(settingsStep), 120);
        },
    };

    const actions: Record<number, TourActionFn> = {
        ...commonActions,
        ...(isCommercialAdminDev ? commercialAdminDevActions : buyerActions),
        ...crossPageActions,
    };

    return {
        actions,
        injectMockQuotation,
        removeMockQuotation,
    };
}

/**
 * Parametri della regia cross-page lato LISTA quotazioni.
 *
 * Questa regia è separata dalle actions a indice perché dipende da:
 * - selector attivo (più robusto ai riordini step)
 * - direzione di navigazione (forward/backward)
 */
type ApplyQuotazioniListCrossPageTourActionParams = {
    isTourOpen: boolean;
    activeStepSelector?: string;
    navigationDirection?: "forward" | "backward" | "none";
    navigateToTourMockDetails?: () => void;
};

/**
 * Regia selector-driven per i passaggi cross-page nel tour quotazioni (pagina LISTA).
 *
 * Caso gestito:
 * - l'utente preme "Indietro" dallo step lista `quotazione-details`
 * - il tour torna allo step `quotazioni-close-counter` (buyer) o `quotazioni-end` (CAD) che vive nel dettaglio quotazione
 * - quindi, dalla pagina lista, navighiamo al dettaglio fake per riallineare il contesto.
 *
 * Importante:
 * - non tocca il business reale;
 * - opera solo in tour aperto e solo su direzione backward.
 * - non usiamo branch di ruolo: il selector-step è già sufficiente.
 */
export function applyQuotazioniListCrossPageTourAction({
    isTourOpen,
    activeStepSelector,
    navigationDirection,
    navigateToTourMockDetails,
}: ApplyQuotazioniListCrossPageTourActionParams): void {
    if (!isTourOpen) return;
    if (navigationDirection !== "backward") return;
    /**
     * Step finali che vivono nel DETTAGLIO quotazione.
     *
     * - Buyer: `quotazioni-close-counter`
     * - CAD:   `quotazioni-end`
     *
     * Se torniamo indietro dalla LISTA su uno di questi selector,
     * dobbiamo rientrare nel dettaglio fake per mantenere il contesto corretto.
     */
    const isDetailsFinalStep =
        activeStepSelector === '[data-tour="quotazioni-close-counter"]' ||
        activeStepSelector === '[data-tour="quotazioni-end"]';
    if (!isDetailsFinalStep) return;
    if (typeof navigateToTourMockDetails !== "function") return;

    navigateToTourMockDetails();
}

type ApplyQuotazioniListOkLinksTourActionParams = {
    isTourOpen: boolean;
    activeStepSelector?: string;
    navigationDirection?: "forward" | "backward" | "none";
    setOpenOkLinksPanel?: (open: boolean) => void;
    setTourOkLinks?: () => void;
    clearTourOkLinks?: () => void;
    ensureTourMockRowActionsMenuOpen?: () => void;
};

/**
 * Regia finale lista quotazioni per il pannello "Ordini collegati" (OC/FB).
 *
 * Obiettivi:
 * - mantenere aperto il pannello nei relativi step tour;
 * - mostrare i risultati mock della quotazione fake senza chiamare API reali;
 * - in backward, chiudere il pannello e riaprire il menu riga per rendere
 *   nuovamente cliccabile la voce "Visualizza FB & OC collegati".
 */
export function applyQuotazioniListOkLinksTourAction({
    isTourOpen,
    activeStepSelector,
    navigationDirection,
    setOpenOkLinksPanel,
    setTourOkLinks,
    clearTourOkLinks,
    ensureTourMockRowActionsMenuOpen,
}: ApplyQuotazioniListOkLinksTourActionParams): void {
    // Regia strettamente tour-only: fuori dal tour non alteriamo mai la UI business.
    if (!isTourOpen) return;

    const isOkLinksPanelStep =
        activeStepSelector === '[data-tour="quotazioni-ok-links-panel"]' ||
        activeStepSelector === '[data-tour="quotazioni-ok-links-close"]';

    if (isOkLinksPanelStep) {
        if (typeof setTourOkLinks === "function") {
            setTourOkLinks();
        }
        if (typeof setOpenOkLinksPanel === "function") {
            setOpenOkLinksPanel(true);
        }
        return;
    }

    if (activeStepSelector === '[data-tour="quotazione-ok-links-open"]') {
        if (typeof setTourOkLinks === "function") {
            setTourOkLinks();
        }
        if (typeof setOpenOkLinksPanel === "function") {
            setOpenOkLinksPanel(false);
        }
        if (
            navigationDirection === "backward" &&
            typeof ensureTourMockRowActionsMenuOpen === "function"
        ) {
            ensureTourMockRowActionsMenuOpen();
        }
        return;
    }

    if (
        activeStepSelector === '[data-tour="quotazione-details"]' &&
        typeof setOpenOkLinksPanel === "function"
    ) {
        setOpenOkLinksPanel(false);
        if (typeof clearTourOkLinks === "function") {
            clearTourOkLinks();
        }
        return;
    }

    // Finale tour: chiudiamo automaticamente il pannello OC/FB senza step dedicato.
    if (
        (activeStepSelector === '[data-tour="global-tour-entry"]' ||
            activeStepSelector === '.tour-menu-start' ||
            activeStepSelector === '[data-tour="tour-modal-start"]') &&
        typeof setOpenOkLinksPanel === "function"
    ) {
        setOpenOkLinksPanel(false);
        if (typeof clearTourOkLinks === "function") {
            clearTourOkLinks();
        }
    }
}

// --------------------------------------------------
// DETAILS STEP ACTIONS (PAGE: quotationDetails.tsx)
// --------------------------------------------------
/**
 * Costruisce la mappa actions del SOLO dettaglio quotazione.
 *
 * Obiettivo:
 * - tenere la logica step->UI nel modulo tour (non dentro il componente pagina)
 * - riusare lo stesso pattern già adottato nella lista (actions per indice step)
 */
export function buildQuotazioniDetailsStepActions({
    role,
    setOpenFilters,
    setOpenSearch,
    setOpenCustomersDetails,
    setOpenProductQtsSettings,
    getFirstCartProductForTour,
    setTourProductPanelLock,
    setTourProductSheetCloseDisabled,
    setTourProductSheetMode,
    setTourProductSecondaryPanelMode,
    setTourProductSubstitutionPanelMode,
    setTourSubstitutionCloseDisabled,
    setTourSubstitutionSearchPanelLock,
    setTourSubstitutionProposalsBoxLock,
    setTourSubstitutionProposalPanelLock,
    openTourClosureWizard,
    closeTourClosureWizard,
}: BuildQuotazioniDetailsStepActionsParams): Record<number, TourActionFn> {
    const isCommercialAdminDev =
        role === "Commerciale" || role === "Admin" || role === "Dev";

    /** Chiude il pannello prodotto (se il setter e disponibile). */
    const closeProductPanel = () => {
        if (typeof setOpenProductQtsSettings !== "function") return;
        setOpenProductQtsSettings(null);
    };

    /** Apre il pannello prodotto usando la prima riga disponibile. */
    const openProductPanel = () => {
        if (typeof setOpenProductQtsSettings !== "function") return;
        if (typeof getFirstCartProductForTour !== "function") return;
        const firstProductRow = getFirstCartProductForTour();
        if (!firstProductRow) return;
        setOpenProductQtsSettings(firstProductRow);
    };

    /**
     * Reset UI tour del blocco prodotto.
     * Lo usiamo come stato base prima di ogni action.
     */
    const resetProductTourUi = () => {
        if (typeof setTourProductPanelLock === "function") {
            setTourProductPanelLock(false);
        }
        if (typeof setTourProductSheetCloseDisabled === "function") {
            setTourProductSheetCloseDisabled(false);
        }
        if (typeof setTourProductSheetMode === "function") {
            setTourProductSheetMode("close");
        }
        if (typeof setTourProductSecondaryPanelMode === "function") {
            setTourProductSecondaryPanelMode("close");
        }
        if (typeof setTourProductSubstitutionPanelMode === "function") {
            setTourProductSubstitutionPanelMode("close");
        }
        if (typeof setTourSubstitutionCloseDisabled === "function") {
            setTourSubstitutionCloseDisabled(false);
        }
        if (typeof setTourSubstitutionSearchPanelLock === "function") {
            setTourSubstitutionSearchPanelLock(false);
        }
        if (typeof setTourSubstitutionProposalsBoxLock === "function") {
            setTourSubstitutionProposalsBoxLock(false);
        }
        if (typeof setTourSubstitutionProposalPanelLock === "function") {
            setTourSubstitutionProposalPanelLock(false);
        }
    };

    /** UI step intro pannello prodotto (pannello lockato, scheda chiusa). */
    const setProductPanelIntroUi = () => {
        resetProductTourUi();
        if (typeof setTourProductPanelLock === "function") {
            setTourProductPanelLock(true);
        }
    };

    /** UI pannello prodotto normale (niente lock, scheda chiusa). */
    const setProductPanelUi = () => {
        resetProductTourUi();
    };

    /** UI scheda prodotto interna (scheda aperta, X disabilitata). */
    const setProductSheetInternalUi = () => {
        resetProductTourUi();
        if (typeof setTourProductSheetMode === "function") {
            setTourProductSheetMode("open");
        }
        if (typeof setTourProductSheetCloseDisabled === "function") {
            setTourProductSheetCloseDisabled(true);
        }
    };

    /** UI step chiusura scheda (scheda aperta, X abilitata). */
    const setProductSheetCloseUi = () => {
        resetProductTourUi();
        if (typeof setTourProductSheetMode === "function") {
            setTourProductSheetMode("open");
        }
    };

    /**
     * Helper tour per il pannello "Dettagli avanzati / storico".
     * Manteniamo nomi espliciti tipo open/close per usarli nelle actions numerate.
     */
    const openAdvancedPanel = () => {
        if (typeof setTourProductSecondaryPanelMode === "function") {
            setTourProductSecondaryPanelMode("open");
        }
    };
    const closeAdvancedPanel = () => {
        if (typeof setTourProductSecondaryPanelMode === "function") {
            setTourProductSecondaryPanelMode("close");
        }
    };

    /**
     * Helper tour per la colonna "Suggerisci/Proponi prodotto".
     */
    const openSubstitutionPanel = () => {
        if (typeof setTourProductSubstitutionPanelMode === "function") {
            setTourProductSubstitutionPanelMode("open");
        }
    };
    const closeSubstitutionPanel = () => {
        if (typeof setTourProductSubstitutionPanelMode === "function") {
            setTourProductSubstitutionPanelMode("close");
        }
    };

    /**
     * Mappa CAD (Commerciale/Admin/Dev):
     */
    const commercialAdminDevActions: Record<number, TourActionFn> = {
        20: () => { setOpenCustomersDetails(false); },
        21: () => { setOpenCustomersDetails(false); },
        22: () => { setOpenCustomersDetails(true); },
        34: () => { setOpenCustomersDetails(true); },
        35: () => { setOpenCustomersDetails(false); },
        42: () => { setOpenSearch(false) },
        43: () => { setOpenSearch(true); },
        44: () => { setOpenSearch(true) },
        45: () => { setOpenFilters(false); setOpenSearch(false); },
        46: () => { setOpenFilters(true); },
        47: () => { setOpenFilters(false); },
        51: () => { closeProductPanel(); },
        52: () => { openProductPanel(); setProductPanelIntroUi(); },
        53: () => { openProductPanel(); setProductPanelUi(); },
        54: () => { openProductPanel(); setProductSheetInternalUi(); },
        55: () => { openProductPanel(); setProductSheetInternalUi(); },
        56: () => { openProductPanel(); setProductSheetInternalUi(); },
        57: () => { openProductPanel(); setProductSheetInternalUi(); },
        58: () => { openProductPanel(); setProductSheetInternalUi(); },
        59: () => { openProductPanel(); setProductSheetCloseUi(); },
        60: () => { openProductPanel(); setProductPanelUi(); },
        62: () => { openProductPanel(); setProductPanelUi(); openAdvancedPanel(); openSubstitutionPanel(); },
        63: () => { openProductPanel(); setProductPanelUi(); openAdvancedPanel(); openSubstitutionPanel(); },
        64: () => { closeProductPanel(); setProductPanelUi(); closeAdvancedPanel(); closeSubstitutionPanel(); },
        67: () => { closeProductPanel(); },
        68: () => { openProductPanel(); },
        69: () => { openProductPanel(); setProductPanelIntroUi(); },
        70: () => { openProductPanel(); setProductPanelUi(); },
        /**
         * Step banner "Quotazione pronta da chiudere":
         * spostiamo il focus fuori dal pannello prodotto.
         */
        71: () => {
            closeProductPanel();
            if (typeof closeTourClosureWizard === "function") {
                closeTourClosureWizard();
            }
        },
        /**
         * Step CTA "Apri chiusura":
         * il wizard resta chiuso finché l'utente non clicca il bottone guidato.
         */
        72: () => {
            closeProductPanel();
            if (typeof closeTourClosureWizard === "function") {
                closeTourClosureWizard();
            }
        },
        /**
         * Step pannello "Chiusura quotazione":
         * apriamo il wizard tour-only.
         */
        73: () => {
            closeProductPanel();
            if (typeof openTourClosureWizard === "function") {
                openTourClosureWizard();
            }
        },
        80: () => {
            if (typeof openTourClosureWizard === "function") {
                openTourClosureWizard();
            }
        },
        81: () => {
            if (typeof closeTourClosureWizard === "function") {
                closeTourClosureWizard();
            }
        },
    };

    /**
     * Mappa Buyer:
     */
    const buyerActions: Record<number, TourActionFn> = {
        15: () => { setOpenCustomersDetails(false); },
        16: () => { setOpenCustomersDetails(true); },
        17: () => { setOpenCustomersDetails(true); },
        18: () => { setOpenCustomersDetails(false); },
        19: () => { setOpenSearch(false) },
        20: () => { setOpenSearch(true) },
        21: () => { setOpenSearch(true); },
        22: () => { setOpenSearch(false); setOpenFilters(false); },
        23: () => { setOpenFilters(true); },
        24: () => { setOpenFilters(false); closeProductPanel(); },
        26: () => { closeProductPanel(); },
        27: () => { openProductPanel(); setProductPanelIntroUi(); },
        28: () => { openProductPanel(); setProductPanelUi(); },
        29: () => { openProductPanel(); setProductSheetInternalUi(); },
        30: () => { openProductPanel(); setProductSheetInternalUi(); },
        31: () => { openProductPanel(); setProductSheetInternalUi(); },
        32: () => { openProductPanel(); setProductSheetInternalUi(); },
        33: () => { openProductPanel(); setProductSheetInternalUi(); },
        34: () => { openProductPanel(); setProductSheetInternalUi(); },
        35: () => { openProductPanel(); setProductSheetCloseUi(); },
        37: () => { openProductPanel(); setProductPanelIntroUi(); },
        38: () => { openProductPanel(); setProductPanelUi(); },
        42: () => { openProductPanel(); openAdvancedPanel(); },
        43: () => { openProductPanel(); closeAdvancedPanel(); },
        45: () => { openProductPanel(); },
        46: () => { closeProductPanel() }

    };

    return isCommercialAdminDev ? commercialAdminDevActions : buyerActions;
}

/**
 * Applica l'action del passo corrente della pagina dettaglio.
 *
 * Nota:
 * - Se il tour è chiuso, forza reset neutro dei pannelli del dettaglio.
 * - Se il tour è aperto ma lo step non ha action associata, non fa nulla.
 */
export function applyQuotazioniDetailsStepAction({
    role,
    isTourOpen,
    stepIndex,
    setOpenFilters,
    setOpenSearch,
    setOpenCustomersDetails,
    setDetailsScope,
    setOpenProductQtsSettings,
    getFirstCartProductForTour,
    setTourProductPanelLock,
    setTourProductSheetCloseDisabled,
    setTourProductSheetMode,
    setTourProductSecondaryPanelMode,
    setTourProductSubstitutionPanelMode,
    setTourSubstitutionCloseDisabled,
    runTourSubstitutionSeedSearch,
    runTourCadAsPanelSeedSearch,
    runTourSubstitutionResetSelection,
    setTourSubstitutionSearchPanelLock,
    setTourSubstitutionProposalsBoxLock,
    setTourSubstitutionProposalPanelLock,
    openTourClosureWizard,
    closeTourClosureWizard,
    restoreTourMockBeforeOpenStep,
    runTourPrepareCommercialCounterproposal,
    restoreTourMockBeforeCommercialCounterproposalStep,
    snapshotTourMockBeforeCommercialAcceptanceStep,
    restoreTourMockBeforeCommercialAcceptanceStep,
    runTourMarkCadQuotationReadyToCloseStep,
    runTourPrepareBuyerReadyToCloseStep,
    runTourCompleteBuyerClosureCounterStep,
    runTourResetCartForAddProductStep,
    runTourSnapshotBuyerBeforeSubmitStep,
    runTourRestoreBuyerBeforeSubmitStep,
    activeStepSelector,
    navigationDirection,
}: BuildQuotazioniDetailsStepActionsParams & {
    isTourOpen: boolean;
    stepIndex: number;
}): void {
    if (!isTourOpen) {
        /**
         * Importante:
         * fuori dal tour NON dobbiamo forzare la chiusura dei pannelli business
         * (cliente/filtri/search/pannello prodotto), altrimenti l'utente può vedere
         * aperture "flash" seguite da chiusura immediata su normali interazioni.
         *
         * In questo ramo resettiamo solo i flag UI specifici del tour.
         */
        if (typeof setTourProductPanelLock === "function") {
            setTourProductPanelLock(false);
        }
        if (typeof setTourProductSheetCloseDisabled === "function") {
            setTourProductSheetCloseDisabled(false);
        }
        if (typeof setTourProductSheetMode === "function") {
            setTourProductSheetMode("close");
        }
        if (typeof setTourProductSecondaryPanelMode === "function") {
            setTourProductSecondaryPanelMode("close");
        }
        if (typeof setTourProductSubstitutionPanelMode === "function") {
            setTourProductSubstitutionPanelMode("close");
        }
        if (typeof setTourSubstitutionCloseDisabled === "function") {
            setTourSubstitutionCloseDisabled(false);
        }
        if (typeof setTourSubstitutionSearchPanelLock === "function") {
            setTourSubstitutionSearchPanelLock(false);
        }
        if (typeof setTourSubstitutionProposalsBoxLock === "function") {
            setTourSubstitutionProposalsBoxLock(false);
        }
        if (typeof setTourSubstitutionProposalPanelLock === "function") {
            setTourSubstitutionProposalPanelLock(false);
        }
        return;
    }

    const actions = buildQuotazioniDetailsStepActions({
        role,
        setOpenFilters,
        setOpenSearch,
        setOpenCustomersDetails,
        setOpenProductQtsSettings,
        getFirstCartProductForTour,
        setTourProductPanelLock,
        setTourProductSheetCloseDisabled,
        setTourProductSheetMode,
        setTourProductSecondaryPanelMode,
        setTourProductSubstitutionPanelMode,
        setTourSubstitutionCloseDisabled,
        runTourSubstitutionSeedSearch,
        runTourSubstitutionResetSelection,
        setTourSubstitutionSearchPanelLock,
        setTourSubstitutionProposalsBoxLock,
        setTourSubstitutionProposalPanelLock,
        openTourClosureWizard,
        closeTourClosureWizard,
    });

    /**
     * Seed robusto della ricerca sostituzione buyer.
     *
     * Perché:
     * - in alcuni casi il pannello ricerca prodotto viene montato dopo l'ingresso step;
     * - un solo trigger immediato può non bastare e la lista risulta vuota.
     *
     * Strategia:
     * - trigger immediato + due retry brevi;
     * - comportamento idempotente, confinato al tour.
     */
    const runRobustSubstitutionSeedSearch = () => {
        if (typeof runTourSubstitutionSeedSearch !== "function") return;

        // Seed immediato all'ingresso step.
        runTourSubstitutionSeedSearch();

        // Retry breve: copre mount asincroni del pannello.
        setTimeout(() => {
            runTourSubstitutionSeedSearch();
        }, 120);

        // Retry finale: copre render lenti/macchine più cariche.
        setTimeout(() => {
            runTourSubstitutionSeedSearch();
        }, 260);
    };

    /**
     * Backward tab-sync CAD #1:
     * quando torniamo indietro da "Lista Prodotti" allo step
     * "Apri la quotazione" dobbiamo rimettere visibile la tab "Descrivi la necessità".
     */
    if (
        activeStepSelector === '[data-tour="quotazioni-necessita-quot"]' &&
        navigationDirection === "backward" &&
        typeof setDetailsScope === "function"
    ) {
        // Porta la UI sulla tab "Descrivi la necessità" (scenario pre-lista prodotti).
        setDetailsScope("descrivi_necessita");
        // Evitiamo pannelli residui che possono coprire CTA nella tab necessità.
        setOpenSearch(false);
        setOpenFilters(false);
    }

    /**
     * Backward tab-sync CAD #2:
     * quando torniamo indietro da "Quotazione Prodotti" allo step
     * "Aggiungi prodotto" dobbiamo riportare la UI su "Lista Prodotti".
     */
    if (
        activeStepSelector === '[data-tour="quotazioni-add-product"]' &&
        navigationDirection === "backward" &&
        typeof setDetailsScope === "function"
    ) {
        // Reset esplicito del carrello fake: lo step torna allo stato iniziale (vuoto).
        if (typeof runTourResetCartForAddProductStep === "function") {
            runTourResetCartForAddProductStep();
        }
        // Ripristina tab "Lista Prodotti" per rendere nuovamente visibile il carrello di aggiunta.
        setDetailsScope("prodotti");
        // Chiudiamo eventuale pannello prodotto rimasto aperto dalla tab quotazioni.
        if (typeof setOpenProductQtsSettings === "function") {
            setOpenProductQtsSettings(null);
        }
    }

    /**
     * Base UI del blocco prodotto per ogni step:
     * poi la singola action può sovrascrivere lock/X/modalità quando serve.
     */
    if (typeof setTourProductPanelLock === "function") {
        setTourProductPanelLock(false);
    }
    if (typeof setTourProductSheetCloseDisabled === "function") {
        setTourProductSheetCloseDisabled(false);
    }
    if (typeof setTourProductSheetMode === "function") {
        setTourProductSheetMode("close");
    }
    if (typeof setTourProductSecondaryPanelMode === "function") {
        setTourProductSecondaryPanelMode("close");
    }
    if (typeof setTourProductSubstitutionPanelMode === "function") {
        setTourProductSubstitutionPanelMode("close");
    }
    if (typeof setTourSubstitutionCloseDisabled === "function") {
        setTourSubstitutionCloseDisabled(false);
    }
    if (typeof setTourSubstitutionSearchPanelLock === "function") {
        setTourSubstitutionSearchPanelLock(false);
    }
    if (typeof setTourSubstitutionProposalsBoxLock === "function") {
        setTourSubstitutionProposalsBoxLock(false);
    }
    if (typeof setTourSubstitutionProposalPanelLock === "function") {
        setTourSubstitutionProposalPanelLock(false);
    }

    const action = actions[stepIndex];
    if (typeof action === "function") {
        action(stepIndex);
    }

    /**
     * Backward guard sullo step "Richiedi quotazione":
     * nel tour fake rimontiamo carrello + stato BOZZA per rendere lo step ripetibile.
     */
    if (
        activeStepSelector === '[data-tour="quotazioni-open"]' &&
        navigationDirection === "backward" &&
        typeof restoreTourMockBeforeOpenStep === "function"
    ) {
        restoreTourMockBeforeOpenStep();
    }

    /**
     * Step CAD "Stato quotazione":
     * in questo punto vogliamo SEMPRE vedere la riga fake nello stato
     * pre-controproposta ("In attesa di valutazione").
     * Così il cambio a "Controproposta inviata" avviene solo nello step successivo.
     */
    if (
        activeStepSelector === '[data-tour="quotazioni-details-status"]' &&
        typeof restoreTourMockBeforeCommercialCounterproposalStep === "function"
    ) {
        restoreTourMockBeforeCommercialCounterproposalStep();
    }

    /**
     * Step CAD "Ricezione controproposta dal buyer":
     * qui attiviamo lo scenario demo che mostra:
     * - pill stato riga = CONTROPROPOSTA_INVIATA
     * - badge "1 controproposta" cliccabile.
     *
     * Nota:
     * su navigazione backward lo stato è già coerente (arriviamo dal click badge),
     * quindi evitiamo mutation ridondanti.
     */
    if (
        activeStepSelector === '[data-tour="quotazioni-product-label"]' &&
        navigationDirection !== "backward" &&
        typeof runTourPrepareCommercialCounterproposal === "function"
    ) {
        runTourPrepareCommercialCounterproposal();
    }

    /**
     * Step CAD "Accetta la proposta":
     * - in ingresso salviamo uno snapshot pre-accettazione;
     * - su navigazione backward ripristiniamo lo stato precedente.
     */
    if (
        activeStepSelector === '[data-tour="quotazioni-product-accetta"]' &&
        navigationDirection !== "backward" &&
        typeof snapshotTourMockBeforeCommercialAcceptanceStep === "function"
    ) {
        snapshotTourMockBeforeCommercialAcceptanceStep();
    }
    if (
        activeStepSelector === '[data-tour="quotazioni-product-accetta"]' &&
        navigationDirection === "backward" &&
        typeof restoreTourMockBeforeCommercialAcceptanceStep === "function"
    ) {
        restoreTourMockBeforeCommercialAcceptanceStep();
    }

    /**
     * Step Buyer "Quotazione pronta da chiudere":
     * qui la fake quotazione passa in stato "DA_CHIUDERE" (non ancora conclusa).
     */
    if (
        (role === "Commerciale" || role === "Admin" || role === "Dev") &&
        activeStepSelector === '[data-tour="quotazioni-chiudi-quotazione"]' &&
        typeof runTourMarkCadQuotationReadyToCloseStep === "function"
    ) {
        runTourMarkCadQuotationReadyToCloseStep();
    }

    /**
     * Step Buyer "Quotazione pronta da chiudere":
     * qui la fake quotazione passa in stato "DA_CHIUDERE" (non ancora conclusa).
     */
    if (
        role === "Buyer" &&
        activeStepSelector === '[data-tour="quotazioni-chiudi-quotazione"]' &&
        typeof runTourPrepareBuyerReadyToCloseStep === "function"
    ) {
        runTourPrepareBuyerReadyToCloseStep();
    }

    /**
     * Step finali "quotazione chiusa" (CAD + Buyer):
     * - Buyer: `quotazioni-close-counter`
     * - CAD:   `quotazioni-end`
     *
     * Regola:
     * entrando (anche tornando indietro) su questi step la fake quotazione
     * deve risultare SEMPRE in stato `OK` con progress 100%.
     *
     * Usiamo una callback idempotente runtime tour-only:
     * - riallinea testata/carrello allo stato finale;
     * - mantiene anche la fase lista `closed_ok` per lo step successivo in index.
     */
    const isFinalClosedStep =
        activeStepSelector === '[data-tour="quotazioni-close-counter"]' ||
        activeStepSelector === '[data-tour="quotazioni-end"]';
    if (
        isFinalClosedStep &&
        typeof runTourCompleteBuyerClosureCounterStep === "function"
    ) {
        runTourCompleteBuyerClosureCounterStep();
    }

    /**
     * Step Buyer "Invia proposta al commerciale":
     * - forward: salviamo snapshot pre-invio (stato originale dello step);
     * - backward: ripristiniamo snapshot per rendere il click nuovamente ripetibile.
     */
    if (
        role === "Buyer" &&
        activeStepSelector === '[data-tour="quotazioni-product-sost-submit"]' &&
        navigationDirection !== "backward" &&
        typeof runTourSnapshotBuyerBeforeSubmitStep === "function"
    ) {
        runTourSnapshotBuyerBeforeSubmitStep();
    }
    if (
        role === "Buyer" &&
        activeStepSelector === '[data-tour="quotazioni-product-sost-submit"]' &&
        navigationDirection === "backward" &&
        typeof runTourRestoreBuyerBeforeSubmitStep === "function"
    ) {
        runTourRestoreBuyerBeforeSubmitStep();
    }

    /**
     * Regia tour del wizard "Chiusura quotazione":
     * - step bottone "Apri chiusura" => wizard chiuso (si vede il banner/CTA);
     * - step pannello chiusura => wizard aperto.
     *
     * In questo modo avanti/indietro resta coerente senza toccare la logica business.
     */
    if (
        activeStepSelector === '[data-tour="quotazioni-product-apri-chiudi"]' &&
        typeof closeTourClosureWizard === "function"
    ) {
        closeTourClosureWizard();
    }
    if (
        (activeStepSelector === '[data-tour="quotazioni-chiusura"]' ||
            activeStepSelector === '[data-tour="quotazioni-chiusura-close"]' ||
            activeStepSelector === '[data-tour="quotazioni-chiusura-select"]' ||
            activeStepSelector === '[data-tour="quotazioni-chiusura-OK"]' ||
            activeStepSelector === '[data-tour="quotazioni-chiusura-OK-avanti"]' ||
            activeStepSelector === '[data-tour="quotazioni-chiusura-OK-OC-FB"]' ||
            activeStepSelector === '[data-tour="quotazioni-chiusura-OK-conferma"]') &&
        typeof openTourClosureWizard === "function"
    ) {
        openTourClosureWizard();
    }

    /**
     * Regia selector-driven (stabile ai riordini degli indici):
     * - step sostituzione buyer: apriamo automaticamente pannello avanzato + ricerca
     * - step pulsanti/storico: richiudiamo i pannelli secondari per evitare incoerenze
     */
    if (activeStepSelector === '[data-tour="quotazioni-product-sost-2"]') {
        if (typeof setTourProductSecondaryPanelMode === "function") {
            setTourProductSecondaryPanelMode("open");
        }
        if (typeof setTourProductSubstitutionPanelMode === "function") {
            setTourProductSubstitutionPanelMode("open");
        }
        /**
         * Seed ricerca sostituzione robusto:
         * garantisce che il prodotto demo resti visibile anche con mount differiti.
         */
        runRobustSubstitutionSeedSearch();
        if (typeof setTourSubstitutionCloseDisabled === "function") {
            setTourSubstitutionCloseDisabled(true);
        }
        if (typeof setTourSubstitutionSearchPanelLock === "function") {
            // Step 43 Buyer: lock interaction di tutto il pannello ricerca prodotto.
            setTourSubstitutionSearchPanelLock(true);
        }
    }

    if (
        activeStepSelector === '[data-tour="quotazioni-product-sost"]' ||
        activeStepSelector === '[data-tour="quotazioni-product-stori"]'
    ) {
        if (typeof setTourProductSubstitutionPanelMode === "function") {
            setTourProductSubstitutionPanelMode("close");
        }
        if (typeof setTourProductSecondaryPanelMode === "function") {
            setTourProductSecondaryPanelMode("close");
        }
    }


    /**
     * Step CAD `quotazioni-AS-panel` nel dettaglio:
     * precompiliamo la ricerca con il prodotto demo per mostrare subito
     * la card risultato (icona carrello visibile).
     *
     * Nota importante:
     * - questa action vive solo nella regia dettaglio, quindi non tocca la lista principale;
     * - la callback runtime ha guard aggiuntivi su route mock + ruolo CAD.
     */
    const isCadRole = role === "Commerciale" || role === "Admin" || role === "Dev";
    const isCadAsSearchStep =
        activeStepSelector === '[data-tour="quotazioni-AS-panel"]' ||
        activeStepSelector === '[data-tour="quotazioni-AS-active"]' ||
        activeStepSelector === '[data-tour="quotazioni-AS-close"]';

    if (
        isCadRole &&
        isCadAsSearchStep &&
        typeof runTourCadAsPanelSeedSearch === "function"
    ) {
        /**
         * In questo step vogliamo la "ricerca mirata" vera e propria:
         * impostiamo quindi `openSearch` in modalità target (`from: "quotazioni"`),
         * così la UI mostra anche la meta-action con icona carrello.
         *
         * Nota:
         * - questa forzatura è solo tour-driven e solo per ruoli CAD;
         * - non impatta i flussi standard fuori tour.
         */
        setOpenSearch({ from: "quotazioni", bool: true });
        /**
         * Seed query: lo rilanciamo solo nello step "AS-panel" in ingresso forward.
         * Negli step successivi manteniamo la modalità/risultati senza ri-triggerare
         * ricerca ad ogni render.
         */
        if (
            activeStepSelector === '[data-tour="quotazioni-AS-panel"]' &&
            navigationDirection !== "none"
        ) {
            runTourCadAsPanelSeedSearch();
        }
    }

    /**
     * Durante lo step selezione teniamo bloccata la chiusura manuale:
     * l'utente deve prima scegliere il prodotto demo.
     */
    if (activeStepSelector === '[data-tour="quotazioni-product-sost-fixed-item"]') {
        /**
         * Se l'utente torna INDIETRO su questo step dopo aver selezionato il prodotto,
         * ripuliamo la selezione per riportare la UI allo stato "pre-selezione".
         * Così il tour resta coerente e lo step è ripetibile senza attriti.
         */
        if (
            navigationDirection === "backward" &&
            typeof runTourSubstitutionResetSelection === "function"
        ) {
            runTourSubstitutionResetSelection();
        }

        if (typeof setTourProductSecondaryPanelMode === "function") {
            setTourProductSecondaryPanelMode("open");
        }
        if (typeof setTourProductSubstitutionPanelMode === "function") {
            setTourProductSubstitutionPanelMode("open");
        }
        if (typeof setTourSubstitutionCloseDisabled === "function") {
            setTourSubstitutionCloseDisabled(true);
        }
        if (typeof setTourSubstitutionSearchPanelLock === "function") {
            // Step selezione prodotto: riabilitiamo il pannello per permettere il click sul prodotto demo.
            setTourSubstitutionSearchPanelLock(false);
        }
    }

    /**
     * Step dedicato alla chiusura pannello ricerca:
     * abilitiamo esplicitamente il pulsante "Chiudi ricerca".
     */
    if (activeStepSelector === '[data-tour="quotazioni-product-sost-close"]') {
        if (typeof setTourProductSecondaryPanelMode === "function") {
            setTourProductSecondaryPanelMode("open");
        }
        if (typeof setTourProductSubstitutionPanelMode === "function") {
            setTourProductSubstitutionPanelMode("open");
        }
        if (typeof setTourSubstitutionCloseDisabled === "function") {
            // In questo step il click su "Chiudi ricerca" è l'azione guidata da sbloccare.
            setTourSubstitutionCloseDisabled(false);
        }
        if (typeof setTourSubstitutionSearchPanelLock === "function") {
            setTourSubstitutionSearchPanelLock(false);
        }
    }

    /**
     * Dopo la chiusura ricerca manteniamo aperto "Dettagli avanzati / storico"
     * per mostrare la sezione "Prodotti inseriti nella proposta".
     */
    if (activeStepSelector === '[data-tour="quotazioni-product-sost-proposals"]') {
        if (typeof setTourProductSecondaryPanelMode === "function") {
            setTourProductSecondaryPanelMode("open");
        }
        if (typeof setTourProductSubstitutionPanelMode === "function") {
            setTourProductSubstitutionPanelMode("close");
        }
        if (typeof setTourSubstitutionCloseDisabled === "function") {
            setTourSubstitutionCloseDisabled(false);
        }
        if (typeof setTourSubstitutionProposalsBoxLock === "function") {
            // Buyer: blocchiamo interazioni nel box "Prodotti inseriti nella proposta".
            setTourSubstitutionProposalsBoxLock(true);
        }
    }

    /**
     * Step di ritorno nel box "Proposta di sostituzione" e invio:
     * questo blocco vive nel pannello principale "Quotazione prodotto",
     * quindi richiudiamo il pannello avanzato prima di guidare l'utente.
     */
    if (
        activeStepSelector === '[data-tour="quotazioni-product-sost-proposal"]' ||
        activeStepSelector === '[data-tour="quotazioni-product-sost-submit"]'
    ) {
        if (typeof setTourProductSecondaryPanelMode === "function") {
            setTourProductSecondaryPanelMode("close");
        }
        if (typeof setTourProductSubstitutionPanelMode === "function") {
            setTourProductSubstitutionPanelMode("close");
        }
        if (typeof setTourSubstitutionCloseDisabled === "function") {
            setTourSubstitutionCloseDisabled(false);
        }
        if (typeof setTourSubstitutionProposalPanelLock === "function") {
            // Step 47 Buyer: lock del pannello "Proposta di sostituzione".
            setTourSubstitutionProposalPanelLock(
                activeStepSelector === '[data-tour="quotazioni-product-sost-proposal"]',
            );
        }
    }
}

// --------------------------------------------------
// SIDE PANEL UI ORCHESTRATION (COMPONENT-LEVEL)
// --------------------------------------------------
/**
 * Applica in modo centralizzato la regia dei pannelli secondari del blocco prodotto
 * durante il tour quotazioni.
 *
 * - evita duplicazione di `useEffect` nei componenti UI;
 * - tiene la logica tour-driven nella cartella `tour/`;
 * - riduce il rumore nel file `productsDetails.tsx`.
 */
export function applyTourProductPanelsOrchestration(params: {
    secondaryMode: "keep" | "open" | "close";
    substitutionMode: "keep" | "open" | "close";
    setSecondaryOpen: Dispatch<SetStateAction<boolean>>;
    setSubstitutionOpen: Dispatch<SetStateAction<boolean>>;
}): void {
    const {
        secondaryMode,
        substitutionMode,
        setSecondaryOpen,
        setSubstitutionOpen,
    } = params;

    /**
     * Regia pannello "Dettagli avanzati / storico".
     */
    if (secondaryMode !== "keep") {
        if (secondaryMode === "open") {
            setSecondaryOpen(true);
        } else {
            // In close chiudiamo anche l'eventuale colonna sostituzione.
            setSecondaryOpen(false);
            setSubstitutionOpen(false);
        }
    }

    /**
     * Regia pannello "Proponi prodotto in sostituzione".
     */
    if (substitutionMode !== "keep") {
        if (substitutionMode === "open") {
            // La sostituzione vive nel pannello secondario: lo apriamo sempre.
            setSecondaryOpen(true);
            setSubstitutionOpen(true);
        } else {
            // Chiudiamo solo la colonna ricerca sostituzione.
            setSubstitutionOpen(false);
        }
    }
}
