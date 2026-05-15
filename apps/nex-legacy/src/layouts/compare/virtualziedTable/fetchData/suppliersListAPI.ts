import { FetchData } from 'examples/Fetch';

interface UserContext {
    details?: {
        username: string;
    };
    token: string;
}

export function SuppliersListAPI({userContext, abortController, setData, setColumns} : 
    {userContext: UserContext, abortController: any; setData: (prev: any) => void; setColumns: (prev: any) => void}): void {
    if (userContext.details === undefined) { return; }

    let bodyToSend: any = {};
    if(userContext){
        bodyToSend.tk = userContext.token;
    }

    FetchData(`${import.meta.env.VITE_API_PRODUCTS}spl`, 'POST', bodyToSend, 
    abortController).then(async (res: any) => {
        setColumns((prev: any) => {
            const copy = [...prev];
            const newArrToMerge = [];
            //componi l'array in base sia alla risposta API che agli elementi non presenti già nel copy. 
            for (let i = 0; i < res.data.length; i++) {
                const dist = res.data[i];
                const objToInsert = {
                    key: ['Fornitori'], fieldToTake: [
                        { key: [{ key: 'Prezzo' }, { key: 'PrezzoListino' }], type: 'eur', conditionToHide: [null, '', 0, undefined] },
                        { key: 'Disponibili', type: 'pz', conditionToHide: [null, '', 0, undefined] },
                        { key: '', type: 'tax', elmToTake: ['Siae', 'Raee'], conditionToHide: [null, undefined, 0], sx: { fontSize: 'calc(0.40vw + 0.40vh) !important' } },
                        { key: 'Promo', type: 'promo', condition: [null, false, undefined], sx: { fontWeight: '600', fontSize: '11px !important', color: '#e1a12c' } }
                    ], label: dist.name, type: 'supplier', sx: { alignItems: 'flex-end' },
                };
                const check = copy.findIndex(e => e.label === dist.name);
                if(check === -1){
                    newArrToMerge.push(objToInsert);
                }else { continue };
            };

            return [...prev, ...newArrToMerge];
        })
    }).catch((error: any) => {
        console.error(error)
    });
}