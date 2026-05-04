import React from "react";
import type { AnyRecord, PanelMode } from "../types";
import { formatCurrencyIt, formatNumberIt } from "../helpers/panelUtils";
import {
    SectionActionButton,
    SectionBlock,
    SectionContainer,
    SectionHeader,
    SectionPill,
} from "../components/sectionUi";
import { FaPlus } from "react-icons/fa";

export const Credit: React.FC<{
    mode: PanelMode;
    creditsYears: AnyRecord | null;
    onOpenDetails?: () => void;
}> = ({ mode, creditsYears, onOpenDetails }) => {
    const isSummary = mode === "summary";

    if (!creditsYears) {
        return (
            <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-900/60 p-4">
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Dati creditizi non disponibili.</p>
            </div>
        );
    }

    const foc = creditsYears?.Focelda ?? {};
    const iot = creditsYears?.IOT ?? {};

    const yearKeys = Object.keys(foc).filter((k) => /^\d{4}$/.test(k)).sort();
    const lastYear = yearKeys.length ? yearKeys[yearKeys.length - 1] : null;

    return (
        <SectionContainer clickable={false} onActivate={onOpenDetails}>
            <SectionHeader
                title="Dati Creditizi"
                description={isSummary ? "Sintesi per anni e insoluti" : "Dettaglio valori per anno (focelda e iot)"}
                rightContent={
                    isSummary ? (
                        <SectionActionButton
                            onClick={(event) => {
                                event.stopPropagation();
                                onOpenDetails?.();
                            }}
                            rightIcon={FaPlus({})}
                        >
                            <span>Dettagli</span>
                        </SectionActionButton>
                    ) : null
                }
            />

            <div className="p-4 space-y-3">
                {isSummary ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <SectionBlock>
                            <p className="text-[10px] text-neutral-500 dark:text-neutral-400">focelda corrente</p>
                            <p className="mt-1 text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
                                {formatCurrencyIt(foc.Corrente ?? 0)}
                            </p>
                        </SectionBlock>

                        <SectionBlock>
                            <p className="text-[10px] text-neutral-500 dark:text-neutral-400">insoluti correnti</p>
                            <p className="mt-1 text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
                                {formatNumberIt(foc.CorrenteInsoluti ?? 0)}
                            </p>
                        </SectionBlock>

                        <SectionBlock>
                            <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                                {lastYear ? `focelda ${lastYear}` : "ultimo anno"}
                            </p>
                            <p className="mt-1 text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
                                {lastYear ? formatCurrencyIt(foc[lastYear] ?? 0) : "-"}
                            </p>
                        </SectionBlock>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/70 dark:bg-neutral-900/40 overflow-hidden">
                            <div className="px-4 py-3 border-b border-neutral-200/60 dark:border-neutral-800/70 flex items-center justify-between">
                                <p className="text-[12px] font-semibold text-neutral-900 dark:text-neutral-100">focelda</p>
                                <SectionPill>
                                    insoluti correnti: <span className="ml-1 font-semibold">{formatNumberIt(foc.CorrenteInsoluti ?? 0)}</span>
                                </SectionPill>
                            </div>

                            <div className="p-4">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-[11px]">
                                        <thead>
                                            <tr className="text-left text-neutral-500 dark:text-neutral-400">
                                                <th className="py-2 pr-3 font-semibold">Anno</th>
                                                <th className="py-2 pr-3 font-semibold">Valore</th>
                                                <th className="py-2 font-semibold">Insoluti</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-neutral-800 dark:text-neutral-100">
                                            {Object.keys(foc)
                                                .filter((k) => /^\d{4}$/.test(k))
                                                .sort()
                                                .map((y) => (
                                                    <tr key={y} className="border-t border-neutral-200/60 dark:border-neutral-800/60">
                                                        <td className="py-2 pr-3 font-medium">{y}</td>
                                                        <td className="py-2 pr-3">{formatCurrencyIt(foc[y])}</td>
                                                        <td className="py-2">{formatNumberIt(foc[`${y}Insoluti`] ?? 0)}</td>
                                                    </tr>
                                                ))}
                                            <tr className="border-t border-neutral-200/60 dark:border-neutral-800/60">
                                                <td className="py-2 pr-3 font-medium">Corrente</td>
                                                <td className="py-2 pr-3">{formatCurrencyIt(foc.Corrente ?? 0)}</td>
                                                <td className="py-2">{formatNumberIt(foc.CorrenteInsoluti ?? 0)}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/70 dark:bg-neutral-900/40 overflow-hidden">
                            <div className="px-4 py-3 border-b border-neutral-200/60 dark:border-neutral-800/70 flex items-center justify-between">
                                <p className="text-[12px] font-semibold text-neutral-900 dark:text-neutral-100">iot</p>
                                <SectionPill>
                                    corrente: <span className="ml-1 font-semibold">{formatCurrencyIt(iot.Corrente ?? 0)}</span>
                                </SectionPill>
                            </div>

                            <div className="p-4">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-[11px]">
                                        <thead>
                                            <tr className="text-left text-neutral-500 dark:text-neutral-400">
                                                <th className="py-2 pr-3 font-semibold">Anno</th>
                                                <th className="py-2 font-semibold">Valore</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-neutral-800 dark:text-neutral-100">
                                            {Object.keys(iot)
                                                .filter((k) => /^\d{4}$/.test(k))
                                                .sort()
                                                .map((y) => (
                                                    <tr key={y} className="border-t border-neutral-200/60 dark:border-neutral-800/60">
                                                        <td className="py-2 pr-3 font-medium">{y}</td>
                                                        <td className="py-2">{formatCurrencyIt(iot[y])}</td>
                                                    </tr>
                                                ))}
                                            <tr className="border-t border-neutral-200/60 dark:border-neutral-800/60">
                                                <td className="py-2 pr-3 font-medium">Corrente</td>
                                                <td className="py-2">{formatCurrencyIt(iot.Corrente ?? 0)}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </SectionContainer>
    );
};
