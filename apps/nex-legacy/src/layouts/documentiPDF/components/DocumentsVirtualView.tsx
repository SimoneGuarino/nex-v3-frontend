// src\layouts\documentiPDF\components\DocumentsVirtualView.tsx
import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
//internal components
import type { DocumentItemMapped } from '../types';
import { useMeasure } from '../hooks/useMeasure';
import { useVirtualWindow } from '../hooks/useVirtualWindow';

export type ViewMode = 'grid' | 'list';

type Props = {
    items: DocumentItemMapped[];
    view: ViewMode;

    // renderer
    renderCard: (item: DocumentItemMapped, index: number) => React.ReactNode; // grid
    renderRow: (item: DocumentItemMapped, index: number) => React.ReactNode;  // list

    // layout
    cardHeight?: number;   // px (grid) – es. 140/160
    itemHeight?: number;   // px (list)
    minColWidth?: number;  // px – default 320
    gapX?: number;         // px – default 16 (grid col gap)
    gapY?: number;         // px – default 16 (grid row gap)
    overscan?: number;     // elementi/righe extra – default 4
    className?: string;

    // grouping (coerente con l’ordine in 'items')
    groupCounts?: number[]; // #item per gruppo
    groupLabels?: string[]; // label gruppo

    scope: string;                  // tab attivo - favorites, shared, deleted (per ora solo in "tutti")

    onEndReached?: () => void;        // chiamata quando il sentinel entra in viewport
    endReachedDisabled?: boolean;     // disabilita il trigger (es. no hasMore o throttling)
    loadingMore?: boolean;            // mostra spinner di coda
    endOffsetPx?: number;             // margine di prefetch (default 800px)
};

const ROW_H_HEADER = 40; // altezza header piatto (non sticky)

/**
 * Strategia stile "Virtuoso":
 * - Dentro la lista virtualizzata: SOLO elementi "piatti" (header + item fissi), NO sticky.
 * - Unico "floating header" sticky sopra la lista, che mostra il label del gruppo corrente
 *   e viene spinto verso l’alto quando entra il gruppo successivo.
 *
 * Fix chiave:
 * 1) In GRID i groupStartPx sono calcolati a **righe** usando v.cols, cardHeight e gapY ⇒
 *    il floating header cambia label esattamente al confine reale del gruppo.
 * 2) L’overlay è visibile solo dopo aver **superato** l’header piatto del gruppo corrente
 *    (niente doppio header in cima).
 * 3) Throttle dello scroll con rAF + niente backdrop-blur sull’overlay ⇒ scroll liscio.
 */
const DocumentsVirtualView: React.FC<Props> = ({
    items,
    view,
    renderCard,
    renderRow,
    cardHeight = 160,
    itemHeight = 68,
    minColWidth = 320,
    gapX = 16,
    gapY = 16,
    overscan = 4,
    className = '',
    groupCounts,
    groupLabels,
    scope,
    onEndReached,
    endReachedDisabled = false,
    loadingMore = false,
    endOffsetPx,
}) => {
    const { ref, rect } = useMeasure<HTMLDivElement>();
    const count = items.length;
    const isGrouped = !!(groupCounts && groupCounts.length);

    const endRef = React.useRef<HTMLDivElement | null>(null);
    const lockRef = React.useRef(false);

    // === Virtual window ===
    const v = useVirtualWindow({
        mode: view === 'grid' ? 'grid' : 'list',
        count,
        containerHeight: rect.height,
        itemHeight: view === 'grid' ? cardHeight : itemHeight,
        containerWidth: rect.width,
        minColWidth,
        gapX,
        gapY,
        overscan,
    });

    // === Stato scroll con throttle rAF (niente jank) ===
    const [scrollTop, setScrollTop] = useState(0);
    const rafRef = useRef<number | null>(null);
    const latestY = useRef(0);

    useEffect(() => {
        const sc = v.scrollRef.current;
        if (!sc) return;

        const onScroll = () => {
            latestY.current = sc.scrollTop;
            if (rafRef.current == null) {
                rafRef.current = requestAnimationFrame(() => {
                    rafRef.current = null;
                    setScrollTop(latestY.current);
                });
            }
        };

        sc.addEventListener('scroll', onScroll, { passive: true });
        // inizializza
        latestY.current = sc.scrollTop;
        setScrollTop(sc.scrollTop);

        return () => {
            sc.removeEventListener('scroll', onScroll);
            if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        };
    }, [v.scrollRef]);

    // === Prefix: indice primo item per gruppo ===
    const itemIndexBase = useMemo(() => {
        if (!isGrouped) return null;
        const base: number[] = new Array(groupCounts!.length);
        let acc = 0;
        for (let i = 0; i < groupCounts!.length; i++) {
            base[i] = acc;
            acc += groupCounts![i];
        }
        return base;
    }, [isGrouped, groupCounts]);

    const prefix = useMemo(() => {
        if (!isGrouped) return null;
        const p: number[] = [0];
        for (let i = 0; i < groupCounts!.length; i++) p.push(p[i] + groupCounts![i]);
        return p; // p[i] = start index del gruppo i
    }, [isGrouped, groupCounts]);

    // *** GRID: calcolo groupStartPx in **righe**
    // Ogni gruppo: header (ROW_H_HEADER) + N righe di card (rows * (cardHeight + gapY)).
    // rows = ceil(groupCounts[i] / v.cols). Questo allinea l'overlay al layout reale.
    const groupStartPxGrid = useMemo(() => {
        if (!isGrouped) return null;
        const cols = Math.max(1, v.cols || 1);
        const starts: number[] = new Array(groupCounts!.length);
        let acc = 0;
        for (let i = 0; i < groupCounts!.length; i++) {
            starts[i] = acc;
            const rows = Math.ceil(groupCounts![i] / cols);
            // header + tutte le righe del gruppo i
            acc += ROW_H_HEADER + (rows > 0 ? (rows * cardHeight + rows * gapY) : 0);
        }
        return starts;
    }, [isGrouped, groupCounts, v.cols, cardHeight, gapY]);

    // LIST: calcolo groupStartPx a pixel (header + items * itemHeight)
    const groupStartPxList = useMemo(() => {
        if (!isGrouped) return null;
        const starts: number[] = new Array(groupCounts!.length);
        let acc = 0;
        for (let i = 0; i < groupCounts!.length; i++) {
            starts[i] = acc;
            acc += ROW_H_HEADER + groupCounts![i] * itemHeight;
        }
        return starts;
    }, [isGrouped, groupCounts, itemHeight]);

    const groupStartPx = view === 'grid' ? groupStartPxGrid : groupStartPxList;

    // --- Hysteresis per visibilità header in viewport (pixel-based, stabile)
    const ENTER_HYST = 8; // px: entra in-view
    const EXIT_HYST = 12; // px: esce da in-view (maggiore di ENTER per evitare ping-pong)

    const inViewSetRef = useRef<Set<number>>(new Set());
    const [inViewVersion, setInViewVersion] = useState(0);

    useEffect(() => {
        if (!isGrouped || !groupStartPx?.length) {
            inViewSetRef.current.clear();
            setInViewVersion(v => v + 1);
            return;
        }

        const starts = groupStartPx;
        const yTop = scrollTop;
        const yBot = scrollTop + rect.height;

        // Aggiorna lo stato "in-view" con isteresi:
        // - ENTER: se header overlap con viewport estesa di ENTER_HYST
        // - EXIT:  se header NON overlap con viewport estesa di EXIT_HYST
        const s = inViewSetRef.current;

        // Trova un range minimo di gruppi da controllare (intorno alla viewport)
        // Partiamo dal primo il cui start < yBot + EXIT_HYST
        let lastIdx = 0;
        {
            let lo = 0, hi = starts.length - 1, ans = -1;
            while (lo <= hi) {
                const mid = (lo + hi) >> 1;
                if (starts[mid] < yBot + EXIT_HYST) { ans = mid; lo = mid + 1; }
                else hi = mid - 1;
            }
            lastIdx = Math.max(0, ans);
        }
        // e scendiamo finché stiamo sopra yTop - EXIT_HYST
        for (let gi = lastIdx; gi >= 0; gi--) {
            const top = starts[gi];
            const bottom = top + ROW_H_HEADER;

            const overlapsEnter =
                bottom > (yTop - ENTER_HYST) && top < (yBot + ENTER_HYST);

            const overlapsExit =
                bottom > (yTop - EXIT_HYST) && top < (yBot + EXIT_HYST);

            if (overlapsEnter) {
                s.add(gi);           // entra / resta
            } else if (!overlapsExit) {
                s.delete(gi);        // esce davvero
            } // altrimenti: zona di isteresi → mantieni stato precedente
            if (top < yTop - rect.height) break; // piccolo cut-off
        }

        setInViewVersion(v => v + 1); // forza re-render dove serve
    }, [isGrouped, groupStartPx, scrollTop, rect.height]);

    // Set stabile da usare nel render
    const groupsWithHeaderInView = inViewSetRef.current;

    // === Floating header: gruppo attivo + pushY + visibilità ===
    const [activeGroup, setActiveGroup] = useState(0);
    const [pushY, setPushY] = useState(0);
    const [showFloating, setShowFloating] = useState(false);

    useEffect(() => {
        if (!isGrouped || !groupStartPx?.length) {
            setActiveGroup(0);
            setPushY(0);
            setShowFloating(false);
            return;
        }
        const starts = groupStartPx;
        const y = scrollTop;

        // ultimo 'start <= y' (cambio label esatto alla soglia del gruppo successivo)
        let lo = 0, hi = starts.length - 1, gi = 0;
        while (lo <= hi) {
            const mid = (lo + hi) >> 1;
            if (starts[mid] <= y) { gi = mid; lo = mid + 1; }
            else hi = mid - 1;
        }
        setActiveGroup(gi);

        // push: quanto manca al prossimo header per "spingere" l'overlay
        const nextStart = starts[gi + 1] ?? Number.POSITIVE_INFINITY;
        const dist = nextStart - (y + ROW_H_HEADER);
        const py = dist < 0 ? dist : 0;
        // riduci sub-pixel jitter:
        setPushY(Math.round(py));

        // Sticky visibile solo se l'header PIATTO del primo gruppo NON è "in-view".
        // Così il passaggio sticky↔piatto è sincronizzato con i padding (niente snap).
        const firstHeaderInView = groupsWithHeaderInView.has(0);
        setShowFloating(!firstHeaderInView);
    }, [isGrouped, groupStartPx, scrollTop, inViewVersion]);

    useEffect(() => {
        if (!onEndReached || endReachedDisabled) return;
        const root = v.scrollRef.current;
        const target = endRef.current;
        if (!root || !target) return;

        // IntersectionObserver con rootMargin bottom per triggerare in anticipo
        // rispetto al fondo (endOffsetPx)
        // Lock per evitare chiamate multiple finché non viene rilasciato
        // (visto che può fare più fire in rapida successione)

        const io = new IntersectionObserver((entries) => {
            const e = entries[0];
            if (e.isIntersecting && !lockRef.current) {
                lockRef.current = true;
                Promise.resolve(onEndReached()).finally(() => {
                    // rilascia il lock nel prossimo frame: evita doppio fire nella stessa paint
                    requestAnimationFrame(() => { lockRef.current = false; });
                });
            }
        }, {
            root,
            //la posizione effettiva del target deve venir presa in considerazione, quindi
            //si usa direttamente target invece di 0
            rootMargin: `0px 0px ${(endOffsetPx ?? target.getBoundingClientRect().height)}px 0px`,
            threshold: 0.01
        });

        io.observe(target);
        return () => io.disconnect();
    }, [onEndReached, endReachedDisabled, endOffsetPx, v.scrollRef]);

    // === GRID: padding che compensano gli header fuori slice ===
    // NB: in grid il virtualizer lavora a items; noi aggiungiamo l’altezza degli header
    // SOLO per quelli che non renderizziamo (prima/dopo la slice).
    const gridPadding = useMemo(() => {
        if (!isGrouped || !groupCounts || !groupStartPx) {
            return { top: v.paddingTop, bottom: v.paddingBottom };
        }
        const yTop = scrollTop;
        const yBot = scrollTop + rect.height;

        let headersAbove = 0;  // completamente sopra (neanche in isteresi)
        let headersBelow = 0;  // completamente sotto

        for (let gi = 0; gi < groupCounts.length; gi++) {
            const top = groupStartPx[gi];
            const bottom = top + ROW_H_HEADER;

            const overlapsExit =
                bottom > (yTop - EXIT_HYST) && top < (yBot + EXIT_HYST);

            if (!overlapsExit) {
                // fuori anche dalla fascia EXIT → sta nei padding
                if (bottom <= yTop - EXIT_HYST) headersAbove++;
                else if (top >= yBot + EXIT_HYST) headersBelow++;
            }
            // se overlapsExit == true → consideralo "in-slice" (o in isteresi) → non nei padding
        }

        return {
            top: v.paddingTop + headersAbove * (ROW_H_HEADER + gapY),
            bottom: v.paddingBottom + headersBelow * (ROW_H_HEADER + gapY),
        };
    }, [isGrouped, groupCounts, groupStartPx, v.paddingTop, v.paddingBottom, scrollTop, rect.height, gapY]);

    /*const headerStarts = useMemo(() => {
        if (!isGrouped || !itemIndexBase) return new Set<number>();
        return new Set<number>(itemIndexBase);
    }, [isGrouped, itemIndexBase]);*/

    
    // ——————————————————————————————————————————————————————————
    // RENDER LIST
    // ——————————————————————————————————————————————————————————
    let listContent: React.ReactNode = null;
    if (view === 'list') {
        if (isGrouped && groupStartPxList && itemIndexBase) {
            // Finestra pixel-based
            const totalHeightPx =
                groupCounts!.length * ROW_H_HEADER +
                (itemIndexBase[itemIndexBase.length - 1] + groupCounts![groupCounts!.length - 1]) * itemHeight;

            const overPx = overscan * itemHeight + ROW_H_HEADER;
            const winStart = Math.max(0, scrollTop - overPx);
            const winEnd = Math.min(totalHeightPx, scrollTop + rect.height + overPx);

            const nodes: React.ReactNode[] = [];
            let renderedTop = Number.POSITIVE_INFINITY;
            let renderedBottom = 0;

            // primo gruppo visibile (binary search su groupStartPxList)
            let gi = 0;
            {
                let lo = 0, hi = groupCounts!.length - 1;
                while (lo <= hi) {
                    const mid = (lo + hi) >> 1;
                    if (groupStartPxList[mid] <= winStart) { gi = mid; lo = mid + 1; }
                    else hi = mid - 1;
                }
            }

            for (; gi < groupCounts!.length; gi++) {
                const gStart = groupStartPxList[gi];
                if (gStart > winEnd) break;

                // HEADER piatto
                if (gStart + ROW_H_HEADER > winStart) {
                    renderedTop = Math.min(renderedTop, gStart);
                    renderedBottom = Math.max(renderedBottom, gStart + ROW_H_HEADER);
                    nodes.push(
                        <div
                            key={`h-${gi}`}
                            className="w-full px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-300"
                            style={{ height: ROW_H_HEADER }}
                        >
                            {groupLabels?.[gi] ?? ''}
                        </div>
                    );
                }

                // ITEMS visibili del gruppo
                const base = itemIndexBase[gi];
                const itemsStartY = gStart + ROW_H_HEADER;
                const lastY = gStart + ROW_H_HEADER + groupCounts![gi] * itemHeight;
                if (itemsStartY > winEnd) break;

                const first = Math.max(0, Math.floor((winStart - itemsStartY) / itemHeight));
                const last = Math.min(groupCounts![gi], Math.ceil((winEnd - itemsStartY) / itemHeight));

                for (let j = first; j < last; j++) {
                    const idx = base + j;
                    const y = itemsStartY + j * itemHeight;
                    renderedTop = Math.min(renderedTop, y);
                    renderedBottom = Math.max(renderedBottom, Math.min(lastY, y + itemHeight));
                    nodes.push(
                        <div key={items[idx].id} style={{ height: itemHeight }} className="px-2">
                            {renderRow(items[idx], idx)}
                        </div>
                    );
                }
            }

            const paddingTopPx = Math.max(0, renderedTop === Number.POSITIVE_INFINITY ? 0 : renderedTop);
            const paddingBottomPx = Math.max(0, totalHeightPx - renderedBottom);

            listContent = (
                <>
                    <div style={{ height: paddingTopPx }} />
                    <div>{nodes}</div>
                    <div style={{ height: paddingBottomPx }} />
                </>
            );
        } else {
            // LIST flat: usa la finestra del virtualizer
            const slice = items.slice(v.startIndex, v.endIndex);
            listContent = (
                <>
                    <div style={{ height: v.paddingTop }} />
                    <div className="flex flex-col w-full p-0.5">
                        {slice.map((it, i) => {
                            const index = v.startIndex + i;
                            return (
                                <div key={it.id} style={{ height: itemHeight }} className="px-2">
                                    {renderRow(it, index)}
                                </div>
                            );
                        })}
                    </div>
                    <div style={{ height: v.paddingBottom }} />
                </>
            );
        };
    };

    // ——————————————————————————————————————————————————————————
    // RENDER GRID
    // ——————————————————————————————————————————————————————————
    let gridContent: React.ReactNode = null;
    if (view === 'grid') {
        const slice = items.slice(v.startIndex, v.endIndex);

        // Trova il gruppo di un indice item globale con prefix (p[i] <= idx < p[i+1])
        /*const findGroupOfIndex = (idx: number) => {
            if (!isGrouped || !prefix) return -1;
            let lo = 0, hi = prefix.length - 2, gi = 0;
            while (lo <= hi) {
                const mid = (lo + hi) >> 1;
                if (prefix[mid] <= idx && idx < prefix[mid + 1]) { gi = mid; break; }
                if (idx < prefix[mid]) hi = mid - 1; else lo = mid + 1;
            }
            return gi;
        };*/

        const shownInSlice = new Set<number>();

        gridContent = (
            <>
                <div style={{ height: gridPadding.top }} />
                <div className="flex flex-wrap p-0.5 w-full" style={{ rowGap: `${gapY}px`, columnGap: `${gapX}px` }}>
                    {slice.map((it, i) => {
                        const globalIndex = v.startIndex + i;

                        // Trova il gruppo dell'item corrente
                        const gi = isGrouped && prefix ? (() => {
                            let lo = 0, hi = prefix.length - 2, g = 0;
                            while (lo <= hi) {
                                const mid = (lo + hi) >> 1;
                                if (prefix[mid] <= globalIndex && globalIndex < prefix[mid + 1]) { g = mid; break; }
                                if (globalIndex < prefix[mid]) hi = mid - 1; else lo = mid + 1;
                            }
                            return g;
                        })() : -1;

                        // Mostra l'header SOLO se quel gruppo ha l'header "in viewport" (pixel-based)
                        // e se non lo abbiamo già mostrato in questa slice
                        let showHeader = false;
                        let headerIdx = -1;

                        if (isGrouped && gi !== -1 && groupsWithHeaderInView.has(gi) && !shownInSlice.has(gi)) {
                            headerIdx = gi;
                            showHeader = true;
                            shownInSlice.add(gi);
                        }

                        return (
                            <React.Fragment key={it.id}>
                                {showHeader && (
                                    <div
                                        // key distinta per evitare che React “ricicli” header tra gruppi nella stessa slice
                                        key={`hdr-${headerIdx}`}
                                        className="w-full px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-300"
                                        style={{ height: ROW_H_HEADER }}
                                    >
                                        {groupLabels?.[headerIdx] ?? ''}
                                    </div>
                                )}

                                <div
                                    // key distinta per card (aiuta nei casi limite di slice che inseriscono header prima della card)
                                    key={`card-${it.id}`}
                                    className="w-full md:w-[calc((100%-16px)/2)] xl:w-[calc((100%-64px)/4)]"
                                    style={{ height: cardHeight }}
                                >
                                    {renderCard(it, globalIndex)}
                                </div>
                            </React.Fragment>
                        );
                    })}

                    {/* Sentinel di fine lista per l’infinite scroll */}
                    {scope === 'all' && /* per ora, funziona solo in "Tutti" */ (
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
                <div style={{ height: gridPadding.bottom }} />
            </>
        );
    };


    // ——————————————————————————————————————————————————————————
    // Sanity checks
    // ——————————————————————————————————————————————————————————
    if (import.meta.env.VITE_NODE_ENV !== 'production' && isGrouped && groupCounts && items) {
        const sum = groupCounts.reduce((a, b) => a + b, 0);
        if (sum !== items.length) {
            console.warn('[DocumentsVirtualView] groupCounts sum != items.length', { sum, items: items.length });
        }
        if (groupLabels && groupLabels.length !== groupCounts.length) {
            console.warn('[DocumentsVirtualView] groupLabels length != groupCounts length', { labels: groupLabels.length, groups: groupCounts.length });
        }
    };


    // ——————————————————————————————————————————————————————————
    // Render finale
    // ——————————————————————————————————————————————————————————
    return (
        <div ref={v.scrollRef} className={`relative w-full h-full overflow-auto ${className}`}>
            {/* Floating header (UNICO sticky). Nascosto se l'header piatto del gruppo corrente è visibile. */}
            {isGrouped && groupLabels && groupStartPx && (
                <div className="pointer-events-none sticky top-0 z-1">
                    <AnimatePresence initial={false}>
                        {showFloating && (
                            <motion.div
                                key={activeGroup} // re-animate quando cambia gruppo
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.16, ease: 'easeOut' }}
                                className="px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-300
                                    bg-white/80 dark:bg-neutral-900/80"
                                style={{
                                    height: ROW_H_HEADER,
                                    // push liscio (già arrotondato) su un wrapper esterno:
                                    transform: `translate3d(0, ${pushY}px, 0)`,
                                }}
                            >
                                {groupLabels[activeGroup] ?? ''}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* Contenuto virtualizzato (solo elementi piatti) */}
            <div ref={ref} className="relative w-full h-full">
                {view === 'grid' ? gridContent : listContent}
            </div>
        </div>
    );
};

export default memo(DocumentsVirtualView);