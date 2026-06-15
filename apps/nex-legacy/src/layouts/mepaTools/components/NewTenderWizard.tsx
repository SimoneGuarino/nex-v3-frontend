import { DragEvent, MutableRefObject, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiCheckCircle, FiCpu, FiFileText, FiRefreshCw, FiShield, FiStar, FiUploadCloud, FiZap } from "react-icons/fi";
import { FDBackdrop, FDButton} from "@nex/fd-ui";
import { SidePanelShell } from "components/UI/panels/SidePanelShell";
import { enqueueSnackbar } from "components/MessageBox";
import { createMepaTenderDraft, finalizeMepaTenderWorkspace, runMepaTenderFormPrefillAgent, uploadMepaTenderDocuments } from "../fetchData/mepaAi";
import { MepaTenderPrefill } from "../types";

type Props = {
    open: boolean;
    onClose: () => void;
    abortController: MutableRefObject<AbortController | null>;
    onCreated?: (tender: any) => void;
};

/**
 * Local editable form used only by the wizard.
 *
 * The persistent source of truth remains the service-ai workspace created at
 * the end of the flow. Keeping this state local avoids mutating a real tender
 * until the user has reviewed the AI prefill and explicitly finalizes the
 * workspace. This is important for rollback and for avoiding partially-created
 * business objects when the upload/prefill phase fails.
 */
type FormState = {
    title: string;
    ente: string;
    cig: string;
    cup: string;
    rdo: string;
    deadlineAt: string;
    procedureType: string;
};

/**
 * Deterministic empty state for the wizard.
 *
 * The object is intentionally module-scoped and immutable by convention: every
 * reset should reuse this value so the wizard always starts from the same
 * predictable baseline.
 */
const emptyForm: FormState = {
    title: "",
    ente: "",
    cig: "",
    cup: "",
    rdo: "",
    deadlineAt: "",
    procedureType: "MEPA_RDO",
};

/**
 * Adapts the FORM_PREFILL_AGENT response to the editable React form model.
 *
 * The agent output is treated as a proposal, never as final truth. Nullable or
 * missing values are normalized to empty strings so every input remains
 * controlled and React never switches between controlled/uncontrolled mode.
 */
function applyPrefill(prefill: MepaTenderPrefill): FormState {
    return {
        title: prefill.title ?? "",
        ente: prefill.ente ?? "",
        cig: prefill.cig ?? "",
        cup: prefill.cup ?? "",
        rdo: prefill.rdo ?? "",
        deadlineAt: prefill.deadlineAt ?? "",
        procedureType: prefill.procedureType ?? "MEPA_RDO",
    };
}

/**
 * Converts a browser File into Base64 for the current service-ai contract.
 *
 * The conversion chunks the Uint8Array before calling String.fromCharCode.
 * Passing a large array all at once can overflow the call stack on some
 * browsers and low-memory clients. This keeps the current API compatible while
 * limiting client-side risk until the backend moves to multipart/form-data or
 * signed object uploads.
 */
async function fileToBase64(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
}

/**
 * Builds a stable, URL/log-safe document id from tender id, index and file name.
 *
 * The filename is user-controlled input, therefore every unsafe character is
 * replaced before the id is sent to service-ai or shown in diagnostics.
 */
function safeDocumentId(tenderId: string, index: number, file: File): string {
    return `${tenderId}-${index}-${file.name}`.replace(/[^a-z0-9._-]/gi, "_");
}

/**
 * Drawer-style wizard used to create a new MEPA workspace.
 *
 * Architectural note:
 * this component owns only the short-lived creation flow. Once the workspace is
 * finalized, long-running analysis, polling, documents and products are handled
 * by the page-level controllers. Keeping this boundary small prevents the
 * wizard from becoming another long-lived domain container.
 */

const stepItems = [
    { id: 1, label: "Documenti", description: "Upload gara" },
    { id: 2, label: "AI Prefill", description: "Dati estratti" },
    { id: 3, label: "Workspace", description: "Orchestratore" },
] as const;

const inputFields: Array<[keyof FormState, string, string]> = [
    ["title", "Titolo gara", "Es. Fornitura apparati e servizi ICT"],
    ["ente", "Ente / Stazione appaltante", "Es. Poste Italiane S.p.A."],
    ["cig", "CIG", "Codice identificativo gara"],
    ["cup", "CUP", "Codice unico progetto"],
    ["rdo", "RDO", "Numero RdO / confronto competitivo"],
    ["deadlineAt", "Scadenza", "Data e ora termine presentazione"],
    ["procedureType", "Tipologia", "Es. MEPA_RDO"],
];

function formatFileSize(size: number): string {
    if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    return `${Math.max(1, Math.round(size / 1024))} KB`;
}

function wizardLoadingLabel(loading: string | null): string | null {
    if (loading === "upload") return "Caricamento documenti e indicizzazione RAG...";
    if (loading === "prefill") return "FORM_PREFILL_AGENT sta leggendo la gara...";
    if (loading === "finalize") return "Creazione workspace e schedulazione orchestratore...";
    return null;
}

export function NewTenderWizard({ open, onClose, abortController, onCreated }: Props) {
    // Wizard step currently visible to the user. It is intentionally limited to
    // a discriminated numeric union so invalid UI states cannot be represented.
    const [step, setStep] = useState<1 | 2 | 3>(1);

    // Raw browser File objects selected by the user. These are never persisted
    // in React beyond the wizard lifetime and are converted only during upload.
    const [files, setFiles] = useState<File[]>([]);

    // Workspace draft id returned by service-ai after phase 1. It gates the
    // finalize operation and prevents creating a business workspace without a
    // backing draft/document context.
    const [tenderId, setTenderId] = useState<string | null>(null);

    // AI prefill proposal shown to the user for review. It is kept separate
    // from `form` so diagnostics can still display model/confidence metadata.
    const [prefill, setPrefill] = useState<MepaTenderPrefill | null>(null);

    // Controlled form edited by the user after the AI proposal is applied.
    const [form, setForm] = useState<FormState>(emptyForm);

    // Local operation marker. String values are intentionally explicit because
    // the UI needs different labels for upload, prefill and finalize phases.
    const [loading, setLoading] = useState<string | null>(null);

    // Non-blocking warnings generated during upload. Example: files skipped
    // because they exceed the temporary browser/Base64 payload threshold.
    const [uploadWarnings, setUploadWarnings] = useState<string[]>([]);

    // Visual state dedicated to drag-and-drop feedback. Keeping it separate
    // from files prevents accidental uploads while still giving clear affordance
    // that the drop zone is active and ready to receive documents.
    const [isDragActive, setIsDragActive] = useState(false);

    // First-step CTA guard. The user can proceed only after choosing at least
    // one document; deeper validations are handled by runPhaseOneAndTwo.
    const canContinue = files.length > 0;

    // Filters files that can safely travel through the current Base64 endpoint.
    // Memoization avoids recalculating the array during unrelated input edits.
    const readableFiles = useMemo(() => files.filter((file) => file.size <= 25 * 1024 * 1024), [files]);

    /**
     * Replaces the selected file set.
     *
     * The wizard uses replacement instead of append semantics: a new file
     * selection represents a new ingestion attempt and previous warnings must
     * not leak into the next attempt.
     */
    const handleFiles = (incoming: FileList | null) => {
        const next = Array.from(incoming ?? []);
        setFiles(next);
        setUploadWarnings([]);
    };

    /**
     * Provides explicit drag-over feedback for the upload drop zone.
     *
     * Native browser drag events are noisy because children can emit nested
     * enter/leave events. The handlers keep the UX intentionally simple: while
     * the pointer carries files over the drop zone, the panel highlights and
     * shows a clear “rilascia qui” state; dropping replaces the current set.
     */
    const handleDragEnter = (event: DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        event.stopPropagation();
        if (event.dataTransfer?.types?.includes("Files")) setIsDragActive(true);
    };

    const handleDragOver = (event: DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        event.stopPropagation();
        if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
        if (event.dataTransfer?.types?.includes("Files")) setIsDragActive(true);
    };

    const handleDragLeave = (event: DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        event.stopPropagation();
        const current = event.currentTarget;
        const nextTarget = event.relatedTarget as Node | null;
        if (!nextTarget || !current.contains(nextTarget)) setIsDragActive(false);
    };

    const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragActive(false);
        handleFiles(event.dataTransfer?.files ?? null);
    };

    /**
     * Restores the wizard to the initial local state.
     *
     * This is intentionally a client-side reset: if a draft was already created
     * on service-ai it remains harmless server-side state and the user can start
     * a clean creation flow without stale files, AI proposals or form values.
     */
    const handleResetWizard = () => {
        if (loading) return;
        setStep(1);
        setFiles([]);
        setTenderId(null);
        setPrefill(null);
        setForm(emptyForm);
        setUploadWarnings([]);
        setIsDragActive(false);
    };

    /**
     * Executes draft creation, document upload and AI form prefill.
     *
     * The phase is intentionally sequential: first a draft workspace is created,
     * then documents are uploaded against that id, finally the FORM_PREFILL_AGENT
     * reads the indexed/RAG context. This order keeps server-side state
     * explainable and avoids sending large Base64 payloads multiple times.
     */
    const runPhaseOneAndTwo = async () => {
        if (!files.length) return;
        try {
            setLoading("upload");
            const draft = await createMepaTenderDraft({ abortController, title: files[0]?.name?.replace(/\.[^.]+$/, "") });
            const id = String((draft as any)?.data?._id ?? (draft as any)?.data?.id ?? "");
            if (!id) throw new Error("Tender draft id non restituito dal service-ai");
            setTenderId(id);

            const warnings: string[] = [];
            if (readableFiles.length !== files.length) {
                warnings.push("Alcuni file superano il limite temporaneo di 25MB e non sono stati inviati al service-ai.");
            }

            const documents = await Promise.all(readableFiles.map(async (file, index) => ({
                documentId: safeDocumentId(id, index, file),
                documentTitle: file.name,
                fileName: file.name,
                mimeType: file.type || undefined,
                documentType: "GARA_UPLOAD",
                rawFileBase64: await fileToBase64(file),
            })));

            await uploadMepaTenderDocuments({
                abortController,
                tenderId: id,
                documents,
                forceRebuild: true,
            });

            setLoading("prefill");
            const prefillResponse = await runMepaTenderFormPrefillAgent({
                abortController,
                tenderId: id,
                // I documenti sono già stati presi in carico dal DOCUMENT_EXTRACTION_AGENT
                // tramite /documents/upload. Qui il FORM_PREFILL_AGENT lavora sul RAG indicizzato,
                // evitando di reinviare payload base64 pesanti e duplicare l’ingestion.
                documents: [],
                forceRebuild: false,
            });
            const nextPrefill = prefillResponse?.data?.prefill;
            setPrefill(nextPrefill ?? null);
            if (nextPrefill) setForm(applyPrefill(nextPrefill));
            setUploadWarnings(warnings);
            setStep(2);
            enqueueSnackbar?.("Documenti elaborati dall'agent e form precompilato dall'AI", { variant: "success" } as any);
        } catch (error) {
            console.error(error);
            enqueueSnackbar?.("Precompilazione agentica non riuscita. Verifica service-ai, parser documentale, OPENAI_API_KEY e MODEL_NAME.", { variant: "error" } as any);
        } finally {
            setLoading(null);
        }
    };

    /**
     * Finalizes the reviewed form into an operational MEPA workspace.
     *
     * At this point user-edited fields win over the AI proposal. The backend is
     * asked to schedule the analysis pipeline in background so the UI does not
     * block on long-running product/dossier agents.
     */
    const handleFinalize = async () => {
        if (!tenderId) return;
        try {
            setLoading("finalize");
            const result = await finalizeMepaTenderWorkspace({
                abortController,
                tenderId,
                input: {
                    title: form.title || null,
                    ente: form.ente || null,
                    cig: form.cig || null,
                    cup: form.cup || null,
                    rdo: form.rdo || null,
                    deadlineAt: form.deadlineAt || null,
                    procedureType: form.procedureType || "MEPA_RDO",
                    runAnalysis: true,
                },
            });
            setStep(3);
            onCreated?.(result?.data?.tender ?? result?.data);
            enqueueSnackbar?.("Workspace gara creato. Orchestratore AI schedulato in background", { variant: "success" } as any);
        } catch (error) {
            console.error(error);
            enqueueSnackbar?.("Creazione workspace non riuscita", { variant: "error" } as any);
        } finally {
            setLoading(null);
        }
    };

    const loadingLabel = wizardLoadingLabel(loading);

    const footer = (
        <div className="border-t border-white/10 bg-white/90 px-5 py-4 backdrop-blur-xl dark:border-neutral-800/80 dark:bg-neutral-950/90">
            {step === 1 && (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs leading-5 text-slate-500 dark:text-neutral-400">
                        L’upload crea una bozza, indicizza i documenti e attiva il prefill AI prima della conferma umana.
                    </p>
                    <FDButton
                        type="button"
                        color="purple"
                        variant="gradient"
                        radius="2xl"
                        size="large"
                        icon={<FiStar />}
                        disabled={!canContinue || loading === "upload" || loading === "prefill"}
                        loading={loading === "upload" || loading === "prefill"}
                        onClick={runPhaseOneAndTwo}
                        className="min-h-[46px] bg-gradient-to-r from-fuchsia-600 via-violet-600 to-sky-500 px-5 text-white shadow-lg shadow-violet-500/25 disabled:opacity-50"
                    >
                        {loading === "upload" || loading === "prefill" ? "AI in elaborazione..." : "Autocompila con AI"}
                    </FDButton>
                </div>
            )}

            {step === 2 && (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs leading-5 text-slate-500 dark:text-neutral-400">
                        I dati proposti da NEX AI restano modificabili: la conferma finale usa sempre la revisione utente.
                    </p>
                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
                        <FDButton
                            type="button"
                            color="neutral"
                            variant="outline"
                            radius="2xl"
                            size="large"
                            icon={<FiRefreshCw />}
                            disabled={Boolean(loading)}
                            onClick={handleResetWizard}
                            className="min-h-[46px] px-5"
                            dataTooltipId="general-mepa-ai-tooltip"
                            dataTooltipContent="Ripulisce i documenti caricati e riporta il wizard allo step iniziale"
                        >
                            Pulisci e riparti
                        </FDButton>
                        <FDButton
                            type="button"
                            color="dark"
                            variant="solid"
                            radius="2xl"
                            size="large"
                            icon={<FiZap />}
                            disabled={loading === "finalize"}
                            loading={loading === "finalize"}
                            onClick={handleFinalize}
                            className="min-h-[46px] px-5"
                        >
                            {loading === "finalize" ? "Creazione workspace..." : "Crea workspace e avvia AI"}
                        </FDButton>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="flex justify-end">
                    <FDButton type="button" color="success" variant="solid" radius="2xl" size="large" icon={<FiCheckCircle />} onClick={onClose}>
                        Chiudi
                    </FDButton>
                </div>
            )}
        </div>
    );

    return (
        <AnimatePresence>
            {open ? (
                <>
                    <FDBackdrop onClick={onClose} />
                    <div className="fixed inset-0 z-50 flex justify-end pointer-events-none" aria-modal="true" role="dialog">
                        <div className="relative ml-auto h-full w-full max-w-3xl pointer-events-auto 2xl:max-w-4xl">
                            <SidePanelShell
                                title={
                                    <div className="flex min-w-0 items-center gap-3">
                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-500 to-sky-400 text-white shadow-lg shadow-violet-500/25">
                                            <FiStar />
                                        </span>
                                        <span className="min-w-0">
                                            <span className="block truncate text-base font-semibold text-slate-950 dark:text-white">Nuova Gara MEPA</span>
                                            <span className="block truncate text-xs font-medium text-slate-500 dark:text-neutral-400">Wizard AI-first per creare workspace, RAG e orchestratore NEX</span>
                                        </span>
                                    </div>
                                }
                                onClose={onClose}
                                footer={footer}
                                bodyClassName="bg-slate-50/80 dark:bg-neutral-950/70"
                            >
                                <div className="space-y-6 pb-3">
                                    <section className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900/80 sm:p-6">
                                        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
                                            <div>
                                                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-200/70 bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-violet-700 shadow-sm dark:border-violet-900/50 dark:bg-neutral-950/70 dark:text-violet-200">
                                                    <FiCpu /> AI Autoprefill
                                                </div>
                                                <h3 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-2xl">
                                                    Carica i documenti, lascia leggere la gara agli agent e conferma i dati prima della creazione.
                                                </h3>
                                                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-neutral-400">
                                                    Il flusso crea una bozza isolata, invia i file al service-ai, indicizza il contesto RAG e usa il FORM_PREFILL_AGENT per proporre titolo, ente, CIG, RDO e scadenze.
                                                </p>
                                            </div>
                                            <div className="grid min-w-0 grid-cols-3 gap-2 rounded-3xl border border-slate-200 bg-slate-50 p-2 dark:border-neutral-800 dark:bg-neutral-950/60">
                                                {stepItems.map((item) => {
                                                    const active = step === item.id;
                                                    const done = step > item.id;
                                                    return (
                                                        <div
                                                            key={item.id}
                                                            data-tooltip-id={`general-mepa-ai-tooltip`}
                                                            data-tooltip-content={item.description}
                                                            className={`min-w-0 rounded-2xl px-2 py-3 text-center transition sm:px-3 ${active ? "bg-slate-950 text-white shadow-lg dark:bg-white dark:text-neutral-950" : done ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200" : "text-slate-500 dark:text-neutral-400"}`}
                                                        >
                                                            <p className="truncate text-[11px] font-bold uppercase tracking-[0.04em] sm:text-xs sm:tracking-[0.08em]">{item.label}</p>
                                                            <p className="mt-1 hidden truncate text-[11px] opacity-80 sm:block">{item.description}</p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </section>

                                    {loadingLabel && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex items-center gap-3 rounded-3xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-800 dark:border-violet-900/40 dark:bg-violet-950/30 dark:text-violet-100"
                                        >
                                            <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-white">
                                                <FiStar />
                                                <span className="absolute inset-0 animate-ping rounded-2xl bg-violet-400/30" />
                                            </span>
                                            <div>
                                                <p className="font-semibold">{loadingLabel}</p>
                                                <p className="text-xs opacity-80">Non chiudere la finestra: il workflow sta preparando il workspace MEPA.</p>
                                            </div>
                                        </motion.div>
                                    )}

                                    {step === 1 && (
                                        <div className="grid gap-4 xl:grid-cols-[1fr_0.85fr]">
                                            <label
                                                onDragEnter={handleDragEnter}
                                                onDragOver={handleDragOver}
                                                onDragLeave={handleDragLeave}
                                                onDrop={handleDrop}
                                                className={`group relative flex min-h-[270px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[30px] border-2 border-dashed p-7 text-center transition duration-200 ${isDragActive ? "-translate-y-0.5 border-violet-500 bg-violet-50 shadow-xl shadow-violet-500/15 ring-4 ring-violet-500/10 dark:border-violet-400 dark:bg-violet-950/30" : "border-slate-300 bg-white hover:-translate-y-0.5 hover:border-violet-400 hover:bg-violet-50/40 hover:shadow-lg hover:shadow-violet-500/10 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-violet-700 dark:hover:bg-violet-950/20"}`}
                                            >
                                                <AnimatePresence>
                                                    {isDragActive && (
                                                        <motion.div
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            exit={{ opacity: 0 }}
                                                            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-white/82 backdrop-blur-sm dark:bg-neutral-950/75"
                                                        >
                                                            <div className="rounded-3xl border border-violet-200 bg-white px-6 py-5 text-center shadow-2xl shadow-violet-500/20 dark:border-violet-800 dark:bg-neutral-900">
                                                                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-500/25">
                                                                    <FiUploadCloud size={28} />
                                                                </span>
                                                                <p className="mt-3 text-base font-semibold text-slate-950 dark:text-white">Rilascia qui i documenti</p>
                                                                <p className="mt-1 text-xs text-slate-500 dark:text-neutral-400">Il wizard li preparerà per ingestion e prefill AI.</p>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                                <span className={`relative mb-4 flex h-16 w-16 items-center justify-center rounded-3xl text-white shadow-lg transition ${isDragActive ? "bg-violet-600 shadow-violet-500/30" : "bg-gradient-to-br from-violet-600 to-sky-500 shadow-violet-500/25"}`}>
                                                    <FiUploadCloud size={30} />
                                                </span>
                                                <span className="relative text-lg font-semibold text-slate-950 dark:text-white">Trascina o seleziona i documenti gara</span>
                                                <span className="relative mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-neutral-400">
                                                    Carica disciplinare, capitolato, invito, chiarimenti e allegati. L’AI userà i documenti per precompilare la scheda iniziale.
                                                </span>
                                                <span className="relative mt-4 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-violet-700 shadow-sm dark:border-neutral-800 dark:bg-neutral-950/80 dark:text-violet-200">
                                                    PDF, DOCX, XLSX e allegati tecnici · limite temporaneo 25MB/file
                                                </span>
                                                <input type="file" multiple className="hidden" onChange={(event) => handleFiles(event.target.files)} />
                                            </label>

                                            <aside className="rounded-[30px] border border-white/70 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                                                <div className="flex items-center justify-between gap-3">
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-950 dark:text-white">File selezionati</p>
                                                        <p className="text-xs text-slate-500 dark:text-neutral-400">{files.length} documenti pronti per ingestion</p>
                                                    </div>
                                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-neutral-800 dark:text-neutral-300">
                                                        {readableFiles.length}/{files.length || 0} validi
                                                    </span>
                                                </div>
                                                <div className="mt-4 max-h-[280px] space-y-2 overflow-y-auto pr-1">
                                                    {files.length ? files.map((file) => {
                                                        const readable = file.size <= 25 * 1024 * 1024;
                                                        return (
                                                            <div key={`${file.name}-${file.size}`} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-neutral-800 dark:bg-neutral-950/60">
                                                                <span className={`mt-0.5 rounded-xl p-2 ${readable ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300" : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-200"}`}>
                                                                    <FiFileText />
                                                                </span>
                                                                <span className="min-w-0 flex-1">
                                                                    <span className="block truncate text-sm font-semibold text-slate-700 dark:text-neutral-200">{file.name}</span>
                                                                    <span className="mt-1 block text-xs text-slate-400">{formatFileSize(file.size)} · {readable ? "pronto" : "troppo grande"}</span>
                                                                </span>
                                                            </div>
                                                        );
                                                    }) : (
                                                        <div className="rounded-2xl border border-dashed border-slate-200 p-5 text-center text-sm text-slate-400 dark:border-neutral-800">
                                                            Nessun file caricato.
                                                        </div>
                                                    )}
                                                </div>
                                            </aside>
                                        </div>
                                    )}

                                    {step === 2 && (
                                        <div className="space-y-4">
                                            <div className="flex flex-col gap-3 rounded-[26px] border border-violet-200 bg-violet-50 p-4 dark:border-violet-900/40 dark:bg-violet-900/40 sm:flex-row sm:items-center sm:justify-between">
                                                <div className="min-w-0">
                                                    <p className="flex items-center gap-2 text-sm font-semibold text-violet-900 dark:text-violet-100"><FiStar /> Autocompilazione NEX AI completata</p>
                                                    <p className="mt-2 text-sm leading-6 text-violet-500 dark:text-violet-400">
                                                        NEX AI ha letto i documenti gara e ha proposto i dati iniziali del workspace. Controlla i campi, completa eventuali valori mancanti e conferma solo dopo revisione umana.
                                                    </p>
                                                </div>
                                            </div>
                                            {uploadWarnings.map((warning) => <p key={warning} className="rounded-2xl bg-amber-50 p-3 text-xs text-amber-700 dark:bg-amber-950/30 dark:text-amber-200">{warning}</p>)}
                                            <div className="grid gap-4 md:grid-cols-2">
                                                {inputFields.map(([key, label, placeholder]) => (
                                                    <label key={key} className={key === "title" ? "text-sm font-medium md:col-span-2" : "text-sm font-medium"}>
                                                        <span className="text-slate-700 dark:text-neutral-200">{label}</span>
                                                        <input
                                                            value={(form as any)[key] ?? ""}
                                                            onChange={(event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))}
                                                            placeholder={placeholder}
                                                            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
                                                        />
                                                    </label>
                                                ))}
                                            </div>
                                            <div className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                                                <p className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-neutral-100"><FiShield /> Revisione umana obbligatoria</p>
                                                <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-neutral-400">
                                                    La proposta AI accelera la compilazione ma non finalizza autonomamente la gara. I dati confermati qui diventano il punto di partenza per overview, dossier, estrazione prodotti e chat documentale.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {step === 3 && (
                                        <div className="rounded-[30px] border border-emerald-200 bg-emerald-50 p-7 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-100">
                                            <FiCheckCircle size={38} />
                                            <h3 className="mt-4 text-2xl font-semibold">Workspace creato</h3>
                                            <p className="mt-2 max-w-2xl text-sm leading-6">
                                                Lo workspace è stato creato e l’orchestratore AI è stato schedulato in background. Le fasi agentiche alimenteranno overview, requisiti, prodotti, criticità, azioni e quality review.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </SidePanelShell>
                        </div>
                    </div>
                </>
            ) : null}
        </AnimatePresence>
    );
}
