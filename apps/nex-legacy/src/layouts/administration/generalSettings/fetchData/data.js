import { FetchData } from '../../../../examples/Fetch';

export function DataRetrive(userContext, abortController, setGSettingsMode) {
    
    if(userContext.details === undefined){return;}
    FetchData(import.meta.env.VITE_API_ADMIN + 'requests/mikpp3kwrskx12dw74vx', 'GET', null, abortController).then(res => {
        setGSettingsMode(res.Data);
    }).catch(error => console.log(error))
}