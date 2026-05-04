import { toTrimmedText } from "utils/data/record";
import { FormatDate } from "utils/date/getDate";

type ClassNameToken = string | false | null | undefined;

export function cn(...values: ClassNameToken[]): string {
    return values.filter(Boolean).join(" ");
}

export function toDisplayText(value: any, fallback = "-"): string {
    const text = toTrimmedText(value).replace(/\s+/g, " ").trim();
    return text || fallback;
}

export function isEmptyValue(value: any): boolean {
    return toTrimmedText(value) === "";
}

export function pickFirstNonEmpty<T = any>(...values: T[]): T | null {
    for (const value of values) {
        if (!isEmptyValue(value)) return value;
    }
    return null;
}

export function formatNumberIt(value: any, fallback = "-"): string {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return fallback;
    return numeric.toLocaleString("it-IT");
}

export function formatCurrencyIt(value: any, fallback = "-"): string {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return fallback;
    return `${numeric.toLocaleString("it-IT", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })} \u20AC`;
}

export function ensureTrailingSlash(value: string | null | undefined, emptyValue = "/"): string {
    const text = toTrimmedText(value);
    if (!text) return emptyValue;
    return text.endsWith("/") ? text : `${text}/`;
}

export function buildQueryString(params: Record<string, string | number | undefined | null>): string {
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null) continue;
        const text = toTrimmedText(value);
        if (!text) continue;
        qs.set(key, text);
    }
    const query = qs.toString();
    return query ? `?${query}` : "";
}

export function formatDateMaybe(value: any, fallback = "-"): string {
    const text = toTrimmedText(value);
    if (!text) return fallback;

    let parsedDate: Date;

    if (/^\d{8}$/.test(text)) {
        parsedDate = FormatDate({ date: text, actualFromat: "yyyymmdd" });
    } else if (/^\d{6}$/.test(text)) {
        parsedDate = FormatDate({ date: text, actualFromat: "yymmdd" });
    } else {
        parsedDate = new Date(text);
    }

    if (Number.isNaN(parsedDate.getTime())) return text;
    return parsedDate.toLocaleDateString("it-IT");
}

export function formatYyyymmddToItalian(value: any, fallback = "-"): string {
    const text = toTrimmedText(value);
    if (!text) return fallback;

    if (!/^\d{8}$/.test(text)) return text;

    const year = text.slice(0, 4);
    const month = text.slice(4, 6);
    const day = text.slice(6, 8);
    return `${day}/${month}/${year}`;
}
