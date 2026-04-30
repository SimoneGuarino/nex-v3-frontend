// examples/productDetails/fetchData/variationData.ts
import { FetchData } from "examples/Fetch";
import type { ProductVariationHistoryDTO } from "../types/productVariation";

type FetchProductVariationParams = {
    productId: string;
    distributorName?: string;
    from?: string;
    to?: string;
    limit?: number;
    abortController: AbortController;
};

export async function ProductVariationHistoryAPI(
    params: FetchProductVariationParams
): Promise<ProductVariationHistoryDTO | null> {
    const {
        productId,
        distributorName,
        from,
        to,
        limit,
        abortController,
    } = params;

    if (!productId) return null;

    const query = new URLSearchParams();
    if (distributorName) query.set("distributor", distributorName);
    if (from) query.set("from", from);
    if (to) query.set("to", to);
    if (typeof limit === "number") query.set("limit", String(limit));

    const base = import.meta.env.VITE_API_SEARCH_ENDPOINT ?? "";
    const url =
        `${base}v1/products/${productId}/variance-history` +
        (query.toString() ? `?${query.toString()}` : "");

    try {
        const response = await FetchData<ProductVariationHistoryDTO>(
            url,
            "GET",
            null,
            abortController
        );

        if (!response) {
            return null;
        }

        if (!Array.isArray(response.suppliers)) {
            console.warn(
                "ProductVariationHistoryAPI: suppliers non è un array",
                response
            );
            return null;
        }

        return response;
    } catch (error) {
        console.error("ProductVariationHistoryAPI errore:", error);
        return null;
    }
}
