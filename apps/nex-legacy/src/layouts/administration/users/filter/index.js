import { useState, useMemo, useContext, useRef, useCallback } from 'react';

import { UserContext } from "../../../../context/UserContext";

import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';
import SendIcon from '@mui/icons-material/Send';

import FiltersVI from './FiltersVI';
import { SendFilters } from './FetchData/sendFilters';
import { Search } from './search';
import { icon_people } from 'config/icons';



export default function Filters(props) {
    const { data, setCopyOfData, setData, userBanned } = props;

    const [userContext, setUserContext] = useContext(UserContext);
    //dati relativi alla lista dei ruoli
    //ruolo selezionato
    const [roleSL, setRoleSL] = useState(null);
    const [loading, setLoading] = useState(false);

    // Abort il panding del fetch all server
    const abortController = useRef(null);

    const requestsData = useCallback(() => {
        //rt=1 se vuoi i ruoli disponibili, o rt=0 se vuoi fare il check
        //FbUserData(userContext, abortController, setData)
        SendFilters(userContext, abortController, roleSL, setCopyOfData)
    }, [roleSL, data, abortController])


    const filter = useMemo(() => {
        if (data.roles === undefined) { return; }
        return <FiltersVI data={data.roles} setRoleSL={setRoleSL} minWidth='10rem' maxWidth='10rem' placeholder='Ruolo' />
    }, [data]);



    return (
        (userContext.details.ruolo === 'Admin' || userContext.details.ruolo === 'Dev') &&
        <Stack direction='row' gap={1} sx={{ marginLeft: 'auto' }} translate="no">
            {data.data.length > 0 && <Search baseData={data.data} setData={setCopyOfData} />}
            <Stack direction='row' gap={1} alignItems='center'>
                {filter}
            </Stack>

            <IconButton onClick={() => userBanned(1)}
                data-tooltip-id="main-user-management-tooltip"
                data-tooltip-content='Lista degli utenti Disabilitati'
                aria-label="delete" sx={{ width: '2em', height: '2em', alignSelf: 'center' }}>
                {icon_people()}
            </IconButton>
            <LoadingButton
                onClick={requestsData}
                loading={loading}
                variant="filled"
                style={{ alignSelf: 'center' }}
                sx={{ backgroundColor: '#1597c1', color: '#fff', '&:hover': { backgroundColor: '#a0d7e9' } }}
            >
                <SendIcon sx={{ width: '1.5em', height: '1.5em' }} />
            </LoadingButton>
        </Stack>
    )
}