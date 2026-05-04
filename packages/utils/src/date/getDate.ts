/**
 * Restituisce un oggetto con le date di oggi, domani, ieri, 45 giorni fa e una settimana fa formattate come stringhe.
 * @returns { today: string, tomorrow: string, yesterday: string, fortyFiveDaysAgo: string, oneWeekAgo: string }
 */
export function GetDate() {
    // Ottieni la data di oggi
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Calcola la data di 45 giorni fa
    const fortyFiveDaysAgo = new Date(today);
    fortyFiveDaysAgo.setDate(today.getDate() - 45);

    // Ottieni la data di ieri
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    // Ottieni la data di una settimana fa
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(today.getDate() - 7);

    // Funzione per formattare la data in 'dd/mm/yy'
    const formatDateString = (date: any) => {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Mese inizia da 0
        const year = String(date.getFullYear()); // Usa solo le ultime due cifre dell'anno
        return `${year}-${month}-${day}`;
    };

    // Crea l'oggetto con le date formattate
    return {
        today: formatDateString(today),
        yesterday: formatDateString(yesterday),
        tomorrow: formatDateString(tomorrow),
        fortyFiveDaysAgo: formatDateString(fortyFiveDaysAgo),
        oneWeekAgo: formatDateString(oneWeekAgo)
    };
};

/**
 * Formatta una data da una stringa in un formato specifico a un oggetto Date.
 * @param dateString string | number | Date
 * @param actualFromat 'ddmmyyyy' | 'yyyymmdd' | 'yyyy-mm-dd'
 * @param desiredFormat 'dd/mm/yyyy'
 * @returns Date
 */
export function FormatDate({ date, actualFromat, desiredFormat }
    : { date: string | number | Date, actualFromat: string, desiredFormat?: string }): Date {
    if (!date) return new Date(NaN); // Data non valida se la stringa è vuota o non definita
    const dateString = date.toString();

    let year: number, month: number, day: number;
    switch (actualFromat.toLowerCase()) {
        case 'ddmmyyyy':
            [day, month, year] = (dateString as string).split(/[-\/]/).map(Number);
            break;
        case 'yyyymmdd':
            year = Number((dateString as string).slice(0, 4));
            month = Number((dateString as string).slice(4, 6));
            day = Number((dateString as string).slice(6, 8));
            break;
        case 'yyyy-mm-dd':
            {
                const match = (dateString as string).match(/^(\d{4})-(\d{2})-(\d{2})/);
                if (!match) return new Date(NaN);
                year = Number(match[1]);
                month = Number(match[2]);
                day = Number(match[3]);
            }
            break;
        case 'iso':
            {
                const match = (dateString as string).match(/^(\d{4})-(\d{2})-(\d{2})/);
                if (!match) return new Date(NaN);
                year = Number(match[1]);
                month = Number(match[2]);
                day = Number(match[3]);
            }
            break;
        case "yymmdd": {
            const yy = Number((dateString as string).slice(0, 2));
            year = 2000 + yy;
            month = Number((dateString as string).slice(2, 4));
            day = Number((dateString as string).slice(4, 6));
            break;
        }
        default:
            return new Date(NaN);
    }

    // crea un oggetto Date
    const formattedDate = new Date(year, month - 1, day);
    if (isNaN(formattedDate.getTime())) return new Date(NaN); // Data non valida

    // formattiamo la data nel formato desiderato
    if (desiredFormat === 'dd/mm/yyyy') {
        const dd = String(formattedDate.getDate()).padStart(2, '0');
        const mm = String(formattedDate.getMonth()).padStart(2, '0'); // Mese inizia da 0
        const yyyy = formattedDate.getFullYear();
        return new Date(`${yyyy}-${mm}-${dd}`);
    }

    return formattedDate;
};

/**
 * Formatta una data in stringa nel formato desiderato.
 * @param date string | number | Date
 * @param actualFromat 'ddmmyyyy' | 'yyyymmdd' | 'yyyy-mm-dd' | 'iso'
 * @param desiredFormat 'yyyy-mm-dd' | 'dd-mm-yyyy' | 'dd/mm/yyyy'
 * @returns string (vuota se non convertibile)
 */
export function FormatDateString({
    date,
    actualFromat,
    desiredFormat = 'yyyy-mm-dd',
}: {
    date: string | number | Date;
    actualFromat: string;
    desiredFormat?: 'yyyy-mm-dd' | 'dd-mm-yyyy' | 'dd/mm/yyyy';
}): string {
    const parsed = FormatDate({ date, actualFromat });
    if (Number.isNaN(parsed.getTime())) return '';

    const dd = String(parsed.getDate()).padStart(2, '0');
    const mm = String(parsed.getMonth() + 1).padStart(2, '0');
    const yyyy = String(parsed.getFullYear());

    if (desiredFormat === 'dd-mm-yyyy') return `${dd}-${mm}-${yyyy}`;
    if (desiredFormat === 'dd/mm/yyyy') return `${dd}/${mm}/${yyyy}`;
    return `${yyyy}-${mm}-${dd}`;
};

/**
 * Calcola il numero di giorni tra due date in formato YYYY-MM-DD.
 * @param a - start date | string
 * @param b - end date | string
 * @returns number of days (integer) or null on invalid input
 */
export function daysBetween(a?: string, b?: string) {
    if (!a || !b) return null;
    const da = new Date(a);
    const db = new Date(b);
    if (Number.isNaN(da.getTime()) || Number.isNaN(db.getTime())) return null;
    const diffMs = db.getTime() - da.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
};

/**
 * Converte una data in un formato accettabile per un input di tipo "datetime-local".
 * @param val - stringa o oggetto Date da convertire
 * @returns stringa formattata per input "datetime-local" (YYYY-MM-DDTHH:mm) o stringa vuota se input non valido
 */
export function toLocalDateTimeInputValue(val?: string | Date | null): string {
    if (!val) return "";
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/**
 * Formatta una data in formato ISO (YYYY-MM-DD HH:mm) o restituisce la stringa originale se non è convertibile.
 * @param val - stringa o oggetto Date da formattare
 * @returns stringa formattata in locale italiano o stringa originale se non convertibile
 */
export function formatISODate(val?: string | Date): string {
    if (!val) return "-";
    const d = new Date(val);
    if (typeof val === "string" && Number.isNaN(d.getTime())) return val;
    return d.toLocaleString("it-IT");
};