import { FetchData } from '../../../../examples/Fetch';
import { CookieCompareV3 } from '../../utils/CookieData';

export function SendFilters(setSearchDataContext, userContext, query, 
    abortController, setTransitionLoad, offset) {
    if(userContext.details === undefined){return;}
    const __dist = CookieCompareV3('stored_settings_prodotti');

    FetchData(import.meta.env.VITE_API_PRODUCTS + 'pds/products?' + query, 'POST', {
        username: userContext?.details?.username,
        tk: userContext.token,
        of: offset.current || 0,
        __dist: __dist
    }, abortController).then(res => {
        if(offset && offset.current !== undefined){
            offset.current++;
        };
        
        setSearchDataContext(prev => {
            return {...prev, totale: res.dataLength, dati:res.data}
        });
        setTransitionLoad(false);
    }).catch(error => console.error(error))
}