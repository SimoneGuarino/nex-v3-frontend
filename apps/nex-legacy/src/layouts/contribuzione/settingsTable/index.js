// HeaderVirtualized.js
import { useState, memo, Fragment } from 'react';

import Stack from '@mui/material/Stack';
import MDTypography from "components/MDTypography";

import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Button, Divider } from '@mui/material';
import { MainTheme } from 'assets/settingsTheme';
import { FDIconButton } from "@nex/fd-ui";


function Settings({ columns, visibleColumns, setVisibleColumns, toggleColumnVisibility }) {
    const palette = MainTheme().palette;
    const { info } = palette;

    const [anchorEl, setAnchorEl] = useState(null)
    const [changeAll, setChangeAll] = useState(true)

    //funzioni per l'apertura e la chiusura del infobox
    const handleOpenMenu = (event) => setAnchorEl(event.currentTarget);
    const handleCloseMenu = () => setAnchorEl(false);

    const ChangeAllStats = () => {
        if(!changeAll){
            setVisibleColumns(columns);
        }else{
            setVisibleColumns([])
        };
        setChangeAll(!changeAll)
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
                    overflow: 'visible',
                    filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                    mt: 1.5,
                    minWidth: 250,
                    '& .MuiAvatar-root': {
                        width: 32,
                        height: 32,
                        ml: -0.5,
                        mr: 1,
                    },
                    '&:before': {
                        content: '""',
                        display: 'block',
                        position: 'absolute',
                        bottom: 10,
                        right: -5,
                        width: 10,
                        height: 10,
                        bgcolor: 'background.paper',
                        transform: 'translateY(-50%) rotate(45deg)',
                        zIndex: (theme) => theme.zIndex.drawer + 2
                    },
                },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        >
            <Stack alignItems='center' sx={{ background: info.main, p: 1, borderRadius: 5 }}>
                <MDTypography component="p" style={{
                    color: '#041e4f', fontWeight: "normal",
                    textAlign: "center", fontSize: "0.865rem", maxWidth: 180, fontWeight: 200
                }}>
                    Se esclusi tutti i fornitori nella lista, verrà utilizzata Focelda come mezzo di paragone.
                </MDTypography>
            </Stack>

            <Divider sx={{ backgroundColor: '#000' }} />

            {columns.map((col, index) => {
                return <MenuItem key={index} onClick={() => toggleColumnVisibility(col)}>
                    <Stack direction="row" gap={1}>
                        <input type="checkbox" checked={visibleColumns.includes(col)} />
                        <MDTypography style={{ alignSelf: "center" }}
                            variant="p" fontSize="0.76em" textTransform="uppercase"
                            textAlign="right" width="100%" className="flexBasis">
                            {col}
                        </MDTypography>
                    </Stack>
                </MenuItem>
            })}


            <Divider sx={{ backgroundColor: '#000' }} />

            <Button onClick={() => ChangeAllStats()}
            sx={{ direction: 'row', display: 'flex', gap: 1, p: '0 15px', alignItems: 'center' }}>
                <input type="checkbox" checked={changeAll} />
                <MDTypography variant="body2" fontSize="0.86rem"
                    textAlign="right" width="100%" className="flexBasis">
                    {!changeAll ? 'Seleziona' : 'Deseleziona'} tutti gli elementi
                </MDTypography>
            </Button>
        </Menu>
    )

    return (
        <Fragment>
            {infoMenu()}
            <FDIconButton
                icon={<MoreVertIcon />}
                data-tooltip-id="general-compare-tooltip"
                data-tooltip-content='Impostazioni dei Fornitori'
                aria-label="sort" onClick={(e) => handleOpenMenu(e)} />
        </Fragment>
    );
}

export default memo(Settings);
