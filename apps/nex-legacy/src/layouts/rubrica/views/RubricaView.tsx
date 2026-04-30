import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TableVirtualized } from "components/Virtualized/table";

import {
    LoadRubricaAPI,
    type RubricaItem,
    type RubricaResponse,
} from "../fetchdatas/getRubricaData";

const PAGE_SIZE = 25;

interface RubricaViewProps {
    selectedItem: RubricaItem | null;
    resetToken: number;
    searchQuery?: string;
    footerSettings?: {
        showColSettings?: boolean;
        colSettingsOpen?: boolean;
        setColSettingsOpen?: (v: boolean) => void;
    };
}

const COLUMNS = [
    { label: "Interno", key: "interno", sort: true, sortType: "string", width: 100 },
    { label: "Nome", key: "nome", sort: true, sortType: "string", width: 150 },
    { label: "Cognome", key: "cognome", sort: true, sortType: "string", width: 180 },
    { label: "Sede", key: "sede", sort: true, sortType: "string", width: 180 },
    { label: "Numero sede", key: "numeroSede", sort: true, sortType: "string", width: 160 },
    { label: "Mobile", key: "mobile", sort: true, sortType: "string", width: 160 },
    { label: "Email", key: "email", sort: true, sortType: "string", width: 230 },
    { label: "Divisione", key: "divisione", sort: true, sortType: "string", width: 160 },
    { label: "BU", key: "bu", sort: true, sortType: "string", width: 120 },
    { label: "Funzione", key: "funzione", sort: true, sortType: "string", width: 180 },
    { label: "Agente 1", key: "agente1", sort: true, sortType: "string", width: 120 },
    { label: "Agente 2", key: "agente2", sort: true, sortType: "string", width: 120 },
    { label: "Agente 3", key: "agente3", sort: true, sortType: "string", width: 120 },
    { label: "Agente 4", key: "agente4", sort: true, sortType: "string", width: 120 },
    { label: "Buyer", key: "buyer", sort: true, sortType: "string", width: 120 },
];

export function RubricaView({
    selectedItem,
    resetToken,
    searchQuery,
    footerSettings,
}: RubricaViewProps) {
    const [tableData, setTableData] = useState<RubricaItem[]>([]);
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
        (item: RubricaItem) => {
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

        const handleComplete = (data: RubricaResponse | null) => {
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

        LoadRubricaAPI({
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

        const handleComplete = (data: RubricaResponse | null) => {
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

        await LoadRubricaAPI({
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
            cookie="rubrica-columns"
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

export default RubricaView;
