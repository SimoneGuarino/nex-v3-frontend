import type { AnyRecord } from "../types";

export type CreditSafeTone = "neutral" | "ok" | "warn";

export type CreditSafeFlagItem = {
    key: string;
    label: string;
    active: boolean | null;
    tone: CreditSafeTone;
    valueLabel: string;
};

type CreditSafeFlagDefinition = {
    key: string;
    label: string;
};

const CREDIT_SAFE_FLAG_DEFINITIONS: CreditSafeFlagDefinition[] = [
    { key: "hasInsolvency", label: "Procedure di insolvenza" },
    { key: "hasCompaniesInsolvency", label: "Collegate in insolvenza" },
    { key: "hasProtesti", label: "Protesti" },
    { key: "hasSevereProtesti", label: "Protesti gravi" },
    { key: "hasPrejudicials", label: "Pregiudizievoli" },
    { key: "hasSeverePrejudicials", label: "Pregiudizievoli gravi" },
    { key: "hasCigsEvents", label: "Eventi CIGS" },
];

const MOJIBAKE_REPLACEMENTS: Array<[string, string]> = [
    ["\u00e2\u201a\u00ac", "\u20ac"],
    ["\u00e2\u20ac\u2122", "'"],
    ["\u00e2\u20ac\u0153", "\""],
    ["\u00e2\u20ac\u009d", "\""],
    ["\u00e2\u20ac\u201c", "-"],
    ["\u00e2\u20ac\u201d", "-"],
    ["\u00c2\u00b0", "\u00b0"],
    ["\u00c2\u00a7", "\u00a7"],
    ["\u00c2\u00b7", "\u00b7"],
    ["\u00c3\u20ac", "\u00c0"],
    ["\u00c3\u0081", "\u00c1"],
    ["\u00c3\u0088", "\u00c8"],
    ["\u00c3\u0089", "\u00c9"],
    ["\u00c3\u008c", "\u00cc"],
    ["\u00c3\u0092", "\u00d2"],
    ["\u00c3\u0093", "\u00d3"],
    ["\u00c3\u0099", "\u00d9"],
    ["\u00c3\u009a", "\u00da"],
    ["\u00c3\u00a0", "\u00e0"],
    ["\u00c3\u00a1", "\u00e1"],
    ["\u00c3\u00a8", "\u00e8"],
    ["\u00c3\u00a9", "\u00e9"],
    ["\u00c3\u00ac", "\u00ec"],
    ["\u00c3\u00b2", "\u00f2"],
    ["\u00c3\u00b3", "\u00f3"],
    ["\u00c3\u00b9", "\u00f9"],
    ["\u00c3\u00ba", "\u00fa"],
];

function isRecord(value: unknown): value is AnyRecord {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function cloneAndNormalizeStrings(value: unknown): unknown {
    if (typeof value === "string") return normalizeCreditSafeText(value);
    if (Array.isArray(value)) return value.map((item) => cloneAndNormalizeStrings(item));
    if (!isRecord(value)) return value;

    const out: AnyRecord = {};
    for (const [key, nestedValue] of Object.entries(value)) {
        out[key] = cloneAndNormalizeStrings(nestedValue);
    }
    return out;
}

function applyCreditsProfileCompatibilityAliases(profile: AnyRecord): AnyRecord {
    const updatedAt = profile?.DataReport ?? profile?.CreditSafe?.Meta?.updatedAt ?? null;
    if (updatedAt != null && profile.Aggiornato == null) {
        profile.Aggiornato = updatedAt;
    }

    for (const scopeKey of ["Focelda", "IOT"]) {
        const details = profile?.Fidi?.[scopeKey]?.Dettagli;
        if (!isRecord(details)) continue;
        if (details.Esposizione == null && details.AScadere != null) {
            details.Esposizione = details.AScadere;
        }
        if (details.AScadere == null && details.Esposizione != null) {
            details.AScadere = details.Esposizione;
        }
        if (details.Rischio == null) {
            details.Rischio = 0;
        }
    }

    return profile;
}

function applyCreditSafeCompatibilityAliases(creditSafe: AnyRecord, dataReport: unknown): AnyRecord {
    const updatedAt = typeof dataReport === "string" && dataReport.trim() ? dataReport : null;
    if (updatedAt == null) return creditSafe;

    const currentMeta = isRecord(creditSafe.Meta) ? creditSafe.Meta : null;
    if (currentMeta?.updatedAt != null) return creditSafe;

    creditSafe.Meta = {
        ...(currentMeta ?? {}),
        updatedAt,
    };

    return creditSafe;
}

export function normalizeCreditSafeText(value: string): string {
    let normalized = value;

    for (const [from, to] of MOJIBAKE_REPLACEMENTS) {
        normalized = normalized.split(from).join(to);
    }

    return normalized;
}

export function normalizeLegacyCreditsResponse(response: unknown): AnyRecord | null {
    const root = isRecord(response) && isRecord(response.data) ? response.data : response;
    if (!isRecord(root)) {
        return null;
    }

    return applyCreditsProfileCompatibilityAliases(cloneAndNormalizeStrings(root) as AnyRecord);
}

export function normalizeCustomerCreditSafeResponse(response: unknown): AnyRecord | null {
    const root = isRecord(response) && isRecord(response.data) ? response.data : response;
    if (!isRecord(root)) {
        return null;
    }

    const normalizedRoot = cloneAndNormalizeStrings(root) as AnyRecord;
    if (!isRecord(normalizedRoot.CreditSafe)) {
        return null;
    }

    return applyCreditSafeCompatibilityAliases(
        normalizedRoot.CreditSafe as AnyRecord,
        normalizedRoot.DataReport
    );
}

export function getCreditSafeCommentaryTone(value: unknown): CreditSafeTone {
    const normalized = String(value ?? "").trim().toLowerCase();

    if (normalized === "positive") return "ok";
    if (normalized === "negative") return "warn";
    return "neutral";
}

export function getCreditSafeFlagItems(creditSafe: AnyRecord | null): CreditSafeFlagItem[] {
    const summaryExtra = isRecord(creditSafe?.CompanySummaryExtra)
        ? (creditSafe?.CompanySummaryExtra as AnyRecord)
        : null;

    return CREDIT_SAFE_FLAG_DEFINITIONS.map(({ key, label }) => {
        const rawValue = summaryExtra?.[key];
        const active = typeof rawValue === "boolean" ? rawValue : null;

        return {
            key,
            label,
            active,
            tone: active == null ? "neutral" : active ? "warn" : "ok",
            valueLabel: active == null ? "-" : active ? "Presenti" : "Assenti",
        };
    });
}

export function humanizeCreditSafeKey(key: string): string {
    const normalized = String(key ?? "").trim();
    if (!normalized) return "-";

    const text = normalized
        .replace(/_/g, " ")
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2")
        .trim()
        .toLowerCase();

    return text ? `${text.charAt(0).toUpperCase()}${text.slice(1)}` : "-";
}
