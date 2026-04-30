import { enqueueSnackbar } from 'components/MessageBox';
import { FetchData } from '../../../../examples/Fetch';

export function DataRetrive(
    setDataContext, 
    abortController, 
    setMainLoad, 
    codiceCommerciale, 
    copyDataContext, 
    setCopyDataContext, 
    channelsCode, 
    setLoadingSendFilter,
    setErr
) {
        FetchData(import.meta.env.VITE_API_ORDER + 'orders/fb-dnrtb', 'POST', {
        ag: codiceCommerciale,
        cnl: channelsCode
    }, abortController).then(res => {
        setDataContext(prev => {
            return {...prev, dati:res.Data.data, dataLength:res.Data.data.length, warehouseToT: res.Data.warehouseToT}
        })
        if(copyDataContext.length < 1){     
            setCopyDataContext(res.Data.data)    
        };
        setMainLoad(false);
        setLoadingSendFilter(false);
    }).catch(error => {
        setErr(true);
        setMainLoad(false);
        
        if (error.name !== 'AbortError') {
            console.error(error);
            let error_ = "Sembra che ci sia stato un problema nel comunicare con il server, perfavore contatta l'assistenza"
            if(error && (error?.msg || error?.message)){    error_ = (error.msg || error.message);     };
            return enqueueSnackbar(error_, {
                title: 'Ops..',
                type: 'error',
            });
        };
    })
}