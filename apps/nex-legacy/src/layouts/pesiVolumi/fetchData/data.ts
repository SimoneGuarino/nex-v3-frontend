// src/layouts/pesiVolumi/fetchData/data.ts
import { FetchData } from '../../../examples/Fetch';
import { enqueueSnackbar } from 'components/MessageBox';

interface UserContext {
    details?: {
        username: string;
    };
    token: string;
}

interface SearchItemAPIProps {
    userContext: UserContext;
    abortController: any;
    setDataContext: (prev: any) => void;
    tp: number;
    setChronoData: (prev: any) => void;
    ChangeLoadingChronoState: () => void;
    ChangeErrorStatus: () => void;
    DisableLoadTableState: () => void;
    warehouse: string | null;
}

export function DataAPI({
    userContext,
    abortController,
    setDataContext,
    tp,
    setChronoData,
    ChangeLoadingChronoState,
    ChangeErrorStatus,
    DisableLoadTableState,
    warehouse
}: SearchItemAPIProps): void {
    // lato BE la sicurezza viene gestita da req.security (token in header tramite FetchData)
    if (userContext.details === undefined) { return; }
    const whToSend = warehouse;

    FetchData(
        `${import.meta.env.VITE_API_LOGISTICS}wgtvlm/gt/prds`,
        'POST',
        {
            // niente più tk nel payload
            tp: tp,
            wh: whToSend,
        },
        abortController
    ).then(async (res: any) => {
        const convertedBuffer = res;

        if (tp == 0) {
            if (convertedBuffer && Array.isArray(convertedBuffer) && convertedBuffer.length > 0) {
                const dataWithNewPeso = convertedBuffer.map((item: any) => ({
                    ...item,
                    peso: item.peso !== undefined ? parseFloat(item.peso) / 1000 : 0
                }));
                setChronoData(dataWithNewPeso);
            }
            ChangeLoadingChronoState();
        } else {
            setDataContext(() => {
                return { dati: convertedBuffer };
            });
            DisableLoadTableState();
        }

    }).catch((error: any) => {
        if (error.name !== 'AbortError') {
            console.error(error);
            enqueueSnackbar(
                "Sembra che i dati al momento non siano disponibili, perfavore contatta un tecnico.",
                {
                    title: 'Ops..',
                    type: 'error',
                }
            );
            ChangeErrorStatus();
        }
    });
}
