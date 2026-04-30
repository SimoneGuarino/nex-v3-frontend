import { FetchData } from '../../../examples/Fetch';


export function InfoOrderFBData(userContext, setOrderFB, abortController, DeleteFromLoadRef) {
    try {
        if( !userContext.token || userContext.details === undefined){return;}

        FetchData(import.meta.env.VITE_API_USERS + 'dashboard/read/esztmzjkp8myop5pb90z', 'POST', {
            tk: userContext.token,
        }, abortController).then(res => {
            setOrderFB(res.Data);
            DeleteFromLoadRef("orders");
        }).catch(error => {
            console.error(error);
            DeleteFromLoadRef("orders");
        })
    } catch(e){
        console.log(e)
    }
}