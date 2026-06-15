import React, { useCallback, useMemo } from "react";
import { FiAlertTriangle, FiCheckCircle, FiFileText } from "react-icons/fi";
import { enqueueSnackbar } from "components/MessageBox";
import { Panel } from "../../components/shared/Panel";
import { InfoMini } from "../../components/shared/InfoMini";
import { EmptyState } from "../../components/shared/EmptyState";
import { pickDossierSections } from "../../utils/dossier";
import type { MepaAgentRunTrace, MepaDossierOperationalReport, MepaDossierQualityReport } from "../../types";
import { ActionCard, CriticalityCard, EvidenceHint, ValidationActions, ValidationStatusBadge } from "../validation";

/**
 * Props consumed by the Dossier tab.
 *
 * Most values are read models produced by `useMepaDossierController` and
 * `useMepaProductsController`. The tab should not fetch or mutate data directly;
 * it only renders the current state and delegates user actions through callbacks.
 */
type DossierTabProps = {
    dossier: any;
    latestAgentRun?: MepaAgentRunTrace | null;
    summary?: string | null;
    report?: MepaDossierOperationalReport | null;
    quality?: MepaDossierQualityReport | null;
    onLoadReport?: () => void;
    onLoadQuality?: () => void;
    loading?: string | null;
    criticalities?: any[];
    actions?: any[];
    onValidate?: (params: any) => void;
};

/**
 * Renders the AI dossier workspace tab.
 *
 * The dossier tab is intentionally isolated from the main MEPA page because it is a
 * heavy, evidence-rich view that is not needed during the first workspace render.
 * Keeping report, quality, requirements and validation UI behind this feature
 * boundary reduces the orchestration cost of the page shell and makes the tab
 * ready for future React.lazy code-splitting without changing its public props.
 */
export const DossierTab = React.memo(function DossierTab({
    dossier,
    latestAgentRun,
    summary,
    report,
    quality,
    onLoadReport,
    onLoadQuality,
    loading,
    criticalities,
    actions,
    onValidate,
}: DossierTabProps) {
    // Normalize heterogeneous dossier payloads into a consistent list of sections.
    // Memoization protects the validation cards from recalculating on unrelated
    // workspace renders.
    const sections = useMemo(() => pickDossierSections(dossier), [dossier]);
    // Requirements can come from the structured operational report or, for older
    // agent runs, directly from the latest trace output. The fallback keeps the
    // UI backward compatible during service-ai schema evolution.
    const requirements = useMemo(() => report?.requirements ?? (latestAgentRun?.outputs as any)?.requirements, [latestAgentRun?.outputs, report?.requirements]);

    // Clipboard export is UI-only and intentionally does not touch backend state.
    // It is guarded because clipboard access can be blocked by browser policy.
    const copyMarkdown = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(report?.markdown ?? "");
            enqueueSnackbar?.("Report markdown copiato negli appunti.", { variant: "success" } as any);
        } catch (error) {
            console.error(error);
            enqueueSnackbar?.("Non riesco a copiare il report.", { variant: "warning" } as any);
        }
    }, [report?.markdown]);

    // Local markdown download for operational sharing. URL revocation is mandatory
    // to avoid leaking object URLs during repeated downloads in long sessions.
    const downloadMarkdown = useCallback(() => {
        const content = report?.markdown ?? "";
        const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `dossier-mepa-${report?.tenderId ?? Date.now()}.md`;
        a.click();
        URL.revokeObjectURL(url);
    }, [report?.markdown, report?.tenderId]);

    return (
        <div className="flex flex-col gap-5">
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_0.9fr]">
                <Panel title="Dossier AI strutturato" icon={<FiFileText className="text-blue-500" />}>
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <p className="max-w-3xl text-sm leading-6 text-slate-600 dark:text-neutral-300">{report?.executiveSummary ?? summary}</p>
                        <div className="mt-4">
                            <h4 className="mb-3 text-sm font-bold uppercase tracking-[0.14em] text-slate-400">Sezioni validabili del dossier</h4>
                            {sections.length ? sections.map((section: any) => <DossierSection key={section.key ?? section.title} section={section} onValidate={onValidate} />) : <EmptyState text="Nessuna sezione dossier ancora disponibile." />}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button type="button" onClick={onLoadReport} disabled={loading === "dossier-report"} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300">Genera report</button>
                            <button type="button" onClick={onLoadQuality} disabled={loading === "dossier-quality"} className="rounded-xl border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-700 disabled:opacity-50 dark:border-blue-900 dark:text-blue-200">Verifica fonti</button>
                            <button type="button" onClick={copyMarkdown} disabled={!report?.markdown} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300">Copia MD</button>
                            <button type="button" onClick={downloadMarkdown} disabled={!report?.markdown} className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Scarica MD</button>
                        </div>
                    </div>

                    {report && <DossierOperationalReport report={report} />}
                    {quality && <DossierQualityPanel quality={quality} />}
                </Panel>
                <Panel title="Requisiti e certificazioni" icon={<FiCheckCircle className="text-emerald-500" />}>
                    {requirements ? <RequirementsView requirements={requirements} /> : <EmptyState text="Requisiti non ancora disponibili." />}
                </Panel>
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                <Panel title={`Criticità (${criticalities?.length ?? 0})`} icon={<FiAlertTriangle className="text-amber-500" />}>
                    {criticalities?.length ? (
                        <div className="flex flex-col gap-2">
                            {criticalities.map((item: any, index: number) => (
                                <CriticalityCard key={`c-${String(item?.id ?? item?.key ?? index)}`} item={item} targetId={String(item?.id ?? item?.key ?? index)} onValidate={onValidate} />
                            ))}
                        </div>
                    ) : (
                        <EmptyState text="Criticità non ancora disponibili." />
                    )}
                </Panel>
                <Panel title={`Azioni suggerite (${actions?.length ?? 0})`} icon={<FiCheckCircle className="text-blue-500" />}>
                    {actions?.length ? (
                        <div className="flex flex-col gap-2">
                            {actions.map((item: any, index: number) => (
                                <ActionCard key={`a-${String(item?.id ?? item?.key ?? index)}`} item={item} targetId={String(item?.id ?? item?.key ?? index)} onValidate={onValidate} />
                            ))}
                        </div>
                    ) : (
                        <EmptyState text="Azioni suggerite non ancora disponibili." />
                    )}
                </Panel>
            </div>
        </div>
    );
});

/**
 * Compact operational summary of the generated dossier.
 *
 * This sub-component is memoized because it can be rendered alongside large
 * validation lists; it should update only when the report object changes.
 */
const DossierOperationalReport = React.memo(function DossierOperationalReport({ report }: { report: MepaDossierOperationalReport }) {
    // Defensive normalization: readiness blockers may be absent when the report was
    // produced by an older agent version.
    const blockers = Array.isArray(report.readiness?.blockers) ? report.readiness.blockers : [];
    return (
        <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4 text-sm dark:bg-neutral-950">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Go / No-Go</p>
                <p className="mt-2 text-xl font-bold">{report.goNoGo?.suggestion ?? "PENDING"}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{report.goNoGo?.rationale ?? "Razionale non disponibile."}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 text-sm dark:bg-neutral-950">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Fonti</p>
                <p className="mt-2 text-xl font-bold">{report.evidence?.totalDocuments ?? 0} doc · {report.evidence?.totalChunks ?? 0} chunk</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">Report costruito solo su evidenze indicizzate nella pratica corrente.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 text-sm dark:bg-neutral-950">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Readiness</p>
                <p className="mt-2 text-xl font-bold">{report.readiness?.canPrepareQuotation ? "Operabile" : "Da completare"}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{report.readiness?.nextSuggestedStep ?? "Validare il dossier prima di procedere."}</p>
            </div>
            {blockers.length > 0 && (
                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800 lg:col-span-3 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
                    <p className="font-semibold">Blocchi / attenzioni prima di procedere</p>
                    <ul className="mt-2 list-disc pl-5 text-xs leading-5">
                        {blockers.map((blocker, index) => <li key={index}>{blocker}</li>)}
                    </ul>
                </div>
            )}
        </div>
    );
});

/**
 * Evidence-quality panel for human validation before operative use.
 *
 * The panel derives issue slices locally because these are display concerns; the
 * quality calculation itself remains owned by the backend/service-ai.
 */
const DossierQualityPanel = React.memo(function DossierQualityPanel({ quality }: { quality: MepaDossierQualityReport }) {
    // Split issue severity with memoized selectors to keep large quality reports
    // cheap when unrelated parent props change.
    const highIssues = useMemo(() => (quality.issues ?? []).filter((item) => item.severity === "HIGH"), [quality.issues]);
    const mediumIssues = useMemo(() => (quality.issues ?? []).filter((item) => item.severity === "MEDIUM"), [quality.issues]);
    const levelClass = quality.level === "HIGH" ? "bg-emerald-50 text-emerald-700 ring-emerald-100" : quality.level === "MEDIUM" ? "bg-amber-50 text-amber-700 ring-amber-100" : "bg-red-50 text-red-700 ring-red-100";
    // Only the most relevant issues are shown in the card. Full diagnostic detail
    // should remain available from the backend/report, not overload the tab UI.
    const visibleIssues = useMemo(() => [...highIssues, ...mediumIssues].slice(0, 5), [highIssues, mediumIssues]);

    return (
        <div className="mb-5 rounded-3xl border border-blue-100 bg-blue-50/40 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
            <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">Evidence Consistency</p>
                    <h4 className="mt-1 text-base font-bold text-slate-900 dark:text-neutral-100">Qualità fonti e copertura del dossier</h4>
                    <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-neutral-400">Verifica se le sezioni AI, criticità, azioni e righe prodotto sono supportate da evidenze risolvibili nella pratica corrente.</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${levelClass}`}>Score {quality.score}/100 · {quality.level}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <InfoMini label="Copertura evidenze" value={`${quality.metrics?.validEvidenceCoveragePct ?? 0}%`} />
                <InfoMini label="Target verificati" value={`${quality.metrics?.withValidEvidence ?? 0}/${quality.metrics?.totalTargets ?? 0}`} />
                <InfoMini label="Validazioni" value={`${quality.metrics?.validationPct ?? 0}%`} />
                <InfoMini label="Chunk risolti" value={`${quality.metrics?.resolvedChunkIds ?? 0}/${quality.metrics?.linkedChunkIds ?? 0}`} />
            </div>
            {quality.readiness?.blockers?.length ? (
                <div className="mt-3 rounded-2xl border border-amber-100 bg-amber-50 p-3 text-xs leading-5 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
                    <p className="mb-1 font-bold">Blocchi di consistenza prima dell'uso operativo</p>
                    <ul className="list-disc pl-5">
                        {quality.readiness.blockers.map((blocker, index) => <li key={index}>{blocker}</li>)}
                    </ul>
                </div>
            ) : (
                <div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-xs leading-5 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200">
                    {quality.readiness?.nextSuggestedStep ?? "La copertura evidenze è sufficiente per proseguire con le validazioni operative."}
                </div>
            )}
            <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950">
                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Issue principali</p>
                    {visibleIssues.length ? visibleIssues.map((item, index) => (
                        <div key={`${item.code}-${index}`} className="mb-2 rounded-xl border border-slate-100 p-2 text-xs dark:border-neutral-800">
                            <div className="flex justify-between gap-2">
                                <b>{item.title}</b>
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold h-fit
                                    ${item.severity === "HIGH" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
                                        {item.severity}
                                </span>
                            </div>
                            <p className="mt-1 leading-5 text-slate-500 dark:text-neutral-400">{item.description}</p>
                        </div>
                    )) : <p className="text-xs text-slate-500">Nessuna issue bloccante rilevata.</p>}
                </div>
            </div>
        </div>
    );
});

/** Renders structured requirements/certifications extracted from the tender. */
const RequirementsView = React.memo(function RequirementsView({ requirements }: { requirements: any }) {
    // Requirements payloads are normalized defensively because AI extraction can be
    // partial while the dossier is still being validated.
    const certifications = Array.isArray(requirements?.certifications) ? requirements.certifications : [];
    const groups: Array<[string, string[]]> = [
        ["Requisiti operativi", requirements?.operationalRequirements ?? []],
        ["Requisiti amministrativi", requirements?.administrativeRequirements ?? []],
        ["Vincoli consegna", requirements?.deliveryConstraints ?? []],
        ["Vincoli garanzia", requirements?.warrantyConstraints ?? []],
    ];
    return (
        <div className="space-y-3 text-sm">
            <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Certificazioni</p>
                {certifications.length ? certifications.slice(0, 12).map((cert: any, index: number) => (
                    <div key={index} className="mb-2 rounded-2xl border border-slate-100 p-3 text-xs dark:border-neutral-800">
                        <p className="font-semibold">{cert.code ?? cert.title ?? cert.name ?? "Certificazione"}</p>
                        <p className="mt-1 leading-5 text-slate-500 dark:text-neutral-400">{cert.description ?? cert.sourceHint ?? "Da verificare sulle evidenze."}</p>
                    </div>
                )) : <EmptyState text="Nessuna certificazione strutturata." />}
            </div>
            {groups.map(([label, values]) => Array.isArray(values) && values.length ? (
                <div key={label}>
                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p>
                    <ul className="list-disc pl-5 text-xs leading-5 text-slate-600 dark:text-neutral-300">
                        {values.slice(0, 8).map((value, index) => <li key={index}>{String(value)}</li>)}
                    </ul>
                </div>
            ) : null)}
        </div>
    );
});

/**
 * Single validable dossier section.
 *
 * The section owns no validation state: it only computes a stable target id and
 * delegates approve/reject operations to the shared validation controls.
 */
const DossierSection = React.memo(function DossierSection({ section, onValidate }: { section: any; onValidate?: (params: any) => void }) {
    // Stable validation target used by human-in-the-loop operations. The fallback
    // avoids crashing on partial sections but still produces a deterministic id.
    const targetId = String(section.key ?? section.id ?? section.title ?? "section");
    return (
        <div className="mb-3 rounded-2xl border border-slate-100 p-4 text-sm dark:border-neutral-800">
            <div className="mb-2 flex items-start justify-between gap-2">
                <h4 className="font-semibold">{section.title ?? section.key}</h4>
                <ValidationStatusBadge value={section.validationStatus ?? "AI_PROPOSED"} />
            </div>
            <p className="whitespace-pre-wrap text-xs leading-5 text-slate-600 dark:text-neutral-300">{String(section.content ?? "")}</p>
            <EvidenceHint evidenceRefs={section.evidenceRefs} />
            <ValidationActions status={section.validationStatus} targetType="DOSSIER_SECTION" targetId={targetId} sectionKey={section.key ?? null} onValidate={onValidate} />
        </div>
    );
});
