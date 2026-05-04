interface NumberToEuroProp {
    toSum?: Array<number>;
    toMinus?: Array<number>;
    convert?: number;
}

export function NumberToEuro({ toSum, toMinus, convert } : NumberToEuroProp): string {
    let value: number = 0;

    if(toSum && toMinus && convert){ 
        const msg = "Sembra che la funzione stia ricevendo piu parametri, scegline uno.";
        console.error(msg);
        return msg
    };

    if(convert){
        value = parseFloat((convert as any));
    }else if(toSum){
        value = toSum.reduce((value: number, increase: number) => value + increase, 0);
    }else if (toMinus){
        value = toMinus.reduce((value: number, increase: number) => value - increase, 0);
    }

    // Formatta il prezzo con il simbolo dell'euro e due decimali
    const formattedPriceString = value.toLocaleString("it-IT", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    return formattedPriceString;
}