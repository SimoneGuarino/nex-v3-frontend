import { FetchData } from '../../../../examples/Fetch';

export function RealTimeChange(tmstp, openErrorSB, abortController, setTmstp) {
    FetchData(import.meta.env.VITE_API_REALTIME, 'GET', undefined, abortController).then(res => {
        if (tmstp !== '' && tmstp !== res.Data) {
            setTmstp(() => res.Data)

            openErrorSB("warning", "Attenzione, i prezzi sono stati aggiornati!");
        }else{
            setTmstp(res.Data)
        }
    }).catch(error => console.error(error))
}