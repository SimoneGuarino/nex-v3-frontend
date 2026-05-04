// src/components/UI/panels/customerNotes/utils.ts
/**
 * descrizione: Utility di dominio per modulo note cliente.
 * include:     normalizzazione payload, regole ruolo/permessi, mapping discussione/storico.
 */
import { CheckRoleAdmin } from "utils/checkAdminPermissions";
import type { DiscussionState, SortDirection, SortField, SortPresetValue } from "./types";

/** Normalizza un valore in stringa trimmata; fallback `""`. */
export const normalizeText = (value: unknown): string => String(value ?? "").trim();
/** Normalizza un identificativo in lowercase per confronti resilienti. */
export const normalizeIdentity = (value: unknown): string => normalizeText(value).toLowerCase();

/** Restituisce il primo valore testuale non vuoto tra i candidati. */
const firstNonEmptyText = (...values: unknown[]): string => {
    for (const value of values) {
        const text = normalizeText(value);
        if (text) return text;
    }
    return "";
};

/** Estrae nome completo da shape utente eterogenee (legacy + nuove). */
const extractFullName = (input: any): string => {
    if (!input || typeof input !== "object") return "";

    const firstName = firstNonEmptyText(
        input?.NOME,
        input?.Nome,
        input?.nome,
        input?.firstName,
        input?.FirstName,
        input?.FIRST_NAME,
        input?.givenName,
        input?.GivenName
    );
    const lastName = firstNonEmptyText(
        input?.COGNOME,
        input?.Cognome,
        input?.cognome,
        input?.lastName,
        input?.LastName,
        input?.LAST_NAME,
        input?.familyName,
        input?.FamilyName
    );

    const fullNameByParts = `${firstName} ${lastName}`.trim();
    if (fullNameByParts) return fullNameByParts;

    return firstNonEmptyText(
        input?.NOME_COGNOME,
        input?.NomeCognome,
        input?.nomeCognome,
        input?.FULL_NAME,
        input?.FullName,
        input?.fullName,
        input?.utenteNomeCompleto,
        input?.UtenteNomeCompleto
    );
};

/** Valida input come stringa composta da sole cifre. */
export const asDigitString = (value: unknown): string | null => {
    const text = normalizeText(value);
    if (!text) return null;
    return /^\d+$/.test(text) ? text : null;
};

/** Formatta `YYYYMMDD` in `DD/MM/YYYY` lasciando invariati gli altri formati. */
export const formatDateFromYYYYMMDD = (value?: string | null): string => {
    if (!value) return "";
    const str = String(value).trim();
    if (str.includes("/")) return str;
    if (/^\d{8}$/.test(str)) {
        const year = str.slice(0, 4);
        const month = str.slice(4, 6);
        const day = str.slice(6, 8);
        return `${day}/${month}/${year}`;
    }
    return str;
};

/** Formatta data/dataora in output leggibile locale `it-IT`. */
export const formatDateTime = (value: unknown): string => {
    if (value === null || value === undefined || value === "") return "-";
    if (value instanceof Date) {
        const timestamp = value.getTime();
        return Number.isNaN(timestamp) ? "-" : value.toLocaleString("it-IT");
    }
    const raw = normalizeText(value);
    if (!raw) return "-";
    if (/^\d{8}$/.test(raw)) return formatDateFromYYYYMMDD(raw);
    const parsed = Date.parse(raw);
    if (!Number.isNaN(parsed)) {
        return new Date(parsed).toLocaleString("it-IT");
    }
    return raw;
};

/** Estrae id nota (mongo o legacy). */
export const extractNoteId = (row: any): string => normalizeText(row?.NOTE_ID || row?._id);
/** True se la nota e una nota mongo gestibile con discussione/CRUD completo. */
export const isMongoNote = (row: any): boolean => Boolean(extractNoteId(row));
/** Estrae codice cliente da shape diverse. */
export const extractCustomerCode = (row: any): string =>
    normalizeText(row?.CLIENTE || row?.CustomerCode || row?.customerCode);
/** Estrae ragione sociale cliente da shape diverse. */
export const extractCustomerLabel = (row: any): string =>
    normalizeText(row?.RAGIONE_SOCIALE || row?.CustomerLabel || row?.customerLabel);
/** Estrae testo nota da shape diverse. */
export const extractNoteText = (row: any): string => normalizeText(row?.NOTA || row?.Nota || row?.noteText);
/** Estrae identificativo utente proprietario nota con fallback opzionale. */
export const extractOriginalNoteOwnerId = (row: any, fallback = ""): string => {
    const ownerId = firstNonEmptyText(
        row?.OWNER_USER_ID,
        row?.OwnerUserId,
        row?.ownerUserId,
        row?.NOTE_OWNER_ID,
        row?.NoteOwnerId,
        row?.noteOwnerId,
        row?.OWNER_ID,
        row?.OwnerId,
        row?.ownerId,
        row?.UserId,
        row?.userId,
        row?.USER_ID,
        row?.Owner?._id,
        row?.owner?._id,
        row?.User?._id,
        row?.user?._id
    );

    return ownerId || fallback;
};

/** Estrae etichetta proprietario nota (nome completo o username) con fallback. */
export const extractOriginalNoteOwnerLabel = (row: any, fallback = "-"): string => {
    const ownerFullName = firstNonEmptyText(
        extractFullName(row?.Owner),
        extractFullName(row?.owner),
        extractFullName(row?.PROPRIETARIO),
        extractFullName(row?.proprietario),
        extractFullName(row?.NOTE_OWNER),
        extractFullName(row?.noteOwner)
    );
    if (ownerFullName) return ownerFullName;

    const ownerLabel = firstNonEmptyText(
        row?.OWNER_USERNAME,
        row?.OwnerUsername,
        row?.ownerUsername,
        row?.OWNER_USER_USERNAME,
        row?.OwnerUserUsername,
        row?.ownerUserUsername,
        row?.NOTE_OWNER_USERNAME,
        row?.NoteOwnerUsername,
        row?.noteOwnerUsername,
        row?.OWNER_LABEL,
        row?.OwnerLabel,
        row?.ownerLabel,
        row?.UTENTE_PROPRIETARIO,
        row?.UtenteProprietario,
        row?.utenteProprietario,
        row?.Owner?.username,
        row?.owner?.username,
        row?.Owner?.userName,
        row?.owner?.userName
    );

    return ownerLabel || fallback;
};

/** Estrae etichetta autore nota usando prima owner originale e poi campi generici. */
export const extractNoteOwnerLabel = (row: any, fallback = "-"): string => {
    const originalOwnerLabel = extractOriginalNoteOwnerLabel(row, "");
    if (originalOwnerLabel) return originalOwnerLabel;

    const genericOwnerLabel = firstNonEmptyText(
        row?.UTENTE,
        row?.Utente,
        row?.userLabel,
        row?.UserLabel
    );

    return genericOwnerLabel || fallback;
};

/** Estrae codice tipologia nota da campi possibili. */
export const extractNoteTypeCode = (row: any): string =>
    normalizeText(
        row?.TIPO_NOTA ||
            row?.TIPOLOGIA_NOTA ||
            row?.Tipologia?.Codice ||
            row?.Tipologia?.codice ||
            row?.noteType
    );

/** Estrae descrizione tipologia nota da campi possibili. */
export const extractNoteTypeLabel = (row: any): string =>
    normalizeText(
        row?.TIPO_NOTA_DESC ||
            row?.TIPO_NOTA ||
            row?.Tipologia?.Descrizione ||
            row?.Tipologia?.descrizione ||
            row?.noteTypeDescription ||
            extractNoteTypeCode(row)
    );

/** Compone etichetta tipologia in forma leggibile `descrizione (codice)`. */
export const formatNoteTypeDisplay = (
    noteTypeCodeInput: unknown,
    noteTypeLabelInput: unknown,
    fallback = "Nota cliente"
): string => {
    const noteTypeCode = normalizeText(noteTypeCodeInput);
    const noteTypeLabel = normalizeText(noteTypeLabelInput);

    if (
        noteTypeLabel &&
        noteTypeCode &&
        noteTypeLabel.toUpperCase() !== noteTypeCode.toUpperCase()
    ) {
        return `${noteTypeLabel} (${noteTypeCode})`;
    }

    return noteTypeLabel || noteTypeCode || fallback;
};

/** Verifica se una tipologia corrisponde ad AMMI. */
export const isAdministrativeTypeCode = (code: unknown): boolean =>
    normalizeText(code).toUpperCase() === "AMMI";

/** Verifica se una riga nota e amministrativa. */
export const isAdministrativeNote = (row: any): boolean =>
    isAdministrativeTypeCode(extractNoteTypeCode(row));

/** Estrae identificativo utente da un entry dello storico modifiche. */
export const extractHistoryEntryUserId = (entry: any): string =>
    normalizeText(
        entry?.UserId ||
            entry?.userId ||
            entry?.USER_ID ||
            entry?.ownerId ||
            entry?.OWNER_ID ||
            entry?.utenteId ||
            entry?.UtenteId
    );

/** Estrae etichetta utente da un entry dello storico con fallback. */
export const extractHistoryEntryUserLabel = (entry: any, fallback = "-"): string => {
    const fullName = firstNonEmptyText(
        extractFullName(entry),
        extractFullName(entry?.utente),
        extractFullName(entry?.Utente),
        extractFullName(entry?.User),
        extractFullName(entry?.user)
    );
    if (fullName) return fullName;

    const label = firstNonEmptyText(
        entry?.UTENTE,
        entry?.utenteModifica,
        entry?.UtenteModifica,
        entry?.utente,
        entry?.Utente,
        entry?.username,
        entry?.userName,
        entry?.UserName
    );

    return label || fallback;
};

/** Estrae testo modifica da un entry storico. */
export const extractHistoryEntryNoteText = (entry: any): string =>
    normalizeText(entry?.nota || entry?.Nota || entry?.noteText || entry?.NoteText || "-");

/** Estrae/formatta timestamp modifica da un entry storico. */
export const extractHistoryEntryDate = (entry: any): string =>
    formatDateTime(entry?.dataModifica || entry?.DataModifica || entry?.data || entry?.Data || "-");

/** Estrae array storico modifiche da dettaglio nota o riga lista. */
export const extractHistoryRows = (rowOrDetail: any): any[] => {
    const raw = rowOrDetail?.StoricoModifiche || rowOrDetail?.storicoModifiche;
    return Array.isArray(raw) ? raw : [];
};

/** Cerca nello storico la label utente associata a un ownerId specifico. */
const findHistoryUserLabelById = (history: any[], ownerUserId: string): string => {
    const normalizedOwnerId = normalizeIdentity(ownerUserId);
    if (!normalizedOwnerId || !Array.isArray(history) || !history.length) return "";

    for (const entry of history) {
        if (normalizeIdentity(extractHistoryEntryUserId(entry)) !== normalizedOwnerId) continue;
        const label = extractHistoryEntryUserLabel(entry, "");
        if (label) return label;
    }

    return "";
};

/** Costruisce una chiave di match stabile per confrontare entry storico tra response diverse. */
const buildHistoryEntryMatchKey = (entry: any): string => {
    const userId = normalizeIdentity(extractHistoryEntryUserId(entry));
    const rawDate = normalizeText(
        entry?.dataModifica || entry?.DataModifica || entry?.data || entry?.Data
    );
    const noteText = normalizeText(
        entry?.nota || entry?.Nota || entry?.noteText || entry?.NoteText
    );
    return `${userId}|${rawDate}|${noteText}`.toLowerCase();
};

/** Arricchisce un entry storico senza label usando dati fallback di una versione precedente. */
const enrichHistoryEntryWithFallbackLabel = (entry: any, fallbackEntry: any): any => {
    if (!fallbackEntry) return entry;

    const currentLabel = extractHistoryEntryUserLabel(entry, "");
    if (currentLabel) return entry;

    const fallbackLabel = extractHistoryEntryUserLabel(fallbackEntry, "");
    if (!fallbackLabel) return entry;

    return {
        ...entry,
        NOME_COGNOME: firstNonEmptyText(
            entry?.NOME_COGNOME,
            entry?.NomeCognome,
            entry?.nomeCognome,
            fallbackLabel
        ),
        UTENTE: firstNonEmptyText(
            entry?.UTENTE,
            entry?.utenteModifica,
            entry?.UtenteModifica,
            entry?.utente,
            entry?.Utente,
            fallbackLabel
        ),
    };
};

/** Tronca testo lungo preservando suffisso ellissi. */
export const truncateText = (value: string, maxLength = 180): string => {
    if (!value) return "";
    if (value.length <= maxLength) return value;
    return `${value.slice(0, maxLength - 3)}...`;
};

/** Normalizza il nome ruolo in lowercase. */
const roleName = (roleInput: unknown): string => normalizeText(roleInput).toLowerCase();

/** Determina se il ruolo ha privilegi DEV (incluso mapping numerico legacy). */
export const isDevRole = (roleInput: unknown): boolean => {
    const normalizedRole = roleName(roleInput);
    if (!normalizedRole) return false;
    if (normalizedRole === "dev" || normalizedRole === "developer") return true;
    const asNumber = Number(normalizedRole);
    if (Number.isFinite(asNumber) && asNumber === 0) return true;
    return CheckRoleAdmin({ role: normalizeText(roleInput), rolesToCheck: [0] });
};

/** Determina se il ruolo ha privilegi ADMIN (incluso mapping numerico legacy). */
export const isAdminRole = (roleInput: unknown): boolean => {
    const normalizedRole = roleName(roleInput);
    if (!normalizedRole) return false;
    if (normalizedRole === "admin") return true;
    const asNumber = Number(normalizedRole);
    if (Number.isFinite(asNumber) && asNumber === 1) return true;
    return CheckRoleAdmin({ role: normalizeText(roleInput), rolesToCheck: [1] });
};

/** Verifica ruoli amministrativi basati su descrizione testuale. */
export const isAdministrativeRole = (roleInput: unknown): boolean => {
    const normalizedRole = roleName(roleInput);
    return normalizedRole.includes("amministrativ");
};

/** Costruisce il set identita del richiedente per confronti ownership resilienti. */
export const buildRequesterIdentityKeys = (userContextInput: any): Set<string> => {
    const keys = new Set<string>();
    /** Inserisce nel set solo identita normalizzate non vuote. */
    const add = (value: unknown) => {
        const normalized = normalizeIdentity(value);
        if (normalized) keys.add(normalized);
    };

    const userContextSafe = userContextInput ?? {};
    const details = userContextSafe?.details ?? {};
    const claims = userContextSafe?.claims ?? userContextSafe?.user?.claims ?? {};
    const security = userContextSafe?.security ?? {};

    add(claims?._id);
    add(claims?.username);
    add(security?._id);
    add(security?.username);
    add(details?._id);
    add(details?.username);
    add(details?.nome);
    add(details?.cognome);
    add(`${normalizeText(details?.nome)} ${normalizeText(details?.cognome)}`.trim());

    return keys;
};

/** Converte il preset UI di sorting nei campi payload richiesti dall'API lista note. */
export const parseSortPreset = (
    value: SortPresetValue
): { profilazioneSortField: SortField; profilazioneSortDirection: SortDirection } => {
    const [fieldRaw, directionRaw] = String(value ?? "").split(":");
    const field = normalizeText(fieldRaw) as SortField;
    const direction = normalizeText(directionRaw) as SortDirection;

    if (!field || (direction !== "asc" && direction !== "desc")) {
        return {
            profilazioneSortField: "DATA_NOTA",
            profilazioneSortDirection: "desc",
        };
    }

    return {
        profilazioneSortField: field,
        profilazioneSortDirection: direction,
    };
};

/** Normalizza date lista note per rendering consistente nel manager. */
export const normalizeListRows = (rows: any[]): any[] =>
    rows.map((row) => ({
        ...row,
        DATA_NOTA: formatDateFromYYYYMMDD(row?.DATA_NOTA),
        ULTIMA_MODIFICA: formatDateFromYYYYMMDD(row?.ULTIMA_MODIFICA),
    }));

/** Unisce storico dettaglio con storico precedente per preservare label mancanti. */
const mergeDiscussionHistory = (previousHistoryInput: any[], detailItem: any): any[] => {
    const nextHistory = extractHistoryRows(detailItem);
    if (!nextHistory.length) return nextHistory;

    const previousHistory = Array.isArray(previousHistoryInput) ? previousHistoryInput : [];
    if (!previousHistory.length) return nextHistory;

    const usedPreviousIndexes = new Set<number>();

    return nextHistory.map((entry, index) => {
        const entryKey = buildHistoryEntryMatchKey(entry);
        let fallbackEntry: any = null;

        if (entryKey !== "||") {
            for (let previousIndex = 0; previousIndex < previousHistory.length; previousIndex += 1) {
                if (usedPreviousIndexes.has(previousIndex)) continue;
                const previousEntry = previousHistory[previousIndex];
                if (buildHistoryEntryMatchKey(previousEntry) !== entryKey) continue;
                fallbackEntry = previousEntry;
                usedPreviousIndexes.add(previousIndex);
                break;
            }
        }

        if (!fallbackEntry && index < previousHistory.length && !usedPreviousIndexes.has(index)) {
            fallbackEntry = previousHistory[index];
            usedPreviousIndexes.add(index);
        }

        return enrichHistoryEntryWithFallbackLabel(entry, fallbackEntry);
    });
};

/** Costruisce lo stato discussione a partire dalla riga selezionata in lista. */
export const buildDiscussionStateFromRow = (row: any): DiscussionState => {
    const history = extractHistoryRows(row);
    const ownerUserId = extractOriginalNoteOwnerId(row, "");
    const ownerLabel = firstNonEmptyText(
        extractOriginalNoteOwnerLabel(row, ""),
        findHistoryUserLabelById(history, ownerUserId),
        ownerUserId,
        "-"
    );

    return {
        noteId: extractNoteId(row),
        customerCode: extractCustomerCode(row),
        customerLabel: extractCustomerLabel(row),
        noteText: extractNoteText(row),
        noteTypeCode: extractNoteTypeCode(row),
        noteTypeLabel: extractNoteTypeLabel(row),
        ownerLabel,
        history,
        sourceRow: row,
    };
};

/** Merge del dettaglio nota dentro lo stato discussione corrente (con fallback robusti). */
export const mergeDetailInDiscussion = (current: DiscussionState, detailItem: any): DiscussionState => {
    const previousHistory = Array.isArray(current.history) ? current.history : [];
    const mergedHistory = mergeDiscussionHistory(previousHistory, detailItem);
    const ownerUserId = extractOriginalNoteOwnerId(
        detailItem,
        extractOriginalNoteOwnerId(current.sourceRow, "")
    );
    const fallbackCurrentLabel = ownerUserId ? "" : current.ownerLabel;
    const ownerLabel = firstNonEmptyText(
        extractOriginalNoteOwnerLabel(detailItem, ""),
        extractOriginalNoteOwnerLabel(current.sourceRow, ""),
        findHistoryUserLabelById(mergedHistory, ownerUserId),
        findHistoryUserLabelById(previousHistory, ownerUserId),
        fallbackCurrentLabel,
        ownerUserId,
        "-"
    );

    return {
        ...current,
        noteText: normalizeText(detailItem?.Nota || detailItem?.nota || current.noteText),
        noteTypeCode: normalizeText(
            detailItem?.Tipologia?.Codice ||
                detailItem?.Tipologia?.codice ||
                detailItem?.TIPO_NOTA ||
                current.noteTypeCode
        ),
        noteTypeLabel: normalizeText(
            detailItem?.Tipologia?.Descrizione ||
                detailItem?.Tipologia?.descrizione ||
                detailItem?.TIPO_NOTA ||
                current.noteTypeLabel
        ),
        ownerLabel,
        history: mergedHistory,
        sourceRow: {
            ...(current.sourceRow || {}),
            ...(detailItem || {}),
        },
    };
};

/** Verifica ownership di un entry storico rispetto all'identita del richiedente. */
export const isEntryOwnedByRequester = (entry: any, requesterIdentityKeys: Set<string>): boolean => {
    const ownerCandidates = [
        extractHistoryEntryUserId(entry),
        entry?.historyUserId,
        entry?.modificaUserId,
        entry?.userId,
        entry?.UserId,
    ]
        .map((value) => normalizeIdentity(value))
        .filter((value) => value.length > 0);

    if (!ownerCandidates.length) return false;
    return ownerCandidates.some((value) => requesterIdentityKeys.has(value));
};
