import React from "react";
import { useTour } from "tour/TourProvider";
import type { CustomersPanelInteractionLockConfig } from "./types";
import { resolveCustomersPanelInteractionLockRule } from "./resolveInteractionLock";

type UseCustomersPanelInteractionLockParams = {
    closeOnBackdrop: boolean;
    closeOnEsc: boolean;
    interactionLockConfig?: CustomersPanelInteractionLockConfig;
};

/**
 * Hook dedicato al lock interazioni della CustomersPanel durante i tour.
 *
 * Perché esiste:
 * - tiene fuori dal componente principale la logica di risoluzione regole tour;
 * - rende il wiring riusabile da eventuali varianti del pannello;
 * - alleggerisce `customersPanel/index.tsx`.
 */
export function useCustomersPanelInteractionLock({
    closeOnBackdrop,
    closeOnEsc,
    interactionLockConfig,
}: UseCustomersPanelInteractionLockParams) {
    /**
     * Leggiamo sia `activeKey` che `activeKeys`:
     * alcuni passaggi del tour possono valorizzare in modo non perfettamente sincrono
     * l'array delle chiavi, quindi passiamo entrambe alla resolver utility.
     */
    const { isOpen: isTourOpen, activeKey, activeKeys, activeStepSelector } = useTour();

    const activeLockRule = React.useMemo(
        () =>
            resolveCustomersPanelInteractionLockRule({
                isTourOpen,
                // Fallback robusto: se `activeKeys` non è pronto, resolver usa `activeKey`.
                activeKey: activeKey as string | undefined,
                activeKeys: activeKeys as string[] | undefined,
                activeStepSelector,
                config: interactionLockConfig,
            }),
        [isTourOpen, activeKey, activeKeys, activeStepSelector, interactionLockConfig],
    );

    // Default intenzionale: quando una regola è attiva blocchiamo tutto,
    // salvo override espliciti definiti nella regola stessa.
    const lockBodyInteractions = Boolean(activeLockRule) && (activeLockRule?.lockBodyInteractions ?? true);
    const disablePrimaryClose = Boolean(activeLockRule) && (activeLockRule?.disablePrimaryClose ?? true);
    const blockBackdropCloseFromTour = Boolean(activeLockRule) && (activeLockRule?.blockBackdropClose ?? true);
    const blockEscCloseFromTour = Boolean(activeLockRule) && (activeLockRule?.blockEscClose ?? true);

    // Compatibilità con API storiche del componente.
    const effectiveCloseOnBackdrop = closeOnBackdrop && !blockBackdropCloseFromTour;
    const effectiveCloseOnEsc = closeOnEsc && !blockEscCloseFromTour;

    return {
        lockBodyInteractions,
        disablePrimaryClose,
        effectiveCloseOnBackdrop,
        effectiveCloseOnEsc,
    };
}
