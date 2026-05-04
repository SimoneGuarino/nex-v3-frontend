// src/components/UI/panels/customersPanel/hooks/useCustomersPanelPaymentsState.ts
/**
 * descrizione: Stato locale dedicato alla section "payments" del CustomersPanel.
 * compito:     gestisce reload manuale, loading tabella detail e statistiche footer.
 */
import React from "react";
import type { DetailsSection, PaymentsDetailsPayload } from "../types";
import type { PaymentsFooterStats } from "../sections/Payments";

type UseCustomersPanelPaymentsStateArgs = {
    activeSection: DetailsSection;
    paymentsDetails: PaymentsDetailsPayload | null;
};

export function useCustomersPanelPaymentsState({
    activeSection,
    paymentsDetails,
}: UseCustomersPanelPaymentsStateArgs) {
    /** Token incrementale usato come trigger di refetch nel componente Payments. */
    const [reloadToken, setReloadToken] = React.useState(0);
    /** Loading locale della griglia pagamenti dettagliata (non del panel globale). */
    const [detailsLoading, setDetailsLoading] = React.useState(false);
    /** Statistiche footer calcolate dal componente Payments quando disponibili. */
    const [footerStats, setFooterStats] = React.useState<PaymentsFooterStats | null>(null);

    // Fallback usato finche il dettaglio non pubblica stats aggiornate via callback.
    const fallbackFooterStats = React.useMemo<PaymentsFooterStats | null>(() => {
        if (!paymentsDetails) return null;

        const items = Array.isArray(paymentsDetails.items) ? paymentsDetails.items : [];
        const imponibile = items.reduce(
            (sum: number, row: any) => sum + (Number(row?.IMPMO ?? 0) || 0),
            0
        );

        return {
            total: Number(paymentsDetails.total ?? 0) || 0,
            shown: items.length,
            imponibile,
        };
    }, [paymentsDetails]);

    React.useEffect(() => {
        if (activeSection === "payments") return;
        // Pulizia stato locale quando si lascia la section pagamenti.
        setDetailsLoading(false);
        setFooterStats(null);
    }, [activeSection]);

    return {
        reloadToken,
        triggerReload: () => setReloadToken((prev) => prev + 1),
        detailsLoading,
        setDetailsLoading,
        footerStats,
        setFooterStats,
        currentFooterStats: footerStats ?? fallbackFooterStats,
    };
}
