import type {
    CustomerFullPayload,
    LoadingSection,
    SectionFetchState,
} from "../types";

type ApplyTourMockPayloadParams = {
    payload: CustomerFullPayload;
    setLoading: (value: boolean) => void;
    setHasErr: (value: boolean) => void;
    resetDataState: () => void;
    setPanelData: (updater: any) => void;
    setSectionFetchState: (section: LoadingSection, state: SectionFetchState) => void;
};

/**
 * Applica in modo centralizzato il ramo "tour mock" del CustomersPanel.
 *
 * Perché esiste:
 * - evita di appesantire `useCustomersPanelController` con logica tour-specifica;
 * - mantiene isolata la logica che NON appartiene al flusso API reale;
 * - rende più semplice modificare il comportamento tour in un solo punto.
 */
export function applyCustomersPanelTourMockPayload({
    payload,
    setLoading,
    setHasErr,
    resetDataState,
    setPanelData,
    setSectionFetchState,
}: ApplyTourMockPayloadParams): void {
    setLoading(false);
    setHasErr(false);
    resetDataState();
    setPanelData(() => payload);

    /**
     * Regola di visibilità summary:
     * una section viene renderizzata quando il relativo fetch-state è `success`.
     *
     * Nel tour usiamo questa utility per simulare quel risultato in base ai dati
     * realmente presenti nel payload mock.
     */
    const setMockFetchState = (
        section: LoadingSection,
        hasData: boolean,
        fallback: SectionFetchState = "idle",
    ) => {
        setSectionFetchState(section, hasData ? "success" : fallback);
    };

    setMockFetchState("anagrafica", Boolean(payload.anagrafica));
    setMockFetchState("credits", Boolean(payload.creditsProfile));
    setMockFetchState("creditsYears", Boolean(payload.creditsYears));
    setMockFetchState("backorders", Boolean(payload.backordersSummary || payload.backordersDetails));
    setMockFetchState("payments", Boolean(payload.paymentsDetails));

    // Section opzionali: visibili solo se valorizzate nel payload mock.
    setMockFetchState("statement", Boolean(payload.statement));
    setMockFetchState("profilazione", Boolean(payload.profilazioneReport));
    setMockFetchState("trackings", Boolean(payload.trackingDetails));
    setMockFetchState("sconti", Boolean(payload.sconti));
    setMockFetchState("quotes", Boolean(payload.quotesSummary));
    setMockFetchState("purchases", Boolean(payload.purchasesSummary));
    setMockFetchState("notes", false);
}

