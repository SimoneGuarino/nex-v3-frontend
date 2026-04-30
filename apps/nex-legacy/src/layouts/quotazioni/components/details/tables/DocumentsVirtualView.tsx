import React, {
    memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState,
} from "react";
import FDBox from "components/UI/box/FDBox";
import SkeletonLoader from "../../SkeletonLoader";
import { useMeasure } from "layouts/quotazioni/hook/useMeasure";
import { useVirtualWindow } from "layouts/quotazioni/hook/useVirtualWindow";
import type { CartProductDTO, ProductDoc, TextRequestCartDTO } from "layouts/quotazioni/types/qts_product";

export type ViewMode = "grid" | "list";

type Props = {
    items: ProductDoc[] | CartProductDTO[];
    view: ViewMode;

    // renderer
    renderCard: (item: ProductDoc, index: number) => React.ReactNode; // grid
    renderRow: (item: CartProductDTO | TextRequestCartDTO, index: number) => React.ReactNode; // list

    loading: boolean;

    // layout
    cardHeight?: number;   // grid card fixed height
    itemHeight?: number;   // list *collapsed* min height (es. 64–72)
    minColWidth?: number;
    gapX?: number;
    gapY?: number;
    overscan?: number;
    className?: string;

    scope: string;

    // infinite scroll
    onEndReached?: () => void;
    endReachedDisabled?: boolean;
    loadingMore?: boolean;
    endOffsetPx?: number;
    highlightedItemId: string[];
};

/** Row wrapper che:
 * - si attiva solo quando (quasi) visibile (IO con isteresi)
 * - misura l'altezza reale e la notifica (RO batched in rAF)
 */
const MeasuredRow: React.FC<{
    rowKey: string;
    minHeight: number;
    onHeight: (key: string, h: number) => void;
    children: React.ReactNode;
}> = ({ rowKey, minHeight, onHeight, children }) => {
    const ref = useRef<HTMLDivElement | null>(null);

    useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return;

        const measure = () => {
            const h = Math.max(minHeight, Math.ceil(el.getBoundingClientRect().height));
            onHeight(rowKey, h);
        };

        measure();

        const ro = new ResizeObserver(() => {
            measure();
        });

        ro.observe(el);

        return () => {
            ro.disconnect();
        };
    }, [rowKey, minHeight, onHeight]);

    return (
        <div ref={ref} className="w-full">
            {children}
        </div>
    );
};

const DocumentsVirtualView: React.FC<Props> = ({
    items,
    view,
    renderCard,
    renderRow,
    loading,
    cardHeight = 160,
    itemHeight,          // default realistico per QuotationCard collapsed (64–72)
    minColWidth = 320,
    gapX = 16,
    gapY = 16,
    overscan = 4,
    className = "",
    scope,
    onEndReached,
    endReachedDisabled = false,
    loadingMore = false,
    endOffsetPx = 800,
    highlightedItemId
}) => {
    const { ref: rootSizerRef, rect } = useMeasure<HTMLDivElement>(); // container size (vh/vw) :contentReference[oaicite:1]{index=1}
    const [autoMinH, setAutoMinH] = useState<number>(120); // fallback realistico per QuotationCard collapsed //@DEFAULT: 68
    const effectiveMinH = (view === "list")
        ? (typeof itemHeight === "number" ? itemHeight : autoMinH)
        : (itemHeight ?? 68);
    const count = items.length;

    const listScrollRef = useRef<HTMLDivElement | null>(null);
    // GRID virtualizer (immutato)
    const vGrid = useVirtualWindow({
        count,
        containerHeight: rect.height,
        containerWidth: rect.width,
        itemHeight: cardHeight,
        minColWidth,
        gapX,
        gapY,
        overscan,
    }); // :contentReference[oaicite:2]{index=2}

    const hasUserScrolledRef = useRef(false);
    const scrollRef = view === "grid" ? vGrid.scrollRef : listScrollRef;

    // scroll throttled con rAF
    const [scrollTop, setScrollTop] = useState(0);
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        const sc = scrollRef.current;
        if (!sc) return;

        const onScroll = () => {
            if (rafRef.current == null) {
                rafRef.current = requestAnimationFrame(() => {
                    rafRef.current = null;
                    setScrollTop(sc.scrollTop);

                    if (sc.scrollTop > 0 && !hasUserScrolledRef.current) {
                        hasUserScrolledRef.current = true;
                    };
                });
            };
        };

        sc.addEventListener("scroll", onScroll, { passive: true });
        onScroll();

        return () => {
            sc.removeEventListener("scroll", onScroll);
            if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        };
    }, [scrollRef, view]);

    // SENTINEL per infinite scroll
    const endRef = useRef<HTMLDivElement | null>(null);
    const loadMoreLockRef = useRef(false);

    useEffect(() => {
        if (!onEndReached || endReachedDisabled) return;

        const sc = vGrid.scrollRef.current;
        if (!sc) return;

        if (!hasUserScrolledRef.current) return;

        const remaining = sc.scrollHeight - (sc.scrollTop + sc.clientHeight);

        if (remaining > endOffsetPx) return;

        if (loadMoreLockRef.current) return;
        loadMoreLockRef.current = true;

        Promise.resolve(onEndReached())
            .finally(() => {
                requestAnimationFrame(() => {
                    loadMoreLockRef.current = false;
                });
            });
    }, [
        scrollTop,               // si aggiorna a ogni scroll (rAF)
        count,                   // quando arrivano nuovi items
        rect.height, rect.width, // resize cambia scrollHeight/clientHeight
        onEndReached,
        endReachedDisabled,
        endOffsetPx
    ]);

    useEffect(() => {
        // reset lock quando cambi tab/view
        loadMoreLockRef.current = false;
    }, [scope, view]);


    // ==========================
    // LIST: variable-row engine
    // ==========================
    const list = items as CartProductDTO[];
    const minH = effectiveMinH + 10;        // min collassato coerente con QuotationCard :contentReference[oaicite:3]{index=3}
    const rowGapPx = 8;             // Tailwind gap-2 nella colonna lista

    // mappe e cache
    const heightsRef = useRef<Map<string, number>>(new Map());
    const indexByKeyRef = useRef<Map<string, number>>(new Map());
    useLayoutEffect(() => {
        const m = new Map<string, number>();
        for (let i = 0; i < list.length; i++) m.set((list[i] as any)._id, i);
        indexByKeyRef.current = m;
    }, [list]);

    // batching misure in rAF + anchored correction
    const pendingRef = useRef<{ key: string; newH: number; prevH: number }[]>([]);
    const commitRaf = useRef<number | null>(null);
    const [tick, setTick] = useState(0);

    // overscan adattivo (freezabile durante espansioni)
    const [dynOverscan, setDynOverscan] = useState(overscan);
    const lastY = useRef(0);
    const lastT = useRef(performance.now());
    const freezeOverscanUntil = useRef(0);

    // GhostRow invisibile: misura l'altezza *collapsed* reale della riga
    const ghostRef = useRef<HTMLDivElement | null>(null);

    // crea un “sample item”: primo elemento della lista o un placeholder minimale
    const sampleItem = (items as any[])[0] as CartProductDTO | undefined;

    // monta/aggiorna quando cambia larghezza (wrapping) o l’item di riferimento
    useLayoutEffect(() => {
        if (view !== "list") return;
        const el = ghostRef.current;
        if (!el) return;

        // misura iniziale
        const first = Math.round(el.getBoundingClientRect().height);
        if (first > 0 && first !== autoMinH) setAutoMinH(first);

        // osserva cambi di dimensione (e.g., resize, font, densità)
        const ro = new ResizeObserver((entries) => {
            const h = Math.round(entries[0].contentRect.height);
            if (h > 0 && h !== autoMinH) setAutoMinH(h);
        });
        ro.observe(el);
        return () => ro.disconnect();
        // trigger su width e sample
    }, [view, rect.width, sampleItem?._id]);

    useEffect(() => {
        const sc = vGrid.scrollRef.current;
        if (!sc) return;
        const onScroll = () => {
            if (performance.now() < freezeOverscanUntil.current) return;
            const now = performance.now();
            const dy = Math.abs(sc.scrollTop - lastY.current);
            const dt = now - lastT.current;
            lastY.current = sc.scrollTop;
            lastT.current = now;
            const speed = dy / Math.max(1, dt); // px/ms
            const next = speed > 1.2 ? 12 : speed > 0.6 ? 8 : 4;
            if (next !== dynOverscan) setDynOverscan(next);
        };
        sc.addEventListener("scroll", onScroll, { passive: true });
        return () => sc.removeEventListener("scroll", onScroll);
    }, [vGrid.scrollRef, dynOverscan]);

    const avgMeasuredHeight = useMemo(() => {
        const values = Array.from(heightsRef.current.values());
        if (!values.length) return minH;
        return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    }, [tick, minH]);

    // prefix & total (includi GAP globali)
    const { prefix, total } = useMemo(() => {
        const p = new Array<number>(list.length + 1);
        p[0] = 0;
        for (let i = 0; i < list.length; i++) {
            const key = (list[i] as any)._id as string;
            const estimatedH = Math.max(minH, avgMeasuredHeight);
            const h = heightsRef.current.get(key) ?? estimatedH;
            p[i + 1] = p[i] + h;
        }
        const gapsAll = Math.max(0, list.length - 1) * rowGapPx;
        return { prefix: p, total: p[list.length] + gapsAll };
    }, [list, minH, tick, rect.width]); // ricalcola se cambia wrapping

    const getRowTop = useCallback(
        (index: number) => prefix[index] + index * rowGapPx,
        [prefix, rowGapPx]
    );

    const getRowBottom = useCallback(
        (index: number) => prefix[index + 1] + index * rowGapPx,
        [prefix, rowGapPx]
    );

    const findStart = useCallback((y: number) => {
        let lo = 0;
        let hi = list.length - 1;
        let ans = 0;

        while (lo <= hi) {
            const mid = (lo + hi) >> 1;
            if (getRowBottom(mid) > y) {
                ans = mid;
                hi = mid - 1;
            } else {
                lo = mid + 1;
            }
        }

        return ans;
    }, [list.length, getRowBottom]);

    const onHeight = useCallback(
        (key: string, hRaw: number) => {
            const h = Math.max(minH, Math.round(hRaw));
            const prev = heightsRef.current.get(key) ?? minH;
            if (h === prev) return;

            heightsRef.current.set(key, h);
            pendingRef.current.push({ key, newH: h, prevH: prev });

            if (!commitRaf.current) {
                commitRaf.current = requestAnimationFrame(() => {
                    commitRaf.current = null;

                    const sc = scrollRef.current;
                    if (sc) {
                        const yTop = sc.scrollTop;
                        const startNow = findStart(yTop);
                        let deltaTop = 0;

                        for (const u of pendingRef.current) {
                            const idx = indexByKeyRef.current.get(u.key);
                            if (idx != null && idx < startNow) {
                                deltaTop += u.newH - u.prevH;
                            }
                        }

                        if (deltaTop) {
                            sc.scrollTop = yTop + deltaTop;
                        }
                    }

                    pendingRef.current = [];
                    setTick((t) => t + 1);
                });
            }
        },
        [findStart, minH, scrollRef]
    );

    // isteresi sugli indici (evita rimbalzi ±1)
    const prevStartRef = useRef(0);
    const prevEndRef = useRef(0);

    // durante batch di misure, congela overscan breve (evita vibrazioni coda)
    useEffect(() => {
        if (pendingRef.current.length > 0) {
            freezeOverscanUntil.current = performance.now() + 250;
        }
    });

    // RENDER LIST
    let listContent: React.ReactNode = null;
    if (view === "list") {
        const viewportH = rect.height;
        const yTop = scrollTop;
        const yBot = yTop + viewportH;

        let startIndex = findStart(yTop);
        let endExclusive = startIndex;

        const target = yBot + minH * (dynOverscan ?? 4);

        while (endExclusive < list.length && getRowBottom(endExclusive) < target) {
            endExclusive++;
        }

        endExclusive = Math.min(list.length, endExclusive + 1);
        startIndex = Math.max(0, startIndex - (dynOverscan ?? 4));

        const HYST = 1 * minH;
        const topEdge = getRowTop(startIndex);
        const bottomEdge = endExclusive > 0 ? getRowBottom(endExclusive - 1) : 0;
        const prevTopEdge = getRowTop(prevStartRef.current);
        const prevBottomEdge = prevEndRef.current > 0 ? getRowBottom(prevEndRef.current - 1) : 0;

        if (Math.abs(topEdge - prevTopEdge) < HYST) {
            startIndex = prevStartRef.current;
        }
        if (Math.abs(bottomEdge - prevBottomEdge) < HYST) {
            endExclusive = Math.max(prevEndRef.current, endExclusive);
        }

        prevStartRef.current = startIndex;
        prevEndRef.current = endExclusive;

        const offsetTop = getRowTop(startIndex);
        const slice = list.slice(startIndex, endExclusive);


        listContent = (
            <div style={{ height: total, position: "relative" }}>
                {/* sentinel in LIST (opzionale) */}
                {onEndReached && (
                    <div
                        ref={endRef}
                        style={{
                            height: 1,
                            position: "absolute",
                            left: 0,
                            right: 0,
                            top: Math.max(0, total - 1),
                        }}
                    />
                )}

                <div
                    className="flex flex-col w-full p-0.5 gap-2"
                    style={{
                        position: "absolute",
                        inset: 0,
                        transform: `translateY(${offsetTop}px)`,
                        overflow: "hidden",
                        willChange: "transform",
                    }}
                >
                    {slice.map((it: CartProductDTO, i) => {
                        const key = (it as any)._id as string;
                        const globalIndex = startIndex + i;
                        const highlighted = highlightedItemId.includes(it.product_id);

                        return (
                            <MeasuredRow
                                key={key}
                                rowKey={key}
                                minHeight={minH}
                                onHeight={onHeight}
                            >
                                <FDBox
                                    variant={it.kind === "TEXT_REQUEST" ? "ghost" : "gradient"}
                                    border={true} radius="md"

                                    className={`flex flex-col gap-2 px-2  ${highlighted ? 'border-2 border-blue-300 dark:border-blue-300/40 !bg-blue-100 dark:!bg-blue-300/10' : ''} `}
                                    style={{
                                        // niente content-visibility:auto in LIST (evita late materialization)
                                        contain: "layout paint style",
                                        containIntrinsicSize: `${minH}px`,
                                    }}
                                >
                                    {renderRow(it, globalIndex)}
                                </FDBox>
                            </MeasuredRow>
                        );
                    })}

                    {onEndReached && loadingMore && (
                        <div className="w-full py-3 text-center text-xs text-neutral-500">
                            Carico altri documenti…
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // RENDER GRID (immutato)
    let gridContent: React.ReactNode = null;
    if (view === "grid") {
        const slice = (items as ProductDoc[]);
        gridContent = (
            <>
                <div className="flex flex-wrap p-0.5 w-full" style={{ rowGap: `${gapY}px`, columnGap: `${gapX}px` }}>
                    {loading ? (
                        <SkeletonLoader count={16} />
                    ) : (
                        slice.map((it: ProductDoc, i) => {
                            const globalIndex = i;
                            return (
                                <React.Fragment key={it._id}>
                                    <FDBox
                                        variant="gradient"
                                        radius="2xl"
                                        shadow="sm"
                                        pad="md"
                                        border
                                        className="w-full md:w-[calc((100%-16px)/2)] xl:w-[calc((100%-64px)/4)] h-full flex flex-col dark:bg-neutral-800"
                                        style={{ height: cardHeight }}
                                        role="option"
                                        onClick={() => { }}
                                    >
                                        {renderCard(it, globalIndex)}
                                    </FDBox>
                                </React.Fragment>
                            );
                        })
                    )}
                    {onEndReached && (
                        <>
                            <div ref={endRef} style={{ height: 1 }} />
                            {loadingMore && (
                                <div className="w-full py-3 text-center text-xs text-neutral-500">
                                    Carico altri documenti…
                                </div>
                            )}
                        </>
                    )}
                </div>
            </>
        );
    };

    return (
        <div ref={vGrid.scrollRef} className={`relative w-full h-full overflow-auto ${className}`}>
            <div ref={rootSizerRef} className="relative w-full h-full">
                {view === "list" && sampleItem && (
                    <div
                        aria-hidden
                        className="absolute inset-x-0 top-0"     // stessa larghezza della lista
                        style={{ visibility: "hidden", pointerEvents: "none" }} // misura sì, ma non interagisce
                    >
                        <div ref={ghostRef} className="w-full">
                            <FDBox
                                radius="md"
                                className="flex flex-col gap-2 px-2" // stesse classi della riga reale
                                style={{ contain: "layout paint style" }}
                            >
                                {/* forza lo stato collassato (expanded=false) */}
                                {renderRow({ ...(sampleItem as any), __forceCollapsed: true }, 0)}
                            </FDBox>
                        </div>
                    </div>
                )}
                {view === "grid" ? gridContent : listContent}
            </div>
        </div>
    );
};

export default memo(DocumentsVirtualView);