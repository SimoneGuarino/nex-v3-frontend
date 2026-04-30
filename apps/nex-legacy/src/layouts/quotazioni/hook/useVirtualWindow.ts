import { useRef, useState, useEffect, useCallback } from 'react';

type Mode = 'list' | 'grid';

type Opts = {
    count: number;
    containerHeight: number;     // px
    itemHeight: number;          // px (list) o cardHeight (grid)
    // GRID
    containerWidth?: number;     // per grid auto-cols
    minColWidth?: number;        // px, default 320
    gapX?: number;               // px, default 16
    gapY?: number;               // px, default 16
    overscan?: number;           // items in più per lato (righe)
};

export function useVirtualWindow({
    count, containerHeight, itemHeight,
    containerWidth = 0, minColWidth = 320, gapX = 16, gapY = 16, overscan = 4,
}: Opts) {
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const [scrollTop, setScrollTop] = useState(0);

    const onScroll = useCallback(() => {
        const y = scrollRef.current ? scrollRef.current.scrollTop : 0;
        setScrollTop(y);
    }, []);

    useEffect(() => {
        const sc = scrollRef.current;
        if (!sc) return;
        const handler = () => onScroll();
        sc.addEventListener('scroll', handler, { passive: true });
        // inizializza
        handler();
        return () => sc.removeEventListener('scroll', handler);
    }, [onScroll]);
    
    const indexAt = useCallback((i: number) => i, []);

    // GRID A CARTE DI ALTEZZA FISSA
    const usableW = Math.max(0, containerWidth);
    const cols = Math.max(1, Math.floor((usableW + gapX) / (minColWidth + gapX)));
    const colWidth = cols > 0 ? (usableW - gapX * (cols - 1)) / cols : usableW; // info se serve
    const rowHeight = itemHeight + gapY; // card + gap verticale
    const rows = Math.ceil(count / cols);
    const totalHeight = Math.max(0, rows * rowHeight - gapY);

    const firstVisibleRow = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
    const visibleRowCount = Math.ceil(containerHeight / rowHeight) + overscan * 2;
    const lastVisibleRow = Math.min(rows - 1, firstVisibleRow + visibleRowCount);
    const startIndex = Math.min(count, firstVisibleRow * cols);
    const endIndex = Math.min(count, (lastVisibleRow + 1) * cols);

    const paddingTop = firstVisibleRow * rowHeight;
    const renderedRows = lastVisibleRow - firstVisibleRow + 1;
    const takenHeight = renderedRows * rowHeight - gapY;
    const paddingBottom = Math.max(0, totalHeight - paddingTop - takenHeight);

    return {
        scrollRef,
        startIndex,
        endIndex,
        range: [startIndex, endIndex] as const,
        paddingTop,
        paddingBottom,
        totalHeight,
        cols,
        rows,
        indexAt,
        layout: 'grid' as const,
        // opzionale: colWidth per media queries custom
        colWidth,
    };
}
