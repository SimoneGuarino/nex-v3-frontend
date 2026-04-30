// HeaderVirtualized.js
import { useState, Fragment } from 'react';

import Stack from '@mui/material/Stack';
import MDTypography from "components/MDTypography";
import IconButton from '@mui/material/IconButton';

import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import MinLoader from "../../../../../minLoader";
import Switch from '@mui/material/Switch';
import { icon_moreSettings } from 'config/icons';



function HeaderVirtualized(props) {
    const { columns, visibleColumns, toggleColumnVisibility, setAllColumnsVisibility } = props;
    const { impTableStatus } = props;

    const [anchorEl, setAnchorEl] = useState(null)

    //funzioni per l'apertura e la chiusura del infobox
    const handleOpenMenu = (event) => setAnchorEl(event.currentTarget);
    const handleCloseMenu = () => setAnchorEl(false);

    // stato aggregato per lo switch globale
    const allVisible = columns.length > 0 && columns.every(c => visibleColumns.includes(c.label));
    const someVisible = !allVisible && visibleColumns.length > 0;

    const handleToggleAll = () => {
        // coerenza con il comportamento esistente: se tocca colonne 'supplier', mostra loader
        setAllColumnsVisibility?.(allVisible ? 'hide' : 'show');
    };

    //render del pannello infoBox 
    const infoMenu = () => (
        <Menu
            anchorEl={anchorEl}
            id="account-menu"
            open={Boolean(anchorEl)}
            onClose={handleCloseMenu}
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
            {/* elenco colonne o loader */}
            {/* switch globale */}
            <MenuItem onClick={handleToggleAll}>
                <Stack direction="row" gap={1}>
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

            {/* elenco singole colonne */}
            {columns.map((col, index) => (
                <MenuItem
                    key={col.label || index}
                    onClick={() => {
                        toggleColumnVisibility(col.label);
                    }}
                >
                    <Stack direction="row" gap={1}>
                        <Switch
                            checked={visibleColumns.includes(col.label)}
                            onChange={() => {
                                toggleColumnVisibility(col.label);
                            }}
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
        </Menu>
    )

    return (
        <Fragment>
            {infoMenu()}
            <IconButton aria-label="sort" onClick={(e) => handleOpenMenu(e)}
                data-tooltip-content='Impostazioni Tabella' data-tooltip-id='general-compare-tooltip'>
                {icon_moreSettings()}
            </IconButton>
        </Fragment>
    );
}

export default HeaderVirtualized;
