import React from "react";
import { motion } from "framer-motion";
import { FiEdit3 } from "react-icons/fi";
import { NumberToEuro, TruncateText } from "utils";
import { CartProductDTO, TextRequestCartDTO } from "layouts/quotazioni/types/qts_product";
import {
    productStateTransitions,
    RigaStato,
    stateProductLabels,
    stateProductOptionsPalette,
} from "layouts/quotazioni/types/quotations";
import FDIconButton from "components/UI/buttons/FDIconButton";
import { clsx } from "components/UI/box/FDBox";
import { CapitalizeFirstLetter } from "utils/string/capitalize";

const FiEdit3Icon = FiEdit3 as React.FC<{ size?: number; className?: string }>;

interface Props {
    item: TextRequestCartDTO;
    isBuyer: boolean;
    isQBozza: boolean;
    menuRef: React.MutableRefObject<HTMLDivElement | null>;
    handleOpenQtsSettings: (item: TextRequestCartDTO) => void;
}

const TextRequestCard: React.FC<Props> = ({
    item,
    isBuyer,
    isQBozza,
    menuRef,
    handleOpenQtsSettings,
}) => {
    const stato = item.quotazione?.stato as RigaStato | undefined;
    const statoLabel = stato ? (productStateTransitions[stato] ?
        CapitalizeFirstLetter(productStateTransitions[stato].replace("_", " "))
        : stateProductLabels[stato]) : "Stato non definito";

    const hasPrice = item.quotazione?.prezzo_finale != null;
    const prezzoFinale = hasPrice ? Number(item.quotazione!.prezzo_finale) : null;

    const descr = item.textRequest?.descrizione ?? "";
    const buyerLabel = item.codice_buyer ?? "Non definito";

    const notes = item?.eventi?.filter(ev => ev.type === 'NOTA') ?? [];
    const hasNotes = (notes.length ?? 0) > 0;
    const lastNote = hasNotes ? notes[notes.length - 1] : null;
    const lastNoteMsg = lastNote?.message ?? "";

    return (
        <motion.div
            layout
            className={clsx(
                "relative w-full rounded-2xl border border-sky-200/70 bg-sky-50/80 px-3 py-3",
                "dark:border-sky-700/70 dark:bg-sky-900/30",
            )}
        >
            <div className="flex gap-4 items-start w-full">
                {/* Icona / pillola sinistra */}
                <div className="shrink-0 mt-1 rounded-xl bg-sky-500/10 p-2 text-sky-600 dark:text-sky-300 dark:bg-sky-700/30">
                    <FiEdit3Icon className="h-5 w-5" />
                </div>

                <div className="flex flex-col w-full gap-2 overflow-hidden">
                    {/* header */}
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col gap-1 min-w-0">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-200">
                                Richiesta descrittiva del commerciale
                            </p>
                            <p className="text-[11px] text-neutral-600 dark:text-neutral-300">
                                Gestita dal buyer{" "}
                                <span className="font-semibold">
                                    {buyerLabel}
                                </span>
                            </p>
                        </div>

                        {/* stato + menu */}
                        <div className="flex items-start gap-2">
                            {!isQBozza && stato && (
                                <span
                                    className={clsx(
                                        "inline-flex items-center rounded-full px-3 py-1 text-[10px] font-semibold",
                                        "bg-white/80 text-neutral-800 shadow-sm dark:bg-neutral-900/70 dark:text-neutral-100",
                                    )}
                                    data-tooltip-id="general-quotations-tooltip"
                                    data-tooltip-content="Stato della richiesta descrittiva"
                                >
                                    <span
                                        className={clsx(
                                            "mr-1 h-1.5 w-1.5 rounded-full",
                                            stateProductOptionsPalette[stato]
                                        )}
                                    />
                                    {statoLabel}
                                </span>
                            )}

                            <div className="ml-1 relative" ref={menuRef}>
                                <FDIconButton
                                    variant="text"
                                    ariaLabel="Apri dettagli richiesta descrittiva"
                                    dataTooltipContent="Apri gestione richiesta descrittiva"
                                    dataTooltipId="general-quotations-tooltip"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenQtsSettings(item);
                                        (menuRef as React.MutableRefObject<HTMLElement | null>).current =
                                            e.currentTarget as HTMLElement;
                                    }}
                                    icon={
                                        <span className="text-xs text-neutral-500 dark:text-neutral-300">
                                            ⋯
                                        </span>
                                    }
                                    initial={false}
                                />
                            </div>
                        </div>
                    </div>

                    {/* descrizione principale */}
                    <div className="mt-1">
                        <h3 className="text-[11px] uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-1">
                            Descrizione necessità
                        </h3>
                        <p
                            className="text-xs text-neutral-800 dark:text-neutral-100 whitespace-pre-line max-h-24 overflow-hidden"
                            data-tooltip-id="general-quotations-tooltip"
                            data-tooltip-content={descr}
                        >
                            {TruncateText(descr || "Nessuna descrizione fornita.", 260)}
                        </p>
                    </div>

                    {/* note + prezzo (se presenti) */}
                    <div className="flex flex-wrap gap-4 pt-1">
                        {hasNotes && (
                            <div className="flex-1 min-w-[160px] space-y-1">
                                <div className="flex items-center justify-between gap-1">
                                    <h4 className="text-[11px] uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                                        Note interne
                                    </h4>
                                    <span className="inline-flex items-center gap-1 rounded-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 px-2 py-[2px] text-[9px] text-neutral-600 dark:text-neutral-300">
                                        {notes.length} {notes.length === 1 ? "nota" : "note"}
                                    </span>
                                </div>
                                <p
                                    className="text-[11px] text-neutral-700 dark:text-neutral-300 line-clamp-2"
                                    data-tooltip-id="general-quotations-tooltip"
                                    data-tooltip-content={lastNoteMsg}
                                >
                                    {TruncateText(lastNoteMsg, 160) || "—"}
                                </p>
                                {lastNote?.actor && (
                                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                                        Ultima nota di{" "}
                                        <span className="font-medium">
                                            {lastNote.actor.name ?? "Utente sconosciuto"}
                                        </span>
                                    </p>
                                )}
                            </div>
                        )}

                        {prezzoFinale != null && (
                            <div className="flex flex-col min-w-[120px]">
                                <h4 className="text-[11px] uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-0.5">
                                    Valore proposte
                                </h4>
                                <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                                    {NumberToEuro({ convert: prezzoFinale })}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* hint operativo */}
                    {isBuyer && (
                        <p className="mt-1 text-[10px] text-neutral-500 dark:text-neutral-400">
                            Dal pannello di dettaglio potrai proporre uno o più prodotti in sostituzione,
                            che verranno quotati al momento della selezione.
                        </p>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default React.memo(TextRequestCard);
