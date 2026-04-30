export interface SanitizeResult<T> {
  Success: boolean;
  Message: string;
  Data: T | null;
}

const EMAIL_REGEX = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+ )\])/;
const POSITIVE_NUMBER_REGEX = /^[0-9]+$/;
const RESTRICT_TEXT_REGEX = /^[a-zA-Z0-9]+(?: [a-zA-Z0-9]+)*$/;
const RESTRICT_TEXT_NTIF_REGEX = /^[A-Za-z0-9<>/\s'àè',.]+$/;
const STRING_REGEX = /^[a-zA-Z0-9]+$/;
const DASH_STRING_REGEX = /^[a-zA-Z0-9 _-]+$/;
const TEXT_REGEX = /^[^'"\s][^'"\n]*[^'"\s]$/;
const TOKEN_REGEX = /^(?!.*[\._\-]{2})[a-zA-Z0-9]+([\._\-][a-zA-Z0-9]+)*$/;

export default class Sanitize {
  email(str: unknown): SanitizeResult<string> {
    if (typeof str !== 'string' || str.length === 0) {
      return { Success: false, Message: 'La mail è vuota o non valida', Data: null };
    }

    const match = str.toLowerCase().match(EMAIL_REGEX);
    if (!match) {
      return { Success: false, Message: 'La mail non è valida', Data: null };
    }

    return { Success: true, Message: '', Data: match[0] };
  }

  number(num: unknown): SanitizeResult<number> {
    try {
      const parsedNumber = Number(num);
      if (Number.isNaN(parsedNumber)) {
        return { Success: false, Message: 'Il numero non è valido', Data: null };
      }

      return { Success: true, Message: '', Data: parsedNumber };
    } catch (error) {
      return { Success: false, Message: String(error), Data: null };
    }
  }

  password(str: unknown): SanitizeResult<string> {
    if (typeof str !== 'string' || str.length === 0) {
      return { Success: false, Message: 'Il campo password è vuoto o non valido', Data: null };
    }

    if (/\s/g.test(str)) {
      return { Success: false, Message: 'Il campo password non può contenere spazi', Data: null };
    }

    return { Success: true, Message: '', Data: str };
  }

  positiveNumber(num: unknown): SanitizeResult<number> {
    if (typeof num === 'number') {
      return num > 0
        ? { Success: true, Message: '', Data: num }
        : { Success: false, Message: 'Il numero non è valido', Data: null };
    }

    if (typeof num === 'string' && POSITIVE_NUMBER_REGEX.test(num) && Number(num) > 0) {
      return { Success: true, Message: '', Data: Number(num) };
    }

    return { Success: false, Message: 'Il numero inserito è vuoto o non valido', Data: null };
  }

  restrictText(str: unknown, ref = ''): SanitizeResult<string> {
    if (typeof str !== 'string' || str.length === 0) {
      return { Success: false, Message: `Il campo ${ref} è vuoto o non valido`, Data: null };
    }

    const match = str.match(RESTRICT_TEXT_REGEX);
    if (!match) {
      return {
        Success: false,
        Message: `Il campo ${ref} non è valido, sono accettate solo lettere maiuscole (A-Z), minuscole (a-z) e spazi ( )`,
        Data: null,
      };
    }

    return { Success: true, Message: '', Data: match[0] };
  }

  restrictTextNTIF(str: unknown): SanitizeResult<string> {
    if (typeof str !== 'string' || str.length === 0) {
      return { Success: false, Message: 'Il campo è vuoto o non valido', Data: null };
    }

    const match = str.match(RESTRICT_TEXT_NTIF_REGEX);
    if (!match) {
      return {
        Success: false,
        Message: 'Il campo non è valido, sono accettate solo lettere maiuscole (A-Z), minuscole (a-z) e spazi ( )',
        Data: null,
      };
    }

    return { Success: true, Message: '', Data: match[0] };
  }

  string(str: unknown, ref = ''): SanitizeResult<string> {
    if (typeof str !== 'string' || str.length === 0) {
      return { Success: false, Message: `Il campo ${ref} è vuoto o non valido`, Data: null };
    }

    const match = str.match(STRING_REGEX);
    if (!match) {
      return {
        Success: false,
        Message: `Il campo ${ref} non è valido, sono accettate solo lettere maiuscole (A-Z), minuscole (a-z) e numeri (0-9)`,
        Data: null,
      };
    }

    return { Success: true, Message: '', Data: match[0] };
  }

  dashString(str: unknown, ref = ''): SanitizeResult<string> {
    if (typeof str !== 'string' || str.length === 0) {
      return { Success: false, Message: `Il campo ${str} è vuoto o non valido`, Data: null };
    }

    const match = str.match(DASH_STRING_REGEX);
    if (!match) {
      return {
        Success: false,
        Message: `Il campo ${str} non è valido, sono accettate solo lettere maiuscole (A-Z), minuscole (a-z), trattino (- _) e numeri (0-9)`,
        Data: null,
      };
    }

    return { Success: true, Message: '', Data: match[0] };
  }

  text(str: unknown, ref = ''): SanitizeResult<string> {
    if (typeof str !== 'string' || str.length === 0) {
      return { Success: false, Message: `Il campo ${ref} è vuoto o non valido`, Data: null };
    }

    const match = str.match(TEXT_REGEX);
    if (!match) {
      return {
        Success: false,
        Message: `Il campo ${ref} non è valido, sono accettate solo lettere maiuscole (A-Z) e minuscole (a-z)`,
        Data: null,
      };
    }

    return { Success: true, Message: '', Data: match[0] };
  }

  token(str: unknown): SanitizeResult<string> {
    if (typeof str !== 'string' || str.length === 0) {
      return { Success: false, Message: 'Il token è vuoto o non valido', Data: null };
    }

    const match = str.match(TOKEN_REGEX);
    if (!match) {
      return { Success: false, Message: 'Il token non è valido', Data: null };
    }

    return { Success: true, Message: '', Data: match[0] };
  }
}
