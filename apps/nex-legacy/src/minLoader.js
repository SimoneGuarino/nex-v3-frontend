import React from "react";

import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

const MinLoader = (props) => {
    const { sx, width, color } = props;
    const { dataTooltipContent, dataTooltipId } = props;
    return (
        <Box component="div"  id="minLoader" sx={{ ...sx, display: 'flex' }} data-tooltip-content={dataTooltipContent} data-tooltip-id={dataTooltipId}>
            <CircularProgress style={{ color: color ? color : "#b1b1b1", width: "inherit", height: "inherit"}} />
        </Box>
    );
};

export default MinLoader;
