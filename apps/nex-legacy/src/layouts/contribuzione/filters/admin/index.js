import React, { useState, memo, useRef, useEffect, useContext} from 'react';

import { UserContext } from "../../../../context/UserContext";
import { useFiltersContext } from "context/filtersContext";


import Stack from '@mui/material/Stack';
import VirtualizedBuyerFilter from './virtualizedBuyerFilter';
import MDTypography from "components/MDTypography";
import Divider from '@mui/material/Divider';
import { CheckAdminPermissions } from 'utils/checkAdminPermissions';
import { BuyersAPI } from './fetchData/buyers';

function AdminFilter(props){
    const {
        buyerTarget,
        setBuyerTarget,
    } = props;
    const [userContext , setUserContext] = useContext(UserContext);
    const [data, setData] = useState([]);
    const CheckAdminDev = CheckAdminPermissions({userRole: userContext.details.ruolo, 
        permissions: userContext.details.permissions, panelToCheck: 'contribuzione', where: 0})
    // Abort il panding del fetch all server
    const abortController = useRef(null);

    const cancelRequest = () => {
        if (abortController.current) {
            abortController.current.abort();
        }
    };

    useEffect(() => {
        if (!userContext.details) { return; }
        // Abort Controller per il fetch
        abortController.current = new AbortController();

        if(!CheckAdminDev){ return };

        BuyersAPI({userContext, abortController, setData})

        return cancelRequest;
    }, [userContext.details]);

    return (
        CheckAdminDev ?
            <Stack sx={{width:'inherit', p: 2}}>
                <Divider style={{ background: '#ccc', width: '100%' }} />
                <MDTypography variant="h6" sx={{mb: 1}}>Filtri per Admin</MDTypography>
                <VirtualizedBuyerFilter data={data} buyerTarget={buyerTarget} setBuyerTarget={setBuyerTarget} />
            </Stack>
        : null
    )
}

export default memo(AdminFilter);