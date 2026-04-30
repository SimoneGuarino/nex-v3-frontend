import React from "react";

// @material-ui core components
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';
import CircularProgress from '@mui/material/CircularProgress';
import { Stack } from "@mui/material";

function SklLoadHintItem(){
    return (
        <Stack sx={{width: '100%', alignItems: 'center'}}>
            <Stack sx={{width: '100%'}} direction='row'>
                <Typography style={{margin: "10px 10px 0px 10px", width: 70}} variant="h5">
                    <Skeleton sx={{height: '100%'}} className="skelLoadingColor"/></Typography>
                <Stack sx={{width: '100%'}}>
                    <Typography style={{margin: "10px 16px 0px 17px"}} variant="h3">
                            <Skeleton className="skelLoadingColor"/></Typography>
                    <div className="skelLoadingObjectDIV">
                        <Typography className="TypoSklItmSKUEAN" variant="h5"><Skeleton className="skelLoadingColor"/></Typography>
                        <Typography className="TypoSklItmSKUEAN" variant="h5"><Skeleton className="skelLoadingColor"/></Typography>
                        <Typography className="TypoSklItmSKUEAN" variant="h3"><Skeleton className="skelLoadingColor"/></Typography>
                        <Typography className="TypoSklItmSKUEAN" variant="h3"><Skeleton className="skelLoadingColor"/></Typography>
                    </div>
                </Stack>

            </Stack>
            <Stack>
                <CircularProgress className="CircularLoading"/>
            </Stack>
        </Stack>
    )
}
export default SklLoadHintItem;