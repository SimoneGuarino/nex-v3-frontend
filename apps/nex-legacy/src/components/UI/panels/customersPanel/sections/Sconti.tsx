import React from "react";
import FDSwitch from "components/UI/input/FDSwitch";
import { FaPlus } from "react-icons/fa";
import {
    SectionActionButton,
    SectionBlock,
    SectionContainer,
    SectionHeader,
    SectionKeyValue,
    SectionPill,
} from "../components/sectionUi";
import { cn, formatDateMaybe, formatNumberIt, toDisplayText } from "../helpers/panelUtils";
import type { AnyRecord, PanelMode, ScontiPayload, ScontiViewType } from "../types";

const PREVIEW_LIMIT = 5;

const typeLabelMap: Record<ScontiViewType, string> = {
    cliente: "Sconti cliente",
    categoria: "Sconti categoria",
};

const TableCell: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <td className={cn("px-3 py-2 text-[12px] text-neutral-700 dark:text-neutral-300", className)}>
        {children}
    </td>
);

const TableHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <th
        className={cn(
            "px-3 py-2 text-left text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-900/50",
            className
        )}
    >
        {children}
    </th>
);

function toText(value: unknown): string {
    return String(value ?? "").replace(/\s+/g, " ").trim();
}

function toTextOrNull(value: unknown): string | null {
    const text = toText(value);
    return text || null;
}

function joinText(values: Array<unknown>, separator = " - ", fallback = "-"): string {
    const parts = values.map((value) => toTextOrNull(value)).filter((value): value is string => Boolean(value));
    return parts.length > 0 ? parts.join(separator) : fallback;
}

function formatNumeric(value: unknown, fallback = "-"): string {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return fallback;
    return numeric.toLocaleString("it-IT", {
        maximumFractionDigits: 2,
    });
}

function getScontoHeaderLabel(row: AnyRecord, type: ScontiViewType): string {
    if (type === "cliente") return "Sconto cliente";
    const codice = toTextOrNull(row?.CODICE_SCONTO);
    const descrizione = toTextOrNull(row?.DESCRIZIONE_SCONTO);
    return joinText([codice, descrizione], " - ", "Sconto categoria");
}

const ScontoRow: React.FC<{
    row: AnyRecord;
    type: ScontiViewType;
    compact: boolean;
    rowIndex: number;
}> = ({ row, type, compact, rowIndex }) => {
    const fornitore = joinText([row?.PREFISSO_FORNITORE, row?.DESCRIZIONE_FORNITORE]);
    const raggruppamento = joinText(
        [row?.CODICE_RAGGRUPPAMENTO, row?.DESCRIZIONE_RAGGRUPPAMENTO],
        " - ",
        "-"
    );
    const linea = joinText([row?.CODICE_LINEA, row?.DESCRIZIONE_LINEA], " - ", "-");
    const gruppo = joinText([row?.CODICE_GRUPPO, row?.DESCRIZIONE_GRUPPO], " - ", "-");
    const famiglia = joinText([row?.CODICE_FAMIGLIA, row?.DESCRIZIONE_FAMIGLIA], " - ", "-");
    const listino = joinText([row?.CODICE_LISTINO, row?.DESCRIZIONE_LISTINO]);
    const riferimentoCosto = toTextOrNull(row?.RIFERIMENTO_COSTO) ?? "-";
    const promoFlag = String(row?.["PROMO(S/N)"] ?? "").trim().toUpperCase();
    const promoEnabled = promoFlag === "S";
    const validita = joinText(
        [formatDateMaybe(row?.DATA_INIZIO), formatDateMaybe(row?.DATA_FINE)],
        " -> ",
        "-"
    );

    return (
        <div className="rounded-xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/70 dark:bg-neutral-900/40">
            <div className="px-4 py-3 border-b border-neutral-200/60 dark:border-neutral-800/70 flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-2">
                        {getScontoHeaderLabel(row, type)}
                    </p>
                    <p className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                        {fornitore}
                    </p>
                </div>

                <div className="shrink-0 flex flex-wrap items-center justify-end gap-1.5">
                    <SectionPill tone={promoEnabled ? "ok" : "neutral"}>
                        {promoEnabled ? "Promo" : "Standard"}
                    </SectionPill>
                    {!compact && (
                        <SectionPill>
                            riga: <span className="ml-1 font-semibold">{formatNumberIt(rowIndex + 1)}</span>
                        </SectionPill>
                    )}
                </div>
            </div>

            <div className={cn("p-4 grid grid-cols-1 gap-2", compact ? "sm:grid-cols-2" : "sm:grid-cols-3")}>
                <SectionBlock contentClassName="space-y-2">
                    <SectionKeyValue k="Listino" v={listino} />
                    <SectionKeyValue k="Raggruppamento" v={raggruppamento} />
                    <SectionKeyValue k="Validita" v={validita} />
                </SectionBlock>

                <SectionBlock contentClassName="space-y-2">
                    <SectionKeyValue k="Sconto 1" v={formatNumeric(row?.SCONTO_1)} />
                    <SectionKeyValue k="Sconto 2" v={formatNumeric(row?.SCONTO_2)} />
                    <SectionKeyValue k="Ricarica" v={formatNumeric(row?.RICARICA)} />
                </SectionBlock>

                {!compact && (
                    <SectionBlock contentClassName="space-y-2">
                        <SectionKeyValue k="Linea" v={linea} />
                        <SectionKeyValue k="Gruppo" v={gruppo} />
                        <SectionKeyValue k="Famiglia" v={famiglia} />
                    </SectionBlock>
                )}
            </div>

            {!compact && (
                <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <SectionBlock contentClassName="space-y-2">
                        <SectionKeyValue k="Obiettivo" v={formatNumeric(row?.OBIETTIVO)} />
                        <SectionKeyValue k="Valore consolidato" v={formatNumeric(row?.VALORE_CONSOLIDATO)} />
                        <SectionKeyValue k="Rif. costo" v={toDisplayText(riferimentoCosto)} />
                    </SectionBlock>

                    <SectionBlock contentClassName="space-y-2">
                        <SectionKeyValue
                            k="Listino promo"
                            v={toDisplayText(toTextOrNull(row?.LISTINO_RIFERIMENTO_PROMO) ?? "-")}
                        />
                        <SectionKeyValue k="Sconto 1 promo" v={formatNumeric(row?.SCONTO_1_PROMO)} />
                        <SectionKeyValue k="Sconto 2 promo" v={formatNumeric(row?.SCONTO_2_PROMO)} />
                        <SectionKeyValue k="Ricarica promo" v={formatNumeric(row?.RICARICA_PROMO)} />
                    </SectionBlock>
                </div>
            )}
        </div>
    );
};

const TypeSwitch: React.FC<{
    activeType: ScontiViewType;
    onChange: (nextType: ScontiViewType) => void;
}> = ({ activeType, onChange }) => {
    const isCategoriaActive = activeType === "categoria";

    return (
        <div
            className="inline-flex items-center gap-2 rounded-full border border-neutral-200/70 dark:border-neutral-800/70 bg-neutral-50/80 dark:bg-neutral-900/50 px-2 py-1"
            onClick={(event) => event.stopPropagation()}
        >
            <button
                type="button"
                className={cn(
                    "px-2 py-[3px] rounded-full text-[11px] font-medium transition",
                    !isCategoriaActive
                        ? "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200"
                        : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                )}
                onClick={(event) => {
                    event.stopPropagation();
                    onChange("cliente");
                }}
            >
                Cliente
            </button>

            <FDSwitch
                size="sm"
                color="primary"
                checked={isCategoriaActive}
                ariaLabel="Mostra sconti categoria"
                onClick={(event) => event.stopPropagation()}
                onChange={(checked) => onChange(checked ? "categoria" : "cliente")}
            />

            <button
                type="button"
                className={cn(
                    "px-2 py-[3px] rounded-full text-[11px] font-medium transition",
                    isCategoriaActive
                        ? "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200"
                        : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                )}
                onClick={(event) => {
                    event.stopPropagation();
                    onChange("categoria");
                }}
            >
                Categoria
            </button>
        </div>
    );
};

export const Sconti: React.FC<{
    mode: PanelMode;
    sconti: ScontiPayload;
    onOpenDetails?: () => void;
}> = ({ mode, sconti, onOpenDetails }) => {
    const isSummary = mode === "summary";
    const [activeType, setActiveType] = React.useState<ScontiViewType>("cliente");

    const selectedPayload = activeType === "cliente" ? sconti.cliente : sconti.categoria;
    const selectedItems = Array.isArray(selectedPayload?.items) ? selectedPayload.items : [];
    const selectedTotal = Number(selectedPayload?.total ?? 0) || 0;
    const absoluteTotal = Number(sconti?.total ?? 0) || 0;
    const visibleRows = isSummary ? selectedItems.slice(0, PREVIEW_LIMIT) : selectedItems;
    const hiddenRows = isSummary ? Math.max(selectedItems.length - PREVIEW_LIMIT, 0) : 0;

    if (isSummary) {
        const clickable = typeof onOpenDetails === "function" && absoluteTotal > 0;

        return (
            <SectionContainer clickable={false} onActivate={onOpenDetails} dataTour="scheda-cliente-sconti">
                <SectionHeader
                    title="Sconti"
                    description="Sconti commerciali cliente e categoria"
                    rightContent={
                        <div className="flex flex-wrap items-center justify-end gap-2">
                            <SectionPill tone={selectedTotal > 0 ? "warn" : "neutral"}>
                                tipo: <span className="ml-1 font-semibold">{formatNumberIt(selectedTotal)}</span>
                            </SectionPill>

                            <SectionPill tone={absoluteTotal > 0 ? "ok" : "neutral"}>
                                totale: <span className="ml-1 font-semibold">{formatNumberIt(absoluteTotal)}</span>
                            </SectionPill>

                            {clickable && (
                                <SectionActionButton
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        onOpenDetails?.();
                                    }}
                                    rightIcon={FaPlus({})}
                                >
                                    <span>Dettagli</span>
                                </SectionActionButton>
                            )}
                        </div>
                    }
                />

                <div className="p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-[12px] font-semibold text-neutral-900 dark:text-neutral-100">
                            {typeLabelMap[activeType]}
                        </p>
                        <TypeSwitch activeType={activeType} onChange={setActiveType} />
                    </div>

                    {visibleRows.length > 0 ? (
                        <div className="space-y-2">
                            <div className="overflow-x-auto">
                                <table className="w-full text-[12px]">
                                    <thead>
                                        <tr className="border-b border-neutral-200 dark:border-neutral-800">
                                            {activeType === "categoria" && (
                                                <TableHeader>Cod. sconto</TableHeader>
                                            )}
                                            <TableHeader>Pref. fornitore</TableHeader>
                                            <TableHeader>Descrizione linea</TableHeader>
                                            <TableHeader>Inizio validita</TableHeader>
                                            <TableHeader>Fine validita</TableHeader>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {visibleRows.map((row, index) => (
                                            <tr
                                                key={`${activeType}-${index}-${toText(row?.PREFISSO_FORNITORE)}-${toText(row?.CODICE_LINEA)}`}
                                                className="border-b border-neutral-100 dark:border-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-900/40 transition"
                                            >
                                                {activeType === "categoria" && (
                                                    <TableCell>{toDisplayText(row?.CODICE_SCONTO)}</TableCell>
                                                )}
                                                <TableCell>{toDisplayText(row?.PREFISSO_FORNITORE)}</TableCell>
                                                <TableCell>{toDisplayText(row?.DESCRIZIONE_LINEA)}</TableCell>
                                                <TableCell>{formatDateMaybe(row?.DATA_INIZIO)}</TableCell>
                                                <TableCell>{formatDateMaybe(row?.DATA_FINE)}</TableCell>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {hiddenRows > 0 && (
                                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                                    Sono presenti altri {formatNumberIt(hiddenRows)} sconti in questa tipologia.
                                </p>
                            )}
                        </div>
                    ) : (
                        <SectionBlock>
                            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                                Nessuno sconto disponibile per {activeType === "cliente" ? "cliente" : "categoria"}.
                            </p>
                        </SectionBlock>
                    )}
                </div>
            </SectionContainer>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                    <SectionPill tone={selectedTotal > 0 ? "warn" : "neutral"}>
                        {typeLabelMap[activeType]}: <span className="ml-1 font-semibold">{formatNumberIt(selectedTotal)}</span>
                    </SectionPill>
                    <SectionPill tone={absoluteTotal > 0 ? "ok" : "neutral"}>
                        totale assoluto: <span className="ml-1 font-semibold">{formatNumberIt(absoluteTotal)}</span>
                    </SectionPill>
                </div>

                <TypeSwitch activeType={activeType} onChange={setActiveType} />
            </div>

            {visibleRows.length > 0 ? (
                <div className="space-y-3">
                    {visibleRows.map((row, index) => (
                        <ScontoRow
                            key={`${activeType}-${index}`}
                            row={row}
                            type={activeType}
                            compact={false}
                            rowIndex={index}
                        />
                    ))}
                </div>
            ) : (
                <div className="rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/70 dark:bg-neutral-900/40 p-4">
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        Nessuno sconto disponibile per questa tipologia.
                    </p>
                </div>
            )}
        </div>
    );
};
