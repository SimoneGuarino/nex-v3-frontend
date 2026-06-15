import { MutableRefObject, useCallback, useEffect, useRef, useState } from "react";
import { enqueueSnackbar } from "components/MessageBox";
import { getMepaDossierQuality, getMepaDossierReport } from "../fetchData/mepaAi";
import type { MepaDossierOperationalReport, MepaDossierQualityReport } from "../types";

type UseMepaDossierControllerParams = {
    abortController: MutableRefObject<AbortController | null>;
    tenderId?: string | null;
    setLoading: (loading: string | null) => void;
};

/**
 * Owns the dossier read-model lifecycle for the selected MEPA tender.
 *
 * Dossier generation can be comparatively expensive because it combines
 * operational synthesis and quality/evidence coverage. The hook isolates the
 * side effects from the page shell and guards against stale responses when the
 * user switches tender while a request is still in flight.
 */
export function useMepaDossierController({ abortController, tenderId, setLoading }: UseMepaDossierControllerParams) {
    // Monotonic request sequence used to invalidate stale async responses.
    const requestSeqRef = useRef(0);

    // Operational dossier report used by the Dossier AI tab.
    const [dossierReport, setDossierReport] = useState<MepaDossierOperationalReport | null>(null);

    // Evidence/quality coverage report used to explain dossier reliability.
    const [dossierQuality, setDossierQuality] = useState<MepaDossierQualityReport | null>(null);

    /** Clears dossier read models and invalidates any in-flight dossier request. */
    const resetDossierState = useCallback(() => {
        requestSeqRef.current += 1;
        setDossierReport(null);
        setDossierQuality(null);
    }, []);

    // A dossier belongs to one tender only; switching tender must clear stale data.
    useEffect(() => {
        resetDossierState();
    }, [tenderId, resetDossierState]);

    /**
     * Loads the complete operational dossier and quality report in parallel.
     *
     * Promise.allSettled keeps partial success usable: if quality succeeds but
     * report fails, the UI can still show the last valid quality model.
     */
    const loadDossierReport = useCallback(async () => {
        if (!tenderId) return;
        const requestSeq = ++requestSeqRef.current;
        try {
            setLoading("dossier-report");
            const [reportRes, qualityRes] = await Promise.allSettled([
                getMepaDossierReport({ abortController, tenderId }),
                getMepaDossierQuality({ abortController, tenderId }),
            ]);

            if (requestSeq !== requestSeqRef.current) return;
            if (reportRes.status === "fulfilled") setDossierReport(reportRes.value?.data ?? null);
            if (qualityRes.status === "fulfilled") setDossierQuality(qualityRes.value?.data ?? null);
            if (reportRes.status === "rejected" && qualityRes.status === "rejected") throw reportRes.reason;
        } catch (error) {
            console.error(error);
            enqueueSnackbar?.("Non riesco a generare il report operativo del dossier.", { variant: "warning" } as any);
        } finally {
            if (requestSeq === requestSeqRef.current) setLoading(null);
        }
    }, [abortController, tenderId, setLoading]);

    /** Refreshes only evidence/quality coverage without regenerating the full report. */
    const loadDossierQuality = useCallback(async () => {
        if (!tenderId) return;
        const requestSeq = ++requestSeqRef.current;
        try {
            setLoading("dossier-quality");
            const res = await getMepaDossierQuality({ abortController, tenderId });
            if (requestSeq === requestSeqRef.current) setDossierQuality(res?.data ?? null);
        } catch (error) {
            console.error(error);
            enqueueSnackbar?.("Non riesco a verificare la copertura evidenze del dossier.", { variant: "warning" } as any);
        } finally {
            if (requestSeq === requestSeqRef.current) setLoading(null);
        }
    }, [abortController, tenderId, setLoading]);

    return {
        dossierReport,
        dossierQuality,
        resetDossierState,
        loadDossierReport,
        loadDossierQuality,
    };
}
