import { useEffect, useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { Role } from "tour/types";
import { applyQuotazioniDetailsStepAction } from "./actions";
import { computeTourStepNavigationDirection } from "./runtime";

type SetBoolean = Dispatch<SetStateAction<boolean>>;
type SetDetailsSearch = Dispatch<
    SetStateAction<
        boolean | { from: "quotazioni" | "prodotti" | "descrivi_necessita" | "propose_qts_products"; bool: boolean }
    >
>;

type UseQuotazioniDetailsTourRuntimeParams = {
    isTourOpen: boolean;
    tourIndex: number;
    activeStepSelector?: string;
    role: Role;
    setOpenFilters: SetBoolean;
    setOpenSearch: SetDetailsSearch;
    setOpenCustomersDetails: SetBoolean;
    setDetailsScope?: (next: "descrivi_necessita" | "prodotti" | "quotazioni") => void;
    setOpenProductQtsSettings?: Dispatch<SetStateAction<any | null>>;
    getFirstCartProductForTour?: () => any | null;
    setTourProductPanelLock?: SetBoolean;
    setTourProductSheetCloseDisabled?: SetBoolean;
    setTourProductSheetMode?: Dispatch<SetStateAction<"keep" | "open" | "close">>;
    setTourProductSecondaryPanelMode?: Dispatch<SetStateAction<"keep" | "open" | "close">>;
    setTourProductSubstitutionPanelMode?: Dispatch<SetStateAction<"keep" | "open" | "close">>;
    setTourSubstitutionCloseDisabled?: SetBoolean;
    runTourSubstitutionSeedSearch?: () => void;
    runTourCadAsPanelSeedSearch?: () => void;
    runTourSubstitutionResetSelection?: () => void;
    setTourSubstitutionSearchPanelLock?: SetBoolean;
    setTourSubstitutionProposalsBoxLock?: SetBoolean;
    setTourSubstitutionProposalPanelLock?: SetBoolean;
    openTourClosureWizard?: () => void;
    closeTourClosureWizard?: () => void;
    restoreTourMockBeforeOpenStep?: () => void;
    runTourPrepareCommercialCounterproposal?: () => void;
    restoreTourMockBeforeCommercialCounterproposalStep?: () => void;
    snapshotTourMockBeforeCommercialAcceptanceStep?: () => void;
    restoreTourMockBeforeCommercialAcceptanceStep?: () => void;
    runTourMarkCadQuotationReadyToCloseStep?: () => void;
    runTourPrepareBuyerReadyToCloseStep?: () => void;
    runTourCompleteBuyerClosureCounterStep?: () => void;
    runTourResetCartForAddProductStep?: () => void;
    runTourSnapshotBuyerBeforeSubmitStep?: () => void;
    runTourRestoreBuyerBeforeSubmitStep?: () => void;
};

/**
 * Runtime tour centralizzato per la pagina dettaglio quotazione.
 *
 * Nota performance:
 * - l'effetto principale reagisce solo ai trigger reali del tour (open/index/selector/role);
 * - callback/setter pagina sono letti da ref "latest" per evitare riesecuzioni continue
 *   dovute a identity-changes dei callback React.
 */
export function useQuotazioniDetailsTourRuntime(params: UseQuotazioniDetailsTourRuntimeParams): void {
    const {
        isTourOpen,
        tourIndex,
        activeStepSelector,
        role,
    } = params;

    const previousTourIndexRef = useRef<number>(tourIndex);
    const latestParamsRef = useRef<UseQuotazioniDetailsTourRuntimeParams>(params);
    const lastAppliedStepKeyRef = useRef<string>("");

    /**
     * Manteniamo sempre allineata la reference dei callback/setter più recenti.
     * Questo permette all'effetto tour di usare valori aggiornati senza dipendere
     * da ogni singola funzione nel dependency array.
     */
    latestParamsRef.current = params;

    useEffect(() => {
        const previousTourIndex = previousTourIndexRef.current;
        const navigationDirection = computeTourStepNavigationDirection({
            isTourOpen,
            currentStepIndex: tourIndex,
            previousStepIndex: previousTourIndex,
        });

        // Aggiorniamo subito il ref per il prossimo delta.
        previousTourIndexRef.current = tourIndex;

        /**
         * Guardia anti-duplicazione:
         * in alcuni cicli (mount/ri-mount, render rapidi) la stessa combinazione
         * di step può essere processata più volte in sequenza, generando rimbalzi UI.
         *
         * Con questa chiave applichiamo la regia una sola volta per transizione.
         */
        const applyKey = [
            isTourOpen ? "open" : "closed",
            String(tourIndex),
            String(activeStepSelector ?? ""),
            navigationDirection,
            String(role),
        ].join("|");

        if (applyKey === lastAppliedStepKeyRef.current) {
            return;
        }
        lastAppliedStepKeyRef.current = applyKey;

        // Quando il tour è chiuso, resettiamo la chiave per il prossimo avvio.
        if (!isTourOpen) {
            lastAppliedStepKeyRef.current = "";
        }

        const latest = latestParamsRef.current;
        applyQuotazioniDetailsStepAction({
            role,
            isTourOpen,
            stepIndex: tourIndex,
            setOpenFilters: latest.setOpenFilters,
            setOpenSearch: latest.setOpenSearch,
            setOpenCustomersDetails: latest.setOpenCustomersDetails,
            setDetailsScope: latest.setDetailsScope,
            setOpenProductQtsSettings: latest.setOpenProductQtsSettings,
            getFirstCartProductForTour: latest.getFirstCartProductForTour,
            setTourProductPanelLock: latest.setTourProductPanelLock,
            setTourProductSheetCloseDisabled: latest.setTourProductSheetCloseDisabled,
            setTourProductSheetMode: latest.setTourProductSheetMode,
            setTourProductSecondaryPanelMode: latest.setTourProductSecondaryPanelMode,
            setTourProductSubstitutionPanelMode: latest.setTourProductSubstitutionPanelMode,
            setTourSubstitutionCloseDisabled: latest.setTourSubstitutionCloseDisabled,
            runTourSubstitutionSeedSearch: latest.runTourSubstitutionSeedSearch,
            runTourCadAsPanelSeedSearch: latest.runTourCadAsPanelSeedSearch,
            runTourSubstitutionResetSelection: latest.runTourSubstitutionResetSelection,
            setTourSubstitutionSearchPanelLock: latest.setTourSubstitutionSearchPanelLock,
            setTourSubstitutionProposalsBoxLock: latest.setTourSubstitutionProposalsBoxLock,
            setTourSubstitutionProposalPanelLock: latest.setTourSubstitutionProposalPanelLock,
            openTourClosureWizard: latest.openTourClosureWizard,
            closeTourClosureWizard: latest.closeTourClosureWizard,
            restoreTourMockBeforeOpenStep: latest.restoreTourMockBeforeOpenStep,
            runTourPrepareCommercialCounterproposal: latest.runTourPrepareCommercialCounterproposal,
            restoreTourMockBeforeCommercialCounterproposalStep: latest.restoreTourMockBeforeCommercialCounterproposalStep,
            snapshotTourMockBeforeCommercialAcceptanceStep: latest.snapshotTourMockBeforeCommercialAcceptanceStep,
            restoreTourMockBeforeCommercialAcceptanceStep: latest.restoreTourMockBeforeCommercialAcceptanceStep,
            runTourMarkCadQuotationReadyToCloseStep: latest.runTourMarkCadQuotationReadyToCloseStep,
            runTourPrepareBuyerReadyToCloseStep: latest.runTourPrepareBuyerReadyToCloseStep,
            runTourCompleteBuyerClosureCounterStep: latest.runTourCompleteBuyerClosureCounterStep,
            runTourResetCartForAddProductStep: latest.runTourResetCartForAddProductStep,
            runTourSnapshotBuyerBeforeSubmitStep: latest.runTourSnapshotBuyerBeforeSubmitStep,
            runTourRestoreBuyerBeforeSubmitStep: latest.runTourRestoreBuyerBeforeSubmitStep,
            activeStepSelector,
            navigationDirection,
        });
    }, [isTourOpen, tourIndex, activeStepSelector, role]);
}
