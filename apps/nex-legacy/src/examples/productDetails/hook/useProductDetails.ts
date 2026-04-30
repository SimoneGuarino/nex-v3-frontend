import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
export const useProductDetails = (productId: string | null) => {
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
        if (!productId) {
            setProduct(null);
            setError(null);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const abortController = new AbortController();

            const data: ProductDetailsApiResponse | undefined =
                await ProductDetailsAPI({
                    abortController,
                    ChangeLoadStatus: () => { },
                    id_product: productId,
                });

            if (!data?.items?.length) {
                setProduct(null);
                setError("Nessun dettaglio prodotto trovato.");
                return;
            }

            const hit = data.items[0];
            const mapped = mapProductDetailsHitToDTO(hit);
            setProduct(mapped);
        } catch (err) {
            console.error("Errore nel fetch dei dettagli prodotto", err);
            setError("Errore nel recupero dei dettagli prodotto.");
            setProduct(null);
        } finally {
            setIsLoading(false);
        }
    }, [productId]);

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
        [canSeePrices, loadVariationHistory]
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
