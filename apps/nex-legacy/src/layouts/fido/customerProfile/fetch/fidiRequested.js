import { FetchData } from '../../../../examples/Fetch';

export function FidiRequestedAPI(userContext, abortController,setFidiRequested) {
    if(userContext.details === undefined){return;}
    FetchData(import.meta.env.VITE_API_CUSTOMERSFIDO + 'rqs-fdi', 'POST', {
        tk: userContext.token,
    }, abortController).then(res => {
        setFidiRequested(res.data);
    }).catch(error => console.log(error))
}