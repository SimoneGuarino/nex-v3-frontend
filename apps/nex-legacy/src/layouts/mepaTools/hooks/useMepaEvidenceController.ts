import { MutableRefObject, useCallback, useEffect, useState } from "react";
import { enqueueSnackbar } from "components/MessageBox";
import { getMepaEvidence } from "../fetchData/mepaAi";
import type { MepaEvidenceDetail } from "../types";

type UseMepaEvidenceControllerParams = {
    abortController: MutableRefObject<AbortController | null>;
    selectedTenderIdRef: { current: string | null | undefined };
};

/**
 * Handles global document-evidence opening for the MEPA workspace.
 *
 * Evidence links can be emitted from lazy-loaded tabs or nested cards through a
 * custom event. Keeping the listener here avoids coupling every feature tab to
 * the evidence modal implementation and keeps the modal mounted once per page.
 */
export function useMepaEvidenceController({ abortController, selectedTenderIdRef }: UseMepaEvidenceControllerParams) {
    // Currently opened evidence payload shown in the modal. Null closes the modal.
    const [selectedEvidence, setSelectedEvidence] = useState<MepaEvidenceDetail["evidence"] | null>(null);

    // Local modal loading state; it is intentionally not tied to the global
    // workspace loading token because evidence opening should not block tabs.
    const [evidenceLoading, setEvidenceLoading] = useState(false);

    /** Opens a document evidence chunk for the currently selected tender. */
    const openEvidenceByChunkId = useCallback(async (chunkId: string) => {
        if (!chunkId || !selectedTenderIdRef.current) return;
        try {
            setEvidenceLoading(true);
            const res = await getMepaEvidence({ abortController, tenderId: selectedTenderIdRef.current, chunkId });
            setSelectedEvidence(res?.data?.evidence ?? null);
        } catch (error) {
            console.error(error);
            enqueueSnackbar?.("Non riesco ad aprire l'evidenza documentale.", { variant: "warning" } as any);
        } finally {
            setEvidenceLoading(false);
        }
    }, [abortController, selectedTenderIdRef]);

    // Global event bridge used by deeply nested/lazy components to request the
    // evidence modal without receiving modal props through every component layer.
    useEffect(() => {
        const handler = (event: Event) => {
            const detail = (event as CustomEvent<{ chunkId?: string }>).detail;
            if (detail?.chunkId) void openEvidenceByChunkId(detail.chunkId);
        };
        window.addEventListener("nex:mepa:evidence:open", handler as EventListener);
        return () => window.removeEventListener("nex:mepa:evidence:open", handler as EventListener);
    }, [openEvidenceByChunkId]);

    /** Closes the evidence modal while keeping the controller mounted. */
    const closeEvidence = useCallback(() => setSelectedEvidence(null), []);

    return {
        selectedEvidence,
        evidenceLoading,
        openEvidenceByChunkId,
        closeEvidence,
    };
}
