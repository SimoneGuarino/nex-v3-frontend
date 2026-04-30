//src\layouts\sellout\fetchdata\uploadCsv.ts
import type { MutableRefObject } from "react";
import {
    FetchFileData,
    type AbortRef,
    type JSONValue,
    type FetchFileResult,
} from "examples/Fetch/FetchFileDataV2";

export interface UploadCsvResponse {
    ok: boolean;
    id?: string;
    saved?: string;     // percorso relativo salvato (ritornato dalla rotta BE)
    message?: string;
    error?: string;
}

function getBase(): string {
    const raw = import.meta.env.VITE_API_PDF_READER || "";
    return raw.replace(/\/+$/, "");
}

function isObjectIdLike(v: string): boolean {
    return /^[0-9a-fA-F]{24}$/.test(String(v || "").trim());
}

/** Converte sia AbortController che MutableRefObject in AbortRef (per FetchFileDataV2) */
function toAbortRef(
    abortLike?: MutableRefObject<AbortController | null> | AbortController | null
): AbortRef | undefined {
    if (!abortLike) return undefined;
    if (typeof (abortLike as any)?.current !== "undefined") {
        return abortLike as MutableRefObject<AbortController | null>;
    }
    return { current: abortLike as AbortController };
}

/**
 * POST {BASE}/sellout/upload-csv/:id
 * - Campo form: "file"
 * - Il BE valida: stato === "Bocciato", nome == basename(filepath), salva *_MOD.csv
 */
export async function uploadAlternativeCsv(
    id: string,
    file: File,
    abortLike?: MutableRefObject<AbortController | null> | AbortController | null
): Promise<UploadCsvResponse> {
    if (!isObjectIdLike(id)) {
        return { ok: false, error: "id non valido (atteso ObjectId Mongo)" };
    }
    if (!(file instanceof File)) {
        return { ok: false, error: "file mancante o non valido" };
    }
    // check veloce client-side (il BE comunque ricontrolla)
    const name = file.name || "";
    if (!name.toLowerCase().endsWith(".csv")) {
        return { ok: false, error: "Sono accettati solo file .csv" };
    }

    const url = `${getBase()}/sellout/upload-csv/${encodeURIComponent(id)}`;
    const form = new FormData();
    form.append("file", file, file.name);

    const res = await FetchFileData<UploadCsvResponse>(url, {
        method: "POST",
        body: form,
        abortRef: toAbortRef(abortLike),
        // niente headers: FormData gestisce il boundary; Auth la mette FetchFileDataV2
        responseType: "auto",
    });

    // La rotta dovrebbe tornare JSON; in caso di blob, segnaliamo errore imprevisto
    if (res.kind === "blob") {
        return {
            ok: false,
            error: `Risposta inattesa (blob: ${res.contentType})`,
        };
    }

    const j = res.json as any;
    return {
        ok: Boolean(j?.ok),
        id: j?.id,
        saved: j?.saved,
        message: j?.message,
        error: j?.error,
    };
}
