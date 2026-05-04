import Cookies from 'js-cookie';  //npm i --save-dev @types/js-cookie

interface CookieProps {
    name: string;
    data?: any;
    setData?: (prev: any) => void;
}
/**
 * @param name String | nome del cookie di riferimento
 * @returns string | cookie
 */
export function RetriveCookie({ name, setData } : CookieProps): any {
    const storedSettings = Cookies.get(name);
    if (storedSettings) {
        const data = JSON.parse(storedSettings);
        if(setData !== undefined){
            setData(data);
        }
        return data;
    }
    return null; // Ritorna null se il cookie non esiste
}

export function SaveCookie({ name, data } : CookieProps): any {
    return Cookies.set(name, JSON.stringify(data));
}

export function RemoveCookie({ name } : CookieProps): any {
    return Cookies.remove(name);
}