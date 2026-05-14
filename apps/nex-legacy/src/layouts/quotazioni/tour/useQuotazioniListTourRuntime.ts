import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTour } from "tour/TourProvider";
import {
    applyQuotazioniListCrossPageTourAction,
    applyQuotazioniListOkLinksTourAction,
} from "./actions";
import { TOUR_QUOTATION_ID, buildTourMockOkLinksForViewer } from "./mockQuotation";
import { computeTourStepNavigationDirection } from "./runtime";

/**
 * Runtime tour dedicato alla pagina LISTA quotazioni.
 *
 * Obiettivo:
 * - centralizzare nella cartella `tour/` tutta la regia cross-page della lista;
 * - lasciare `pages/index.tsx` con solo wiring minimo, senza logica tour interna.
 *
 * Regia attuale:
 * - se il tour torna indietro allo step `quotazioni-close-counter` mentre siamo in lista,
 *   navighiamo automaticamente al dettaglio della quotazione fake.
 */
export function useQuotazioniListTourRuntime(params?: {
    setOpenOkLinksPanel?: (open: boolean) => void;
    setOkLinks?: (items: any[]) => void;
    viewerRole?: string | null;
    viewerBuyerCode?: string | null;
    ensureTourMockRowActionsMenuOpen?: () => void;
}): void {
    const tour = useTour();
    const navigate = useNavigate();
    const previousTourIndexRef = useRef<number>(tour.index);
    const setOpenOkLinksPanel = params?.setOpenOkLinksPanel;
    const setOkLinks = params?.setOkLinks;
    const viewerRole = params?.viewerRole;
    const viewerBuyerCode = params?.viewerBuyerCode;
    const ensureTourMockRowActionsMenuOpen = params?.ensureTourMockRowActionsMenuOpen;

    useEffect(() => {
        const previousIndex = previousTourIndexRef.current;
        const navigationDirection = computeTourStepNavigationDirection({
            isTourOpen: tour.isOpen,
            currentStepIndex: tour.index,
            previousStepIndex: previousIndex,
        });

        // Aggiorniamo sempre il ref per il prossimo calcolo della direzione.
        previousTourIndexRef.current = tour.index;

        applyQuotazioniListCrossPageTourAction({
            isTourOpen: tour.isOpen,
            activeStepSelector: tour.activeStepSelector,
            navigationDirection,
            navigateToTourMockDetails: () => {
                navigate(`/quotazioni/${TOUR_QUOTATION_ID}`);
            },
        });

        applyQuotazioniListOkLinksTourAction({
            isTourOpen: tour.isOpen,
            activeStepSelector: tour.activeStepSelector,
            navigationDirection,
            setOpenOkLinksPanel,
            setTourOkLinks: () => {
                /**
                 * Dati tour-only per il pannello "Ordini collegati".
                 *
                 * Qui evitiamo fetch reali con `TOUR_QUOTATION_ID` e passiamo al
                 * pannello lo stesso shape che arriverebbe dal backend a chiusura OK.
                 */
                setOkLinks?.(buildTourMockOkLinksForViewer(viewerRole, viewerBuyerCode));
            },
            clearTourOkLinks: () => {
                // Pulizia gentile: uscendo dagli step finali non lasciamo righe demo appese.
                setOkLinks?.([]);
            },
            ensureTourMockRowActionsMenuOpen,
        });
    }, [
        tour.isOpen,
        tour.index,
        tour.activeStepSelector,
        navigate,
        setOpenOkLinksPanel,
        setOkLinks,
        viewerRole,
        viewerBuyerCode,
        ensureTourMockRowActionsMenuOpen,
    ]);
}
