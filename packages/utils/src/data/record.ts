type AnyRecord = Record<string, any>;

export function normalizeRecordKey(key: string): string {
    return key
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]/g, "")
        .toLowerCase();
}

export function pickFieldInsensitive(source: AnyRecord | null | undefined, keys: string[]): any {
    if (!source) return undefined;

    for (const key of keys) {
        if (Object.prototype.hasOwnProperty.call(source, key)) return source[key];
    }

    const normalizedMap = new Map<string, any>(
        Object.entries(source).map(([k, v]) => [normalizeRecordKey(k), v])
    );

    for (const key of keys) {
        const found = normalizedMap.get(normalizeRecordKey(key));
        if (found !== undefined) return found;
    }

    return undefined;
}

export function toTrimmedText(value: any): string {
    if (value === null || value === undefined) return "";
    return String(value).trim();
}

export function isFlagOn(value: any): boolean {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value === 1;

    const s = String(value ?? "").trim().toUpperCase();
    return s === "S" || s === "SI" || s === "Y" || s === "YES" || s === "TRUE" || s === "1";
}

export function toSN(value: boolean): "S" | "N" {
    return value ? "S" : "N";
}
