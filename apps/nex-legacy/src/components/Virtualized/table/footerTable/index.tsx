// footerTable/index.tsx
import React, { memo, useCallback, useMemo, useState } from 'react';

import Stack from '@mui/material/Stack';
import MDTypography from 'components/MDTypography';

import SettingsTable from './settingsTable';
import MinLoader from '../../../../minLoader';
import { Skeleton } from '@mui/material';
import theme from 'assets/theme';
import { useMaterialUIController } from 'context/index';
import { icon_warehouse } from 'config/icons';

/** tipi */

export type BooleanSetter =
    | React.Dispatch<React.SetStateAction<boolean>>
    | ((value: boolean) => void);

type LoaderPair = {
    get?: boolean;
    set?: BooleanSetter;
};

type Column = {
    label: string;
    type?: string;
    [key: string]: unknown;
};

export interface FooterSettings {
    showColSettings?: boolean;
    callbackColSettings?: () => void;
    colSettingsLoader?: LoaderPair;
    showResults?: boolean;
    showWarehouse?: boolean;
    showWherehouse?: boolean; // alias tollerato
    totWarehouse?: number | string | null;
    colSettingsOpen?: boolean;
    setColSettingsOpen?: (open: boolean) => void;
    [key: string]: unknown;
    tourIsOpen?: boolean;
}

export interface FooterTableProps {
    data: unknown[] | null | undefined;

    resultsMax?: number;
    currentResultsLoad?: number;

    columns: Column[];
    visibleColumns: string[];
    toggleColumnVisibility: (label: string) => void;

    // nuovo: batch toggle per le colonne
    setAllColumnsVisibility?: (mode: 'show' | 'hide' | 'toggle') => void;
    /** se disponibile: setter diretto per aggiornare in bulk (consigliato) */
    setVisibleColumnsDirect?: (labels: string[]) => void;

    impTableStatus: boolean;
    setImpTableStatus: BooleanSetter;

    footerSettings?: FooterSettings;
    loadStatus?: boolean;

    /** retro-compat: vecchio prop standalone */
    totWarehouse?: number | string | null;

    infiniteScroll?: {
        func: () => void;
        loadStatus?: boolean;
    };
}

function FooterTable(props: FooterTableProps): JSX.Element {
    const [colSettingsOpen, setColSettingsOpen] = useState(false);
    const [controller] = useMaterialUIController() as unknown as [
        { darkMode?: boolean },
        unknown
    ];
    const { darkMode } = controller ?? {};

    const {
        data,
        resultsMax,
        currentResultsLoad,
        columns,
        visibleColumns,
        toggleColumnVisibility,
        setAllColumnsVisibility, // nuovo
        impTableStatus,
        setImpTableStatus,
        footerSettings,
        loadStatus,
        totWarehouse, // legacy
        infiniteScroll,
    } = props;

    const hasData = Array.isArray(data) && data.length !== 0;

    const totWarehouseRaw =
        (footerSettings && footerSettings.totWarehouse) ?? totWarehouse;

    const showWarehouse =
        footerSettings?.showWarehouse ??
        footerSettings?.showWherehouse ??
        (typeof totWarehouseRaw !== 'undefined' && totWarehouseRaw !== null);

    const showColSettings =
        (footerSettings && footerSettings.showColSettings) ||
        footerSettings === undefined ||
        (footerSettings && typeof footerSettings.showColSettings === 'undefined');

    const showResults = footerSettings?.showResults ?? true;

    const formatEuro = (v: number | string | null | undefined): string => {
        if (v === null || typeof v === 'undefined') return '0€';
        if (typeof v === 'number') {
            if (!isFinite(v)) return '0€';
            try {
                return new Intl.NumberFormat('it-IT', {
                    style: 'currency',
                    currency: 'EUR',
                }).format(v);
            } catch {
                return `${v}€`;
            }
        }
        const s = String(v);
        if (s === 'NaN€' || s === 'NaN') return '0€';
        return s;
    };


    return (
        <Stack
            direction="row"
            p={1}
            alignItems="center"
            mt="auto"
            borderTop={`1px solid ${darkMode ? theme.palette.grey[800] : '#ccc'}`}
        >
            {showWarehouse ? (
                !loadStatus ? (
                    <Stack
                        direction="row"
                        alignItems="center"
                        gap={1}
                        data-tooltip-content="Totale € dei prodotti in magazzino"
                        data-tooltip-id="general-compare-tooltip"
                    >
                        {icon_warehouse()}
                        <MDTypography variant="body2" sx={{ fontSize: '0.7em' }}>
                            {formatEuro(totWarehouseRaw)}
                        </MDTypography>
                    </Stack>
                ) : (
                    <Skeleton width={120} />
                )
            ) : null}

            <Stack direction="row" gap={3} sx={{ marginLeft: 'auto', alignItems: 'center' }}>
                {(loadStatus || infiniteScroll?.loadStatus) && (
                    <MinLoader dataTooltipContent="Caricamento in corso di altri dati.." dataTooltipId="general-vi-table-virtualized-tooltip" sx={{ width: 25, height: 25 }} />
                )}

                {showResults && hasData ? (
                    resultsMax !== 0 && resultsMax !== undefined ? (
                        <MDTypography variant="body2" sx={{ fontSize: '0.7em', p: 0.5 }}>
                            {currentResultsLoad} di {resultsMax}
                        </MDTypography>
                    ) : (
                        <Skeleton width={60} />
                    )
                ) : null}

                {showColSettings && (
                    <SettingsTable
                        columns={columns}
                        visibleColumns={visibleColumns}
                        toggleColumnVisibility={toggleColumnVisibility}
                        // passiamo anche il batch toggle
                        setAllColumnsVisibility={setAllColumnsVisibility}
                        impTableStatus={impTableStatus}
                        setImpTableStatus={setImpTableStatus}
                        loading={!!loadStatus}
                        open={footerSettings?.colSettingsOpen ? !!footerSettings?.colSettingsOpen : colSettingsOpen}
                        onOpenChange={footerSettings?.setColSettingsOpen ? footerSettings?.setColSettingsOpen : setColSettingsOpen}
                        tourIsOpen={!!footerSettings?.tourIsOpen}
                    />
                )}
            </Stack>
        </Stack>
    );
}

export default memo(FooterTable);
