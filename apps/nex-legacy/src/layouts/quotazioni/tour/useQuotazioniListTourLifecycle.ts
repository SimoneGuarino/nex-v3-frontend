import { useCallback, useEffect, useRef } from "react";
import { shouldIgnoreTourListFiltersClose, type TourContextMenuCloseReason } from "./runtime";
import { useTour } from "tour/TourProvider";

type UseQuotazioniListTourLifecycleParams = {
    isTourOpen: boolean;
    items: any[];
    injectMockQuotation: () => void;
    removeMockQuotation: () => void;
};

/**
 * Runtime lifecycle tour della pagina LISTA quotazioni.
 *
 * Responsabilità:
 * - iniezione/rimozione della riga fake all'apertura/chiusura tour;
 * - safety-net idempotente quando la lista viene ricaricata durante tour aperto;
 * - guardia centralizzata per la chiusura del menu filtri nello step lockato.
 */
export function useQuotazioniListTourLifecycle({
    isTourOpen,
    items,
    injectMockQuotation,
    removeMockQuotation,
}: UseQuotazioniListTourLifecycleParams): {
    shouldIgnoreListContextMenuClose: (reason?: TourContextMenuCloseReason) => boolean;
} {
    const { activeStepSelector } = useTour();
    const wasTourOpenRef = useRef<boolean>(false);

    useEffect(() => {
        const wasOpen = wasTourOpenRef.current;

        /**
         * Primo ingresso tour: garantiamo presenza riga fake in tabella.
         */
        if (isTourOpen && !wasOpen) {
            injectMockQuotation();
        }

        /**
         * Uscita tour: cleanup completo della riga fake.
         */
        if (!isTourOpen && wasOpen) {
            removeMockQuotation();
        }

        wasTourOpenRef.current = isTourOpen;
    }, [isTourOpen, injectMockQuotation, removeMockQuotation]);

    useEffect(() => {
        /**
         * Safety-net durante tour aperto:
         * se la lista viene ricaricata e la riga fake sparisce dal payload BE,
         * la reinseriamo in modo idempotente (nessun re-render se già allineata).
         */
        if (!isTourOpen) return;
        injectMockQuotation();
    }, [isTourOpen, items, injectMockQuotation]);

    const shouldIgnoreListContextMenuClose = useCallback((reason?: TourContextMenuCloseReason) => {
        return shouldIgnoreTourListFiltersClose({
            isTourOpen,
            activeStepSelector,
            reason,
        });
    }, [isTourOpen, activeStepSelector]);

    return {
        shouldIgnoreListContextMenuClose,
    };
}
