import { enqueueSnackbar } from "components/MessageBox";
import { FetchData } from "examples/Fetch";
import { ChangeLoadStatusArgs } from "layouts/quotazioni/types/quotations";

export type QuotationOkLinkItemDTO = {
    _id: string;
    product_id?: string | null;
    quantita?: number | null;
    codice_buyer?: string | null;
    approvato?: boolean;
    dettagli_prodotto?: {
        codiceProduttore?: string | null;
        codiceEAN?: string | null;
        descrizione?: string | null;
        anteprima?: string | null;
        marca?: string | null;
        linea?: string | null;
        gruppo?: string | null;
        famiglia?: string | null;
        descrizioneLinea?: string | null;
        descrizioneGruppo?: string | null;
        descrizioneFamiglia?: string | null;
    };
    quotazione?: {
        stato?: string | null;
        prezzo_base?: number | null;
        sconto_percentuale?: number | null;
        prezzo_finale?: number | null;
        validita_offerta?: string | null;
        scadenza?: string | null;
    };
    final_ok_link?: {
        oc?: string | null;
        fb?: string | null;
        linked_at?: string | null;
        linked_by?: string | null;
    };
    derivedFromAcceptedCounterproposal?: boolean;
    originalProductLabel?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
};

export type GetQuotationOkLinksResponse = {
    data: QuotationOkLinkItemDTO[];
    meta?: {
        quotationId?: string;
        quotationState?: string;
        total?: number;
    };
};

type GetQuotationOkLinksAPIProps = {
    abortController: AbortController;
    quotationId: string;
    ChangeLoadStatus: ({ from, bool }: ChangeLoadStatusArgs) => void;
};

export async function GetQuotationOkLinksAPI({
    abortController,
    quotationId,
    ChangeLoadStatus,
}: GetQuotationOkLinksAPIProps): Promise<GetQuotationOkLinksResponse | undefined> {
    try {
        ChangeLoadStatus({ from: "get_quotation_ok_links", bool: true });

        const base = import.meta.env.VITE_API_ORDER ?? "";
        const url = new URL(`${base}quotations/get/${quotationId}/ok-links`);

        const res = await FetchData(
            url.toString(),
            "GET",
            null,
            abortController
        );

        if (!res || !Array.isArray(res.data)) {
            throw new Error("Risposta dal server non valida");
        }

        return res as GetQuotationOkLinksResponse;
    } catch (err: unknown) {
        const e = err as { name?: string; message?: any };

        if (e?.name !== "AbortError") {
            const backendMsg =
                typeof e?.message === "string"
                    ? e.message
                    : e?.message?.msg || "Errore nel recupero dei collegamenti OC/FB della quotazione.";

            console.error("[GetQuotationOkLinksAPI] error:", err);

            enqueueSnackbar(backendMsg, {
                title: "Ops..",
                type: "error",
            });
        }
    } finally {
        ChangeLoadStatus({ from: "get_quotation_ok_links", bool: false });
    }
}