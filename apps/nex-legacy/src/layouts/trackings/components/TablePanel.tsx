import { useCallback, useMemo } from "react";
import type { SetStateAction } from "react";

import FDButton from "components/UI/buttons/FDButton";
import ContextMenu from "components/UI/menu/ContextMenu";
import { TableVirtualized } from "components/Virtualized/table";

import { IoCopy } from "react-icons/io5";
import { RxOpenInNewWindow } from "react-icons/rx";

import {
    renderCourierCell,
    TRACKINGS_COURIER_COLUMN_KEY,
    TRACKINGS_COURIER_COLUMN_LABEL,
    TRACKINGS_OPTIONS_COLUMN_KEY,
    TRACKINGS_OPTIONS_COLUMN_LABEL,
} from "../utils/helpers";
import type {
    TrackingsOptionMenuState,
    TrackingsTableColumn,
    TrackingsTableState,
    TrackingRow,
} from "../types";

type TablePanelProps = {
    table: TrackingsTableState;
    trackingMenu: TrackingsOptionMenuState;
};

/**
 * Incapsula tutta la logica visuale della tabella virtualizzata trackings,
 * incluse colonne fisse e context menu per le azioni sul tracking.
 */
export default function TablePanel({ table, trackingMenu }: TablePanelProps) {
    const {
        columns,
        setColumns,
        rows,
        setRows,
        total,
        loadStatus,
        serverSort,
        infiniteScroll,
        onSortChange,
    } = table;
    const { openMenu: openTrackingMenu } = trackingMenu;

    /**
     * Colonna fissa che espone il bottone per aprire il menu tracking della riga.
     */
    const optionsColumn = useMemo<TrackingsTableColumn>(
        () => ({
            label: TRACKINGS_OPTIONS_COLUMN_LABEL,
            key: TRACKINGS_OPTIONS_COLUMN_KEY,
            width: 140,
            sort: false,
            type: "custom",
            render: ({ row }: { row: TrackingRow }) => {
                const hasTrackingUrl = String(row?.URL_TRACKING || "").trim().length > 0;

                return (
                    <div className="flex justify-center">
                        <FDButton
                            size="small"
                            radius="md"
                            variant="solid"
                            color="primary"
                            disabled={!hasTrackingUrl}
                            onClick={(event) => openTrackingMenu(event, row)}
                        >
                            Tracking
                        </FDButton>
                    </div>
                );
            },
        }),
        [openTrackingMenu]
    );

    /**
     * Colonna corriere customizzata con resa uniforme di testo e logo.
     */
    const courierColumn = useMemo<TrackingsTableColumn>(
        () => ({
            label: TRACKINGS_COURIER_COLUMN_LABEL,
            key: TRACKINGS_COURIER_COLUMN_KEY,
            width: 180,
            type: "custom",
            render: ({ row }: { row: TrackingRow }) => renderCourierCell(row?.CORRIERE),
        }),
        []
    );

    /**
     * Reinietta le colonne fisse del modulo ogni volta che la tabella aggiorna la configurazione.
     */
    const withFixedColumns = useCallback(
        (incomingColumns: TrackingsTableColumn[]) => {
            const nextColumns = incomingColumns.reduce<TrackingsTableColumn[]>((acc, column) => {
                const key = String(column?.key || "").trim().toUpperCase();
                const label = String(column?.label || "").trim().toUpperCase();

                if (
                    key === TRACKINGS_OPTIONS_COLUMN_KEY ||
                    label === TRACKINGS_OPTIONS_COLUMN_LABEL.toUpperCase()
                ) {
                    return acc;
                }

                if (
                    key === TRACKINGS_COURIER_COLUMN_KEY ||
                    label === TRACKINGS_COURIER_COLUMN_LABEL
                ) {
                    acc.push({
                        ...column,
                        ...courierColumn,
                        width: column?.width ?? courierColumn.width,
                        sort: column?.sort,
                        sortType: column?.sortType,
                        columnOnHover: column?.columnOnHover,
                    });
                    return acc;
                }

                acc.push(column);
                return acc;
            }, []);

            return [optionsColumn, ...nextColumns];
        },
        [courierColumn, optionsColumn]
    );

    /**
     * Adapter tra `TableVirtualized` e lo stato colonne del layout.
     */
    const setColumnsWithFixedColumns = useCallback(
        (next: SetStateAction<TrackingsTableColumn[]>) => {
            setColumns((prev) => {
                const resolved = typeof next === "function" ? next(prev) : next;
                const normalized = Array.isArray(resolved) ? resolved : [];
                return withFixedColumns(normalized);
            });
        },
        [setColumns, withFixedColumns]
    );

    /** Fallback iniziale minimo per evitare una tabella totalmente priva di colonne prima del bootstrap. */
    const resolvedColumns = useMemo(
        () => (columns.length > 0 ? columns : [optionsColumn]),
        [columns, optionsColumn]
    );

    return (
        <>
            <TableVirtualized
                footer={true}
                data={rows}
                setData={setRows as any}
                columns={resolvedColumns}
                setColumns={setColumnsWithFixedColumns as any}
                loadStatus={loadStatus.table}
                results={total}
                textCenter
                whereToFindData={false}
                tableName="Trackings"
                infiniteScroll={{
                    func: infiniteScroll as any,
                    loadStatus: loadStatus.infiniteScroll as any,
                }}
                headerSettings={{
                    onSortChange,
                    sortState: serverSort,
                }}
                className="h-full"
            />

            <ContextMenu
                openFor={trackingMenu.isOpen}
                onClose={trackingMenu.closeMenu}
                pos={trackingMenu.anchorRef}
                menuButtons={[
                    {
                        title: "Copia URL",
                        icon: IoCopy({}),
                        onClick: trackingMenu.copyUrl,
                    },
                    {
                        title: "Apri",
                        icon: RxOpenInNewWindow({}),
                        onClick: trackingMenu.openUrl,
                    },
                ]}
            />
        </>
    );
}
