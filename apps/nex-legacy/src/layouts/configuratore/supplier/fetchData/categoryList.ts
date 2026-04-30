import { FetchData } from 'examples/Fetch';

interface UserContext {
    details?: {
        username: string;
    };
    token: string;
}

export function CategoryListAPI({userContext, abortController, setBrandsCategoryData, setGroupings} : 
    {userContext: UserContext, abortController: any, setBrandsCategoryData: (prev : any) => void, setGroupings: (prev : any) => void}): void {
    if (userContext.details === undefined) { return; }
    FetchData(`${import.meta.env.VITE_API_CONFIGURATORS}suppliers/gt/cat`, 'POST', {
        tk: userContext.token,
    }, abortController).then(async (res: any) => {
        setBrandsCategoryData(res.data);
        setGroupings(res.groupings);
    }).catch((error: any) => {
        //openErrorSB('info', 'Perfavore inserisci un codice promo valido di 4 caratteri');
        console.error(error)
    });
}