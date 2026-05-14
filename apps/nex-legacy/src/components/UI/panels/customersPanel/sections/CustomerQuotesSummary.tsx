import React from "react";
import { useNavigate } from "react-router-dom";
import type { CustomerQuotesSummaryPayload } from "../types";
import { cn, formatDateMaybe, formatNumberIt, toDisplayText } from "../helpers/panelUtils";
import { SectionActionButton, SectionContainer, SectionHeader } from "../components/sectionUi";
import { FaPlus } from "react-icons/fa";

const PREVIEW_LIMIT = 5;

function formatQuoteStatus(value: unknown): string {
    const status = String(value ?? "").trim();
    if (status === "*") return "Convertito in OC";
    return toDisplayText(status);
}

const TableCell: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <td className={cn("px-3 py-2 text-[12px] text-neutral-700 dark:text-neutral-300", className)}>
        {children}
    </td>
);

const TableHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <th
        className={cn(
            "px-3 py-2 text-left text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-900/50",
            className
        )}
    >
        {children}
    </th>
);

export const CustomerQuotesSummary: React.FC<{
    customerCode: string;
    quotes: CustomerQuotesSummaryPayload;
}> = ({ customerCode, quotes }) => {
    const navigate = useNavigate();
    const normalizedCustomerCode = String(customerCode ?? "").trim();
    const total = Number(quotes?.total ?? 0) || 0;

    const previewRows = React.useMemo(
        () => (Array.isArray(quotes?.items) ? quotes.items.slice(0, PREVIEW_LIMIT) : []),
        [quotes?.items]
    );

    const handleOpenQuotesPage = React.useCallback(() => {
        if (!normalizedCustomerCode) return;

        /**
         * La card resta una preview leggera nel pannello cliente.
         * Il dettaglio completo si apre nella pagina dedicata preventivi,
         * prefiltrata via `location.state.customerCode`.
         */
        navigate("/contabilita/preventivi", {
            state: { customerCode: normalizedCustomerCode },
        });
    }, [navigate, normalizedCustomerCode]);

    return (
        <SectionContainer dataTour="scheda-cliente-preventivi">
            <SectionHeader
                title="Preventivi"
                description={`${formatNumberIt(total, "0")} preventivi totali`}
                rightContent={
                    normalizedCustomerCode ? (
                        <SectionActionButton
                            rightIcon={FaPlus({})}
                            onClick={handleOpenQuotesPage}>
                            Dettagli
                        </SectionActionButton>
                    ) : null
                }
            />

            {previewRows.length > 0 ? (
                <div className="p-4">
                    {/* Per una preview da poche righe usiamo HTML nativo:
                        evita overhead e resta coerente con gli altri box summary. */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-[12px]">
                            <thead>
                                <tr className="border-b border-neutral-200 dark:border-neutral-800">
                                    <TableHeader>Data</TableHeader>
                                    <TableHeader>N. prev.</TableHeader>
                                    <TableHeader>Magazzino</TableHeader>
                                    <TableHeader>Agente</TableHeader>
                                    <TableHeader>Stato</TableHeader>
                                </tr>
                            </thead>
                            <tbody>
                                {previewRows.map((row: any, idx) => {
                                    // Chiave stabile anche quando il backend invia campi opzionali null/empty.
                                    const rowKey = [
                                        toDisplayText(row?.AMBIENTE, "no-env"),
                                        toDisplayText(row?.TANNO, "no-year"),
                                        toDisplayText(row?.TNRPR, "no-quote"),
                                        String(idx),
                                    ].join("-");

                                    return (
                                        <tr
                                            key={rowKey}
                                            className="border-b border-neutral-100 dark:border-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-900/40 transition"
                                        >
                                            <TableCell>{formatDateMaybe(row?.TDTPR)}</TableCell>
                                            <TableCell>{toDisplayText(row?.TNRPR)}</TableCell>
                                            <TableCell>{toDisplayText(row?.TCDMA)}</TableCell>
                                            <TableCell>{toDisplayText(row?.TCDAG)}</TableCell>
                                            <TableCell>{formatQuoteStatus(row?.TSTAT)}</TableCell>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="p-6 text-center">
                    <p className="text-[12px] text-neutral-500 dark:text-neutral-400">
                        Nessun preventivo disponibile
                    </p>
                </div>
            )}
        </SectionContainer>
    );
};
