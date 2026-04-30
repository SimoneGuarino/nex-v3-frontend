//src\classes\cookie.js
import Cookies from 'js-cookie';

/**
 * Dedicato al salvataggio delle impostazioni utenti all'interno dei Cookie
 * @param {*} name nome del cookie
 * @returns 
 */
export function CookiesStoredSettings(name) {
    const storedSettings = Cookies.get(name);
    if (storedSettings) {
        return JSON.parse(storedSettings);
    };
    return null; // Ritorna null se il cookie non esiste
};

export function setCookie({ name, data }) {
    const data_ = JSON.stringify(!data); //converti in stringa il valore
    //salva solo se il valore è diverso da undefined
    if (data_ !== undefined) {
        CookiesSaveSettings(name, data);
    };

    //ritorna il valore salvato o data.
    if (!CookiesStoredSettings(name)) {
        return data;
    } else {
        return CookiesStoredSettings(name);
    };
};

export function CookiesSaveSettings(name, arr) {
    // Salva l'array nei cookie con un nome specifico, ad esempio 'arr'
    return Cookies.set(name, JSON.stringify(arr));
};