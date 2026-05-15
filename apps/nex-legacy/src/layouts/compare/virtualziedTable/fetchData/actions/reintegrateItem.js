import { FetchData } from '../../../../../examples/Fetch';

export function ReintegrateItem(data, setData, userContext, abortController, itemId) {
    if(userContext.details === undefined){return;}
    FetchData(import.meta.env.VITE_API_PRODUCTS + 'exclude/delete/items', 'POST', {
        tk: userContext.token,
        //Codice: data[itemId].Codice,
        IdCompare: data[itemId]._id,
    }, abortController).then(res => {
        setData((prev) => {
            const newData = [...prev.dati]; // Clona l'array data
            newData.splice(itemId, 1); // Rimuovi l'elemento dal clone
            return { ...prev, dati: newData };
        });
    }).catch(error => console.error(error))
}