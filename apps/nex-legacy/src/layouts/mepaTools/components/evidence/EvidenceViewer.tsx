import React, { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiCheckCircle, FiDatabase, FiFileText, FiHash, FiLayers } from "react-icons/fi";
import { SidePanelShell } from "components/UI/panels/SidePanelShell";
import {
    SectionBlock,
    SectionContainer,
    SectionHeader,
    SectionKeyValue,
    SectionPill,
} from "components/UI/panels/customersPanel/components/sectionUi";
import type { MepaEvidenceDetail } from "../../types";

/**
 * Side-panel evidence inspector used by all MEPA explainability links.
 *
 * CustomerPanel-aligned UX contract:
 * - the evidence is presented as a structured detail sheet, not as a technical modal;
 * - every section uses the same visual primitives used by the customer detail panel;
 * - the first card answers "what is this source and can I trust it?";
 * - the full indexed excerpt remains readable, but technical identifiers are demoted to audit metadata;
 * - the panel is read-only because validation actions belong to the product/tender workflow, not here.
 */
export function EvidenceViewer({ evidence, loading, onClose }: { evidence: MepaEvidenceDetail["evidence"] | null; loading: boolean; onClose: () => void }) {
    const open = Boolean(evidence || loading);

    /**
     * UI-facing projection of the backend evidence payload.
     * Keeping this memoized prevents repeated string coercion on every render and gives the JSX a
     * clean, business-readable vocabulary similar to CustomersPanel sections.
     */
    const vm = useMemo(() => buildEvidenceViewModel(evidence), [evidence]);

    return (
        <AnimatePresence>
            {open ? (
                <>
                    <motion.div
                        className="fixed inset-0 z-[1490] bg-slate-950/25 backdrop-blur-[2px]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        aria-hidden="true"
                    />

                    <div className="fixed inset-0 z-[1500] flex justify-end pointer-events-none" aria-modal="true" role="dialog" aria-label="Fonte documentale della gara">
                        <div className="relative ml-auto h-full w-full max-w-xl pointer-events-auto sm:max-w-2xl">
                            <SidePanelShell
                                title="Fonte documentale della gara"
                                onClose={onClose}
                                bodyClassName="bg-neutral-100/70 dark:bg-neutral-950/75"
                            >
                                {loading ? (
                                    <EvidenceLoadingState />
                                ) : (
                                    <div className="space-y-4">
                                        <EvidenceHero vm={vm} />
                                        <EvidenceContentSection vm={vm} />
                                        <EvidenceTraceabilitySection vm={vm} />
                                    </div>
                                )}
                            </SidePanelShell>
                        </div>
                    </div>
                </>
            ) : null}
        </AnimatePresence>
    );
}

type EvidenceViewModel = {
    title: string;
    subtitle: string;
    documentType: string;
    pageLabel: string;
    sectionLabel: string;
    qualityLabel: string;
    qualityTone: "ok" | "warn" | "neutral";
    indexedAtLabel: string;
    chunkLabel: string;
    text: string;
    sourceRows: Array<{ label: string; value: string }>;
};

/**
 * Builds a presentation-safe model for the evidence panel.
 *
 * The backend payload can contain long technical identifiers and optional metadata. This function
 * normalizes those values once and decides which details are user-facing versus audit-only.
 */
function buildEvidenceViewModel(evidence: MepaEvidenceDetail["evidence"] | null): EvidenceViewModel {
    const title = String(evidence?.documentTitle ?? evidence?.documentId ?? "Fonte documentale");
    const documentType = String(evidence?.documentType ?? "Documento gara");
    const quality = String(evidence?.quality?.level ?? "MEDIUM").toUpperCase();
    const pageLabel = evidence?.page ? `Pagina ${evidence.page}` : "Pagina n.d.";
    const sectionLabel = String(evidence?.sectionTitle ?? "Sezione non indicata");
    const indexedAt = evidence?.indexedAt ?? evidence?.updatedAt ?? null;
    const chunkId = evidence?.chunkId ? String(evidence.chunkId) : "";
    const chunkLabel = chunkId ? `Chunk ${chunkId.slice(0, 12)}…` : "Chunk non disponibile";
    const text = String(evidence?.text ?? evidence?.excerpt ?? "Nessun testo disponibile.");

    const qualityTone: EvidenceViewModel["qualityTone"] = quality === "HIGH" ? "ok" : quality === "LOW" ? "warn" : "neutral";
    const subtitle = "Estratto indicizzato usato dall'AI per spiegare una proposta o una verifica della gara.";

    const sourceRows = [
        { label: "Documento", value: title },
        { label: "Tipo", value: documentType },
        { label: "Pagina", value: evidence?.page ? String(evidence.page) : "n.d." },
        { label: "Sezione", value: sectionLabel },
        { label: "Indicizzazione", value: formatEvidenceDate(indexedAt) },
        { label: "Riferimento tecnico", value: chunkId ? chunkLabel : "n.d." },
    ];

    return {
        title,
        subtitle,
        documentType,
        pageLabel,
        sectionLabel,
        qualityLabel: `qualità: ${quality}`,
        qualityTone,
        indexedAtLabel: formatEvidenceDate(indexedAt),
        chunkLabel,
        text,
        sourceRows,
    };
}

/** Formats backend timestamps without making assumptions about locale-specific business rules. */
function formatEvidenceDate(value?: string | null) {
    if (!value) return "n.d.";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/**
 * Top summary card, intentionally similar to the customer panel header sections.
 * It gives operators enough context before they read the full excerpt.
 */
function EvidenceHero({ vm }: { vm: EvidenceViewModel }) {
    return (
        <SectionContainer className="overflow-hidden bg-white/90 dark:bg-neutral-900/70">
            <SectionHeader
                title="Fonte documentale"
                description="Origine e qualità dell'evidenza recuperata dal corpus gara."
                icon={<FiFileText className="text-sky-500" />}
                rightContent={<SectionPill tone={vm.qualityTone}>{vm.qualityLabel}</SectionPill>}
            />
            <div className="space-y-3 p-4">
                <div className="rounded-xl border border-neutral-200/70 bg-white p-4 dark:border-neutral-800/70 dark:bg-neutral-950/60">
                    <div className="flex flex-wrap gap-2">
                        <SectionPill tone="neutral">{vm.documentType}</SectionPill>
                        <SectionPill tone="neutral">{vm.pageLabel}</SectionPill>
                        <SectionPill tone="neutral">{vm.sectionLabel}</SectionPill>
                    </div>
                    <h3 className="mt-3 text-[15px] font-semibold leading-snug text-neutral-950 dark:text-neutral-50">{vm.title}</h3>
                    <p className="mt-2 text-[12px] leading-5 text-neutral-500 dark:text-neutral-400">{vm.subtitle}</p>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <SectionBlock title="Stato fonte">
                        <div className="space-y-2">
                            <SectionKeyValue k="Qualità" v={vm.qualityLabel.replace("qualità: ", "")} />
                            <SectionKeyValue k="Indicizzata" v={vm.indexedAtLabel} />
                        </div>
                    </SectionBlock>
                    <SectionBlock title="Posizione">
                        <div className="space-y-2">
                            <SectionKeyValue k="Pagina" v={vm.pageLabel.replace("Pagina ", "")} />
                            <SectionKeyValue k="Sezione" v={vm.sectionLabel} />
                        </div>
                    </SectionBlock>
                </div>
            </div>
        </SectionContainer>
    );
}

/** Main read-only excerpt section. */
function EvidenceContentSection({ vm }: { vm: EvidenceViewModel }) {
    return (
        <SectionContainer className="overflow-hidden bg-white/90 dark:bg-neutral-900/70">
            <SectionHeader
                title="Estratto indicizzato"
                description="Testo recuperato dal motore RAG e usato come evidenza documentale."
                icon={<FiLayers className="text-sky-500" />}
                rightContent={<SectionPill tone="neutral">Read-only</SectionPill>}
            />
            <div className="p-4">
                <div className="max-h-[54vh] overflow-auto rounded-xl border border-neutral-200/70 bg-neutral-50/70 p-4 dark:border-neutral-800/70 dark:bg-neutral-950/50">
                    <p className="whitespace-pre-wrap text-[12px] leading-6 text-neutral-700 dark:text-neutral-200">{vm.text}</p>
                </div>
            </div>
        </SectionContainer>
    );
}

/** Technical traceability, demoted to the bottom exactly like secondary customer-panel details. */
function EvidenceTraceabilitySection({ vm }: { vm: EvidenceViewModel }) {
    return (
        <SectionContainer className="overflow-hidden bg-white/90 dark:bg-neutral-900/70">
            <SectionHeader
                title="Tracciabilità"
                description="Metadati utili a verificare l'origine dell'evidenza senza esporre ID tecnici come contenuto principale."
                icon={<FiDatabase className="text-sky-500" />}
                rightContent={<SectionPill tone="ok"><FiCheckCircle className="mr-1" /> collegata alla gara</SectionPill>}
            />
            <div className="space-y-3 p-4">
                <SectionBlock title="Metadati fonte">
                    <div className="space-y-2">
                        {vm.sourceRows.map((row) => (
                            <SectionKeyValue key={row.label} k={row.label} v={row.value} />
                        ))}
                    </div>
                </SectionBlock>
                <SectionBlock title="Nota operativa">
                    <div className="flex gap-2 text-[11px] leading-5 text-neutral-600 dark:text-neutral-300">
                        <FiHash className="mt-0.5 shrink-0 text-neutral-400" />
                        <p>
                            Questa fonte viene recuperata dalla gara corrente e deve essere usata come supporto alla verifica. La decisione finale resta nel flusso operativo del dettaglio prodotto e della successiva quotazione.
                        </p>
                    </div>
                </SectionBlock>
            </div>
        </SectionContainer>
    );
}

/** Loading state aligned to CustomersPanel section cards instead of generic skeleton blocks. */
function EvidenceLoadingState() {
    return (
        <div className="space-y-4">
            <SectionContainer className="overflow-hidden bg-white/90 dark:bg-neutral-900/70">
                <SectionHeader title="Fonte documentale" description="Caricamento evidenza in corso..." icon={<FiFileText className="text-sky-500" />} />
                <div className="space-y-3 p-4">
                    <div className="h-4 w-32 rounded-full bg-neutral-100 dark:bg-neutral-800" />
                    <div className="h-6 w-4/5 rounded-full bg-neutral-100 dark:bg-neutral-800" />
                    <div className="h-4 w-full rounded-full bg-neutral-100 dark:bg-neutral-800" />
                    <div className="h-4 w-2/3 rounded-full bg-neutral-100 dark:bg-neutral-800" />
                </div>
            </SectionContainer>
            <SectionContainer className="overflow-hidden bg-white/90 dark:bg-neutral-900/70">
                <SectionHeader title="Estratto indicizzato" description="Preparazione contenuto fonte." icon={<FiLayers className="text-sky-500" />} />
                <div className="p-4">
                    <div className="h-40 rounded-xl bg-neutral-100 dark:bg-neutral-800" />
                </div>
            </SectionContainer>
        </div>
    );
}
