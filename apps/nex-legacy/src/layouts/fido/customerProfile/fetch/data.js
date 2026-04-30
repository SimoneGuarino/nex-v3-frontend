import { enqueueSnackbar } from 'components/MessageBox';
import { FetchData } from '../../../../examples/Fetch';

function normalizeCreditsResponse(res) {
    // supporta sia payload "puro" sia { ok, data }
    const root = res?.data ?? res;

    const fixDettagli = (det) => {
        if (!det) return;

        // se arriva ancora AScadere, la consideriamo Esposizione (fallback)
        if (det.Esposizione == null && det.AScadere != null) det.Esposizione = det.AScadere;

        // se Rischio manca, metti 0 (così lo mostri comunque)
        if (det.Rischio == null) det.Rischio = 0;

        // elimina la vecchia chiave
        if ('AScadere' in det) delete det.AScadere;
    };

    fixDettagli(root?.Fidi?.Focelda?.Dettagli);
    fixDettagli(root?.Fidi?.IOT?.Dettagli);

    return res?.data ? { ...res, data: root } : root;
}

export function CustomerData(
    userContext,
    abortController,
    setData,
    FatturatoDataAPI,
    customerCode,
    setLoadStatus,
    setReqCustomersDataStatus
) {
    if (userContext.details === undefined) return;

    FetchData(import.meta.env.VITE_API_CUSTOMERSFIDO + 'gt-cpd', 'POST', {
        tk: userContext.token,
        ctm: customerCode,
    }, abortController)
        .then(res => {
            setReqCustomersDataStatus(false);

            const normalized = normalizeCreditsResponse(res);

            setData(normalized);
            setLoadStatus(false);
            FatturatoDataAPI(customerCode, normalized);
        })
        .catch(error => {
            if (error.name !== 'AbortError') {
                console.error(error);
                let error_ = "Sembra che non è stato possibile trovare i dati, perfavore contatta un tecnico.";
                if (error && (error?.msg || error?.message)) error_ = (error.msg || error.message);
                return enqueueSnackbar(error_, { title: 'Ops..', type: 'error' });
            }
        });
}
