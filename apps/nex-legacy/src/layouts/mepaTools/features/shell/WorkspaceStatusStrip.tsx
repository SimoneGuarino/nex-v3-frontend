import React from "react";
import type { MepaTenderListItem } from "../../types";
import type { WorkspaceSnapshot } from "../../domain/workspace.types";

/**
 * Screen-reader only operational status.
 *
 * The visual status is already represented by cards and badges; this strip keeps
 * the workspace understandable for assistive technologies without introducing
 * extra layout cost on mobile or desktop.
 */
/**
 * Thin status strip below the workspace header.
 *
 * It surfaces long-running analysis state without owning timers or polling.
 * Values are read from the selected tender and the latest workspace snapshot so
 * stale UI state cannot diverge from the controller read model.
 */
export function WorkspaceStatusStrip({ selectedTender, snapshot }: { selectedTender: MepaTenderListItem; snapshot: WorkspaceSnapshot | null }) {
    // Optional because the workspace can render before the first snapshot fetch
    // completes. Fallback values use selectedTender fields where possible.
    const status = snapshot?.statusSummary;
    if (!status) return null;

    return (
        <section className="sr-only" aria-label={`Stato operativo gara ${selectedTender.title}`}>
            Analisi {String(status.analysisStatus ?? selectedTender.status ?? "non disponibile")}, prodotti {String(status.extractedItemsCount ?? selectedTender.extractedItemsCount ?? 0)}.
        </section>
    );
}
