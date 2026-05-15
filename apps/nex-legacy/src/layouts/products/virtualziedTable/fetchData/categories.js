import { FetchData } from '../../../../examples/Fetch';

export function CategoriesData(setSearchDataContext, userContext, setMainLoad, abortController, queryColumns,
    setTransitionLoad, 
) {
    if(userContext.details === undefined){return;}
    FetchData(import.meta.env.VITE_API_PRODUCTS + 'pds/cat', 'POST', {
        tk: userContext.token,
        __dist: queryColumns
    }, abortController).then(res => {
        setSearchDataContext(prev => {
            return {...prev, categories:res.categories, brand: res.brand, customers: res.customers}
        });
        
        setTransitionLoad(false);

        if(setMainLoad)
            setMainLoad(false);
    }).catch(error => console.error(error))
}