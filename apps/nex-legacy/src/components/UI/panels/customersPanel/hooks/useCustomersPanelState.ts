/**
 * descrizione: Stato base del CustomersPanel (summary + details).
 * compito:     centralizza loading/error, payload section e apertura pannello secondario.
 */
import React from "react";
import type {
    CustomerFullPayload,
    DetailsSection,
    LoadingSection,
    LoadingStates,
    SectionFetchState,
    SectionFetchStates,
} from "../types";

// Stato loading per singola section.
// Le chiavi devono restare allineate con `LoadingSection` in `types.ts`.
export function createEmptyLoadingStates(): LoadingStates {
    return {
        anagrafica: false,
        credits: false,
        creditsYears: false,
        statement: false,
        backorders: false,
        payments: false,
        // loading dedicato al mini-box preventivi nel pannello cliente
        quotes: false,
        // loading dedicato al mini-box acquisti nel pannello cliente
        purchases: false,
        profilazione: false,
        trackings: false,
        notes: false,
        sconti: false,
    };
}

// Shape dati unico del pannello, condiviso tra summary e details.
function createEmptyData(): CustomerFullPayload {
    return {
        anagrafica: null,
        creditsProfile: null,
        creditsYears: null,
        backordersSummary: null,
        backordersDetails: null,
        paymentsDetails: null,
        // preview preventivi separata dai dettagli completi della pagina /preventivi
        quotesSummary: null,
        // preview acquisti separata dalla pagina completa /contabilita/dati-acquistato-clienti
        purchasesSummary: null,
        profilazioneReport: null,
        trackingDetails: null,
        sconti: null,
        statement: null,
        // warnings: [], @deprecated
    };
}

// Stato di fetch per singola section: abilita policy di rendering robuste
// (es. mostra card solo se `success`).
function createEmptySectionFetchStates(): SectionFetchStates {
    return {
        anagrafica: "idle",
        credits: "idle",
        creditsYears: "idle",
        statement: "idle",
        backorders: "idle",
        payments: "idle",
        quotes: "idle",
        purchases: "idle",
        profilazione: "idle",
        trackings: "idle",
        notes: "idle",
        sconti: "idle",
    };
}

export function useCustomersPanelState() {
    /** Loading globale del panel cliente (fase bootstrap fetch iniziale). */
    const [loading, setLoading] = React.useState(false);
    /** Flag errore globale: indica failure del caricamento principale dati cliente. */
    const [hasErr, setHasErr] = React.useState(false);
    /** Loading granulare per singola section (summary/details). */
    const [loadingStates, setLoadingStates] = React.useState<LoadingStates>(() => createEmptyLoadingStates());
    /** Esito fetch per section: `idle/success/error` usato per policy di rendering robuste. */
    const [sectionFetchStates, setSectionFetchStates] = React.useState<SectionFetchStates>(() => createEmptySectionFetchStates());
    /** Payload dati centralizzato condiviso tra tutte le section del panel. */
    const [data, setData] = React.useState<CustomerFullPayload>(() => createEmptyData());

    /** Apertura pannello secondario (details). */
    const [secondaryOpen, setSecondaryOpen] = React.useState(false);
    /** Section attiva nel pannello secondario. */
    const [activeSection, setActiveSection] = React.useState<DetailsSection>("anagrafica");

    // Apertura pannello secondario su section specifica.
    const openDetails = React.useCallback((section: DetailsSection) => {
        setActiveSection(section);
        setSecondaryOpen(true);
    }, []);

    // Chiude solo il pannello secondario, preservando il pannello principale.
    const closeSecondary = React.useCallback(() => {
        setSecondaryOpen(false);
    }, []);

    const setPanelData = React.useCallback((updater: any) => {
        setData((prev) => (typeof updater === "function" ? updater(prev) : updater));
    }, []);

    const setSectionLoading = React.useCallback((section: LoadingSection, isLoading: boolean) => {
        setLoadingStates((prev) => ({ ...prev, [section]: isLoading }));
    }, []);

    const setSectionFetchState = React.useCallback((section: LoadingSection, fetchState: SectionFetchState) => {
        setSectionFetchStates((prev) => ({ ...prev, [section]: fetchState }));
    }, []);

    // Reset completo all'apertura cliente: elimina dati stale tra clienti diversi.
    const resetDataState = React.useCallback(() => {
        setHasErr(false);
        setLoadingStates(createEmptyLoadingStates());
        setSectionFetchStates(createEmptySectionFetchStates());
        setData(createEmptyData());
    }, []);

    return {
        loading,
        setLoading,
        hasErr,
        setHasErr,
        loadingStates,
        setSectionLoading,
        sectionFetchStates,
        setSectionFetchState,
        data,
        setPanelData,
        resetDataState,
        secondaryOpen,
        activeSection,
        openDetails,
        closeSecondary,
    };
}
