import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuotationClosureGate } from "../../../hook/useQuotationClosureGate";
import { FiLock, FiClock, FiAlertTriangle } from "react-icons/fi";
import { FDButton } from "components/UI/buttons/FDButton";
import { QuotazioneDTOExtended } from "layouts/quotazioni/types/closure";
import { useTour } from "tour/TourProvider";

const FiLockIcon = FiLock as React.FC<{ size?: number; className?: string }>;
const FiClockIcon = FiClock as React.FC<{ size?: number; className?: string }>;
const FiAlertTriangleIcon = FiAlertTriangle as React.FC<{ size?: number; className?: string }>;

type Props = {
    qts?: QuotazioneDTOExtended | null;

    /** L’utente che ha creato la quotazione (agenteId) */
    isRequester: boolean;
    isBuyer?: boolean;

    /**
     * True quando tutti i prodotti della quotazione hanno raggiunto uno stato terminale "done"
     * (VALUTAZIONE_COMPLETATA o CONTROPROPOSTA_ACCETTATA).
     * Serve per rendere la quotazione chiudibile anche prima della scadenza.
     */
    allProductsDone: boolean;

    /** Azione: apri wizard chiusura */
    onOpenClosure: () => void;
};

/**
 * ValidityBanner (nuova versione):
 * - Non è più solo MEPA.
 * - Mostra:
 *   A) info validità (countdown) se c’è una finestra validità attiva
 *   B) blocco operativo (requiresClosure) quando la quotazione è pronta da chiudere:
 *      - scaduta, oppure
 *      - tutti prodotti completati, oppure
 *      - stato quotazione "DA_CHIUDERE"
 *
 * Nota UX:
 * - La navigazione resta permessa.
 * - Le azioni operative vanno bloccate altrove usando gate.locked.
 * - CTA apre il wizard governato SOLO da openClosure.
 */
export const ValidityBanner: React.FC<Props> = ({ qts, isRequester, isBuyer = false, allProductsDone, onOpenClosure }) => {
    const gate = useQuotationClosureGate(qts, allProductsDone);

    // Esiste finestra validità se almeno uno tra inizio/fine è presente
    const hasValidityWindow = Boolean(qts?.finestraValidita?.inizio || qts?.finestraValidita?.fine);

    // Mostriamo banner se:
    // - c’è una finestra validità (per mostrare countdown / scadenza), oppure
    // - la quotazione richiede chiusura (readyToClose ma non finalizzata)
    const shouldShow = Boolean(hasValidityWindow || gate.requiresClosure);

    const baseClass =
        "w-full rounded-2xl border p-4 md:p-5 shadow-sm bg-white/60 backdrop-blur " +
        "dark:bg-neutral-900/60";

    const isLock = gate.requiresClosure;

    /**
     * Testi “enterprise”:
     * - in lock: spieghiamo chiaramente che le azioni sono bloccate finché non si chiude
     * - fuori lock: informiamo sulla finestra validità (se presente)
     */
    const title = isLock
        ? "Quotazione pronta da chiudere"
        : "Validità quotazione";

    const badgeText = isLock
        ? gate.lockReason === "VALIDITY_EXPIRED"
            ? "Scaduta — chiusura richiesta"
            : gate.lockReason === "ALL_PRODUCTS_DONE"
                ? "Prodotti completati — chiusura richiesta"
                : "Chiusura richiesta"
        : gate.expired
            ? "Scaduta"
            : gate.countdownLabel
                ? `Scade tra ${gate.countdownLabel}`
                : "Finestra validità";

    const description = isLock ? (
        <>
            La quotazione è pronta per la chiusura definitiva: finché non viene completata la chiusura,
            tutte le azioni operative su prodotti/quotazione devono rimanere bloccate (per buyer e commerciale).
            {qts?.tipologia === "MEPA" ? (
                <> Il richiedente dovrà indicare l’esito gara (vinta (OK) / persa (KO)) e, se vinta, associare OC/FB.</>
            ) : (
                <> Il richiedente dovrà indicare l’esito finale (OK/KO) e, se OK, associare OC/FB.</>
            )}
        </>
    ) : (
        <>
            {gate.expired ? (
                <>La finestra di validità risulta scaduta.</>
            ) : (
                <>
                    Finché la finestra è valida puoi lavorare sui prodotti. Se la quotazione diventa pronta da chiudere
                    (scadenza o prodotti completati), verrà richiesta la chiusura definitiva.
                </>
            )}
        </>
    );


    //LockInteraction tour system
    const { isOpen, index: tourIndex } = useTour();
    const lockInteractions = isOpen && tourIndex === 71;
    //
    return (
        <AnimatePresence>
            {shouldShow && (
                <motion.div
                    data-tour="quotazioni-chiudi-quotazione"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className={
                        baseClass +
                        " mt-2 " +
                        (isLock
                            ? " border-amber-500 bg-amber-50/70"
                            : " border-slate-200 dark:border-slate-800")
                    }
                >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                                {isLock ? (
                                    <FiLockIcon className="text-amber-700" size={18} />
                                ) : gate.expired ? (
                                    <FiAlertTriangleIcon className="text-amber-600" size={18} />
                                ) : (
                                    <FiClockIcon className="text-slate-700 dark:text-slate-200" size={18} />
                                )}
                            </div>

                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="text-sm md:text-base font-semibold text-slate-900 dark:text-slate-100">
                                        {title}
                                    </h3>

                                    <span
                                        className={
                                            "text-xs px-2 py-1 rounded-full border " +
                                            (isLock
                                                ? "border-amber-200 text-amber-800 bg-amber-50"
                                                : !gate.expired
                                                    ? "border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-200"
                                                    : "border-amber-200 text-amber-800 bg-amber-50")
                                        }
                                    >
                                        {badgeText}
                                    </span>
                                </div>

                                <p className="mt-1 text-xs md:text-sm text-slate-700 dark:text-slate-300">
                                    {description}
                                </p>

                                {/* Info permessi */}
                                {isLock && !isRequester && (
                                    <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                                        Solo il richiedente (agenteId) può completare la chiusura definitiva.
                                    </p>
                                )}
                            </div>
                        </div>

                        {isLock && (
                            <FDButton
                                data-tour="quotazioni-product-apri-chiudi"
                                variant="outline"
                                onClick={onOpenClosure}
                                disabled={isBuyer || !isRequester || lockInteractions}
                                radius="xl"
                            >
                                Apri chiusura
                            </FDButton>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};