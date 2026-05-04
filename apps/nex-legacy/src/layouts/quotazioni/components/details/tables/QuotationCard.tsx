import React, { memo, useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiAlertCircle, FiChevronDown } from "react-icons/fi";
import { IoEllipsisVertical } from "react-icons/io5";

import { NumberToEuro, TruncateText } from "utils";
import { clsx } from "components/UI/box/FDBox";
import FDIconButton from "components/UI/buttons/FDIconButton";

import {
    productStateTransitions,
    RigaStato,
    stateProductLabels,
    stateProductOptionsPalette,
} from "layouts/quotazioni/types/quotations";
import { CartProductDTO, ContropropostaDTO } from "layouts/quotazioni/types/qts_product";
import { CapitalizeFirstLetter } from "utils/string/capitalize";

const FiChevronDownIcon = FiChevronDown as React.FC<{ size?: number; className?: string }>;
const FiAlertCircleIcon = FiAlertCircle as React.FC<{ size?: number; className?: string }>;
const IoEllipsisVerticalIcon = IoEllipsisVertical as React.FC<{ size?: number, className?: string }>;


/**
 * QuotationCard (optimized)
 * - Fast derived-state (single useMemo) + memoized UI primitives
 * - Correctly treats CONTROPROPOSTA_ACCETTATA as a *product substitution*
 *   and visually shows Original → Sostituito, so the user understands instantly.
 *
 * NOTE: OC/FB mapping must use the same "effective product" concept in quotationDetails.tsx productRows.
 */
// -----------------------------------------------------------------------------
// UI primitives
// -----------------------------------------------------------------------------
type PillVariant = "filled" | "outline";

const Pill = memo(function Pill({
    title,
    children,
    color,
    truncateTo = 24,
    variant = "filled",
    className,
}: {
    title: string;
    children: React.ReactNode;
    color?: string;
    truncateTo?: number;
    variant?: PillVariant;
    className?: string;
}) {
    // NOTE: dynamic Tailwind classes require safelist in build config; kept consistent with existing codebase.
    const base =
        variant === "outline"
            ? `border text-${color}-400`
            : `${color ?? "bg-neutral-200 dark:bg-neutral-800/50"}`;

    const text =
        typeof children === "string" || typeof children === "number"
            ? TruncateText(String(children), truncateTo)
            : children;

    return (
        <span
            className={clsx(base, "rounded-md text-[10px] px-3 w-fit h-fit", className)}
            data-tooltip-id="general-quotations-tooltip"
            data-tooltip-content={title}
        >
            {text}
        </span>
    );
});

const Field = memo(function Field({
    label,
    value,
    tooltip,
    className,
    valueClassName,
    truncateTo,
}: {
    label: string;
    value: React.ReactNode;
    tooltip?: string;
    className?: string;
    valueClassName?: string;
    truncateTo?: number;
}) {
    const renderValue =
        typeof value === "string" || typeof value === "number"
            ? TruncateText(String(value), truncateTo ?? 999)
            : value;

    return (
        <div className={clsx("flex flex-col items-start text-xs min-w-[80px]", className)}>
            <h3 className="text-[11px] uppercase tracking-wide text-neutral-500">{label}</h3>
            <div
                className={clsx("text-neutral-800 dark:text-neutral-300", valueClassName)}
                data-tooltip-id={tooltip ? "general-quotations-tooltip" : undefined}
                data-tooltip-content={tooltip}
            >
                {renderValue}
            </div>
        </div>
    );
});

const ProductThumb = memo(function ProductThumb({
    src,
    alt,
}: {
    src?: string | null;
    alt?: string | null;
}) {
    const [imgError, setImgError] = useState(false);

    const onError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
        e.currentTarget.onerror = null;
        setImgError(true);
    }, []);

    return (
        <div
            className={clsx(
                "flex items-center justify-center w-16 h-16 rounded-xl",
                "bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700",
                "overflow-hidden shrink-0"
            )}
        >
            {src && !imgError ? (
                <img
                    src={src}
                    alt={alt ?? "Prodotto"}
                    className="w-full h-full object-contain bg-white dark:bg-neutral-900"
                    onError={onError}
                />
            ) : (
                <span className="text-[11px] text-neutral-400 dark:text-neutral-500 text-center px-2">
                    Nessuna immagine
                </span>
            )}
        </div>
    );
});

// -----------------------------------------------------------------------------
// Domain helpers
// -----------------------------------------------------------------------------
type AnyObj = Record<string, any>;

function findAcceptedProposal(cps: ContropropostaDTO[] | undefined | null) {
    const list = cps ?? [];
    return (
        list.find((cp: AnyObj) => cp?.stato === "CONTROPROPOSTA_ACCETTATA") ??
        list.find((cp: AnyObj) => cp?.approvato === true) ??
        null
    );
};

function getPrimaryProposal(item: CartProductDTO, accepted: AnyObj | null) {
    const cps = (item?.controproposte ?? []) as AnyObj[];
    return accepted ?? (cps.length > 0 ? cps[0] : null);
};

function getEffectiveDetails(item: CartProductDTO, accepted: AnyObj | null) {
    const stato = item?.quotazione?.stato as RigaStato | undefined;
    if (stato === "CONTROPROPOSTA_ACCETTATA" && accepted?.dettagli_prodotto) return accepted.dettagli_prodotto;
    return item?.dettagli_prodotto;
};


// -----------------------------------------------------------------------------
// Props
// -----------------------------------------------------------------------------
interface Props {
    item: CartProductDTO;
    expanded?: boolean;
    isQBozza: boolean;
    isBIDPassivo: boolean;
    menuRef: React.MutableRefObject<HTMLDivElement | null>;
    handleOpenQtsSettings: (item: CartProductDTO) => void;
    onToggle: () => void;

    // azione esplicita per aprire il dettaglio prodotto
    onViewProductDetails?: (productId: string, cartItem: CartProductDTO) => void;
};


// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------
const QuotationCard: React.FC<Props> = ({
    item,
    expanded,
    isQBozza,
    isBIDPassivo,
    menuRef,
    handleOpenQtsSettings,
    onToggle,
    onViewProductDetails,
}) => {
    const derived = useMemo(() => {
        const stato = item?.quotazione?.stato as RigaStato | undefined;
        const cps = ((item?.controproposte ?? []) as ContropropostaDTO[]).filter(p => p.stato !== "CONTROPROPOSTA_RIFIUTATA") ?? [];
        const accepted = findAcceptedProposal(cps);
        const primary = getPrimaryProposal(item, accepted);

        const isCounterAccepted = stato === "CONTROPROPOSTA_ACCETTATA";
        const isCounterRejected = stato === "CONTROPROPOSTA_RIFIUTATA";
        const hasProposals = !!item?.quotazione && cps.length > 0;

        const effectiveDetails = getEffectiveDetails(item, accepted);
        const originalDetails = item?.dettagli_prodotto;

        const statoLabel = stato ? (productStateTransitions[stato] ?
            CapitalizeFirstLetter(productStateTransitions[stato].replace("_", " "))
            : stateProductLabels[stato]) : "Stato non definito";

        const substitutedToLabel =
            isCounterAccepted && accepted?.dettagli_prodotto
                ? `${accepted?.dettagli_prodotto?.codiceProduttore ?? ""} ${accepted?.dettagli_prodotto?.descrizione ?? ""}`.trim() || null
                : null;

        const isOnWaiting = item?.quotazione?.stato === "ATTESA_VALUTAZIONE";

        const prezzoProposto = (() => {
            if (!item?.quotazione || isQBozza || isOnWaiting) return null;

            if (isCounterAccepted && primary?.quotazione?.prezzo_finale != null) return Number(primary.quotazione.prezzo_finale);
            if (item?.quotazione?.prezzo_finale != null) return Number(item.quotazione.prezzo_finale);
            return null;
        })();

        const canActOnProposals = hasProposals && !isCounterAccepted && !isCounterRejected;

        return {
            stato,
            statoLabel,
            controproposte: cps,
            acceptedProposal: accepted,
            primaryProposal: primary,
            isCounterAccepted,
            isCounterRejected,
            hasProposals,
            isOnWaiting,
            prezzoProposto,
            canActOnProposals,
            effectiveDetails,
            originalDetails,
            substitutedToLabel,
        };
    }, [item, isQBozza]);

    const details = derived.effectiveDetails ?? {};
    const original = derived.originalDetails ?? {};

    const onOpenSettings = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            handleOpenQtsSettings(item);
            (menuRef as React.MutableRefObject<HTMLElement | null>).current = e.currentTarget as HTMLElement;
        },
        [handleOpenQtsSettings, item, menuRef]
    );

    const originalCode = original?.codiceProduttore ?? null;
    const originalDesc = original?.descrizione ?? null;

    const effectiveCode = details?.codiceProduttore ?? null;
    const effectiveDesc = details?.descrizione ?? null;

    const showDiff = derived.isCounterAccepted && !!originalCode && !!effectiveCode && originalCode !== effectiveCode;

    return (
        <motion.div layout className="relative w-full">
            {/* Collapsed row */}
            <div className="flex gap-4 items-center w-full min-h-[64px] py-3">
                <ProductThumb src={details?.anteprima} alt={effectiveDesc} />

                {/* Price */}
                {derived.prezzoProposto != null && (
                    <>
                        <div className="flex flex-col min-w-[100px]">
                            <h3 className="text-[11px] uppercase tracking-wide text-neutral-500">Prezzo proposto</h3>
                            <p
                                className="text-lg text-neutral-800 dark:text-neutral-300 truncate"
                                data-tooltip-id="general-quotations-tooltip"
                                data-tooltip-content={
                                    derived.isCounterAccepted
                                        ? `Prezzo della sostituzione proposta dal buyer ${item?.codice_buyer ?? ""}`
                                        : `Prezzo finale della quotazione proposto dal buyer ${item?.codice_buyer ?? ""}`
                                }
                            >
                                {NumberToEuro({ convert: derived.prezzoProposto }) ?? "N/A"}
                            </p>
                        </div>
                        <span className="w-1 h-12 px-2 border-l border-gray-200 dark:border-gray-700" />
                    </>
                )}

                <div className="flex flex-col w-full gap-1 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex gap-x-6 items-center">
                            <div className="truncate">
                                <p className="text-[11px] text-neutral-500">Gestita dal buyer</p>
                                <p
                                    className={clsx(
                                        "text-xs w-fit",
                                        !item?.codice_buyer && "text-red-500 bg-red-100 dark:bg-red-900/20 p-1 rounded-md"
                                    )}
                                >
                                    {item?.codice_buyer ?? "Non Definito"}
                                </p>
                            </div>

                            {isBIDPassivo && <>
                                <div className="truncate">
                                    <p className="text-[11px] text-neutral-500">Prefisso</p>
                                    <p
                                        className={clsx(
                                            "text-xs w-fit",
                                            !item?.dettagli_prodotto.prefisso && "text-red-500 bg-red-100 dark:bg-red-900/20 p-1 rounded-md"
                                        )}
                                    >
                                        {item?.dettagli_prodotto.prefisso ?? "Non Definito"}
                                    </p>
                                </div>

                                <div className="truncate">
                                    <p className="text-[11px] text-neutral-500">Linea</p>
                                    <p
                                        className={clsx(
                                            "text-xs w-fit",
                                            !item?.dettagli_prodotto.linea && "text-red-500 bg-red-100 dark:bg-red-900/20 p-1 rounded-md"
                                        )}
                                    >
                                        {item?.dettagli_prodotto.linea ?? "Non Definito"}
                                    </p>
                                </div>

                                <div className="truncate">
                                    <p className="text-[11px] text-neutral-500">Gruppo</p>
                                    <p
                                        className={clsx(
                                            "text-xs w-fit",
                                            !item?.dettagli_prodotto.gruppo && "text-red-500 bg-red-100 dark:bg-red-900/20 p-1 rounded-md"
                                        )}
                                    >
                                        {item?.dettagli_prodotto.gruppo ?? "Non Definito"}
                                    </p>
                                </div>
                            </>}
                            {!isQBozza && derived.stato && (
                                <Pill
                                    title="Stato della quotazione"
                                    color={stateProductOptionsPalette[derived.stato]}
                                    truncateTo={25}
                                    variant="filled"
                                >
                                    {derived.statoLabel}
                                </Pill>
                            )}

                            {derived.isCounterAccepted && derived.substitutedToLabel && (
                                <span
                                    className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium
                                    bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200"
                                    data-tooltip-id="general-quotations-tooltip"
                                    data-tooltip-content="Controproposta accettata: il prodotto è stato sostituito con quello accettato."
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    <span className="truncate max-w-[260px]">{TruncateText(derived.substitutedToLabel, 40)}</span>
                                </span>
                            )}
                        </div>

                        <div className="flex items-center">
                            {derived.hasProposals && !derived.isCounterAccepted && !derived.isCounterRejected && (
                                <button
                                    type="button"
                                    onClick={onOpenSettings/*onToggle*/}
                                    aria-expanded={expanded}
                                    data-tooltip-id="general-quotations-tooltip"
                                    data-tooltip-content="Questo prodotto ha una o più controproposte. Il buyer ti ha proposto una sostituzione."
                                    className={clsx(
                                        "inline-flex items-center gap-2 rounded-full px-3 py-1",
                                        "text-xs font-medium",
                                        "bg-amber-100 text-amber-800 dark:bg-amber-300/20 dark:text-amber-200",
                                        "hover:brightness-105 transition"
                                    )}
                                >
                                    <span className="flex items-center gap-1">
                                        <FiAlertCircleIcon className="shrink-0" />
                                        {derived.controproposte.length} contropropost{derived.controproposte.length > 1 ? "e" : "a"}
                                    </span>
                                    <motion.span
                                        animate={{ rotate: expanded ? 180 : 0 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 24 }}
                                        className="inline-flex"
                                    >
                                        <FiChevronDownIcon />
                                    </motion.span>
                                </button>
                            )}

                            {derived.hasProposals && derived.isCounterRejected && (
                                <span
                                    className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium
                                    bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-200"
                                    data-tooltip-id="general-quotations-tooltip"
                                    data-tooltip-content="Le controproposte per questo prodotto sono state rifiutate."
                                >
                                    <FiAlertCircleIcon className="shrink-0" />
                                    <span>{stateProductLabels["CONTROPROPOSTA_RIFIUTATA"]}</span>
                                </span>
                            )}

                            <div className="ml-2 relative" ref={menuRef}>
                                <FDIconButton
                                    variant="text"
                                    ariaLabel="Apri dettagli quotazione prodotto"
                                    dataTooltipContent="Apri dettagli quotazione prodotto"
                                    dataTooltipId="general-quotations-tooltip"
                                    onClick={onOpenSettings}
                                    icon={<IoEllipsisVerticalIcon className="text-neutral-500 dark:text-neutral-400" />}
                                    initial={false}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Fields */}
                    <div className="flex flex-wrap items-start gap-x-6 gap-y-2 pt-1">
                        <Field
                            label="Codice Produttore"
                            tooltip={effectiveCode ?? undefined}
                            className="min-w-[140px]"
                            value={
                                showDiff ? (
                                    <div className="flex flex-col leading-tight">
                                        <span className="line-through text-neutral-400 dark:text-neutral-500">
                                            {TruncateText(originalCode, 18)}
                                        </span>
                                        <span className="text-neutral-800 dark:text-neutral-200">
                                            {TruncateText(effectiveCode ?? "N/A", 18)}
                                        </span>
                                    </div>
                                ) : (
                                    TruncateText(effectiveCode ?? "N/A", 18)
                                )
                            }
                        />

                        <Field
                            label="Quantità"
                            tooltip={`Quantità richiesta del prodotto in quotazione: ${item?.quantita ?? 1}`}
                            value={item?.quantita ?? 1}
                            className="min-w-[80px]"
                        />

                        <Field
                            label="Descrizione"
                            tooltip={effectiveDesc ?? undefined}
                            className="flex-1 min-w-[220px]"
                            valueClassName="truncate"
                            value={
                                showDiff && originalDesc && originalDesc !== effectiveDesc ? (
                                    <div className="flex flex-col leading-tight min-w-0">
                                        <span className="line-through text-neutral-400 dark:text-neutral-500 truncate">
                                            {TruncateText(originalDesc, 90)}
                                        </span>
                                        <span className="truncate text-neutral-800 dark:text-neutral-200">
                                            {TruncateText(effectiveDesc ?? "N/A", 90)}
                                        </span>
                                    </div>
                                ) : (
                                    TruncateText(effectiveDesc ?? "N/A", 100)
                                )
                            }
                        />

                        <div className="flex flex-wrap mt-1 gap-2">
                            <Pill title={`Marca: ${details?.marca ?? "N/A"}`}>{details?.marca ?? "N/A"}</Pill>
                            <Pill title={`Linea: ${details?.descrizioneLinea ?? "N/A"}`}>{details?.descrizioneLinea ?? "N/A"}</Pill>
                            <Pill title={`Gruppo: ${details?.descrizioneGruppo ?? "N/A"}`}>{details?.descrizioneGruppo ?? "N/A"}</Pill>
                        </div>
                    </div>
                </div>
            </div>

            {/* Nudge when proposals exist and not expanded */}
            {derived.hasProposals && !expanded && !derived.isCounterAccepted && !derived.isCounterRejected && (
                <span className="absolute left-0 top-2 h-2 w-2 rounded-full bg-amber-400 animate-pulse" aria-hidden />
            )}
        </motion.div>
    );
};

export default memo(QuotationCard);
