import React from "react";
import FDButton from "components/UI/buttons/FDButton";
import FDInput from "components/UI/input/FDInput";
import FDSelect from "components/UI/input/FDSelect";
import { ContextMenu } from "components/UI/menu/ContextMenu";

type FiltersMenuProps = {
    open: boolean;
    anchorRef: React.RefObject<HTMLDivElement>;
    onClose: () => void;
    canSelectAgent: boolean;
    env: string;
    onChangeEnv: (value: string) => void;
    agentCodes: string[];
    onChangeAgentCodes: (value: string[]) => void;
    agentOptions: Array<{ label: string; value: string }>;
    onChangeAgentSearch: (value: string) => void;
    customerCode: string;
    onChangeCustomerCode: (value: string) => void;
    customerOptions: Array<{ label: string; value: string }>;
    onChangeCustomerSearch: (value: string) => void;
    year: string;
    onChangeYear: (value: string) => void;
    warehouse: string;
    onChangeWarehouse: (value: string) => void;
    quoteNumber: string;
    onChangeQuoteNumber: (value: string) => void;
    onResetQuotesFilters: () => void;
    onSearchQuotes: () => void;
};

/**
 * Normalizza il valore restituito da FDSelect in array di codici stringa.
 * Supporta stringhe singole, numeri, oggetti `{ value/id/code }` e array misti.
 */
function normalizeToStringArray(value: unknown): string[] {
    const pick = (item: any): string => {
        if (typeof item === "string" || typeof item === "number") return String(item).trim();
        if (item && typeof item === "object") {
            return String(item?.value ?? item?.id ?? item?.code ?? "").trim();
        }
        return "";
    };

    if (Array.isArray(value)) return value.map(pick).filter(Boolean);
    const single = pick(value);
    return single ? [single] : [];
}

/**
 * Filtri preventivi:
 * - i campi aggiornano solo lo stato locale del form
 * - l'applicazione reale dei filtri avviene con il pulsante Cerca in TopBar
 * - reset completo + chiusura menu
 */
export default function FiltersMenu(props: FiltersMenuProps) {
    const {
        open,
        anchorRef,
        onClose,
        canSelectAgent,
        env,
        onChangeEnv,
        agentCodes,
        onChangeAgentCodes,
        agentOptions,
        onChangeAgentSearch,
        customerCode,
        onChangeCustomerCode,
        customerOptions,
        onChangeCustomerSearch,
        year,
        onChangeYear,
        warehouse,
        onChangeWarehouse,
        quoteNumber,
        onChangeQuoteNumber,
        onResetQuotesFilters,
        onSearchQuotes,
    } = props;

    return (
        <ContextMenu
            openFor={open}
            pos={anchorRef}
            onClose={onClose}
            placement="bottom-end"
            panel={
                <div className="flex flex-col gap-3 w-[380px] max-h-180 overflow-auto p-2">
                    <div className="text-sm font-medium">Filtri</div>
                    <div className="grid grid-cols-1 gap-2">
                        <div className="flex flex-col gap-2 w-full min-w-0">
                            <span className="text-xs pl-2">Ambiente</span>
                            <FDSelect
                                options={[
                                    { label: "Tutti", value: "" },
                                    { label: "Focelda", value: "FOCELDA" },
                                    { label: "IoT", value: "IOT" },
                                ]}
                                value={env}
                                onChange={(v: any) => {
                                    const raw =
                                        v == null
                                            ? ""
                                            : typeof v === "string" || typeof v === "number"
                                                ? v
                                                : v?.value ?? v?.id ?? "";
                                    onChangeEnv(String(raw ?? "").trim().toUpperCase());
                                }}
                                clearable={false}
                                size="sm"
                                radius="md"
                                variant="outline"
                                color="dark"
                            />
                            <span className="text-xs pl-2">Cliente</span>
                            <FDSelect
                                options={customerOptions as any}
                                value={customerCode || undefined}
                                onChange={(v: any) => {
                                    // FDSelect in alcuni casi ritorna il value, in altri l'oggetto opzione:
                                    // normalizziamo sempre al codice cliente stringa.
                                    const rawValue =
                                        v == null
                                            ? ""
                                            : typeof v === "string" || typeof v === "number"
                                                ? v
                                                : v?.value ?? v?.id ?? "";
                                    onChangeCustomerCode(String(rawValue ?? "").trim());
                                }}
                                placeholder="Cerca per cod. cliente, Rag. sociale, P.IVA..."
                                size="sm"
                                radius="md"
                                variant="outline"
                                color="dark"
                                clearable
                                virtualized
                                searchable
                                onSearchChange={(text: string) => onChangeCustomerSearch(text)}
                            />
                            <span className="text-xs pl-2">Anno preventivo</span>
                            <FDInput
                                size="sm"
                                value={year}
                                placeholder="Es. 2024"
                                onChange={(e) => onChangeYear(e.target.value)}
                                variant="outline"
                                color="dark"
                                radius="md"
                            />
                            <span className="text-xs pl-2">Numero preventivo</span>
                            <FDInput
                                size="sm"
                                value={quoteNumber}
                                placeholder="Es. 2033"
                                onChange={(e) => onChangeQuoteNumber(e.target.value)}
                                variant="outline"
                                color="dark"
                                radius="md"
                            />
                            <span className="text-xs pl-2">Magazzino</span>
                            <FDInput
                                size="sm"
                                value={warehouse}
                                placeholder="Es. 010"
                                onChange={(e) => onChangeWarehouse(e.target.value)}
                                variant="outline"
                                color="dark"
                                radius="md"
                            />

                            {canSelectAgent && (
                                <>
                                    {/**
                   * Allineamento a Purchases:
                   * il filtro agente è multiselezione e salva un array di codici.
                   */}
                                    <span className="text-xs pl-2">Agente</span>
                                    <FDSelect
                                        options={agentOptions as any}
                                        value={agentCodes as any}
                                        onChange={(v: any) => {
                                            onChangeAgentCodes(
                                                normalizeToStringArray(v).map((code) => String(code).toUpperCase())
                                            );
                                        }}
                                        placeholder="Cerca agente..."
                                        size="sm"
                                        radius="md"
                                        variant="outline"
                                        color="dark"
                                        clearable
                                        searchable
                                        virtualized
                                        multiple
                                        onSearchChange={(text: string) => onChangeAgentSearch(text)}
                                    />
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-2">
                        <FDButton
                            variant="outline"
                            color="dark"
                            size="small"
                            onClick={() => {
                                onResetQuotesFilters();
                                onClose();
                            }}
                        >
                            Reset
                        </FDButton>
                        <FDButton
                            variant="solid"
                            color="primary"
                            size="small"
                            onClick={() => {
                                onSearchQuotes();
                                onClose();
                            }}
                        >
                            Applica filtri
                        </FDButton>
                    </div>
                </div>
            }
        />
    );
}
