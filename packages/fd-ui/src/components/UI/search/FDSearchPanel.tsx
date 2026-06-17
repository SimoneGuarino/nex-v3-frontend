import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MdSearch, MdClose, MdKeyboardArrowUp, MdKeyboardArrowDown } from "react-icons/md";
import { IoClose, IoEllipsisVertical } from "react-icons/io5";
// components
import { FDBox, FDBackdrop, FDIconButton, FDInput, ContextMenu} from "../../../";

// tour system
/*import { useTour } from "tour/TourProvider";
import { resolveDataTours } from "tour/utils";
import type { TourKey } from "tour/tours";*/

type CloseReason = "clickAway" | "escapeKeyDown" | "backdropClick" | "itemClick";

const MdSearchIcon = MdSearch as React.FC<{ size?: number; className?: string }>;
const MdCloseIcon = MdClose as React.FC<{ size?: number; className?: string }>;
const MdKeyboardArrowUpIcon = MdKeyboardArrowUp as React.FC<{ size?: number; className?: string }>;
const MdKeyboardArrowDownIcon = MdKeyboardArrowDown as React.FC<{ size?: number; className?: string }>;
const IoCloseIcon = IoClose as React.FC<{ size?: number; className?: string }>;
const IoEllipsisVerticalIcon = IoEllipsisVertical as React.FC<{ size?: number; className?: string }>;

/*const SEARCHPANEL_TOUR_PREFIX: Partial<Record<TourKey, string>> = {
    documents: "docs",
    rubrica: "rubrica", // TODO: quando creerai gli step rubrica, userai questi data-tour
    listiniPromo: "listiniPromo",
    quotazioni: "quotazioni",
};*/

const SEARCHPANEL_TOUR_NAMES = ["panel", "close", "active"] as const;
type SearchPanelTourName = (typeof SEARCHPANEL_TOUR_NAMES)[number];

// --------- Types
export type SearchItemId = string | number;

export type RecentSearchConfig = {
    enabled: boolean;
    cookieName?: string; // default: "fd_search_recent"
    limit?: number; // default: 8
};

export type QuickAction<T> = {
    label: string;
    icon?: React.ReactNode;
    onAction: (item: T, event: React.MouseEvent<HTMLButtonElement>) => void;
};

export type SearchItem<T = any> = {
    id: SearchItemId;
    title: string;
    subtitle?: string;
    metaRight?: React.ReactNode;
    iconLeft?: React.ReactNode;
    payload?: T;
    actions?: QuickAction<T>[];
};

export type FilterChip = {
    key: string;
    label?: string;
    value: string | null;
    onRemove?: () => void;
};

export type FDSearchPanelProps<T = any> = {
    open: boolean;
    onClose: () => void;

    query?: string;
    onQueryChange?: (q: string) => void;

    items: SearchItem<T>[];
    onSelect: (item: SearchItem<T>) => void;

    renderFilters?: React.ReactNode;
    appliedFilters?: FilterChip[];

    placeholder?: string;

    emptyLabel?: string;
    emptyNoResultsLabel?: string;

    highlight?: boolean;
    limit?: number;

    UseVirtualize?: (len: number) => { start: number; end: number };

    recentSearch?: RecentSearchConfig;

    id_tooltip?: string;

    loading?: boolean;

    customRecent?: string[];
    setCustomRecent?: (terms: string[]) => void;
    tourIsOpen?: boolean;
};

// --------- Utils
const clsx = (...c: Array<string | false | undefined>) => c.filter(Boolean).join(" ");

function highlightText(text: string, query: string) {
    if (!query) return text;
    try {
        const parts = text.split(new RegExp(`(${escapeRegExp(query)})`, "ig"));
        return parts.map((p, i) =>
            p.toLowerCase() === query.toLowerCase() ? (
                <mark key={i} className="rounded px-0.5 bg-amber-200/60 dark:bg-yellow-400/30">
                    {p}
                </mark>
            ) : (
                <span key={i}>{p}</span>
            )
        );
    } catch {
        return text;
    }
}
function escapeRegExp(s: string) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// semplice virtualizer opzionale (finestra 30 + overscan 10)
function useSimpleVirtual(len: number) {
    const containerRef = React.useRef<HTMLDivElement>(null);

    const compute = React.useCallback(() => {
        const el = containerRef.current;
        const itemH = 56;
        const scrollTop = el?.scrollTop ?? 0;
        const start = Math.max(0, Math.floor(scrollTop / itemH) - 10);
        const end = Math.min(len, start + 40);
        return { start, end };
    }, [len]);

    const [range, setRange] = React.useState(() => ({ start: 0, end: Math.min(40, len) }));

    React.useEffect(() => {
        setRange(compute());
    }, [compute]);

    React.useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const onScroll = () => setRange(compute());
        el.addEventListener("scroll", onScroll, { passive: true });
        return () => el.removeEventListener("scroll", onScroll);
    }, [compute]);

    return { containerRef, start: range.start, end: range.end };
}

// cookie JSON
function readRecent(name: string): string[] {
    const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    if (!m) return [];
    try {
        return JSON.parse(decodeURIComponent(m[1])) as string[];
    } catch {
        return [];
    }
}

export function writeRecent(name: string, arr: string[]) {
    const v = encodeURIComponent(JSON.stringify(arr));
    document.cookie = `${name}=${v}; max-age=${60 * 60 * 24 * 180}; path=/; SameSite=Lax`;
}

export function pushRecent(list: string[], q: string, limit: number) {
    const t = q.trim();
    if (!t) return list;
    const next = [t, ...list.filter((s) => s.toLowerCase() !== t.toLowerCase())];
    return next.slice(0, limit);
}

// --------- Styles
const footer_key =
    "shadow-sm px-2 py-1 rounded-md bg-white dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700";

// --------- Component
const FDSearchPanel = <T,>({
    open,
    onClose,
    query,
    onQueryChange,
    items,
    onSelect,
    renderFilters,
    appliedFilters = [],
    placeholder = "Search item",
    emptyLabel = "Start typing to search…",
    emptyNoResultsLabel = "No results for this search.",
    highlight = true,
    limit = 1000,
    UseVirtualize,
    recentSearch,
    id_tooltip = undefined,
    loading = undefined,
    customRecent = undefined,
    setCustomRecent = undefined,
    tourIsOpen = false,
}: FDSearchPanelProps<T>) => {
    //const tour = useTour();
    const dt = {
        panel: "search-panel",
        close: "search-panel-close",
        active: "search-panel-active",
    } as const;
    const isTourOpen = false //tourIsOpen || tour.isOpen;

    // genera data-tour in base al tour attivo:
    // documents => "docs-filters-..."
    // rubrica   => "rubrica-filters-..."
    /*const dt = React.useMemo(() => {
        return resolveDataTours<TourKey, SearchPanelTourName>(tour.activeKey, {
            scope: "AS", // IMPORTANT: deve matchare i tuoi step esistenti ("docs-filters-panel", ecc.)
            names: SEARCHPANEL_TOUR_NAMES,
            perKeyPrefix: SEARCHPANEL_TOUR_PREFIX,
            fallbackPrefix: "global",
        });
    }, [tour.activeKey]);*/

    // ---- chiusura “intelligente” stile SettingsTable
    const shouldIgnoreClose = React.useCallback(
        (reason?: CloseReason | string) => {
            if (!isTourOpen) return false;
            if (!reason) return false;
            return reason === "backdropClick" || reason === "clickAway" || reason === "escapeKeyDown";
        },
        [isTourOpen]
    );

    const requestClose = React.useCallback(
        (reason: CloseReason) => {
            if (shouldIgnoreClose(reason)) return;
            onClose();
        },
        [onClose, shouldIgnoreClose]
    );

    const recentCfg: Required<RecentSearchConfig> = {
        enabled: recentSearch?.enabled ?? false,
        cookieName: recentSearch?.cookieName ?? "fd_search_recent",
        limit: recentSearch?.limit ?? 8,
    };

    const [innerQ, setInnerQ] = React.useState(query ?? "");
    const [active, setActive] = React.useState(0);
    const [recent, setRecent] = React.useState<string[]>([]);
    const [ctxOpenFor, setCtxOpenFor] = React.useState<SearchItem | null>(null);
    const menuRef = React.useRef<HTMLButtonElement | null>(null);

    const btnRefs = React.useRef<Map<SearchItemId, React.RefObject<HTMLDivElement>>>(new Map());
    const deferredQ = React.useDeferredValue(innerQ);

    React.useEffect(() => {
        if (open && recentCfg.enabled) (setCustomRecent ?? setRecent)(readRecent(recentCfg.cookieName));
    }, [open, recentCfg.enabled, recentCfg.cookieName, setCustomRecent]);

    React.useEffect(() => {
        setActive(0);
    }, [deferredQ]);

    React.useEffect(() => {
        if (query !== undefined) setInnerQ(query);
    }, [query]);

    const filtered = React.useMemo(() => items.slice(0, limit), [items, limit]);

    const recentItems: SearchItem<T>[] = React.useMemo(() => {
        if (!recentCfg.enabled || (customRecent ?? recent).length === 0) return [];
        return (customRecent ?? recent).map((q, i) => ({
            id: `__recent_${i}`,
            title: q,
            subtitle: "Recent search",
            iconLeft: <MdSearchIcon />,
            payload: { recentQuery: q } as any,
        }));
    }, [recentCfg.enabled, recent, customRecent]);

    const simpleVirt = useSimpleVirtual(filtered.length);
    const virt = UseVirtualize ? UseVirtualize(filtered.length) : { start: simpleVirt.start, end: simpleVirt.end };
    const containerRef = UseVirtualize ? undefined : simpleVirt.containerRef;

    const commitSearchIfNeeded = React.useCallback(
        (q: string) => {
            if (!recentCfg.enabled) return;
            const next = pushRecent(customRecent ?? recent, q, recentCfg.limit);
            (setCustomRecent ?? setRecent)(next);
            writeRecent(recentCfg.cookieName, next);
        },
        [recentCfg.enabled, recentCfg.limit, recentCfg.cookieName, recent, customRecent, setCustomRecent]
    );

    const handleSelect = (it: SearchItem<T>) => {
        const rq = (it.payload as any)?.recentQuery as string | undefined;
        if (rq) {
            setInnerQ(rq);
            onQueryChange?.(rq);
            return;
        }
        commitSearchIfNeeded(innerQ);
        onSelect(it);
    };

    const handleKey = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
            e.stopPropagation();
            requestClose("escapeKeyDown");
            return;
        }
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((p) => Math.min(p + 1, Math.max(recentItems.length + filtered.length - 1, 0)));
        }
        if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((p) => Math.max(p - 1, 0));
        }
        if (e.key === "Enter") {
            if (active < recentItems.length) handleSelect(recentItems[active]);
            else {
                const rIdx = active - recentItems.length;
                const item = filtered[rIdx];
                if (item) handleSelect(item);
            }
        }
    };


    return (
        <AnimatePresence>
            {open && (
                <>
                    <FDBackdrop onClick={() => requestClose("backdropClick")} />

                    <div
                        className={`fixed inset-0 z-20 grid place-items-start max-w-screen max-h-screen ${(customRecent ?? recent)?.length > 0 ? "pt-[5vh]" : "pt-[10vh]"
                            } transition-all`}
                        onKeyDown={handleKey}
                    >
                        <motion.div
                            role="dialog"
                            aria-modal="true"
                            initial={{ opacity: 0, y: 6, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 6, scale: 0.98 }}
                            className="w-full max-w-3xl mx-auto"
                        >
                            <FDBox
                                radius="2xl"
                                shadow="2xl"
                                className="bg-white dark:bg-neutral-900/95 flex flex-col border border-neutral-200 dark:border-neutral-800 max-h-[90vh] max-w-screen"
                            >
                                {/* Header: searchbar */}
                                <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
                                    <div className="flex items-center gap-2">
                                        <FDInput
                                            data-tour={dt.panel}
                                            fullWidth
                                            size="lg"
                                            leftIcon={<MdSearchIcon />}
                                            placeholder={placeholder}
                                            value={innerQ}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                setInnerQ(e.target.value);
                                                onQueryChange?.(e.target.value);
                                            }}
                                            aria-label="Search"
                                        />

                                        <span data-tour={dt.close}>
                                            <FDIconButton
                                                variant="text"
                                                size="medium"
                                                ariaLabel="Close"
                                                onClick={() => requestClose("itemClick")}
                                                icon={<IoCloseIcon />}
                                            />
                                        </span>
                                    </div>

                                    {/* Chips filtri applicati */}
                                    {appliedFilters.length > 0 && (
                                        <div className="mt-4 space-y-1" data-tour={dt.active}>
                                            <p className="text-xs text-neutral-500">Sto cercando per...</p>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {appliedFilters.map((f) => (
                                                    <span
                                                        key={f.key}
                                                        data-tooltip-id={id_tooltip}
                                                        data-tooltip-content={`Rimuovi filtro: ${f.label ?? f.value}`}
                                                        className="inline-flex items-center gap-2 text-xs px-2 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800"
                                                    >
                                                        {f.value}
                                                        {f.onRemove && (
                                                            <button
                                                                onClick={f.onRemove}
                                                                className="opacity-70 hover:opacity-100 cursor-pointer"
                                                                aria-label={`Remove ${f.value}`}
                                                            >
                                                                <MdCloseIcon size={14} />
                                                            </button>
                                                        )}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {renderFilters && (
                                        <div className="mt-3">
                                            <h4 className="text-xs font-medium text-neutral-500 p-2">Filtri</h4>
                                            {renderFilters}
                                        </div>
                                    )}
                                </div>

                                {/* LISTA RECENT */}
                                {recentCfg.enabled && recentItems.length > 0 && (
                                    <div className="px-4 border-b border-neutral-200 dark:border-neutral-800 mb-2">
                                        <div className="p-2 flex items-center justify-between">
                                            <span className="text-xs font-medium text-neutral-500">Recent</span>
                                            <button
                                                className="text-[11px] px-2 py-1 rounded-md hover:bg-neutral-100 cursor-pointer dark:hover:bg-neutral-800 text-neutral-500"
                                                onClick={() => {
                                                    if (setCustomRecent) setCustomRecent([]);
                                                    setRecent([]);
                                                    writeRecent(recentCfg.cookieName, []);
                                                }}
                                            >
                                                Clear
                                            </button>
                                        </div>

                                        <div className="flex flex-col gap-1 mb-2">
                                            {recentItems.map((it, idx) => {
                                                const isActive = active === idx;
                                                return (
                                                    <button
                                                        key={it.id}
                                                        className={`group w-full h-14 px-3 rounded-lg flex items-center gap-3 text-left transition-colors cursor-pointer ${isActive
                                                            ? "bg-blue-50 dark:bg-neutral-800/80 ring-1 ring-blue-400/40"
                                                            : "hover:bg-neutral-100/80 dark:hover:bg-neutral-800/60"
                                                            }`}
                                                        onMouseEnter={() => setActive(idx)}
                                                        onClick={() => handleSelect(it)}
                                                        aria-selected={isActive}
                                                    >
                                                        <div className="w-8 h-8 flex items-center justify-center shrink-0 rounded-full bg-neutral-100 dark:bg-neutral-800">
                                                            {it.iconLeft}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-[15px] truncate">{it.title}</div>
                                                            {it.subtitle && <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{it.subtitle}</div>}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* LISTA RESULTS */}
                                <div className="px-4 max-h-[54vh] overflow-auto p-2" ref={containerRef}>
                                    {loading ? (
                                        <div className="flex flex-col gap-1">
                                            {new Array(5).fill(0).map((_, i) => (
                                                <div key={i} className="animate-pulse flex items-center gap-3 py-1 px-3">
                                                    <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700" />
                                                    <div className="flex-1 space-y-2 py-1">
                                                        <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4" />
                                                        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : filtered.length === 0 ? (
                                        <div className="p-6 text-sm text-neutral-500">{innerQ ? emptyNoResultsLabel : emptyLabel}</div>
                                    ) : (
                                        <div className="flex flex-col gap-1">
                                            {filtered.slice(virt.start, virt.end).map((it, i) => {
                                                const globalIdx = recentItems.length + virt.start + i;
                                                const isActive = globalIdx === active;

                                                return <div
                                                    key={it.id}
                                                    role="button"
                                                    tabIndex={0}
                                                    className={clsx(
                                                        "group w-full h-14 px-3 rounded-lg flex items-center gap-3 text-left transition-colors cursor-pointer",
                                                        isActive ? "bg-blue-50 dark:bg-neutral-800/80 ring-1 ring-blue-400/40" : "hover:bg-neutral-100/80 dark:hover:bg-neutral-800/60"
                                                    )}
                                                    onMouseEnter={() => setActive(globalIdx)}
                                                    onClick={() => handleSelect(it)}
                                                    aria-selected={isActive}
                                                >
                                                    <div className="w-8 h-8 flex items-center justify-center shrink-0 rounded-full bg-neutral-100 dark:bg-neutral-800">
                                                        {it.iconLeft}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-[15px] truncate">{highlight ? highlightText(it.title, deferredQ) : it.title}</div>
                                                        {it.subtitle && (
                                                            <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                                                                {highlight ? highlightText(it.subtitle, deferredQ) : it.subtitle}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {it.metaRight && <div className="ml-2 text-xs text-neutral-500 dark:text-neutral-400">{it.metaRight}</div>}

                                                    {it.actions && it.actions.length > 0 && (
                                                        <div className="ml-2 relative">
                                                            <FDIconButton
                                                                size="small"
                                                                ariaLabel="Actions"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setCtxOpenFor(it);
                                                                    (menuRef as React.MutableRefObject<HTMLElement | null>).current = e.currentTarget;
                                                                }}
                                                                icon={<IoEllipsisVerticalIcon className="text-neutral-500 dark:text-neutral-400" />}
                                                                initial={false}
                                                            />
                                                        </div>
                                                    )}
                                                </div>;
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* ribbon comandi tastiera */}
                                <div className="p-4 mt-3 text-[11px] text-neutral-500 flex items-center space-x-8 bg-neutral-100 dark:bg-neutral-800/40 rounded-b-2xl">
                                    <span className="inline-flex items-center gap-1">
                                        <span className={`inline-flex items-center ${footer_key}`}>
                                            <MdKeyboardArrowDownIcon size={16} />
                                        </span>
                                        <span className={`inline-flex items-center ${footer_key}`}>
                                            <MdKeyboardArrowUpIcon size={16} />
                                        </span>
                                        Muovi
                                    </span>
                                    <span className="inline-flex items-center gap-1">
                                        <span className={footer_key}>Enter</span> Seleziona
                                    </span>
                                    <span className="inline-flex items-center gap-1">
                                        <span className={footer_key}>Esc</span> Esci
                                    </span>
                                </div>
                            </FDBox>
                        </motion.div>
                    </div>

                    <ContextMenu
                        openFor={!!ctxOpenFor}
                        pos={menuRef}
                        onClose={() => setCtxOpenFor(null)}
                        menuButtons={
                            !!(ctxOpenFor && ctxOpenFor?.actions)
                                ? ctxOpenFor.actions.map((a) => ({
                                    title: a.label,
                                    icon: a.icon ?? null,
                                    onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
                                        a.onAction(ctxOpenFor.payload as T, e);
                                        setCtxOpenFor(null);
                                    },
                                }))
                                : []
                        }
                    />
                </>
            )}
        </AnimatePresence>
    );
};

export default FDSearchPanel;
