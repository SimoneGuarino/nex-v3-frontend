// src/components/UI/panels/customerNotes/components/CustomerNotesHeader.tsx
/**
 * descrizione: Header operativo del manager note.
 * include:     KPI rapidi, filtri locali/server-side e azioni globali.
 */
import React, { useState } from "react";
import FDButton from "components/UI/buttons/FDButton";
import FDSelect from "components/UI/input/FDSelect";
import { MdRefresh } from "react-icons/md";
import { IoAddOutline } from "react-icons/io5";
import { NOTE_SCOPE_OPTIONS, SORT_PRESET_OPTIONS } from "../constants";
import type { NotesScopeFilter, NotesSummary, SortPresetValue } from "../types";
import FDInput from "components/UI/input/FDInput";
import { MdExpandLess, MdExpandMore } from "react-icons/md";
import { FDSkeletonLayout, FDSkeletonPresets, FDSkeletonSwitch } from "components/UI/box/FDSkeleton";

type CustomerNotesHeaderProps = {
    rowsCount: number;
    total: number;
    summary: NotesSummary;
    loadingTotal: boolean;
    loadingInitial: boolean;
    loadingMore: boolean;
    searchText: string;
    sortPreset: SortPresetValue;
    scopeFilter: NotesScopeFilter;
    onSearchTextChange: (value: string) => void;
    onSortPresetChange: (value: SortPresetValue) => void;
    onScopeFilterChange: (value: NotesScopeFilter) => void;
    onRefresh: (firstLoad?: boolean) => void;
    onOpenCreateDialog: () => void;
};

/** Header con metriche, filtri e azioni globali del manager. */
export const CustomerNotesHeader: React.FC<CustomerNotesHeaderProps> = ({
    rowsCount,
    total,
    summary,
    loadingTotal,
    loadingInitial,
    loadingMore,
    searchText,
    sortPreset,
    scopeFilter,
    onSearchTextChange,
    onSortPresetChange,
    onScopeFilterChange,
    onRefresh,
    onOpenCreateDialog,
}) => {
    /** Controlla l'espansione della sezione filtri/metriche avanzate. */
    const [expand, setExpand] = useState(true);
    return (
        <div className="border border-neutral-200 bg-white/75 px-5 py-4 backdrop-blur supports-[backdrop-filter]:backdrop-blur dark:border-neutral-700 dark:bg-neutral-900/70 rounded-xl">
            <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                            Note Cliente
                        </p>
                        <p className="text-sm text-neutral-600 dark:text-neutral-300">
                            {rowsCount} note caricate su {total || rowsCount} disponibili
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <FDButton
                            size="small"
                            radius="md"
                            variant="outline"
                            color="neutral"
                            onClick={expand ? () => setExpand(false) : () => setExpand(true)}
                            rightIcon={expand ? MdExpandLess({}) : MdExpandMore({})}
                        >
                            {expand ? "Riduci" : "Espandi"}
                        </FDButton>
                        <FDButton
                            variant="outline"
                            color="neutral"
                            rightIcon={MdRefresh({})}
                            size="small"
                            radius="md"
                            onClick={() => onRefresh(true)}
                            disabled={loadingInitial || loadingMore}
                        >
                            Aggiorna
                        </FDButton>
                        <FDButton
                            variant="solid"
                            color="primary"
                            size="small"
                            radius="md"
                            rightIcon={IoAddOutline({})}
                            onClick={onOpenCreateDialog}
                        >
                            Nuova nota
                        </FDButton>
                    </div>
                </div>
                {expand && (
                    <>
                        <div className="grid gap-3 md:grid-cols-4">

                            <FDSkeletonSwitch
                                loading={loadingTotal}
                                skeleton={FDSkeletonPresets.fieldRow("", "full")}
                                className=""
                            >
                                <div className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100">
                                    <p className="text-xs uppercase tracking-wide">Totali</p>
                                    <p className="text-xl font-semibold">{summary.total}</p>
                                </div>
                            </FDSkeletonSwitch>

                            <div className="rounded-xl border border-rose-200/80 bg-rose-50/70 px-3 py-2 text-rose-900 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-100">
                                <p className="text-xs uppercase tracking-wide">Amministrative</p>
                                <p className="text-xl font-semibold">{summary.ammi}</p>
                            </div>
                            <div className="rounded-xl border border-sky-200/80 bg-sky-50/70 px-3 py-2 text-sky-900 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-100">
                                <p className="text-xs uppercase tracking-wide">Commerciali</p>
                                <p className="text-xl font-semibold">{summary.commerciali}</p>
                            </div>
                            <div className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100">
                                <p className="text-xs uppercase tracking-wide">Visualizzate</p>
                                <p className="text-xl font-semibold">{rowsCount}</p>
                            </div>
                        </div>

                        <div className="grid gap-2 lg:grid-cols-2">
                            <div className="rounded-xl border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800">
                                <label className="block text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-300">
                                    Cerca nota
                                </label>
                                <FDInput
                                    type="text"
                                    color="neutral"
                                    radius="md"
                                    size="sm"
                                    value={searchText}
                                    onChange={(event) => onSearchTextChange(event.target.value)}
                                    placeholder="Cliente, testo nota, utente..."
                                    clearable
                                />
                            </div>

                            <div className="rounded-xl border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800">
                                <label className=" block text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-300">
                                    Ordinamento Nota
                                </label>
                                <FDSelect
                                    options={SORT_PRESET_OPTIONS}
                                    value={sortPreset}
                                    /** Fallback difensivo su preset default in caso di valore non-stringa. */
                                    onChange={(value) =>
                                        onSortPresetChange(
                                            typeof value === "string"
                                                ? (value as SortPresetValue)
                                                : "DATA_NOTA:desc"
                                        )
                                    }
                                    size="sm"
                                    radius="md"
                                    fullWidth
                                />
                            </div>

                            <div className="rounded-xl col-span-2 border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800">
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-300">
                                    Tipologia
                                </label>
                                <div className="grid grid-cols-3 gap-1 rounded-md bg-neutral-100 p-1 dark:bg-neutral-700">
                                    {NOTE_SCOPE_OPTIONS.map((option) => {
                                        const isActive = scopeFilter === option.value;
                                        return (
                                            <button
                                                key={option.value}
                                                type="button"
                                                onClick={() => onScopeFilterChange(option.value)}
                                                className={`rounded-md px-2 py-1 text-xs font-semibold transition ${isActive
                                                    ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-neutral-100"
                                                    : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100"
                                                    }`}
                                            >
                                                {option.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </>
                )}



            </div>
        </div>

    );
};

export default CustomerNotesHeader;
