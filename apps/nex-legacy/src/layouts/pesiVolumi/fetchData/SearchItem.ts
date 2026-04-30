// src/layouts/pesiVolumi/fetchData/SearchItem.ts
import { FetchData } from '../../../examples/Fetch';
import { enqueueSnackbar } from 'components/MessageBox';

interface SearchItemAPIProps {
    abortController: any;
    params: URLSearchParams;
    setInsertData: (prev: any) => void;
}

export function SearchItemAPI({ abortController, params, setInsertData }: SearchItemAPIProps): void {
    FetchData(
        `${import.meta.env.VITE_API_LOGISTICS}wgtvlm/sc/prd?${params.toString()}`,
        'GET',
        null,
        abortController
    )
        .then(async (res: any) => {
            if (res) {
                if (res.msg && res.msg !== '') {
                    return enqueueSnackbar(res.msg, {
                        title: 'Attenzione',
                        type: 'warning',
                    });
                }

                setInsertData((prev: any) => {
                    // preserva sempre il codice che l'utente sta scrivendo
                    const prevCi = prev?.ci;

                    // normalizza peso
                    const newPeso =
                        res.peso !== undefined && res.peso !== null
                            ? parseFloat(res.peso) / 1000
                            : 0;

                    // NON vogliamo sovrascrivere ci con quello del BE
                    const { ci: _omitCi, ...rest } = res;

                    const response = { ...rest, peso: newPeso };

                    const merged = { ...prev, ...response };
                    if (prevCi !== undefined) {
                        merged.ci = prevCi;
                    }

                    return merged;
                });
            }
        }).catch((error: any) => {
            if (error.name !== 'AbortError') {
                console.error(error);
                let error_ = "Sembra che non è stato trovato nessun elemento";
                if (error && (error?.msg || error?.message)) { error_ = (error.msg || error.message); };
                return enqueueSnackbar(error_, {
                    title: 'Elemento non trovato',
                    type: 'warning',
                });
            };
        });
}
