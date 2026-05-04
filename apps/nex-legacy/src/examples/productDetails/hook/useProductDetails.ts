import { MutableRefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ProductDetailsDTO,
    ProductDetailsApiResponse,
    mapProductDetailsHitToDTO,
} from "../types/product";
import { ProductDetailsAPI } from "../fetchData/productDetails";
import { ProductVariationHistoryDTO } from "../types/productVariation";
import { ProductVariationHistoryAPI } from "../fetchData/variationData";

import { useUserContext } from "context/UserContext";
import { CheckAdminPermissions } from "utils";


// ——————————————————————————————————————————————————————————
// TYPES
// ——————————————————————————————————————————————————————————
export type VariationRange = "30d" | "90d" | "all";


// ——————————————————————————————————————————————————————————
// UTILS
// ——————————————————————————————————————————————————————————
const computeRangeDates = (range: VariationRange) => {
    const now = new Date();
    if (range === "30d") {
        const from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return { from: from.toISOString(), to: undefined as string | undefined };
    }
    if (range === "90d") {
        const from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        return { from: from.toISOString(), to: undefined as string | undefined };
    }
    return { from: undefined, to: undefined };
};

export const formatMoney = (val?: number, currency = "€") => {
    if (val === undefined || val === null || Number.isNaN(val)) return "-";
    return (
        val.toLocaleString("it-IT", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }) + ` ${currency}`
    );
};


// ——————————————————————————————————————————————————————————
// HOOK
// ——————————————————————————————————————————————————————————
const PRODUCT_DETAILS_CACHE_MAX = 10;
const productDetailsCache = new Map<string, ProductDetailsDTO>();
const productDetailsInflight = new Map<string, Promise<ProductDetailsDTO | null>>();

const getCachedProductDetails = (id: string): ProductDetailsDTO | null => {
    const cached = productDetailsCache.get(id) ?? null;
    if (!cached) return null;

    // Touch in stile LRU
    productDetailsCache.delete(id);
    productDetailsCache.set(id, cached);
    return cached;
};

const setCachedProductDetails = (id: string, product: ProductDetailsDTO) => {
    if (productDetailsCache.has(id)) {
        productDetailsCache.delete(id);
    }
    productDetailsCache.set(id, product);

    if (productDetailsCache.size > PRODUCT_DETAILS_CACHE_MAX) {
        const oldestKey = productDetailsCache.keys().next().value as
            | string
            | undefined;
        if (oldestKey) productDetailsCache.delete(oldestKey);
    }
};

const fetchProductDetailsShared = async (
    id: string,
    abortController?: MutableRefObject<AbortController | null>
): Promise<ProductDetailsDTO | null> => {
    const cached = getCachedProductDetails(id);
    if (cached) return cached;

    const inflight = productDetailsInflight.get(id);
    if (inflight) return inflight;

    const requestPromise = (async () => {
        console.log(`Fetching details for product ${id} with abortController:`, abortController);
        const data: ProductDetailsApiResponse | undefined =
            await ProductDetailsAPI({
                abortController: abortController ?? undefined,
                ChangeLoadStatus: () => { },
                id_product: id,
            });

        if (!data?.items?.length) {
            return null;
        }

        const hit = data.items[0];
        const mapped = mapProductDetailsHitToDTO(hit);
        setCachedProductDetails(id, mapped);
        return mapped;
    })();

    productDetailsInflight.set(id, requestPromise);

    try {
        return await requestPromise;
    } finally {
        productDetailsInflight.delete(id);
    }
};

export const useProductDetails = (productId: string | null, abortController?: MutableRefObject<AbortController | null>) => {
    const [product, setProduct] = useState<ProductDetailsDTO | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [variationHistory, setVariationHistory] =
        useState<ProductVariationHistoryDTO | null>(null);
    const [isVariationLoading, setIsVariationLoading] = useState(false);
    const [variationError, setVariationError] = useState<string | null>(null);

    const [variationRange, setVariationRange] =
        useState<VariationRange>("30d");

    // selezione fornitore centralizzata nell'hook
    const [selectedSupplier, setSelectedSupplier] = useState<string | null>(
        null
    );

    // Abort controller per lo storico
    const variationAbortRef = useRef<AbortController | null>(null);
    const loadProductSeqRef = useRef(0);

    const [userState] = useUserContext();

    const canSeePrices = useMemo(() => {
        return CheckAdminPermissions({
            userRole: userState?.details?.ruolo ?? "N/A",
            permissions: userState?.details?.permissions,
            rolesToCheck: [0, 1, 2],
            panelToCheck: "dettagli_quotazione",
        });
    }, [userState]);

    // ---------------------------
    // DETTAGLI PRODOTTO
    // ---------------------------
    const loadProduct = useCallback(async () => {
        const requestSeq = ++loadProductSeqRef.current;

        if (!productId) {
            setProduct(null);
            setError(null);
            setIsLoading(false);
            return;
        }

        const cached = getCachedProductDetails(productId);
        if (cached) {
            setProduct(cached);
            setError(null);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const mapped = await fetchProductDetailsShared(productId, abortController);
            if (loadProductSeqRef.current !== requestSeq) return;

            if (!mapped) {
                setProduct(null);
                setError("Nessun dettaglio prodotto trovato.");
                return;
            }

            setProduct(mapped);
            setError(null);
        } catch (err) {
            if (loadProductSeqRef.current !== requestSeq) return;
            console.error("Errore nel fetch dei dettagli prodotto", err);
            setError("Errore nel recupero dei dettagli prodotto.");
            setProduct(null);
        } finally {
            if (loadProductSeqRef.current === requestSeq) {
                setIsLoading(false);
            }
        }
    }, [productId, abortController]);

    useEffect(() => {
        void loadProduct();
    }, [loadProduct]);

    // Quando cambia prodotto, resettiamo storico + range + fornitore
    useEffect(() => {
        setVariationHistory(null);
        setVariationError(null);
        setVariationRange("30d");
        setSelectedSupplier(null);
    }, [productId]);

    // ---------------------------
    // STORICO FORNITORI
    // ---------------------------
    const loadVariationHistory = useCallback(
        async (supplierName?: string | null) => {
            if (!productId || !canSeePrices) {
                setVariationHistory(null);
                setVariationError(null);
                return;
            }

            // Abort richiesta precedente
            if (variationAbortRef.current) {
                variationAbortRef.current.abort();
            }
            const controller = new AbortController();
            variationAbortRef.current = controller;

            setIsVariationLoading(true);
            setVariationError(null);

            try {
                const { from, to } = computeRangeDates(variationRange);

                // Limite per singolo fornitore
                let limit: number | undefined;
                if (variationRange === "30d") limit = 800;
                else if (variationRange === "90d") limit = 1500;
                else limit = 3000;

                const data = await ProductVariationHistoryAPI({
                    productId,
                    distributorName: supplierName ?? undefined, // 👈 solo se passato
                    from,
                    to,
                    limit,
                    abortController: controller,
                });

                if (!data) {
                    setVariationHistory(null);
                    setVariationError(
                        "Nessuna variazione trovata per questo prodotto."
                    );
                    return;
                }

                setVariationHistory(data);
            } catch (err: any) {
                if (err?.name === "AbortError") return;
                console.error(
                    "Errore nel fetch dello storico fornitori",
                    err
                );
                setVariationHistory(null);
                setVariationError(
                    "Errore nel recupero delle variazioni fornitore."
                );
            } finally {
                setIsVariationLoading(false);
            }
        },
        [productId, canSeePrices, variationRange]
    );

    // Imposta automaticamente il primo fornitore come selezionato
    // e carica il relativo storico quando il prodotto è pronto
    useEffect(() => {
        if (!product || !canSeePrices) return;

        const suppliers = (product.suppliers ?? []) as {
            name?: string;
        }[];

        if (!suppliers.length) {
            setSelectedSupplier(null);
            return;
        }

        // se non c'è ancora un fornitore selezionato, prendi il primo
        if (!selectedSupplier) {
            const firstName = suppliers[0].name ?? null;
            setSelectedSupplier(firstName);
            if (firstName) {
                void loadVariationHistory(firstName);
            }
        }
    }, [product, canSeePrices, selectedSupplier, loadVariationHistory]);

    // Quando cambia il range (30/90/Tutto) ricarichiamo lo storico
    useEffect(() => {
        if (!canSeePrices || !selectedSupplier) return;
        void loadVariationHistory(selectedSupplier);
    }, [variationRange, selectedSupplier, canSeePrices, loadVariationHistory]);

    // Funzione che userai nel click sulla lista fornitori
    const selectSupplier = useCallback(
        (supplierName: string) => {
            setSelectedSupplier(supplierName);
            if (!canSeePrices) return;
            //void loadVariationHistory(supplierName);
        },
        [canSeePrices]
    );


    // ---------------------------
    // API esposta all'esterno
    // ---------------------------
    return {
        product,
        isLoading,
        error,
        reload: () => {
            void loadProduct();
            if (selectedSupplier) {
                void loadVariationHistory(selectedSupplier);
            }
        },

        // permessi
        canSeePrices,

        // storico fornitore selezionato
        variationHistory,
        isVariationLoading,
        variationError,
        reloadVariation: () => {
            if (selectedSupplier) {
                void loadVariationHistory(selectedSupplier);
            }
        },

        variationRange,
        setVariationRange,

        selectedSupplier,
        selectSupplier,
    };
};
