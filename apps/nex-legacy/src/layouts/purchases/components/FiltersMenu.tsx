import React from "react";
import FDButton from "components/UI/buttons/FDButton";
import FDDate from "components/UI/input/FDDate";
import FDSelect from "components/UI/input/FDSelect";
import { ContextMenu } from "components/UI/menu/ContextMenu";
import type { PurchasesFiltersResponse, PurchasesQuery } from "../types";


// ——————————————————————————————————————————————————————————
// TYPES & INTERFACE
// ——————————————————————————————————————————————————————————
type FiltersMenuProps = {
    open: boolean;
    anchorRef: React.RefObject<HTMLDivElement>;
    onClose: () => void;
    query: PurchasesQuery;
    onPatchQuery: (patch: Partial<PurchasesQuery>) => void;
    filterOptions: PurchasesFiltersResponse;
    canSelectAgent: boolean;
    customerSearchLoading: boolean;
    onCustomerSearchChange: (text: string) => void;
    onSearch: () => void;
    onReset: () => void;
};

type SelectOption = {
    label: string;
    value: string;
};

type MultiFilterConfig = {
    key: string;
    label: string;
    options: SelectOption[];
    value: string[];
    patchKey: keyof PurchasesQuery;
    resetKeys?: Array<keyof PurchasesQuery>;
};

// ——————————————————————————————————————————————————————————
// CONST
// ——————————————————————————————————————————————————————————
/**
 * Opzioni statiche per il filtro "Ambiente".
 */
const environmentOptions = [
    { label: "Tutti", value: "" },
    { label: "Focelda", value: "FOCELDA" },
    { label: "IOT", value: "IOT" },
];

const baseSelectProps = {
    size: "sm" as const,
    radius: "md" as const,
    variant: "outline" as const,
    color: "dark" as const,
};

const baseSearchableMultiSelectProps = {
    ...baseSelectProps,
    clearable: true,
    searchable: true,
    multiple: true,
};

// ——————————————————————————————————————————————————————————
// HELPER
// ——————————————————————————————————————————————————————————
/**
 * Normalizza il valore restituito dalle select in array di stringhe.
 * Supporta stringa singola, numero, oggetti `{ value/id/code }` e array multipli.
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

function normalizeToSingleString(value: unknown): string {
    if (value == null) return "";
    if (typeof value === "string" || typeof value === "number") return String(value).trim();
    if (typeof value === "object") {
        return String((value as any)?.value ?? (value as any)?.id ?? "").trim();
    }
    return "";
}

function renderField(args: {
    key: string;
    label: string;
    children: React.ReactNode;
    className?: string;
}) {
    const { key, label, children, className = "" } = args;

    return (
        <div key={key} className={`flex flex-col gap-1 ${className}`.trim()}>
            <span className="text-xs pl-2">{label}</span>
            {children}
        </div>
    );
};


// ——————————————————————————————————————————————————————————
// COMPONENT
// ——————————————————————————————————————————————————————————
/**
 * Menu contestuale dei filtri acquisti.
 *
 * Nota importante:
 * i filtri prodotto sono gestiti "a cascata" (brand -> linea -> gruppo -> famiglia)
 * e quando cambia un livello padre vengono resettati i livelli figli per evitare combinazioni incoerenti.
 */
export default function FiltersMenu(props: FiltersMenuProps) {
    const {
        open,
        anchorRef,
        onClose,
        query,
        onPatchQuery,
        filterOptions,
        canSelectAgent,
        customerSearchLoading,
        onCustomerSearchChange,
        onSearch,
        onReset,
    } = props;

    /**
     * CASCATA PRODOTTO LATO FRONTEND (senza roundtrip continuo):
     *
     * Se il backend fornisce `taxonomy`, calcoliamo localmente:
     * - linee ammesse dai brand selezionati;
     * - gruppi ammessi da brand + linee;
     * - famiglie ammesse da brand + linee + gruppi.
     *
     * In questo modo evitiamo chiamate `retrieve filters` a ogni onChange.
     * Se `taxonomy` non è presente, manteniamo fallback legacy sulle liste flat.
     */
    const productTaxonomy = Array.isArray(filterOptions.taxonomy) ? filterOptions.taxonomy : [];

    const brandCodesSelected = query.brandCodes;
    const lineCodesSelected = query.lineCodes;
    const groupCodesSelected = query.groupCodes;


    // ——————————————————————————————————————————————————————————
    // MEMOIZED OPTIONS LABELS
    // ——————————————————————————————————————————————————————————
    const lineLabelByCode = React.useMemo(
        () => new Map(filterOptions.lines.map((opt) => [String(opt.value).trim(), String(opt.label).trim() || String(opt.value).trim()])),
        [filterOptions.lines]);

    const groupLabelByCode = React.useMemo(
        () => new Map(filterOptions.groups.map((opt) => [String(opt.value).trim(), String(opt.label).trim() || String(opt.value).trim()])),
        [filterOptions.groups]);

    const familyLabelByCode = React.useMemo(
        () => new Map(filterOptions.families.map((opt) => [String(opt.value).trim(), String(opt.label).trim() || String(opt.value).trim()])),
        [filterOptions.families]);

    const lineOptionsComputed = React.useMemo(() => {
        if (productTaxonomy.length === 0) return filterOptions.lines;
        const allowedBrandCodes = new Set(brandCodesSelected);

        const map = new Map<string, { value: string; label: string }>();
        productTaxonomy.forEach((row) => {
            if (allowedBrandCodes.size > 0 && !allowedBrandCodes.has(row.brandCode)) return;
            if (!map.has(row.lineCode)) {
                map.set(row.lineCode, { value: row.lineCode, label: lineLabelByCode.get(row.lineCode) ?? row.lineCode });
            }
        });
        return Array.from(map.values());
    }, [brandCodesSelected, filterOptions.lines, lineLabelByCode, productTaxonomy]);

    const groupOptionsComputed = React.useMemo(() => {
        if (productTaxonomy.length === 0) return filterOptions.groups;
        const allowedBrandCodes = new Set(brandCodesSelected);
        const allowedLineCodes = new Set(lineCodesSelected);

        const map = new Map<string, { value: string; label: string }>();
        productTaxonomy.forEach((row) => {
            if (allowedBrandCodes.size > 0 && !allowedBrandCodes.has(row.brandCode)) return;
            if (allowedLineCodes.size > 0 && !allowedLineCodes.has(row.lineCode)) return;
            if (!map.has(row.groupCode)) {
                map.set(row.groupCode, { value: row.groupCode, label: groupLabelByCode.get(row.groupCode) ?? row.groupCode });
            }
        });
        return Array.from(map.values());
    }, [brandCodesSelected, lineCodesSelected, filterOptions.groups, groupLabelByCode, productTaxonomy]);

    const familyOptionsComputed = React.useMemo(() => {
        if (productTaxonomy.length === 0) return filterOptions.families;
        const allowedBrandCodes = new Set(brandCodesSelected);
        const allowedLineCodes = new Set(lineCodesSelected);
        const allowedGroupCodes = new Set(groupCodesSelected);

        const map = new Map<string, { value: string; label: string }>();
        productTaxonomy.forEach((row) => {
            if (allowedBrandCodes.size > 0 && !allowedBrandCodes.has(row.brandCode)) return;
            if (allowedLineCodes.size > 0 && !allowedLineCodes.has(row.lineCode)) return;
            if (allowedGroupCodes.size > 0 && !allowedGroupCodes.has(row.groupCode)) return;
            if (!map.has(row.familyCode)) {
                map.set(row.familyCode, { value: row.familyCode, label: familyLabelByCode.get(row.familyCode) ?? row.familyCode });
            }
        });
        return Array.from(map.values());
    }, [brandCodesSelected, lineCodesSelected, groupCodesSelected, familyLabelByCode, filterOptions.families, productTaxonomy]);

    /**
     * Config dei filtri prodotto con gestione della cascata e reset dei livelli dipendenti.
     */
    const productFilters = React.useMemo<MultiFilterConfig[]>(
        () => [
            {
                key: "brandCodes",
                label: "Brand",
                options: filterOptions.brands as SelectOption[],
                value: query.brandCodes,
                patchKey: "brandCodes",
                resetKeys: ["lineCodes", "groupCodes", "familyCodes"],
            },
            {
                key: "lineCodes",
                label: "Linea",
                options: lineOptionsComputed as SelectOption[],
                value: query.lineCodes,
                patchKey: "lineCodes",
                resetKeys: ["groupCodes", "familyCodes"],
            },
            {
                key: "groupCodes",
                label: "Gruppo",
                options: groupOptionsComputed as SelectOption[],
                value: query.groupCodes,
                patchKey: "groupCodes",
                resetKeys: ["familyCodes"],
            },
            {
                key: "familyCodes",
                label: "Famiglia",
                options: familyOptionsComputed as SelectOption[],
                value: query.familyCodes,
                patchKey: "familyCodes",
            },
        ],
        [
            filterOptions.brands,
            lineOptionsComputed,
            groupOptionsComputed,
            familyOptionsComputed,
            query.brandCodes,
            query.lineCodes,
            query.groupCodes,
            query.familyCodes,
        ]
    );

    const extraFilters = React.useMemo<MultiFilterConfig[]>(
        () => [
            ...(canSelectAgent
                ? [
                    {
                        key: "agentCodes",
                        label: "Agente",
                        options: filterOptions.agents as SelectOption[],
                        value: query.agentCodes,
                        patchKey: "agentCodes",
                    } satisfies MultiFilterConfig,
                ]
                : []),
        ],
        [canSelectAgent, filterOptions.agents, query.agentCodes]
    );

    // ——————————————————————————————————————————————————————————
    // CALLBACK'S
    // ——————————————————————————————————————————————————————————
    /**
     * Gestione patch dei filtri multipli con reset dei livelli dipendenti.
     * Viene usata per tutti i filtri prodotto per mantenere la logica di cascata.
     */
    const patchMultiFilter = React.useCallback(
        (config: MultiFilterConfig, rawValue: unknown) => {
            const patch: Partial<PurchasesQuery> = {
                [config.patchKey]: normalizeToStringArray(rawValue),
            };

            config.resetKeys?.forEach((resetKey) => {
                patch[resetKey] = [] as any;
            });

            onPatchQuery(patch);
        },
        [onPatchQuery]
    );


    // ——————————————————————————————————————————————————————————
    // RENDER
    // ——————————————————————————————————————————————————————————
    return (
        <ContextMenu
            openFor={open}
            pos={anchorRef}
            onClose={onClose}
            placement="bottom-end"
            panel={
                <div className="w-[360px] max-w-full space-y-4 overflow-visible p-2">
                    <div className="text-sm font-medium">Filtri</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {renderField({
                            key: "period",
                            label: "",
                            className: "sm:col-span-2",
                            children: (
                                <>
                                    <div className="grid grid-cols-2 gap-2 text-xs px-2">
                                        <span className="text-left">Periodo da</span>
                                        <span className="text-left pl-2">Periodo a</span>
                                    </div>
                                    <FDDate
                                        range
                                        fromLabel=""
                                        toLabel=""
                                        value={{
                                            from: query.dateFrom || undefined,
                                            to: query.dateTo || undefined,
                                        }}
                                        onChange={(value) => {
                                            onPatchQuery({
                                                dateFrom: value?.from ?? "",
                                                dateTo: value?.to ?? "",
                                            });
                                        }}
                                        fullWidth
                                        size="sm"
                                        color="dark"
                                        radius="md"
                                        clearable={false}
                                    />
                                </>
                            ),
                        })}

                        {renderField({
                            key: "customer",
                            label: "Cliente",
                            className: "sm:col-span-2",
                            children: (
                                <FDSelect
                                    {...baseSelectProps}
                                    options={filterOptions.customers as any}
                                    value={query.customerCodes[0] || undefined}
                                    placeholder="Cerca per cod. cliente, Rag. sociale, P.IVA..."
                                    clearable
                                    searchable
                                    loading={customerSearchLoading}
                                    onSearchChange={onCustomerSearchChange}
                                    onChange={(v: any) => {
                                        const value = normalizeToSingleString(v);
                                        onPatchQuery({
                                            customerCodes: value ? [value] : [],
                                        });
                                    }}
                                />
                            ),
                        })}

                        {renderField({
                            key: "env",
                            label: "Ambiente",
                            children: (
                                <FDSelect
                                    {...baseSelectProps}
                                    options={environmentOptions as any}
                                    value={query.env as any}
                                    clearable={false}
                                    onChange={(v: any) => {
                                        const value = normalizeToSingleString(v);
                                        onPatchQuery({
                                            env: value as PurchasesQuery["env"],
                                        });
                                    }}
                                />
                            ),
                        })}

                        {productFilters.map((filter) =>
                            renderField({
                                key: filter.key,
                                label: filter.label,
                                children: (
                                    <FDSelect
                                        {...baseSearchableMultiSelectProps}
                                        options={filter.options as any}
                                        value={filter.value as any}
                                        onChange={(v: any) => patchMultiFilter(filter, v)}
                                    />
                                ),
                            })
                        )}

                        {extraFilters.map((filter) =>
                            renderField({
                                key: filter.key,
                                label: filter.label,
                                children: (
                                    <FDSelect
                                        {...baseSearchableMultiSelectProps}
                                        options={filter.options as any}
                                        value={filter.value as any}
                                        onChange={(v: any) => patchMultiFilter(filter, v)}
                                    />
                                ),
                            })
                        )}
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <FDButton
                            variant="outline"
                            color="dark"
                            size="small"
                            onClick={() => {
                                // Il reset agisce su tutta la query e chiude il menu per mostrare subito il risultato.
                                onReset();
                                onClose();
                            }}
                        >
                            Reset
                        </FDButton>
                        <FDButton variant="solid" color="primary" size="small" onClick={onSearch}>
                            Applica filtri
                        </FDButton>
                    </div>
                </div>
            }
        />
    );
}
