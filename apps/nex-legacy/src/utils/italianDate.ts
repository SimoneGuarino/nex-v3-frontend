export function ConvertToItalianDate(date: string, settings: { time: boolean } | null) {
    if (!date) return "";

    // Provo a parsare la data
    const dataRichiesta = new Date(date);

    // Se non è una data valida, probabilmente è già formattata
    if (isNaN(dataRichiesta.getTime())) {
        return date;
    }
    // Funzione per ottenere il giorno della settimana in italiano
    function getGiornoSettimanaItaliano(dayOfWeek: any) {
        const giorniSettimana = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
        return giorniSettimana[dayOfWeek];
    }

    // Funzione per ottenere il mese in italiano
    function getMeseItaliano(month: any) {
        const mesiItaliani = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
        return mesiItaliani[month];
    }

    // Assume data[rowSelected].Dettagli.DataRichiesta è una stringa rappresentante una data
    const giornoSettimana = getGiornoSettimanaItaliano(dataRichiesta.getDay());
    const giorno = dataRichiesta.getDate();
    const mese = getMeseItaliano(dataRichiesta.getMonth());
    const anno = dataRichiesta.getFullYear();

    let dataItaliana = '';
    if (settings && settings.time) {
        // Aggiungi ora e minuti
        const ore = dataRichiesta.getHours();
        const minuti = dataRichiesta.getMinutes();
        const orario = `${ore.toString().padStart(2, '0')}:${minuti.toString().padStart(2, '0')}`; // Formatta ora e minuti con 2 cifre
        dataItaliana = `${giornoSettimana} ${giorno} ${mese} ${anno} alle ${orario}`;
    } else {
        dataItaliana = `${giornoSettimana} ${giorno} ${mese} ${anno}`;
    };

    return dataItaliana;
};