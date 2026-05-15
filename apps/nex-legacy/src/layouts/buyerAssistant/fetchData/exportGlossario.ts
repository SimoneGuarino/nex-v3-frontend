import { enqueueSnackbar } from "components/MessageBox";
import { FetchFileData, type AbortRef } from "examples/Fetch/FetchFileDataV2";


// ——————————————————————————————————————————————————————————
// TYPES & INTERFACE
// ——————————————————————————————————————————————————————————
export type GlossarioExportFormat = "csv" | "xlsx";

type ChangeLoadStatusArgs = { from: string; bool: boolean };

interface ExportGlossarioProps {
    format?: GlossarioExportFormat;
    abortRef?: AbortRef;
    ChangeLoadStatus?: (args: ChangeLoadStatusArgs) => void;
    setErr?: (value: boolean) => void;
};


// ——————————————————————————————————————————————————————————
// API CALLS
// ——————————————————————————————————————————————————————————
/**
 * esporta il glossario del buyer assistant
 * @param format - formato ('csv' | 'xlsx')
 * @param abortRef - optional abort reference for the request
 * @param ChangeLoadStatus - optional callback to toggle loading states
 * @param setErr - optional setter for error flag
 * @returns Promise<boolean> - true on success, false on failure/abort
 * Endpoint: POST /noPromo/exportGlossario?format=csv|xlsx
 */
export function ExportGlossarioAPI({
    format = "csv",
    abortRef,
    ChangeLoadStatus,
    setErr,
}: ExportGlossarioProps): Promise<boolean> {
    const from = "export_glossario";
    const url = `${import.meta.env.VITE_API_PRODUCTS}noPromo/exportGlossario?format=${format}`;

    ChangeLoadStatus?.({ from, bool: true });

    return FetchFileData(url, {
        method: "POST",
        body: JSON.stringify({ format }),
        headers: {
            "Content-Type": "application/json",
        },
        abortRef,
        responseType: "blob",
    })
        .then((res) => {
            if (res.kind !== "blob") {
                const msg =
                    ((res as any)?.json?.msg as string) ||
                    "Risposta inattesa dal server durante l'export glossario.";
                throw new Error(msg);
            }

            const fallbackName = `buyer-assistant-glossario.${format}`;
            const filename = res.filename || fallbackName;
            const blobUrl = window.URL.createObjectURL(res.blob);

            const link = document.createElement("a");
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(blobUrl);

            return true;
        })
        .catch((error: any) => {
            if (error?.name === "AbortError") {
                return false;
            }

            console.error(error);
            const msg =
                (error && (error.msg || error.message)) ||
                "Sembra che ci sia stato un problema durante l'export del glossario, perfavore contatta un tecnico.";
            enqueueSnackbar(msg, { title: "Ops..", type: "error" });
            setErr?.(true);
            return false;
        })
        .finally(() => {
            ChangeLoadStatus?.({ from, bool: false });
        });
};