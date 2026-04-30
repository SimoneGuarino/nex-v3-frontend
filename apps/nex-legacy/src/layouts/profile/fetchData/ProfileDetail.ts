import { FetchData } from 'examples/Fetch';
import { MutableRefObject } from 'react';

interface DataAPIProps {
    abortController: MutableRefObject<AbortController | null>;
    body?: {data: string};
};
export async function ProfileDetailAPI({ abortController, body }: DataAPIProps) : Promise<any> {
    return await FetchData(`${import.meta.env.VITE_API_USERS}users/me`, 
        'PATCH', body, abortController)
    .then((res: any) => {
        return res;
    }).catch((errorState: any) => {
        if (errorState.name !== 'AbortError') {
            console.error(errorState);
        };
        return errorState;
    });
};