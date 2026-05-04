import React from "react";
import { useNavigate } from "react-router-dom";
import type { CustomerPurchasesSummaryPayload } from "../types";
import { cn, formatCurrencyIt, formatNumberIt, formatYyyymmddToItalian, toDisplayText } from "../helpers/panelUtils";
import { SectionActionButton, SectionContainer, SectionHeader } from "../components/sectionUi";
import { FaPlus } from "react-icons/fa";

const PREVIEW_LIMIT = 10;

const TableCell: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <td className={cn("px-3 py-2 text-[12px] text-neutral-700 dark:text-neutral-300", className)}>{children}</td>
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

/**
 * Box preview acquisti nel pannello cliente.
 *
 * Mostriamo solo le righe essenziali e lasciamo il dettaglio completo
 * alla pagina dedicata /contabilita/dati-acquistato-clienti.
 */
export const CustomerPurchasesSummary: React.FC<{
    customerCode: string;
    customerName?: string;
    purchases: CustomerPurchasesSummaryPayload;
}> = ({ customerCode, customerName, purchases }) => {
    const navigate = useNavigate();
    const normalizedCustomerCode = String(customerCode ?? "").trim();
    const total = Number(purchases?.total ?? 0) || 0;

    const previewRows = React.useMemo(
        () => (Array.isArray(purchases?.items) ? purchases.items.slice(0, PREVIEW_LIMIT) : []),
        [purchases?.items]
    );

    const handleOpenPurchasesPage = React.useCallback(() => {
        if (!normalizedCustomerCode) return;

        navigate("/contabilita/acquisti_clienti", {
            state: {
                customerCode: normalizedCustomerCode,
                customerName: String(customerName ?? "").trim(),
            },
        });
    }, [customerName, navigate, normalizedCustomerCode]);

    return (
        <SectionContainer>
            <SectionHeader
                title="Acquisti cliente"
                description={`${formatNumberIt(total, "0")} acquisti totali`}
                rightContent={
                    normalizedCustomerCode ? <SectionActionButton rightIcon={FaPlus({})} onClick={handleOpenPurchasesPage}>Dettagli</SectionActionButton> : null
                }
            />

            {previewRows.length > 0 ? (
                <div className="p-4">
                    <div className="overflow-x-auto">
                        <table className="w-full text-[12px]">
                            <thead>
                                <tr className="border-b border-neutral-200 dark:border-neutral-800">
                                    <TableHeader>Data</TableHeader>
                                    <TableHeader>Documento</TableHeader>
                                    <TableHeader>Articolo</TableHeader>
                                    <TableHeader>Descrizione</TableHeader>
                                    <TableHeader className="text-right">Valore</TableHeader>
                                </tr>
                            </thead>
                            <tbody>
                                {previewRows.map((row: any, idx) => {
                                    const rowKey = [
                                        toDisplayText(row?.documentDate, "no-date"),
                                        toDisplayText(row?.documentNumber, "no-doc"),
                                        toDisplayText(row?.articleCode, "no-art"),
                                        String(idx),
                                    ].join("-");

                                    return (
                                        <tr
                                            key={rowKey}
                                            className="border-b border-neutral-100 dark:border-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-900/40 transition"
                                        >
                                            <TableCell>{formatYyyymmddToItalian(row?.documentDate)}</TableCell>
                                            <TableCell>{toDisplayText(row?.documentNumber)}</TableCell>
                                            <TableCell>{toDisplayText(row?.articleCode)}</TableCell>
                                            <TableCell>{toDisplayText(row?.description)}</TableCell>
                                            <TableCell className="text-right">{formatCurrencyIt(row?.rowValue)}</TableCell>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="p-6 text-center">
                    <p className="text-[12px] text-neutral-500 dark:text-neutral-400">Nessun acquisto disponibile</p>
                </div>
            )}
        </SectionContainer>
    );
};
