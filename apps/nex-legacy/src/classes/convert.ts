export interface ConversionResult<T> {
  Success: boolean;
  Message?: string;
  Data: T | null;
}

export default class Convert {
  euro(num: string | number | null | undefined): ConversionResult<string> {
    const convertNum = typeof num === 'number' ? num : Number.parseFloat(String(num));

    if (!Number.isFinite(convertNum)) {
      return {
        Success: false,
        Message: 'Il Numero è vuoto o non valido',
        Data: null,
      };
    }

    return {
      Success: true,
      Data: convertNum.toLocaleString('it-IT', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    };
  }

  date(str: string | null | undefined): ConversionResult<string> {
    if (typeof str !== 'string' || str.length === 0) {
      return {
        Success: false,
        Message: 'Il Numero è vuoto o non valido',
        Data: null,
      };
    }

    const formattedString = str.length > 5 ? str : `0${str}`;
    const day = formattedString.substring(2, 4);
    const month = formattedString.substring(0, 2);
    const year = formattedString.substring(4);

    return {
      Success: true,
      Data: `${month}/${day}/${year}`,
    };
  }
}
