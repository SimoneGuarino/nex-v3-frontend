export function DivideName(fullName: string): [string, string] {
    const index = fullName.indexOf(' '); // Trova l'indice del primo spazio
    if (index === -1) {
        // Se non c'è spazio, restituisci l'intera stringa come primo elemento
        return [fullName, ''];
    }

    // Suddividi la stringa al primo spazio trovato
    const firstPart = fullName.substring(0, index);
    const secondPart = fullName.substring(index + 1);

    return [firstPart, secondPart];
}