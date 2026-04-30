import React, { memo } from 'react';

import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';

import Badge from '@mui/material/Badge';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';

function TypeSupplierEur (props) {
    const { colIndex, indexRow, allData, elm} = props;

    return (
        <Stack direction='row' width='100%' gap={1.5} height='100%' style={{overflow:'hidden', alignItems: 'center'}}>
            <Stack sx={colIndex.sx} >
            {colIndex.fieldToTake.map((data, index) => {
                return <Tooltip key={index} title={data.title} disableInteractive>
                    <IconButton onClick={(e) => {
                        if(data.key !== 'Comments'){
                            return data.funcAction(indexRow, allData)
                        }else{
                            return data.funcAction(e, elm)
                        }
                    }} aria-label={data.ariaLabel} sx={{ padding: '5px', '&:hover': { backgroundColor: data.onHoverColor, color: '#fff' } }}>
                        {data.icon}</IconButton>
                </Tooltip>
            })}
            </Stack>

            {elm.Comments?.length > 0 && <Badge sx={{ color: '#38304e' }} badgeContent={elm.Comments?.length} color="primary" max={999} style={{ alignSelf: "center" }}>
                <ForumOutlinedIcon fontSize="2em !important" />
            </Badge>}
        </Stack>
    )
}

export default TypeSupplierEur