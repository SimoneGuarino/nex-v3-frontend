import React from "react";
import type { PaymentsFooterStats } from "../sections/Payments";
import { formatCurrencyIt } from "../helpers/panelUtils";

// Footer contestuale mostrato solo nei dettagli "payments".
// Riceve statistiche aggregate dal componente Payments.
type CustomersPanelPaymentsFooterProps = {
    stats: PaymentsFooterStats;
};

export const CustomersPanelPaymentsFooter: React.FC<CustomersPanelPaymentsFooterProps> = ({
    stats,
}) => (
    <div className="border-t border-neutral-200/60 dark:border-neutral-800/80 px-5 py-3 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-3 bg-neutral-50 dark:bg-neutral-900/50">
                <p className="text-[11px] text-neutral-600 dark:text-neutral-400">Totale movimenti</p>
                <p className="text-[14px] font-semibold text-neutral-900 dark:text-neutral-50 mt-1">
                    {stats.total}
                </p>
            </div>

            <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-3 bg-neutral-50 dark:bg-neutral-900/50">
                <p className="text-[11px] text-neutral-600 dark:text-neutral-400">Pagamenti mostrati</p>
                <p className="text-[14px] font-semibold text-neutral-900 dark:text-neutral-50 mt-1">
                    {stats.shown}
                </p>
            </div>

            <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-3 bg-neutral-50 dark:bg-neutral-900/50">
                <p className="text-[11px] text-neutral-600 dark:text-neutral-400">Imponibile totale</p>
                <p className="text-[14px] font-semibold text-neutral-900 dark:text-neutral-50 mt-1">
                    {formatCurrencyIt(stats.imponibile)}
                </p>
            </div>
        </div>
    </div>
);
