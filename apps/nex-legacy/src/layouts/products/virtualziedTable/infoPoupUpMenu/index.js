import React, { memo } from 'react';

import Menu from '@mui/material/Menu';


function InfoMenu(props){
    const { anchorEl } = props;
    const { handleCloseMenu, contain } = props;

    return (
        <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        //onClick={handleCloseMenu}
        PaperProps={{
            elevation: 0,
            sx: {
                overflow: 'visible',
                //filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                boxShadow: '0rem 0.625rem 0.9375rem -0.1875rem rgb(0 0 0 / 2%), 0rem 0.25rem 0rem 0rem rgb(0 0 0 / 1%)',
                mt: 1.5,
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
            {contain}
        </Menu>
    )
}

export default memo(InfoMenu);