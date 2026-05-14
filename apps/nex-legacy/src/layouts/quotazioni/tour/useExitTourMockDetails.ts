import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTour } from "tour/TourProvider";
import { isTourMockQuotationId } from "./mockQuotation";

// --------------------------------------------------
// HOOK
// --------------------------------------------------
/**
 * Hook dedicato alla sola UX del tour nella pagina dettaglio quotazione.
 *
 * Responsabilità:
 * - intercettare il caso "sto guardando la quotazione fake del tour"
 * - riportare l'utente alla lista quando il tour viene chiuso
 *
 * Perché esiste:
 * - evita di tenere logica business del tour dentro `quotationDetails.tsx`
 * - centralizza il comportamento in `layouts/quotazioni/tour/`
 * - mantiene la pagina dettagli reale il più possibile invariata
 */
export function useExitTourMockDetails(quotationId: string): void {
    // Stato globale del motore tour (aperto/chiuso + step corrente).
    const tour = useTour();
    // Navigate react-router usato per il redirect controllato alla lista quotazioni.
    const navigate = useNavigate();

    useEffect(() => {
        /**
         * Guard di sicurezza:
         * se non siamo sul dettaglio mock del tour, non facciamo nulla.
         * In questo modo la logica non tocca mai le quotazioni reali.
         */
        if (!isTourMockQuotationId(quotationId)) return;

        /**
         * Caso target:
         * - l'utente è sul dettaglio della quotazione fake
         * - il tour viene chiuso
         *
         * Azione:
         * riportiamo subito alla lista, così non resta una pagina "orfana"
         * legata a un elemento mock che non dovrebbe più essere visibile.
         */
        if (!tour.isOpen) {
            navigate("/commerciale/quotazioni", { replace: true });
        }
    }, [tour.isOpen, quotationId, navigate]);

    useEffect(() => {
        /**
         * Guard di sicurezza:
         * questa regia vale solo nel dettaglio della quotazione fake tour.
         */
        if (!isTourMockQuotationId(quotationId)) return;

        /**
         * Caso "restart tour dalla pagina dettaglio":
         * se il tour è aperto ed è tornato allo step 0 (welcome),
         * lo riportiamo alla lista quotazioni per ancorare correttamente
         * il popover al flusso iniziale.
         *
         * In pratica:
         * - niente step 0 orfano nel dettaglio;
         * - ripartenza coerente sempre dalla home quotazioni.
         */
        if (tour.isOpen && tour.index === 0) {
            navigate("/commerciale/quotazioni", { replace: true });
        }
    }, [tour.isOpen, tour.index, quotationId, navigate]);

    useEffect(() => {
        /**
         * Step "Visualizza FB & OC collegati":
         * il target vive nella pagina lista e non nel dettaglio quotazione.
         *
         * Se ci arriviamo mentre siamo ancora sul dettaglio mock,
         * navighiamo alla lista per rendere visibile il selettore
         * `data-tour="quotazione-details"` senza interrompere il tour.
         */
        if (!isTourMockQuotationId(quotationId)) return;
        if (!tour.isOpen) return;
        if (tour.activeStepSelector !== '[data-tour="quotazione-details"]') return;

        navigate("/commerciale/quotazioni", { replace: true });
    }, [tour.isOpen, tour.activeStepSelector, quotationId, navigate]);
}
