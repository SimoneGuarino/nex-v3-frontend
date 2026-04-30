import { RetriveSupplierFromCookies } from 'utils';
import { FetchData } from 'examples/Fetch';
import { enqueueSnackbar } from 'components/MessageBox';

export function CategoriesData(setExtraData, userContext, setMainLoad, abortController, cookieNameColumns) {
    if(userContext.details === undefined){return;}
    FetchData(import.meta.env.VITE_API_SEARCH_ENDPOINT + 'tablecategories', 'POST', {
        frm: 0,
        tk: userContext.token,
        __dist: RetriveSupplierFromCookies(cookieNameColumns)
    }, abortController).then(res => {
        setExtraData(prev => {
            const obj = {}
            if(JSON.stringify(res.categories) !== JSON.stringify(prev.categories)){
                obj.categories = res.categories;
            }
            if(JSON.stringify(res.brand) !== JSON.stringify(prev.brand)){
                obj.brand = res.brand;
            }

            return obj
        })
        if(setMainLoad)
            setMainLoad(false);
    }).catch(error => {
        if (error.name !== 'AbortError') {
            console.error(error);
            let error_ = "Sembra che non è stato possibile recuperare la lista delle categorie, perfavore contatta un tecnico."
            if(error && (error?.msg || error?.message)){    error_ = (error.msg || error.message);     };
            return enqueueSnackbar(error_, {
                title: 'Ops..',
                type: 'error',
            });
        };
    })
}