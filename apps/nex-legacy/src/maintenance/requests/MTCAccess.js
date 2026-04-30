import { FetchData } from '../../examples/Fetch';

export function MTCAccess(abortController, setGSettingsMode, setCanAccess) {
    FetchData(import.meta.env.VITE_API_USERS + 'ucy8udwl2hy0yhmycfbb', 'GET', null, abortController).then(res => {
        if(res.Success == true){
            setGSettingsMode(false)
            setCanAccess(true);
        }
    }).catch(error => console.error(error))
}