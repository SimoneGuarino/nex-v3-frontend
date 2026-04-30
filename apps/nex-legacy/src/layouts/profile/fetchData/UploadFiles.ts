import { FetchFileData } from 'examples/Fetch/FetchFileData';
import { MutableRefObject } from 'react';

interface DataAPIProps {
    abortController: MutableRefObject<AbortController | null>;
    url?: string;
    form?: FormData;
};
export async function UploadFilesAPI({ abortController, url, form }: DataAPIProps) : Promise<any> {
    return await FetchFileData(`${import.meta.env.VITE_API_USERS}${url || ''}`, 
        'POST', form, abortController)
    .then((res: any) => {
        return res;
    }).catch((errorState: any) => {
        if (errorState.name !== 'AbortError') {
            console.error(errorState);
        };
        return errorState;
    });
};