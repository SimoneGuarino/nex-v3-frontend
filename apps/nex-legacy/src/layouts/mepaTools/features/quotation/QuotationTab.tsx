import React from "react";
import { FiFileText } from "react-icons/fi";
import { Panel } from "../../components/shared/Panel";
import type { MepaTenderListItem } from "../../types";

/**
 * Placeholder for the future quotation workflow.
 *
 * Kept as an isolated feature tab so the future quotation generator can evolve without
 * increasing the MEPA workspace orchestrator or coupling it to product-review internals.
 */
/**
 * Placeholder/bridge tab for the future quotation workflow.
 *
 * It is memoized even though it is currently lightweight because the tab is
 * lazy-loaded and will likely evolve into a heavier integration surface. Keeping
 * the contract explicit now prevents future coupling with the MEPA shell.
 */
export const QuotationTab = React.memo(function QuotationTab({ selectedTender }: { selectedTender: MepaTenderListItem }) {
    return <Panel title="Quotazione collegata" icon={<FiFileText className="text-blue-500" />}><p className="text-sm text-slate-600 dark:text-neutral-300">La generazione della bozza Quotazione NEX verrà abilitata quando dossier, righe prodotto e validazioni saranno pronti.</p><div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm dark:bg-neutral-950"><p className="font-semibold">Stato attuale</p><p className="mt-1 text-slate-500">Quotation ID: {selectedTender.quotationId ?? "non ancora generata"}</p></div></Panel>;
});
