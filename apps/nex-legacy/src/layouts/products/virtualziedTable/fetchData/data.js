import { FetchData } from '../../../../examples/Fetch';
import { CookieCompareV3 } from '../../utils/CookieData';


export function DataRetrive(setSearchDataContext, userContext, setMainLoad, 
    abortController, CategoriesRetriveData, setImpTableStatus, query, setErr) {
    if(userContext.details === undefined){return;}
    const __dist = CookieCompareV3('stored_settings_prodotti');

    let bodyToSend = {};
    if(userContext){
        bodyToSend.username = userContext.details.username;
        bodyToSend.tk = userContext.token;
        bodyToSend.__dist = __dist;
    }

    FetchData(import.meta.env.VITE_API_PRODUCTS + 'pds/products?' + query, 'POST', bodyToSend, 
    abortController).then(res => {
        setSearchDataContext(prev => {
            return {...prev, dati:res.data}
        })

        setImpTableStatus(false);
        setMainLoad(false);
        CategoriesRetriveData(__dist);
    }).catch(error => {
        console.log(error);
        setErr(true);
    })
}