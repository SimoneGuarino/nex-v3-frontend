import { RetriveSupplierFromCookies } from 'utils';
import { FetchData } from 'examples/Fetch';
import { enqueueSnackbar } from 'components/MessageBox';

export function SendFilters(setSortedData, userContext, query, 
    abortController, setLoadState, setData, FilterArrayByWarehouseFilter, ResetWarehousesSelected, 
    buyerTarget, ResetMarginFilters, visibleColumns, setDataOrigin_, cookieNameColumns) {
    if(userContext.details === undefined){return;}

    FetchData(import.meta.env.VITE_API_PRODUCTS + 'contribution/gt?disp=1&' + query, 'POST', {
        usr: userContext?.details?.username,
        byid: buyerTarget?._id,
        __dist: RetriveSupplierFromCookies(cookieNameColumns)
    }, abortController).then(res => {

        //Filtra per escludere quelli che non hanno almeno 1 fornitore
        const distOrNot = visibleColumns.length > 0 ? res.data.filter(e => {
            for (const key in e.Fornitori) {
                const dist = e.Fornitori[key];
                if (visibleColumns.includes(key)) {
                    if ((dist.Prezzo > 0 || dist.PrezzoListino > 0) && dist.Disponibili > 0) {
                        return true; // Se trovi almeno un fornitore con Prezzo e PrezzoListino diversi da zero, restituisci true
                    }
                }
            }
            return false; // Se nessun fornitore soddisfa le condizioni, restituisci false
        }) : res.data;
        setDataOrigin_(res.data);

        ResetWarehousesSelected();
        setSortedData(distOrNot);
        setData(distOrNot);
        ResetMarginFilters();
        //FilterArrayByWarehouseFilter({data: distOrNot, warehouses: []});

        setLoadState(false);
    }).catch(error => {
        if (error.name !== 'AbortError') {
            console.error(error);
            let error_ = "Sembra che non è stato possibile caricare i dati, perfavore contatta un tecnico."
            if(error && (error?.msg || error?.message)){    error_ = (error.msg || error.message);     };
            return enqueueSnackbar(error_, {
                title: 'Ops..',
                type: 'error',
            });
        };
    })
}