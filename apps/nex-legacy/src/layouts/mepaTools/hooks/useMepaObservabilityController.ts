import { MutableRefObject, useCallback, useEffect, useRef, useState } from "react";
import { enqueueSnackbar } from "components/MessageBox";
import {
    bootstrapMepaProductRagIndex,
    getMepaEmbeddingHealth,
    getMepaProductRagControlPlane,
    getMepaRagStats,
    getMepaVespaHealth,
    runNextMepaProductIndexJobs,
    syncMepaTenderChunksToVespa,
} from "../fetchData/mepaAi";
import type { MepaProductRagControlPlane, MepaRagStats } from "../types";

type ProductRagBootstrapMode = "PRODUCTS_FIRST" | "FOCELDA_ONLY" | "SUPPLIERS_ONLY" | "GOVERNED_ICECAT" | "PRODUCTS_AND_GOVERNED_ICECAT";

type UseMepaObservabilityControllerParams = {
    abortController: MutableRefObject<AbortController | null>;
    tenderId?: string | null;
    setLoading: (loading: string | null) => void;
};

/**
 * Coordinates MEPA AI observability data and RAG maintenance actions.
 *
 * Health checks and indexing actions are intentionally isolated from the page
 * container because they are operational concerns, not rendering concerns. The
 * hook also ignores stale responses to avoid showing health data from a tender
 * that is no longer selected.
 */
export function useMepaObservabilityController({ abortController, tenderId, setLoading }: UseMepaObservabilityControllerParams) {
    // Monotonic request sequence used to drop stale health/read-model responses.
    const requestSeqRef = useRef(0);

    // Tender-level RAG statistics: indexed chunks, provider coverage and usage metadata.
    const [ragStats, setRagStats] = useState<MepaRagStats | null>(null);

    // Human-readable Vespa health line shown in the Observability tab.
    const [vespaStatus, setVespaStatus] = useState<string>("Vespa non verificato");

    // Human-readable embedding service health line.
    const [embeddingStatus, setEmbeddingStatus] = useState<string>("Embedding: non verificato");

    // Product RAG control plane summary: bootstrap/indexing jobs and queue status.
    const [productRagControlPlane, setProductRagControlPlane] = useState<MepaProductRagControlPlane | null>(null);

    /** Clears all observability read models and invalidates in-flight checks. */
    const resetObservabilityState = useCallback(() => {
        requestSeqRef.current += 1;
        setRagStats(null);
        setVespaStatus("Vespa non verificato");
        setEmbeddingStatus("Embedding: non verificato");
        setProductRagControlPlane(null);
    }, []);

    // Observability data is tender-scoped; reset it on tender switch to avoid
    // showing health/statistics belonging to a previous workspace.
    useEffect(() => {
        resetObservabilityState();
    }, [tenderId, resetObservabilityState]);

    /**
     * Loads all observability cards in parallel.
     *
     * Independent health checks use allSettled so a temporary Vespa failure does
     * not hide embedding/RAG stats or product indexing information.
     */
    const loadObservability = useCallback(async () => {
        if (!tenderId) return;
        const requestSeq = ++requestSeqRef.current;
        try {
            setLoading("observability");
            const [vespa, embedding, stats, productControl] = await Promise.allSettled([
                getMepaVespaHealth({ abortController }),
                getMepaEmbeddingHealth({ abortController }),
                getMepaRagStats({ abortController, tenderId }),
                getMepaProductRagControlPlane({ abortController, limit: 8 }),
            ]);

            if (requestSeq !== requestSeqRef.current) return;
            if (vespa.status === "fulfilled") {
                setVespaStatus(vespa.value?.data?.ok ? `Vespa attivo: ${vespa.value?.data?.endpoint}` : `Vespa non attivo: ${vespa.value?.data?.details ?? "disabled"}`);
            }
            if (embedding.status === "fulfilled") {
                const data = embedding.value?.data ?? {};
                setEmbeddingStatus(`Embedding ${data.enabled ? "ON" : "OFF"} · vector ${data.vectorSearchEnabled ? "ON" : "OFF"} · ${data.model ?? "—"} · dim ${data.dimensions ?? "—"}`);
            }
            if (stats.status === "fulfilled") setRagStats(stats.value?.data ?? null);
            if (productControl.status === "fulfilled") setProductRagControlPlane(productControl.value?.data ?? null);
        } catch (error) {
            console.error(error);
        } finally {
            if (requestSeq === requestSeqRef.current) setLoading(null);
        }
    }, [abortController, tenderId, setLoading]);

    /** Pushes the selected tender chunks to Vespa and refreshes health afterwards. */
    const syncTenderVespa = useCallback(async () => {
        if (!tenderId) return;
        try {
            setLoading("vespa-sync");
            const res = await syncMepaTenderChunksToVespa({ abortController, tenderId, limit: 500 });
            setVespaStatus(`Sync documenti: ${res?.data?.fed ?? 0}/${res?.data?.attempted ?? 0} chunk alimentati`);
            await loadObservability();
        } catch (error) {
            console.error(error);
            setVespaStatus("Sync documenti verso Vespa non riuscita");
        } finally {
            setLoading(null);
        }
    }, [abortController, tenderId, loadObservability, setLoading]);

    /** Creates product RAG indexing jobs using the selected bootstrap strategy. */
    const bootstrapProductRag = useCallback(async (mode: ProductRagBootstrapMode = "PRODUCTS_FIRST") => {
        try {
            setLoading("product-rag-bootstrap");
            const res = await bootstrapMepaProductRagIndex({
                abortController,
                mode,
                runImmediately: true,
                maxBatchesPerJob: 1,
                batchSize: 100,
                productsMaxItems: mode === "GOVERNED_ICECAT" ? undefined : 5000,
                icecatMaxItems: 1000,
            });
            const jobs = res?.data?.jobs?.length ?? 0;
            const warnings = res?.data?.warnings ?? [];
            enqueueSnackbar?.(warnings.length ? warnings[0] : `Bootstrap RAG prodotti creato (${jobs} job).`, { variant: warnings.length ? "warning" : "success" } as any);
            await loadObservability();
        } catch (error) {
            console.error(error);
            enqueueSnackbar?.("Bootstrap RAG prodotti non riuscito o capability mancante.", { variant: "error" } as any);
        } finally {
            setLoading(null);
        }
    }, [abortController, loadObservability, setLoading]);

    /** Runs a bounded amount of queued product indexing work from the UI. */
    const runNextProductIndexJobs = useCallback(async () => {
        try {
            setLoading("product-rag-run-next");
            const res = await runNextMepaProductIndexJobs({ abortController, maxJobs: 1, maxBatchesPerJob: 3 });
            enqueueSnackbar?.(`Indicizzazione prodotti: ${res?.data?.processedJobs ?? 0} job processati.`, { variant: "success" } as any);
            await loadObservability();
        } catch (error) {
            console.error(error);
            enqueueSnackbar?.("Run-next indicizzazione prodotti non riuscito.", { variant: "error" } as any);
        } finally {
            setLoading(null);
        }
    }, [abortController, loadObservability, setLoading]);

    return {
        ragStats,
        vespaStatus,
        embeddingStatus,
        productRagControlPlane,
        resetObservabilityState,
        loadObservability,
        syncTenderVespa,
        bootstrapProductRag,
        runNextProductIndexJobs,
    };
}
