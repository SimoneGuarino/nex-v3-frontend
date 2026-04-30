import React from 'react';

// @external components
import { Divider, Fade, IconButton, Stack } from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';

// @internal components
import MDTypography from 'components/MDTypography';
import { icon_fileDownload, icon_close, icon_delete, icon_email } from 'config/icons';
import { MainTheme } from 'assets/settingsTheme';
import { useTour } from "tour/TourProvider";
import { useNexTheme } from '@nex/theme-system';



export function ActionsBar({ selectedFile, loadStatus,
    DeleteFile, CheckAdminDev, openMailPanel,
    MakeEmptySelection, numFileSelected, downloadFile,
}) {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;
    const { isOpen, index: tourIndex } = useTour();
    const lockInteractions = (isOpen && CheckAdminDev && tourIndex === 9) || (isOpen && !CheckAdminDev && tourIndex === 6);


    const genIconButton = React.useCallback((tooltip_content, type, icon, func, status) => {
        let elmToReturn;
        switch (type) {
            case 'IconButton':
                elmToReturn = <IconButton sx={{ padding: 0 }}
                    data-tooltip-id="actionBar-tooltip"
                    data-tooltip-content={tooltip_content}
                    onClick={func}>
                    {icon}
                </IconButton>
                break;
            case 'LoadingButton':
                elmToReturn = <LoadingButton sx={{ padding: 0, width: 25, height: 25, minWidth: 25, color: '#666b72' }}
                    loading={status}
                    data-tooltip-id="actionBar-tooltip"
                    data-tooltip-content={tooltip_content}
                    onClick={func}>
                    <span style={{ width: 'inherit', height: 'inherit' }}>{icon}</span>
                </LoadingButton>
                break;
        }
        return elmToReturn;
    }, [])


    return <Fade in={selectedFile.length > 0}>
        <Stack direction='row' data-tour="drive-selected-element" sx={selectedFile.length > 0 ? { display: 'flex' } : { display: 'none' }}
            style={{ backgroundColor: `${darkMode ? palette.primary.main : palette.primary.light}`, padding: '2px 10px', borderRadius: 15 }}
            alignItems='center' gap={3}>
            {lockInteractions && (
                <div
                    aria-hidden="true"
                    style={{
                        position: 'absolute',
                        inset: 0,
                        zIndex: 10,
                        pointerEvents: 'auto',
                    }}
                    onClickCapture={(e) => e.stopPropagation()}
                />
            )}
            {genIconButton('annulla selezione', 'IconButton', icon_close({ color: `${darkMode ? palette.white.main : ''}` }),
                () => MakeEmptySelection())}
            <MDTypography component="p" style={{
                fontWeight: "normal",
                textAlign: "center", fontSize: "0.7em", fontWeight: 400
            }}> elementi selezionati: {numFileSelected}</MDTypography>

            <Divider
                orientation="vertical"
                sx={{ height: 28, m: 0.5, backgroundColor: `${darkMode ? palette.grey[300] : palette.grey[800]}` }} />
            {genIconButton('scarica i file', 'LoadingButton',
                icon_fileDownload({ width: 'inherit', height: 'inherit', color: `${darkMode ? palette.white.main : ''}` }),
                downloadFile, (loadStatus.download || loadStatus.upload))}
            {genIconButton('invio della e-mail', 'LoadingButton',
                icon_email({ width: 'inherit', height: 'inherit', color: `${darkMode ? palette.white.main : ''}` }),
                openMailPanel, (loadStatus.delete || loadStatus.upload))}
            {CheckAdminDev && genIconButton('cancella i file', 'LoadingButton',
                icon_delete({ width: 'inherit', height: 'inherit', color: `${darkMode ? palette.white.main : ''}` }),
                DeleteFile, (loadStatus.delete || loadStatus.upload))}
        </Stack>
    </Fade>
}