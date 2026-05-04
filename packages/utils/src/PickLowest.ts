//prendi il valore piu basso ad eccezione che sia diverso da 0
export const PickLowest = (a: number, b: number) => {
    if((a === undefined || a === null) || (b === undefined && b === null)){  return NaN  };
    let value;

    if (a == 0 && b == 0) {
        value = 0
    } else {
        if (a >= b) {
            if (b != 0) {
                value = b
            } else {
                value = a
            }
        } else {
            if (a != 0) {
                value = a
            } else {
                value = b
            }
        }
    }

    return value;
};