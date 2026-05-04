import { FetchData } from 'examples/Fetch';

interface SearchItemAPIProps {
    username: string;
    abortController: any;
    rememberMe: boolean
};

export async function TempKey({ username, abortController}: SearchItemAPIProps): Promise<any> {
    return new Promise((resolve, reject) => {
        FetchData(`${import.meta.env.VITE_API_API_ENDPOINT}hNzsua12vkie421O/8d21as`, 'POST', {
            usr: username
        }, abortController).then(async (response) => {
            resolve(response);
        }).catch((error: any) => {
            reject(error?.message?.msg || "Qualcosa è andato storto, riprova più tardi.");
        })
    });
}