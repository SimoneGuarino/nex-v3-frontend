import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MdClose, MdSearch, MdPersonAddAlt1, MdDone, MdFilePresent } from "react-icons/md";

import { FDBox, FDInput, FDIconButton, FDButton, FDBackdrop } from "@nex/fd-ui";

import RichTextEditor from "../input/RichTextEditor";
import { UserAvatar } from "examples/Navbars/components/userInfo";

const MdCloseIcon = MdClose as React.FC<{ size?: number; className?: string }>;
const MdSearchIcon = MdSearch as React.FC<{ size?: number; className?: string }>;
const MdPersonAddAlt1Icon = MdPersonAddAlt1 as React.FC<{ size?: number; className?: string }>;
const MdDoneIcon = MdDone as React.FC<{ size?: number; className?: string }>;
const MdFilePresentIcon = MdFilePresent as React.FC<{ size?: number; className?: string }>;

/** Tipi base */
export type Company = "FOCELDA" | "IOT";
export type ShareDoc = { fileName: string; company: Company; displayName?: string };
export type ShareTarget = {
    _id: string;
    idBlock?: null | string;
    username: string;
    nome: string;
    cognome: string;
    email: string;
    stato: {
        codice: "Online" | "Offline" | "Assente"
    },
    biografia?: string;
    immagini?: {
        avatar?: string;
        cover?: string;
    };
};

export type ShareResult = {
    targets: ShareTarget[];
    message?: string;
    attachments: ShareDoc[]; // resource-based attachments
};

export type FetchUsersFn = (q: string, page: number) => Promise<{ users: ShareTarget[]; hasMore: boolean }>;

export interface FDSharePanelProps {
    open: boolean;
    onClose: () => void;

    /** Documenti che vuoi condividere (resource-based) */
    docs: ShareDoc[];

    /** Funzione di ricerca utenti (server-side) */
    fetchUsers: FetchUsersFn;

    /** Callback finale: qui colleghi shareToChat (emissione socket + azioni blocco) */
    onShare: (payload: ShareResult) => Promise<void> | void;

    /** Opzioni UI */
    title?: string;
    placeholderSearch?: string;
    allowMulti?: boolean; // default true
    defaultMessageHtml?: string;

    //tour
    isActive?: boolean;
}

/** Hook: debounce minimale */
function useDebounced<T>(value: T, ms = 300) {
    const [v, setV] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setV(value), ms);
        return () => clearTimeout(t);
    }, [value, ms]);
    return v;
}

/** Windowing leggero (stile FDSelect): calcolo fetta visibile */
function useWindowing<T>(items: T[], rowH = 56, viewport = 320, scrollTop = 0, overscan = 8) {
    return useMemo(() => {
        const start = Math.max(0, Math.floor(scrollTop / rowH) - overscan);
        const end = Math.min(items.length, Math.ceil((scrollTop + viewport) / rowH) + overscan);
        return {
            slice: items.slice(start, end),
            before: start * rowH,
            after: Math.max(0, (items.length - end) * rowH),
            start,
            end,
        };
    }, [items, rowH, viewport, scrollTop, overscan]);
}

/** Chip utente selezionato */
function UserChip({ u, onRemove }: { u: ShareTarget; onRemove: () => void }) {
    return (
        <div className="flex items-center gap-2 rounded-full bg-neutral-100 dark:bg-neutral-800 px-2 py-1 text-xs">
            <UserAvatar src={u.immagini?.avatar} name={u.nome}
                cognome={u.cognome} size={8} cover={{ src: u.immagini?.cover, active: true }} bio={u.biografia} />
            <span className="max-w-[160px] truncate">{u.nome} {u.cognome}</span>
            <button onClick={onRemove} className="rounded-full hover:bg-neutral-200/80 dark:hover:bg-neutral-700 p-1">
                <MdCloseIcon />
            </button>
        </div>
    );
}

/** Riga utente in elenco */
function UserRow({
    u, selected, onToggle,
}: { u: ShareTarget; selected: boolean; onToggle: () => void }) {
    return (
        <button
            type="button"
            onClick={onToggle}
            className={`w-full flex items-center gap-3 px-3 ${selected ? "bg-neutral-100 dark:bg-neutral-800" : "hover:bg-neutral-50 dark:hover:bg-neutral-800/70"} transition-colors`}
            style={{ height: 56 }}
        >
            <UserAvatar src={u.immagini?.avatar} name={u.nome} textSize="xs"
                cognome={u.cognome} size={8} cover={{ src: u.immagini?.cover, active: true }} bio={u.biografia} />
            <div className="flex-1 text-left">
                <div className="text-sm">{u.nome} {u.cognome}</div>
                <div className="text-xs text-neutral-500">{u.username ?? "N/A"}</div>
            </div>
            {selected ? <MdDoneIcon className="text-blue-600" /> : <MdPersonAddAlt1Icon className="text-neutral-500" />}
        </button>
    );
}

/** Pannello di condivisione */
export default function FDSharePanel({
    open,
    onClose,
    docs,
    fetchUsers,
    onShare,
    title = "Condividi con…",
    placeholderSearch = "Cerca persone",
    allowMulti = true,
    defaultMessageHtml = "",
    isActive = true,
}: FDSharePanelProps) {
    const [query, setQuery] = useState("");
    const debounced = useDebounced(query, 300);

    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);

    const [items, setItems] = useState<ShareTarget[]>([]);
    const [selected, setSelected] = useState<ShareTarget[]>([]);
    const [message, setMessage] = useState<string>(defaultMessageHtml);
    /* submitting:
 * - evita doppi invii se l'utente clicca più volte su "Invia" mentre aspettiamo la risposta. */
    const [submitting, setSubmitting] = useState(false);

    const listRef = useRef<HTMLDivElement>(null);
    const [scrollTop, setScrollTop] = useState(0);
    const viewport = 360;
    const rowH = 56;

    const view = useWindowing(items, rowH, viewport, scrollTop, 8);

    /** reset quando apri/pulisci query */
    useEffect(() => {
        if (!open) return;
        setPage(0);
        setHasMore(true);
        setItems([]);
    }, [debounced, open]);

    /** fetch page */
    useEffect(() => {
        if (!open || loading) return;
        (async () => {
            setLoading(true);
            try {
                const r = await fetchUsers(debounced.trim(), page);
                if (!r || !Array.isArray(r.users)) throw new Error("fetchUsers non ha restituito un array di utenti");
                setItems(r.users);
                //setItems((prev) => (page === 0 ? r.users : prev.concat(r.users)));
            } finally {
                setLoading(false);
            }
        })();
    }, [open, debounced, page, fetchUsers]);

    /** infinite scroll */
    const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const el = e.currentTarget;
        setScrollTop(el.scrollTop);
        if (!loading && hasMore && el.scrollTop + el.clientHeight + 120 >= el.scrollHeight) {
            setPage((p) => p + 1);
        }
    }, [loading, hasMore]);

    /** toggle selezione */
    const toggle = useCallback((u: ShareTarget) => {
        setSelected((prev) => {
            const found = prev.find((x) => x._id === u._id);
            if (found) return prev.filter((x) => x._id !== u._id);
            return allowMulti ? [...prev, u] : [u];
        });
    }, [allowMulti]);

    // Possiamo inviare solo se non stiamo già inviando (anti doppio click) -> aggiunto  && !submitting al codice originale
    const canShare = selected.length > 0 && docs.length > 0 && !loading && !submitting;

    /** submit */
    const submit = useCallback(async () => {
        if (!canShare) return;
        //Blocco click multipli finché l'azione non termina
        setSubmitting(true);
        try {
            await onShare({ targets: selected, message, attachments: docs });
            onClose();
        } finally {
            //in caso di errore o abort sblocchiamo il bottone
            setSubmitting(false);
        }
    }, [canShare, onShare, selected, message, docs, onClose]);

    /** key handlers */
    const onKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === "Escape") onClose();
        if (e.key === "Enter" && canShare) { e.preventDefault(); submit(); }
    }, [canShare, submit, onClose]);

    /** recap allegati */
    const docsText = docs && docs.length > 0 ? docs.slice(0, 2).map(d => d?.displayName ?? d?.fileName).join(", ") : "";
    const docsMore = Math.max(0, docs.length - 2);


    return (
        <AnimatePresence>
            {open && (
                <>
                    <FDBackdrop onClick={() => { if (isActive) onClose(); }} />
                    <motion.div
                        className="fixed inset-x-0 bottom-0 md:inset-0 z-[1100] grid place-items-end md:place-items-center p-0 md:p-6"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onKeyDown={(e) => {
                            if (!isActive) { e.preventDefault(); e.stopPropagation(); return; }
                            if (e.key === "Escape") onClose();
                            if (e.key === "Enter" && canShare) { e.preventDefault(); submit(); }
                        }}
                    >
                        <FDBox
                            data-tour="docs-filters-share-panel"
                            asMotion
                            radius="2xl"
                            shadow="2xl"
                            color="light"
                            className="w-full md:w-[min(880px,92vw)] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
                            initial={{ y: 24, opacity: 0 }}
                            animate={{ y: 0, opacity: 1, transition: { type: "spring", stiffness: 380, damping: 30 } }}
                            exit={{ y: 24, opacity: 0 }}
                        >
                            {!isActive && (
                                <div className="absolute inset-0 z-[5] bg-black/10 pointer-events-auto" aria-hidden="true" />
                            )}
                            <div className={isActive ? "" : "pointer-events-none select-none opacity-60"} aria-disabled={!isActive}>
                                {/* Header */}
                                <div className="flex items-center gap-3 p-3 md:p-4 border-b border-neutral-200 dark:border-neutral-800">
                                    <div className="h-9 w-9 grid place-items-center rounded-full bg-blue-600 text-white"><MdFilePresentIcon /></div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-semibold truncate">{title}</div>
                                        <div className="text-xs text-neutral-500 truncate">
                                            {docs.length} allegato{docs.length > 1 ? "i" : ""}{docsText ? `: ${docsText}` : ""}{docsMore ? ` (+${docsMore})` : ""}
                                        </div>
                                    </div>
                                    <span data-tour="docs-share-close">
                                        <FDIconButton icon={<MdCloseIcon />} variant="text" onClick={onClose} ariaLabel="Chiudi" /></span>
                                </div>

                                {/* Body: 2 colonne (selected + list) */}
                                <div className="grid md:grid-cols-[1fr_1.2fr] gap-0 md:gap-6">
                                    {/* Colonna sinistra: selezionati + messaggio */}
                                    <div className="p-3 md:p-4" data-tour="docs-filters-share-recip">
                                        <div className="mb-2 text-xs text-neutral-500">Destinatari</div>
                                        <div className="flex flex-wrap gap-2 min-h-[42px]">
                                            {selected.map((u) => (
                                                <UserChip key={u._id} u={u} onRemove={() => setSelected(s => s.filter(x => x._id !== u._id))} />
                                            ))}
                                            {selected.length === 0 && <div className="text-xs text-neutral-400">Nessuno selezionato</div>}
                                        </div>

                                        <div className="mt-4">
                                            <div className="mb-2 text-xs text-neutral-500">Messaggio (opzionale)</div>
                                            {/* Puoi sostituire con un textarea leggero se preferisci */}
                                            <RichTextEditor value={message} onChange={setMessage} maxHeight={180} />
                                        </div>
                                    </div>

                                    {/* Colonna destra: search + list */}
                                    <div className="p-3 md:p-4 border-t md:border-t-0 md:border-l border-neutral-200 dark:border-neutral-800">
                                        <span data-tour="docs-filters-share-search">
                                            <FDInput
                                                leftIcon={<MdSearchIcon />}
                                                placeholder={placeholderSearch}
                                                value={query}
                                                onChange={(e) => setQuery(e.currentTarget.value)}
                                                className="bg-white dark:bg-neutral-900"
                                                fullWidth
                                            /></span>
                                        <div
                                            ref={listRef}
                                            className="mt-3 overflow-auto rounded-lg border border-neutral-200 dark:border-neutral-800"
                                            style={{ maxHeight: viewport, height: viewport }}
                                            onScroll={onScroll}
                                        >
                                            {/* spacer superiore */}
                                            <div style={{ height: view.before }} />
                                            {view.slice.map((u, idx) => {
                                                const real = view.start + idx;
                                                const sel = !!selected.find(s => s._id === u._id);
                                                return (
                                                    <UserRow key={`${u._id}-${real}`} u={u} selected={sel} onToggle={() => toggle(u)} />
                                                );
                                            })}
                                            {/* spacer inferiore */}
                                            <div style={{ height: view.after }} />
                                            {/* stati */}
                                            {!loading && items.length === 0 && (
                                                <div className="py-8 text-center text-sm text-neutral-500">Nessun risultato</div>
                                            )}
                                            {loading && (
                                                <div className="py-6 text-center text-sm text-neutral-500">Caricamento…</div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-end gap-2 p-3 md:p-4 border-t border-neutral-200 dark:border-neutral-800">
                                    <span data-tour="docs-filters-share-send">
                                        <FDButton variant="soft" color="neutral" onClick={onClose}>Annulla</FDButton>
                                        <FDButton
                                            variant="solid"
                                            color={canShare ? "primary" : "neutral"}
                                            // disabled={!(selected.length > 0 && docs.length > 0 && !loading)}
                                            disabled={!canShare}
                                            onClick={submit}
                                        >
                                            Invia
                                        </FDButton>
                                    </span>
                                </div>
                            </div>
                        </FDBox>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
