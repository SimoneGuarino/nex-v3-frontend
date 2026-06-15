// src/layouts/sellout/fetchdata/download.ts
import type { MutableRefObject } from "react";
import {
    FetchFileData,
    type AbortRef,
} from "examples/Fetch/FetchFileDataV2";

function trimTrailingSlash(s: string): string {
    return s.replace(/\/+$/, "");
}

function getBase(): string {
    // nuovo backend (Drive/Node) – usato per i file Mongo
    const raw = import.meta.env.VITE_API_PDF_READER || "";
    return trimTrailingSlash(raw);
}

function getLegacyBase(): string {
    // base del PHP legacy – usato per i file MariaDB
    const raw = import.meta.env.VITE_API_MARIA_MACHINE || "";
    return trimTrailingSlash(raw);
}

function isObjectIdLike(v: string): boolean {
    return /^[0-9a-fA-F]{24}$/.test(v);
}

function isNumericId(id: unknown): id is number | `${number}` {
    if (typeof id === "number") return Number.isFinite(id);
    if (typeof id === "string") return /^\d+$/.test(id.trim());
    return false;
}

/**
 * Scarica il blob dal NUOVO endpoint (solo per id ObjectId/Mongo).
 * Per gli id numerici (MariaDB) usa triggerSelloutDownload che apre l'URL legacy.
 */
export async function fetchSelloutDownloadBlob(
    id: string,
    abortRef: MutableRefObject<AbortController | null>
): Promise<{ blob: Blob; filename: string; contentType: string }> {
    if (!id || !isObjectIdLike(id)) {
        throw new Error("fetchSelloutDownloadBlob è pensata per id Mongo (ObjectId).");
    }

    const url = `${getBase()}/sellout/download/${encodeURIComponent(id)}`;

    const res = await FetchFileData(url, {
        method: "GET",
        responseType: "blob",
        abortRef: abortRef as AbortRef,
    });

    if (res.kind === "json") {
        const err =
            typeof res.json === "object" && res.json && "error" in (res.json as any)
                ? String((res.json as any).error)
                : "Risposta inattesa (JSON) dal server";
        throw new Error(err);
    }

    return {
        blob: res.blob,
        filename: res.filename || `sellout_file_${id}`,
        contentType: res.contentType,
    };
}

/**
 * Trigger del download:
 * - id numerico  -> apre URL legacy PHP (nessun XHR, niente CORS).
 * - id ObjectId  -> usa API nuova e scarica blob.
 */
export async function triggerSelloutDownload(
    id: number | string,
    abortRef: MutableRefObject<AbortController | null>
): Promise<void> {
    // caso MariaDB: id numerico -> URL legacy PHP
    if (isNumericId(id)) {
        const base = getLegacyBase();
        if (!base) {
            console.warn(
                "VITE_API_MARIA_MACHINE non configurata: impossibile usare l'endpoint legacy."
            );
            return;
        }
        const url = `${base}/Vari/Gestione_Sellout/Visualizzafilesell.php?download=${encodeURIComponent(
            String(id)
        )}`;

        // Apri direttamente il link (evita CORS e lascia gli header al server legacy)
        const a = document.createElement("a");
        a.href = url;
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        a.remove();
        return;
    }

    // caso Mongo: ObjectId -> usa API nuova e scarica blob
    const s = String(id).trim();
    if (!isObjectIdLike(s)) {
        console.warn("id non riconosciuto come numerico o ObjectId:", id);
        return;
    }

    const { blob, filename } = await fetchSelloutDownloadBlob(s, abortRef);
    const href = URL.createObjectURL(blob);
    try {
        const a = document.createElement("a");
        a.href = href;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
    } finally {
        URL.revokeObjectURL(href);
    }
}
