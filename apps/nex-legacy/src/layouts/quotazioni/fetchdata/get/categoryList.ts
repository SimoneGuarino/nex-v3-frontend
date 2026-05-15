import { FetchData } from 'examples/Fetch';

interface UserContext {
    details?: {
        username: string;
    };
    token: string;
}

export function CategoryListAPI({abortController, setCategoryData} : {abortController: any, setCategoryData: (prev : any) => void}): void {
    FetchData(`${import.meta.env.VITE_API_PRODUCTS}v1/categories`, 'GET', null, abortController)
    .then(async (res: any) => {
        setCategoryData(res);
    }).catch((error: any) => {
        //openErrorSB('info', 'Perfavore inserisci un codice promo valido di 4 caratteri');
        console.error(error)
    });
}