import React, { useCallback, useEffect, useRef, useState } from "react";
import { TableVirtualized } from "components/Virtualized/table";

import {
    LoadMicrosettoriAPI,
    type MicrosettoriItem,
    type MicrosettoriResponse,
} from "../fetchdatas/getMicrosettoriData";

const PAGE_SIZE = 25;

interface MicrosettoriViewProps {
    selectedItem: MicrosettoriItem | null;
    resetToken: number;
    searchQuery?: string;
    footerSettings?: {
        showColSettings?: boolean;
        colSettingsOpen?: boolean;
        setColSettingsOpen?: (v: boolean) => void;
    };
}

const COLUMNS = [
    { label: "Codice", key: "code", sort: true, sortType: "string", width: 140 },
    { label: "Descrizione", key: "description", sort: true, sortType: "string", width: 400 },
];

export function MicrosettoriView({
    selectedItem,
    resetToken,
    searchQuery,
    footerSettings,
}: MicrosettoriViewProps) {
    const [tableData, setTableData] = useState<MicrosettoriItem[]>([]);
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
        (item: MicrosettoriItem) => {
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

        const handleComplete = (data: MicrosettoriResponse | null) => {
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

        LoadMicrosettoriAPI({
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

        const handleComplete = (data: MicrosettoriResponse | null) => {
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

        await LoadMicrosettoriAPI({
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
            cookie="microsettori-columns"
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

export default MicrosettoriView;
