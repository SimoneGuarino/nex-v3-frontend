import React from "react";
import { FiChevronRight, FiPlus, FiRefreshCw } from "react-icons/fi";
import FDButton from "components/UI/buttons/FDButton";
import { StatusPill } from "../../components/StatusPill";
import { InfoMini } from "../../components/shared/InfoMini";
import { formatDate } from "../../utils/formatters";
import type { MepaTenderListItem } from "../../types";
import type { ScreenMode, WorkspaceSnapshot } from "../../domain/workspace.types";

export type MepaPageHeaderProps = {
    screenMode: ScreenMode;
    selectedTender: MepaTenderListItem | null;
    snapshot: WorkspaceSnapshot | null;
    loading: string | null;
    onBackToList: () => void;
    onCreateTender: () => void;
    onRefreshWorkspace: () => void;
    onOpenQuotation: () => void;
};

/**
 * Responsive MEPA page header.
 *
 * This component intentionally receives already-normalized data and callbacks.
 * It never reaches into workspace state directly, so it can be reused by the
 * list screen and workspace screen without triggering feature-tab renders.
 */
export function MepaPageHeader({
    screenMode,
    selectedTender,
    snapshot,
    loading,
    onBackToList,
    onCreateTender,
    onRefreshWorkspace,
    onOpenQuotation,
}: MepaPageHeaderProps) {
    // Header mode is derived, not stored, to avoid duplicating state between the
    // shell and the workspace controller. A selected tender is required because
    // the same route can transiently render during selection/reset transitions.
    const isWorkspace = screenMode === "workspace" && selectedTender;

    // Status summary comes from the workspace snapshot/read model. It is used
    // only for display KPIs; the component never decides pipeline behavior.
    const status = snapshot?.statusSummary;

    if (!isWorkspace) {
        return (
            <section className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-sm backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/80 md:p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                        <nav aria-label="Breadcrumb" className="mb-3 flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-500 dark:text-neutral-400">
                            <span className="truncate text-slate-900 dark:text-white">Gare MEPA</span>
                        </nav>
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white md:text-3xl">Lista gare</h1>
                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.08em] text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">Tender assistant</span>
                        </div>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-neutral-400">
                            Governa le pratiche MEPA, consulta lo stato delle analisi AI e apri il workspace operativo della gara.
                        </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <FDButton
                            type="button"
                            color="primary"
                            size="large"
                            icon={<FiPlus />}
                            onClick={onCreateTender}
                        >
                            Nuova Gara
                        </FDButton>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-sm backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/80 md:p-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0 flex-1">
                    <nav aria-label="Breadcrumb" className="mb-3 flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-500 dark:text-neutral-400">
                        <button type="button" onClick={onBackToList} className="inline-flex items-center gap-1 rounded-full px-2 py-1 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-neutral-800 dark:hover:text-white">
                            Gare MEPA
                        </button>
                        <FiChevronRight className="shrink-0 text-slate-300 dark:text-neutral-600" />
                        <span className="truncate text-slate-500 dark:text-neutral-400 underline">{selectedTender.title}</span>
                    </nav>
                    <div className="flex min-w-0 flex-wrap items-center gap-3">
                        <h1 className="min-w-0 truncate text-2xl font-semibold tracking-tight text-slate-950 dark:text-white md:text-3xl">{selectedTender.title}</h1>
                        <StatusPill value={selectedTender.status} />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500 dark:text-neutral-400">
                        <span>CIG {selectedTender.cig ?? "—"}</span>
                        <span className="hidden h-1 w-1 rounded-full bg-slate-300 dark:bg-neutral-700 sm:inline-block" />
                        <span>RDO {selectedTender.rdo ?? "—"}</span>
                        <span className="hidden h-1 w-1 rounded-full bg-slate-300 dark:bg-neutral-700 sm:inline-block" />
                        <span>Scadenza {formatDate(selectedTender.deadlineAt)}</span>
                        <span className="hidden h-1 w-1 rounded-full bg-slate-300 dark:bg-neutral-700 sm:inline-block" />
                        <span className="min-w-0 truncate">Stazione appaltante: {selectedTender.ente ?? "Non valorizzata"}</span>
                    </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <button type="button" onClick={onRefreshWorkspace} disabled={loading === "workspace"} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-950">
                        <FiRefreshCw /> Aggiorna
                    </button>
                    <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-950">
                        Condividi
                    </button>
                    <FDButton type="button" color="primary" variant="solid" radius="2xl" size="large" icon={<FiPlus />} onClick={onOpenQuotation} className="min-h-[46px] px-5 shadow-lg shadow-blue-600/20">
                        Nuova quotazione
                    </FDButton>
                </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
                <InfoMini label="Analisi" value={String(status?.analysisStatus ?? selectedTender.status ?? "—")} />
                <InfoMini label="Agenti" value={`${status?.completedSteps ?? 0}/${status?.totalSteps ?? 0}`} />
                <InfoMini label="Step corrente" value={String(status?.runningStep ?? status?.failedStep ?? "—")} />
                <InfoMini label="Dossier" value={status?.dossierReady ? "Pronto" : "In attesa"} />
                <InfoMini label="Prodotti" value={String(status?.extractedItemsCount ?? selectedTender.extractedItemsCount ?? 0)} />
                <InfoMini label="Validazioni" value={`${status?.validationSummary?.validated ?? 0}/${status?.validationSummary?.total ?? 0}`} />
            </div>
        </section>
    );
}
