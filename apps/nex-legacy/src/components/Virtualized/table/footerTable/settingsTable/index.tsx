import React, { useState, memo, Fragment, useEffect, useRef, useCallback } from 'react';

import Stack from '@mui/material/Stack';
import MDTypography from 'components/MDTypography';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Switch from '@mui/material/Switch';

import MinLoader from '../../../../../minLoader';
import { icon_moreSettings } from 'config/icons';

type Column = {
    label: string;
    type?: string;
    [key: string]: unknown;
};

type SetterBoolean =
    | React.Dispatch<React.SetStateAction<boolean>>
    | ((value: boolean) => void);

interface SettingsTableProps {
    columns: Column[];
    visibleColumns: string[];
    toggleColumnVisibility: (label: string) => void;
    setAllColumnsVisibility?: (mode: 'show' | 'hide' | 'toggle') => void;
    impTableStatus: boolean;
    setImpTableStatus: SetterBoolean;
    loading?: boolean;
    open?: boolean; onOpenChange?: (open: boolean) => void;
    tourIsOpen?: boolean;
}

type CloseReason = 'clickAway' | 'escapeKeyDown' | 'backdropClick' | 'itemClick';

function SettingsTable(props: SettingsTableProps): JSX.Element {
    const {
        columns,
        visibleColumns,
        toggleColumnVisibility,
        setAllColumnsVisibility,
        impTableStatus,
        setImpTableStatus,
        loading = false,
        open = false,
        onOpenChange,
        tourIsOpen = false,
    } = props;

    const allVisible = columns.length > 0 && columns.every((c) => visibleColumns.includes(c.label));
    const someVisible = !allVisible && visibleColumns.length > 0;

    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const buttonRef = useRef<HTMLButtonElement | null>(null);

    const handleCloseMenu = useCallback(() => {
        setAnchorEl(null);
        onOpenChange?.(false);
    }, [onOpenChange]);

    useEffect(() => {
        if (!open) {
            setAnchorEl(null);
            return;
        };
        if (!anchorEl && buttonRef.current) {
            setAnchorEl(buttonRef.current);
        };
    }, [open, anchorEl]);

    const handleOpenMenu = useCallback((event: React.MouseEvent<HTMLElement>) => {
        if (loading) return;
        setAnchorEl(event.currentTarget);
        onOpenChange?.(true);
    }, [loading, onOpenChange]);

    const handleToggleAll = () => {
        const touchesSupplier = columns.some((c) => c.type === 'supplier');
        if (touchesSupplier) setImpTableStatus(true);
        setAllColumnsVisibility?.(allVisible ? 'hide' : 'show');
    };

    const shouldIgnoreClose = (reason?: CloseReason | string) => {
        if (!tourIsOpen) return false;
        if (!reason) return false;
        return reason === 'backdropClick' || reason === 'clickAway' || reason === 'escapeKeyDown';
    };

    const handleMenuClose: React.ComponentProps<typeof Menu>['onClose'] = (_event, reason) => {
        if (shouldIgnoreClose(reason)) return;
        handleCloseMenu();
    };

    const infoMenu = () => (
        <Menu
            anchorEl={anchorEl}
            id="account-menu"
            open={open && Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
                elevation: 0,
                sx: {
                    overflow: 'auto',
                    filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                    mt: 1.5,
                    minWidth: 220,
                    maxHeight: 360,
                    minHeight: 150,
                },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        >
            {!impTableStatus ? (
                <>
                    <MenuItem onClick={handleToggleAll}>
                        <Stack direction="row" gap={1} data-tour="rubrica-mostra-tutte">
                            <Switch
                                checked={allVisible}
                                onChange={handleToggleAll}
                                inputProps={{ 'aria-label': 'Mostra/Nascondi tutte le colonne' }}
                            />
                            <MDTypography
                                style={{ alignSelf: 'center' }}
                                variant="body2"
                                fontSize="0.76em"
                                textTransform="uppercase"
                                width="100%"
                                className="flexBasis"
                            >
                                {allVisible ? 'nascondi tutte' : 'mostra tutte'}
                                {someVisible ? ' (parziale)' : ''}
                            </MDTypography>
                        </Stack>
                    </MenuItem>

                    <div style={{ height: 1, background: 'rgba(0,0,0,0.08)', margin: '4px 8px' }} />

                    {columns.map((col, index) => (
                        <MenuItem
                            key={col.label || index}
                            onClick={() => {
                                if (col.type === 'supplier') setImpTableStatus(true);
                                toggleColumnVisibility(col.label);
                            }}
                        >
                            <Stack direction="row" gap={1}>
                                <Switch
                                    checked={visibleColumns.includes(col.label)}
                                    onChange={() => {
                                        toggleColumnVisibility(col.label);
                                    }}
                                    onClick={() => col.type === 'supplier' && setImpTableStatus(true)}
                                />
                                <MDTypography
                                    style={{ alignSelf: 'center' }}
                                    variant="body2"
                                    fontSize="0.76em"
                                    textTransform="uppercase"
                                    textAlign="right"
                                    width="100%"
                                    className="flexBasis"
                                >
                                    {col.label}
                                </MDTypography>
                            </Stack>
                        </MenuItem>
                    ))}
                </>
            ) : (
                <MinLoader sx={{ width: 25, height: 25, m: '8px auto' }} />
            )}
        </Menu>
    );

    return (
        <Fragment>
            {infoMenu()}
            <IconButton
                ref={buttonRef}
                data-tour="rubrica-abilita-colonne"
                aria-label="sort"
                onClick={handleOpenMenu}
                data-tooltip-content="Impostazioni Tabella"
                data-tooltip-id="general-vi-table-virtualized-tooltip"
                disabled={loading}
            >
                {icon_moreSettings()}
            </IconButton>
        </Fragment>
    );
}

export default memo(SettingsTable);
