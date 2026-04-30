import React, { useCallback, useEffect, useRef, useState } from "react";
import { TableVirtualized } from "components/Virtualized/table";

import {
    LoadCondGaranziaAPI,
    type CondGaranziaItem,
    type CondGaranziaResponse,
} from "../fetchdatas/getCondGaranziaData";

const PAGE_SIZE = 25;

interface CondGaranziaViewProps {
    selectedItem: CondGaranziaItem | null;
    resetToken: number;
    searchQuery?: string;
    footerSettings?: {
        showColSettings?: boolean;
        colSettingsOpen?: boolean;
        setColSettingsOpen?: (v: boolean) => void;
    };
}

const COLUMNS = [
    { label: "Brand", key: "brand", sort: true, sortType: "string", width: 140 },
    { label: "Tipo Garanzia", key: "tipoGaranzia", sort: true, sortType: "string", width: 200 },
    { label: "Contatto", key: "contatto", sort: true, sortType: "string", width: 200 },
    { label: "Durata Garanzia", key: "durataGaranzia", sort: true, sortType: "string", width: 200 },
    { label: "DOA", key: "DOA", sort: true, sortType: "string", width: 200 },
    { label: "Gestione DOA", key: "chiGestisceIlDoa", sort: true, sortType: "string", width: 200 },
    { label: "Giorni DOA", key: "DOAGiorni", sort: true, sortType: "string", width: 200 },
    ...["note", "note1", "note2", "note3", "note4"].map((key, idx) => ({
        label: idx === 0 ? "Note" : `Note ${idx}`,
        key,
        sort: true,
        sortType: "string",
        width: 200,
        onHover: true,
        sxText: {
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            height: "auto !important",
            textOverflow: "ellipsis",
            WebkitLineClamp: "2",
        },
    })),
];

export function CondGaranziaView({
    selectedItem,
    resetToken,
    searchQuery,
    footerSettings,
}: CondGaranziaViewProps) {
    const [tableData, setTableData] = useState<CondGaranziaItem[]>([]);
    const [columns, setColumns] = useState(COLUMNS);
    const [totalRows, setTotalRows] = useState<number | null>(null);
    const [initialLoading, setInitialLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const abortRef = useRef<AbortController | null>(null);
    const nextPageIndexRef = useRef<number>(1);

    const abortInFlight = useCallback(() => {
        if (abortRef.current) abortRef.current.abort();
    }, []);

    const showSelectedOnly = useCallback(
        (item: CondGaranziaItem) => {
            abortInFlight();
            setInitialLoading(false);
            setLoadingMore(false);
            setHasMore(false);
            setTotalRows(1);
            setTableData([item]);
        },
        [abortInFlight]
    );

    const loadFirstPage = useCallback(() => {
        setInitialLoading(true);
        setLoadingMore(false);
        setHasMore(true);
        nextPageIndexRef.current = 1;

        abortInFlight();

        const controller = new AbortController();
        abortRef.current = controller;

        const handleComplete = (data: CondGaranziaResponse | null) => {
            setInitialLoading(false);

            if (!data || !Array.isArray(data.items)) {
                setTableData([]);
                setTotalRows(0);
                setHasMore(false);
                return;
            }

            const items = data.items;
            const total =
                typeof data.total === "number" && Number.isFinite(data.total)
                    ? data.total
                    : items.length;

            setTableData(items);
            setTotalRows(total);

            const alreadyLoaded = (data.offset ?? 0) + items.length;
            setHasMore(alreadyLoaded < total);
        };

        LoadCondGaranziaAPI({
            abortLike: abortRef,
            q: searchQuery || "",
            offset: 0,
            onComplete: handleComplete,
        });

        return () => controller.abort();
    }, [abortInFlight, searchQuery]);

    const loadMore = useCallback(async (): Promise<boolean> => {
        if (selectedItem || !hasMore) return false;

        const pageIndex = nextPageIndexRef.current;
        const offset = pageIndex * PAGE_SIZE;

        let loaded = false;
        setLoadingMore(true);

        const handleComplete = (data: CondGaranziaResponse | null) => {
            setLoadingMore(false);

            if (!data || !Array.isArray(data.items) || data.items.length === 0) {
                setHasMore(false);
                return;
            }

            const items = data.items;
            loaded = items.length > 0;

            setTableData((prev) => {
                const merged = [...prev, ...items];
                const baseOffset = data.offset ?? offset;
                const total =
                    typeof data.total === "number" && Number.isFinite(data.total)
                        ? data.total
                        : merged.length;

                const alreadyLoaded = baseOffset + items.length;
                setTotalRows(total);
                setHasMore(alreadyLoaded < total);

                return merged;
            });
        };

        await LoadCondGaranziaAPI({
            abortLike: abortRef,
            q: searchQuery || "",
            offset,
            onComplete: handleComplete,
        });

        return loaded;
    }, [selectedItem, hasMore, searchQuery]);

    useEffect(() => {
        if (selectedItem) {
            showSelectedOnly(selectedItem);
            return;
        }

        const cleanup = loadFirstPage();
        return cleanup;
    }, [selectedItem, loadFirstPage, resetToken, showSelectedOnly]);

    return (
        <TableVirtualized
            data={tableData}
            setData={setTableData}
            columns={columns}
            setColumns={setColumns}
            cookie="garanzia-columns"
            results={totalRows ?? undefined}
            tableType="bottom-line"
            loadStatus={initialLoading}
            footer
            whereToFindData={false}
            className="h-full text-center"
            infiniteScroll={
                selectedItem
                    ? undefined
                    : {
                        func: loadMore,
                        offset: nextPageIndexRef,
                        numberToFetch: PAGE_SIZE,
                    }
            }
            footerSettings={footerSettings}
        />
    );
}

export default CondGaranziaView;
