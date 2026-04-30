import React from "react";
import FDBox from "components/UI/box/FDBox";
import FDIconButton from "components/UI/buttons/FDIconButton";
import { FDButton } from "components/UI/buttons/FDButton";
import { FDDate } from "components/UI/input/FDDate";
import { QuotazioneDTO, STATE_COLOR_STYLES } from "layouts/quotazioni/types/quotations";
import { motion, AnimatePresence } from "framer-motion";

import { CopyToClipboard } from "utils";

// Icons
import { BsBoxSeam } from "react-icons/bs";
import { IoCopyOutline } from "react-icons/io5";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import { MdEuro } from "react-icons/md";

const BsBoxSeamIcon = BsBoxSeam as React.FC<{ size?: number; className?: string }>;
const IoCopyOutlineIcon = IoCopyOutline as React.FC<{ size?: number; className?: string }>;
const FiChevronDownIcon = FiChevronDown as React.FC<{ size?: number; className?: string }>;
const FiChevronUpIcon = FiChevronUp as React.FC<{ size?: number; className?: string }>;
const MdEuroIcon = MdEuro as React.FC<{ size?: number; className?: string }>;

// ——————————————————————————————————————————————————————————
// TYPES
// ——————————————————————————————————————————————————————————
type QuotationDetailsCardProps = {
    quotation: QuotazioneDTO | null;
    quotationId: string;
    prog_num?: number;
    /** true se l'utente può vedere valori economici (buyer/admin/dev) */
    canSeePrices?: boolean;
    /** totale netto o lordo corrente della quotazione */
    totalAmount?: number | null;

    /**
     * Callback opzionale: salva la finestra di validità.
     * IMPORTANTISSIMO:
     * - In questo componente l'utente può modificare SOLO la data FINE.
     * - La data INIZIO è sempre read-only (deriva dal backend o da automazioni).
     * - Il formato atteso è "YYYY-MM-DD" (coerente con input type=date).
     *
     * In BOZZA, al click su "Salva" verrà chiamata con:
     *   { fine: "YYYY-MM-DD" | undefined }
     */
    onUpdateValidityWindow?: (range: { fine?: string }) => Promise<void> | void;
};

// ——————————————————————————————————————————————————————————
// HELPERS
// ——————————————————————————————————————————————————————————
// formatter minimale, stesso stile del pannello prodotto
function formatDecimal(val?: string | number | null): string {
    if (val === undefined || val === null) return "-";
    const num = typeof val === "string" ? Number(val.replace(",", ".")) : Number(val);
    if (Number.isNaN(num)) return String(val);
    return num.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

/** Converte un valore (Date/string/number/undefined) nel formato input="date" (YYYY-MM-DD). */
function toDateInputValue(v: unknown): string | undefined {
    if (!v) return undefined;
    const d = v instanceof Date ? v : new Date(v as any);
    if (Number.isNaN(d.getTime())) return undefined;
    return d.toISOString().slice(0, 10);
};

/** Converte in data leggibile (it-IT) oppure null. */
function toHumanDate(v: unknown): string | null {
    if (!v) return null;
    const d = v instanceof Date ? v : new Date(v as any);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString("it-IT");
};

function startOfDayLocal(d: Date) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
};

/**
 * Riga informativa (label + value) per evitare ripetizioni nel render.
 * - Memo: riduce re-render inutili quando cambiano solo alcune parti.
 */
const InfoRow = React.memo(function InfoRow(props: {
    label: string;
    children: React.ReactNode;
    className?: string;
    tooltip?: string;
}) {
    return (
        <div className={props.className ?? ""} data-tooltip-content={props.tooltip} data-tooltip-id="general-quotations-tooltip">
            <span className="font-medium text-neutral-700 dark:text-neutral-200">{props.label} </span>
            <span className="text-neutral-700 dark:text-neutral-300">{props.children}</span>
        </div>
    );
});


// ——————————————————————————————————————————————————————————
// COMPONENT
// ——————————————————————————————————————————————————————————
export default function QuotationDetailsCard({
    quotation,
    quotationId,
    canSeePrices,
    totalAmount,
    prog_num,
    onUpdateValidityWindow,
}: QuotationDetailsCardProps) {
    const [isOpen, setIsOpen] = React.useState(true);


    // ——————————————————————————————————————————————————————————
    // FLAGS
    // ——————————————————————————————————————————————————————————
    const isDraft = quotation?.stato === "BOZZA";
    const isMepa = (quotation as any)?.tipologia === "MEPA";


    // ——————————————————————————————————————————————————————————
    // FINESTRA DI VALIDITÀ
    // Regole:
    // - MEPA: sezione sempre visibile; finestra idealmente obbligatoria (ma gestiamo legacy)
    // - Non MEPA: sezione visibile SOLO se una delle date è presente
    // - In BOZZA: l'utente può modificare SOLO la data FINE (mai l'inizio)
    // - Non BOZZA: mostra inizio + fine (read-only)
    // ——————————————————————————————————————————————————————————
    const rawValidFrom = (quotation as any)?.finestraValidita?.inizio;
    const rawValidTo = (quotation as any)?.finestraValidita?.fine;

    const shouldShowValidityBox = React.useMemo(() => {
        return isMepa || Boolean(rawValidFrom || rawValidTo);
    }, [isMepa, rawValidFrom, rawValidTo]);

    const validFromHuman = React.useMemo(() => toHumanDate(rawValidFrom), [rawValidFrom]);
    const validToHuman = React.useMemo(() => toHumanDate(rawValidTo), [rawValidTo]);

    // BOZZA: editiamo SOLO "fine"
    const initialEnd = React.useMemo(() => toDateInputValue(rawValidTo), [rawValidTo]);
    const [validEnd, setValidEnd] = React.useState<string | undefined>(initialEnd);
    const [isSavingValidity, setIsSavingValidity] = React.useState(false);
    const hasUserEditedEndRef = React.useRef(false);

    const endDirty = React.useMemo(() => validEnd !== initialEnd, [validEnd, initialEnd]);

    // la data di fine deve essere sempre piu grande della data attuale di almeno 1 giorno, quindi potrò selezionare da domani in poi
    // esempio: se oggi è 1 giugno, la data di fine deve essere >= 2 giugno
    const isValidDate = React.useMemo(() => {
        if (!validEnd) return true; // accettiamo anche undefined (per rimuovere la data)
        const today = startOfDayLocal(new Date());
        const selectedDate = startOfDayLocal(new Date(validEnd));
        return selectedDate.getTime() > today.getTime();
    }, [validEnd]);

    // riallineo da backend quando non sto editando
    React.useEffect(() => {
        // Quando arriva initialEnd dal backend:
        // - se l'utente NON ha ancora modificato manualmente, riallineo validEnd
        // - se l'utente ha modificato, non sovrascrivo
        if (!hasUserEditedEndRef.current) {
            setValidEnd(initialEnd);
        }
    }, [initialEnd]);

    const onSaveValidityEnd = React.useCallback(async () => {
        if (!onUpdateValidityWindow) return;
        if (!endDirty) return;

        try {
            setIsSavingValidity(true);
            await onUpdateValidityWindow({ fine: validEnd });
            hasUserEditedEndRef.current = false;
        } finally {
            setIsSavingValidity(false);
        }
    }, [onUpdateValidityWindow, endDirty, validEnd]);


    // ——————————————————————————————————————————————————————————
    // UI DATA
    // ——————————————————————————————————————————————————————————
    const updatedAt = quotation?.updated_at ? new Date(quotation.updated_at).toLocaleDateString() : "-";
    const createdAt = quotation?.created_at ? new Date(quotation.created_at).toLocaleDateString() : "-";

    // Codice business leggibile: 1 -> 0001, 25 -> 0025, 2345 -> 2345.
    // Non sostituisce l'_id Mongo, che resta l'identificativo tecnico.
    const progressiveCode = typeof prog_num === "number"
        ? String(prog_num).padStart(4, "0")
        : "-";


    const statoColor = quotation ? STATE_COLOR_STYLES[quotation.stato] : undefined;

    if (!quotation) return null;

    return (
        <FDBox
            variant="soft"
            color="light"
            radius="md"
            shadow="sm"
            pad="lg"
            className={[
                "relative flex flex-col",
                "bg-white/90 dark:bg-neutral-900/80",
                "border border-black/5 dark:border-white/10",
                "backdrop-blur supports-[backdrop-filter]:backdrop-blur",
                "transition-colors duration-200",
            ].join(" ")}
        >
            {/* HEADER - sempre visibile */}
            <div
                className="flex items-start justify-between gap-4 cursor-pointer select-none"
                onClick={() => setIsOpen((prev) => !prev)}
            >
                <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <BsBoxSeamIcon className="w-4 h-4 text-neutral-500 dark:text-neutral-300" />
                        <h3 className="text-[11px] uppercase tracking-[0.16em] text-neutral-400">Dettagli Quotazione</h3>
                    </div>

                    {/* Totale quotazione – solo buyer/admin/dev */}
                    {canSeePrices && typeof totalAmount === "number" && (
                        <motion.div
                            layout
                            className="inline-flex items-center gap-2 rounded-full mt-2 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-700 px-3 py-[4px] shadow-sm"
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2, ease: [0.22, 0.61, 0.36, 1] }}
                        >
                            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-600 dark:text-emerald-300">
                                Potenziale Totale Quotazione
                            </span>
                            <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-emerald-700 dark:text-emerald-200">
                                <MdEuroIcon className="opacity-80" />
                                {formatDecimal(totalAmount)}
                            </span>
                        </motion.div>
                    )}

                    {/* Badge tipologia + stato */}
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span
                            className="px-3 py-0.5 rounded-md text-[11px] font-medium bg-orange-400 text-white"
                            data-tooltip-id="general-quotations-tooltip"
                            data-tooltip-content="Tipologia della quotazione"
                        >
                            {quotation.tipologia}
                        </span>

                        <span
                            className={[
                                "px-3 py-0.5 rounded-md text-[11px] font-medium",
                                statoColor ? `${statoColor.bg} ${statoColor.text}` : "bg-slate-500 text-white",
                            ].join(" ")}
                            data-tooltip-id="general-quotations-tooltip"
                            data-tooltip-content="Stato della quotazione"
                        >
                            {quotation.stato}
                        </span>

                        <span className="text-[10px] text-neutral-500">
                            Aggiornato il <span className="text-neutral-800 dark:text-neutral-200">{updatedAt}</span>
                        </span>
                    </div>
                </div>

                {/* Toggle button */}
                <FDIconButton
                    size="small"
                    dataTooltipId="general-quotations-tooltip"
                    dataTooltipContent={isOpen ? "Nascondi dettagli quotazione" : "Mostra dettagli quotazione"}
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen((prev) => !prev);
                    }}
                    className="shrink-0 mt-1"
                    icon={
                        isOpen ? (
                            <FiChevronUpIcon className="transition-transform duration-150" />
                        ) : (
                            <FiChevronDownIcon className="transition-transform duration-150" />
                        )
                    }
                />
            </div>

            {/* CONTENUTO COLLASSABILE */}
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        key="quotation-details"
                        initial={{ height: 0, opacity: 0, y: -4 }}
                        animate={{ height: "auto", opacity: 1, y: 0 }}
                        exit={{ height: 0, opacity: 0, y: -4 }}
                        transition={{ duration: 0.22, ease: [0.22, 0.61, 0.36, 1] }}
                        className="overflow-hidden"
                    >
                        <div className="mt-3 text-sm text-neutral-500 dark:text-neutral-400 space-y-2">
                            <InfoRow label="Titolo:">{quotation.titolo || "N/A"}</InfoRow>
                            <InfoRow label="Stato:">{quotation.stato}</InfoRow>
                            <InfoRow label="Note:">{quotation.note ?? "N/A"}</InfoRow>

                            {/* Codice quotazione + copia */}
                            <div className="flex items-center gap-2 pt-1">
                                {/* <InfoRow label="ID:" tooltip={`Codice univoco assegnato alla quotazione ${quotationId}`}>#{quotationId.slice(0, 8) + "..."}</InfoRow> */}
                                <InfoRow label="ID:" tooltip={`Codice univoco progressivo assegnato alla quotazione ${progressiveCode}.`}
                                >
                                    {progressiveCode}
                                </InfoRow>

                                <FDIconButton
                                    variant="text"
                                    size="small"
                                    icon={<IoCopyOutlineIcon />}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        CopyToClipboard(String(quotationId));
                                    }}
                                    className="inline-flex"
                                    dataTooltipContent="Copia codice"
                                    dataTooltipId="general-quotations-tooltip"
                                />
                            </div>

                            {/* Finestra di validità */}
                            {shouldShowValidityBox && (
                                <div className="mt-2 rounded-2xl border border-neutral-200/70 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/50 p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                                                Finestra di validità
                                            </div>
                                            <div className="mt-1 text-xs text-neutral-600 dark:text-neutral-300">
                                                {isMepa ? (
                                                    <>
                                                        Obbligatoria per <span className="font-semibold">MEPA</span>.
                                                    </>
                                                ) : (
                                                    <>Opzionale (solo se impostata).</>
                                                )}
                                            </div>
                                        </div>

                                        {isMepa && (!rawValidFrom || !rawValidTo) && (
                                            <span
                                                className={[
                                                    "shrink-0 inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold shadow-sm",
                                                    "border-amber-200 text-amber-800 bg-amber-50/70",
                                                    "dark:border-amber-500/20 dark:text-amber-200 dark:bg-amber-500/10",
                                                ].join(" ")}
                                            >
                                                Da completare
                                            </span>
                                        )}
                                    </div>

                                    {/* NON BOZZA: read-only, mostra inizio+fine */}
                                    {!isDraft && (
                                        <div className="mt-3 text-sm text-neutral-700 dark:text-neutral-200 space-y-1">
                                            <div>
                                                <span className="font-medium">Inizio:</span>{" "}
                                                <span className="text-neutral-700 dark:text-neutral-300">{validFromHuman ?? "N/A"}</span>
                                            </div>
                                            <div>
                                                <span className="font-medium">Fine:</span>{" "}
                                                <span className="text-neutral-700 dark:text-neutral-300">{validToHuman ?? "N/A"}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* BOZZA: inizio read-only, fine editabile */}
                                    {isDraft && (
                                        <div className="mt-3">
                                            <div className="text-sm text-neutral-700 dark:text-neutral-200">
                                                <span className="font-medium">Inizio:</span>{" "}
                                                <span className="text-neutral-700 dark:text-neutral-300">{validFromHuman ?? "N/A"}</span>
                                            </div>

                                            <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                                                <FDDate
                                                    size="sm"
                                                    label="Fine validità"
                                                    value={validEnd}
                                                    onChange={(v) => {
                                                        hasUserEditedEndRef.current = true;
                                                        setValidEnd(v);
                                                    }}
                                                    radius="xl"
                                                    variant="outline"
                                                    color="neutral"
                                                    disabled={isSavingValidity}
                                                    helperText={isMepa ? "Seleziona la data di scadenza della gara." : "Opzionale."}
                                                    className="w-full"
                                                />
                                            </div>

                                            <div className="mt-3 flex items-center justify-end gap-2">
                                                <FDButton
                                                    variant="ghost"
                                                    disabled={!endDirty || isSavingValidity}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        hasUserEditedEndRef.current = false; // torna "non editato"
                                                        setValidEnd(initialEnd);
                                                    }}
                                                    data-tooltip-id="general-quotations-tooltip"
                                                    data-tooltip-content="Resetta lo stato di validità"
                                                    className="rounded-xl"
                                                >
                                                    Reset
                                                </FDButton>

                                                <FDButton
                                                    disabled={!onUpdateValidityWindow || !endDirty || isSavingValidity || !isValidDate}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        void onSaveValidityEnd();
                                                    }}
                                                    className="rounded-xl"
                                                    data-tooltip-id="general-quotations-tooltip"
                                                    data-tooltip-content={!isValidDate ? "La data di fine deve essere sempre più grande della data attuale di almeno 1 giorno" : "Salva la data"}
                                                >
                                                    {isSavingValidity ? "Salvataggio..." : "Salva"}
                                                </FDButton>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="pt-1 flex items-center justify-between gap-2">
                                <span className="text-[11px] text-neutral-500">
                                    Creato il <span className="text-neutral-800 dark:text-neutral-200">{createdAt}</span>
                                </span>

                                {canSeePrices && typeof totalAmount === "number" && (
                                    <span className="text-[11px] text-neutral-600 dark:text-neutral-300">
                                        Valore attuale: <span className="font-semibold">{formatDecimal(totalAmount)} €</span>
                                    </span>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </FDBox>
    );
}
