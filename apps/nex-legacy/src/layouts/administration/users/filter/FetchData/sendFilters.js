import { FetchData } from 'examples/Fetch';

export function SendFilters(userContext, abortController, roleSL, setCopyOfData) {
    if(userContext.details === undefined){return;}
    FetchData(import.meta.env.VITE_API_ADMIN + "requests/users/read/82hzv7izk92inrwk1j29", 'POST', {
        rl: roleSL
    }, abortController).then(res => {
        setCopyOfData(_ => {
            const resDataSorted =  res.data.sort((a, b) => {
                if ((a.stato.codice === 'Online' || a.stato.codice === 'Assente') && b.stato.codice === 'Offline') {
                    return -1; // a viene prima di b
                } else if (a.stato.codice === 'Offline' && (b.stato.codice === 'Online' || b.stato.codice === 'Assente')) {
                    return 1; // b viene prima di a
                } else {
                    return a.nome.localeCompare(b.nome);
                }
            });
            return [{}, ...resDataSorted]
        })
    }).catch(error => console.error(error))
}