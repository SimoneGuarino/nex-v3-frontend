import React from "react";
import {
    FiAlertTriangle,
    FiCpu,
    FiDatabase,
    FiFileText,
    FiMessageSquare,
    FiSend,
    FiZap,
} from "react-icons/fi";
import { Panel } from "../../components/shared/Panel";
import { providerBadgeClass, providerLabel } from "../../utils/status";
import type { MepaChatMessage, MepaDocumentChunkSearchResult, MepaRetrievalProvider, MepaVespaQueryStrategy } from "../../types";

type ChatTabProps = {
    selectedTender?: { title?: string; cig?: string; rdo?: string; ente?: string };
    chatQuestion?: string;
    setChatQuestion?: (value: string) => void;
    chatAnswer?: string;
    chatMessages?: MepaChatMessage[];
    ragChunks?: MepaDocumentChunkSearchResult[];
    retrievalProvider?: MepaRetrievalProvider;
    fallbackUsed?: boolean;
    ragElapsedMs?: number | null;
    retrievalMode?: "LEXICAL" | "HYBRID_VECTOR";
    vespaQueryStrategy?: MepaVespaQueryStrategy;
    fallbackReason?: string | null;
    embeddingError?: string | null;
    vespaHitsBeforeScope?: number | null;
    vespaScopedHits?: number | null;
    vespaSelfHealAttempted?: boolean;
    vespaSelfHealFed?: number | null;
    vespaSelfHealFailed?: number | null;
    vespaSelfHealEmbeddingFailed?: number | null;
    vespaSelfHealError?: string | null;
    chatConfidence?: number | null;
    chatIntent?: string | null;
    chatLimitations?: string[];
    chatSuggestedActions?: Array<{ type?: string; label: string }>;
    loading?: string | null;
    onAskAi?: (questionOverride?: string) => void | Promise<void>;
    onLoadChatMessages?: () => void | Promise<void>;
    setActiveTab?: (tab: any) => void;
};

const QUICK_PROMPTS = [
    "Quali sono le criticità principali della gara?",
    "Elenca certificazioni e requisiti di conformità richiesti.",
    "Quali prodotti o servizi sono richiesti nei documenti?",
    "Quali punti devo validare prima di creare la quotazione?",
    "Prepara una sintesi operativa per il buyer.",
];

function shortDiagnosticLabel(value?: string | null) {
    if (!value) return "n.d.";
    if (value === "VESPA_NO_HITS") return "Vespa senza risultati";
    if (value === "VESPA_ERROR") return "Errore Vespa";
    return value;
}

function messageBubbleClass(role?: string) {
    if (role === "user") return "ml-auto border-blue-100 bg-blue-600 text-white dark:border-blue-700 dark:bg-blue-600";
    return "mr-auto border-slate-200 bg-white text-slate-800 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100";
}

function MessageBubble({ message }: { message: MepaChatMessage }) {
    return (
        <article className={`max-w-[92%] rounded-3xl border px-4 py-3 text-sm leading-6 shadow-sm sm:max-w-[78%] ${messageBubbleClass(message.role)}`}>
            <div className="whitespace-pre-wrap break-words">{message.content}</div>
            {message.role === "assistant" && message.retrievalProvider ? (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] opacity-80">
                    <span className={`rounded-full px-2 py-0.5 font-semibold ring-1 ${providerBadgeClass(message.retrievalProvider)}`}>{providerLabel(message.retrievalProvider)}</span>
                    {message.retrievalMeta?.intent ? <span>Intent: {String(message.retrievalMeta.intent)}</span> : null}
                    {typeof message.retrievalMeta?.confidence === "number" ? <span>Confidenza: {Math.round(message.retrievalMeta.confidence * 100)}%</span> : null}
                </div>
            ) : null}
        </article>
    );
}

function DiagnosticCard({ icon, label, value, tone = "neutral" }: { icon: React.ReactNode; label: string; value: React.ReactNode; tone?: "neutral" | "warning" | "success" }) {
    const toneClass = tone === "success"
        ? "border-emerald-100 bg-emerald-50/70 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-200"
        : tone === "warning"
            ? "border-amber-100 bg-amber-50/70 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200"
            : "border-slate-200 bg-white text-slate-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200";
    return (
        <div className={`rounded-2xl border p-3 ${toneClass}`}>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide opacity-80">
                {icon}
                {label}
            </div>
            <div className="mt-1 text-sm font-bold">{value}</div>
        </div>
    );
}

export const ChatTab = React.memo(function ChatTab(props: ChatTabProps) {
    const isLoading = props.loading === "chat";
    const provider = props.retrievalProvider ?? "VESPA";
    const hasFallback = Boolean(props.fallbackUsed || provider === "MONGO_FALLBACK");
    const messages = props.chatMessages ?? [];
    const latestChunks = props.ragChunks ?? [];
    const question = props.chatQuestion ?? "";

    const submit = React.useCallback((override?: string) => {
        const value = (override ?? question).trim();
        if (!value || isLoading) return;
        void props.onAskAi?.(value);
    }, [isLoading, props, question]);

    const onKeyDown = React.useCallback((event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            submit();
        }
    }, [submit]);

    React.useEffect(() => {
        void props.onLoadChatMessages?.();
        // The chat tab owns its own lifecycle and only hydrates persisted state on mount.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,0.34fr)_minmax(0,0.66fr)]">
            <Panel title="Assistente AI contestuale" icon={<FiMessageSquare className="text-blue-500" />}>
                <div className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5 dark:border-blue-900/40 dark:from-blue-950/30 dark:to-neutral-900">
                    <span className={`mb-3 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${providerBadgeClass(provider)}`}>{providerLabel(provider)}</span>
                    <h4 className="text-lg font-semibold">Tender Assistant dedicato</h4>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-neutral-300">
                        Questa chat usa il <b>TENDER_DOCUMENT_CHAT_AGENT</b> della gara aperta, con retrieval su Vespa quando disponibile e fallback Mongo solo come modalità degradata e tracciata.
                    </p>

                    <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1">
                        {QUICK_PROMPTS.map((prompt) => (
                            <button
                                key={prompt}
                                type="button"
                                disabled={isLoading}
                                onClick={() => {
                                    props.setChatQuestion?.(prompt);
                                    submit(prompt);
                                }}
                                className="rounded-2xl border border-blue-100 bg-white px-3 py-2 text-left text-xs font-semibold text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-blue-900/40 dark:bg-neutral-950 dark:text-blue-200 dark:hover:bg-blue-950/30"
                            >
                                {prompt}
                            </button>
                        ))}
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
                        <DiagnosticCard icon={<FiDatabase />} label="Provider" value={providerLabel(provider)} tone={provider === "VESPA" ? "success" : hasFallback ? "warning" : "neutral"} />
                        <DiagnosticCard icon={<FiZap />} label="Strategia" value={props.vespaQueryStrategy ?? "n.d."} />
                        <DiagnosticCard icon={<FiCpu />} label="Modalità" value={props.retrievalMode ?? "n.d."} />
                        <DiagnosticCard icon={<FiAlertTriangle />} label="Fallback" value={hasFallback ? shortDiagnosticLabel(props.fallbackReason) : "No"} tone={hasFallback ? "warning" : "success"} />
                        <DiagnosticCard
                            icon={<FiDatabase />}
                            label="Auto-sync Vespa"
                            value={props.vespaSelfHealAttempted ? `${props.vespaSelfHealFed ?? 0} feed / ${props.vespaSelfHealFailed ?? 0} errori` : "Non necessario"}
                            tone={props.vespaSelfHealAttempted ? (props.vespaSelfHealFailed ? "warning" : "success") : "neutral"}
                        />
                    </div>

                    {props.embeddingError ? (
                        <p className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
                            Embedding query non disponibile: il backend ha continuato con ricerca Vespa lexical. Dettaglio: {props.embeddingError}
                        </p>
                    ) : null}
                    {props.vespaSelfHealError ? (
                        <p className="mt-3 rounded-2xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
                            Auto-sync Vespa completato con warning: {props.vespaSelfHealError}
                        </p>
                    ) : null}
                </div>
            </Panel>

            <Panel title="Conversazione gara" icon={<FiMessageSquare className="text-blue-500" />}>
                <div className="flex h-[calc(100vh-260px)] min-h-[620px] flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50/70 dark:border-neutral-800 dark:bg-neutral-950/60">
                    <div className="border-b border-slate-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900 sm:px-5">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-slate-800 dark:text-neutral-100">{props.selectedTender?.title || "Gara MEPA"}</p>
                                <p className="truncate text-xs text-slate-500 dark:text-neutral-400">
                                    {[props.selectedTender?.ente, props.selectedTender?.cig ? `CIG ${props.selectedTender.cig}` : null, props.selectedTender?.rdo ? `RDO ${props.selectedTender.rdo}` : null].filter(Boolean).join(" · ") || "Contesto pratica corrente"}
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs">
                                {typeof props.ragElapsedMs === "number" ? <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-600 dark:bg-neutral-800 dark:text-neutral-300">{props.ragElapsedMs} ms</span> : null}
                                {typeof props.chatConfidence === "number" ? <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-600 dark:bg-neutral-800 dark:text-neutral-300">Confidenza {Math.round(props.chatConfidence * 100)}%</span> : null}
                                {props.chatIntent ? <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-600 dark:bg-neutral-800 dark:text-neutral-300">{props.chatIntent}</span> : null}
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-5">
                        {messages.length ? (
                            <div className="flex flex-col gap-3">
                                {messages.map((message, index) => <MessageBubble key={message._id ?? `${message.role}-${index}`} message={message} />)}
                            </div>
                        ) : (
                            <div className="flex h-full items-center justify-center text-center">
                                <div className="max-w-md rounded-3xl border border-dashed border-slate-300 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-900">
                                    <FiMessageSquare className="mx-auto text-3xl text-blue-500" />
                                    <h4 className="mt-3 text-base font-bold">Fai una domanda sui documenti gara</h4>
                                    <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-neutral-400">
                                        L'assistente recupera solo evidenze della pratica corrente e restituisce fonti consultabili sotto la risposta.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="border-t border-slate-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900 sm:p-4">
                        <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-3 dark:border-neutral-800 dark:bg-neutral-950 sm:flex-row sm:items-end">
                            <textarea
                                value={question}
                                onChange={(event) => props.setChatQuestion?.(event.target.value)}
                                onKeyDown={onKeyDown}
                                rows={2}
                                placeholder="Scrivi una domanda sui documenti della gara..."
                                className="min-h-[52px] flex-1 resize-none bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-neutral-100"
                            />
                            <button
                                type="button"
                                disabled={isLoading || !question.trim()}
                                onClick={() => submit()}
                                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <FiSend />
                                {isLoading ? "Invio..." : "Invia"}
                            </button>
                        </div>

                        {(latestChunks.length || props.chatLimitations?.length || props.chatSuggestedActions?.length) ? (
                            <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
                                {latestChunks.length ? (
                                    <div className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
                                        <div className="mb-3 flex items-center justify-between gap-2">
                                            <h5 className="text-sm font-bold">Fonti usate</h5>
                                            <span className="text-xs text-slate-500">{latestChunks.length} chunk</span>
                                        </div>
                                        <div className="space-y-3">
                                            {latestChunks.slice(0, 4).map((chunk, index) => (
                                                <div key={chunk.chunkId ?? index} className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-xs leading-5 dark:border-neutral-800 dark:bg-neutral-900">
                                                    <div className="flex items-start gap-2 font-bold text-slate-700 dark:text-neutral-200">
                                                        <FiFileText className="mt-0.5 shrink-0 text-blue-500" />
                                                        <span className="line-clamp-1">{chunk.documentTitle || chunk.documentId || "Documento gara"}</span>
                                                    </div>
                                                    <p className="mt-2 line-clamp-3 text-slate-500 dark:text-neutral-400">{chunk.text}</p>
                                                    <p className="mt-2 text-[11px] font-semibold text-slate-400">score {Number(chunk.score ?? 0).toFixed(2)} · {chunk.sectionTitle || "sezione n.d."}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : null}

                                <div className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
                                    <h5 className="text-sm font-bold">Dettagli risposta</h5>
                                    <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                        <dt className="text-slate-500">Vespa hits</dt>
                                        <dd className="font-bold text-slate-700 dark:text-neutral-200">{props.vespaScopedHits ?? "n.d."}/{props.vespaHitsBeforeScope ?? "n.d."}</dd>
                                        <dt className="text-slate-500">Fallback reason</dt>
                                        <dd className="font-bold text-slate-700 dark:text-neutral-200">{shortDiagnosticLabel(props.fallbackReason)}</dd>
                                        <dt className="text-slate-500">Auto-sync</dt>
                                        <dd className="font-bold text-slate-700 dark:text-neutral-200">
                                            {props.vespaSelfHealAttempted ? `${props.vespaSelfHealFed ?? 0}/${(props.vespaSelfHealFed ?? 0) + (props.vespaSelfHealFailed ?? 0)} chunk` : "n.d."}
                                        </dd>
                                    </dl>
                                    {props.chatLimitations?.length ? (
                                        <div className="mt-4 rounded-2xl bg-amber-50 p-3 text-xs leading-5 text-amber-800 dark:bg-amber-950/20 dark:text-amber-200">
                                            {props.chatLimitations.map((item, index) => <p key={index}>• {item}</p>)}
                                        </div>
                                    ) : null}
                                    {props.chatSuggestedActions?.length ? (
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {props.chatSuggestedActions.slice(0, 4).map((action, index) => (
                                                <button key={`${action.type}-${index}`} type="button" className="rounded-full border border-blue-100 px-3 py-1 text-xs font-bold text-blue-700 hover:bg-blue-50 dark:border-blue-900/50 dark:text-blue-200 dark:hover:bg-blue-950/30">
                                                    {action.label}
                                                </button>
                                            ))}
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            </Panel>
        </div>
    );
});
