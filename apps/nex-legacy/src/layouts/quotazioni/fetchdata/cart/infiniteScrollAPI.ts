// src/layouts/quotazioni/agents/fetchdata/cart/infiniteScrollAPI.ts
import { FetchData } from "examples/Fetch";
import type { MutableRefObject } from "react";
import type { UserState } from "types/UserContext";
import {
    type ProductsListResponseDTO,
} from "layouts/quotazioni/types/products_list";

/* tipologie locali */
type AbortLike = MutableRefObject<AbortController | null> | AbortController;

export interface InfiniteScrollProps {
    user?: UserState | null;
    quotationId: string;
    ofs: number; // offset assoluto (multipli di 50)
    abortController: AbortLike;
}

/**
 * Carica una pagina (50 elementi) dalla rotta:
 * GET /quotations/:id/products-list?ofs=<ofs>&agenteId=<id>
 * NOTE: non tocca alcun loader globale, lascia gestire al caller.
 */
export async function InfiniteScrollAPI({
    user,
    quotationId,
    ofs,
    abortController,
}: InfiniteScrollProps): Promise<ProductsListResponseDTO> {
    const getAgenteId = (u?: UserState | null) => {
        const d: any = u?.details ?? {};
        const id = d?._id ?? d?.id;
        return typeof id === "string" && id.trim() ? id.trim() : undefined;
    };

    if (!(typeof quotationId === "string" && /^[0-9a-fA-F]{24}$/.test(quotationId))) {
        throw new Error("id quotazione non valido.");
    };

    const base = import.meta.env.VITE_API_PRODUCTS;

    const url = new URL(`${base}quotations/${quotationId}/products-list`);
    url.searchParams.set("ofs", String(Math.max(0, ofs | 0)));

    const agenteId = getAgenteId(user);
    if (agenteId) url.searchParams.set("agenteId", agenteId);

    // non toccare loadStatus qui: lasciamo la tabella montata
    const res = await FetchData<ProductsListResponseDTO>(
        url.toString(),
        "GET",
        null,
        abortController
    );

    if (!res?.success || !Array.isArray(res?.data)) {
        throw new Error("risposta non valida dal server durante il recupero prodotti.");
    }
    return res;
}