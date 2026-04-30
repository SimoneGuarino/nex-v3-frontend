import { FetchData } from '../../../../examples/Fetch';

export function FatturatoData(userContext, abortController, setData, customerData, cselected) {
    if(userContext.details === undefined){return;}
    FetchData(import.meta.env.VITE_API_CUSTOMERSFIDO + 'gt-cpdyrs', 'POST', {
        tk: userContext.token,
        ctm: cselected,
        actm: customerData?.Anagrafica?.CodiceClienteIOT != undefined ? 
            customerData.Anagrafica.CodiceClienteIOT : '',
    }, abortController).then(res => {
        setData((prev) => {return {...prev, Fatturato: res}});
    }).catch(error => console.log(error))
}