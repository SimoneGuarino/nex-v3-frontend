import * as React from "react";
import { useMemo, useCallback } from "react";

// UI
import FDButton from "components/UI/buttons/FDButton";
import FDSelect, { FDSelectOption } from "components/UI/input/FDSelect";
import FDInput from "components/UI/input/FDInput";

// fetchdata
import { NoPromoMysqlFilters } from "../fetchData/filters";

// context
import { useUserContext } from "context/UserContext";

// types
import { BrandDoc, BuyerAssistantFiltersProps } from "../types/types";

// utils
import { safeArray } from "../utils/utils";


// ——————————————————————————————————————————————————————————
// TYPES & INTERFACES
// ——————————————————————————————————————————————————————————
export interface FiltersMenuProps {
    handleChangeFilters: ({
        key,
        value,
        deleteProps,
    }: {
        key: keyof BuyerAssistantFiltersProps;
        value: any;
        deleteProps?: (keyof BuyerAssistantFiltersProps)[];
    }) => void;
    onClose?: () => void;
    brands: BrandDoc[];
    brandsLoading: boolean;
    mysqlFilters: NoPromoMysqlFilters;
    mysqlFiltersLoading: boolean;
    filters: BuyerAssistantFiltersProps;
    setFilters: React.Dispatch<React.SetStateAction<BuyerAssistantFiltersProps>>;
}

type FieldShellProps = {
    label: React.ReactNode;
    children: React.ReactNode;
};

type SelectFieldProps = {
    label: React.ReactNode;
    loading?: boolean;
    options: FDSelectOption<string>[];
    value: any;
    onChange: (v: any) => void;
    /** override opzionali */
    disabled?: boolean;
    multiple?: boolean;
    clearable?: boolean;
    searchable?: boolean;
    variant?: any;
};

type InputFieldProps = {
    label: React.ReactNode;
    value: string | undefined;
    placeholder?: string;
    onChange: (e: any) => void;
};


// ——————————————————————————————————————————————————————————
// UTILS
// ——————————————————————————————————————————————————————————
/**
 * Ordina alfabeticamente le opzioni.
 */
function sortOptionsAsc(opts: FDSelectOption<string>[]): FDSelectOption<string>[] {
    return [...opts].sort((a, b) => {
        const la = typeof a.label === "string" ? a.label : String(a.label);
        const lb = typeof b.label === "string" ? b.label : String(b.label);
        return la.localeCompare(lb, "it", { sensitivity: "base" });
    });
}

/**
 * Converte il valore onChange di FDSelect in array di stringhe.
 */
function mapToValues(v: any): string[] {
    if (Array.isArray(v)) {
        return v
            .map((x) => (typeof x === "string" ? x : (x as any)?.value))
            .filter((x) => typeof x === "string" && x.trim() !== "")
            .map((x) => x.trim());
    }
    if (typeof v === "string" && v.trim() !== "") return [v.trim()];
    return [];
}

/**
 * Costruisce una lista di opzioni "semplice" (value==label) e la ordina.
 */
function makeSimpleOptions(values: string[] | undefined): FDSelectOption<string>[] {
    return sortOptionsAsc(
        safeArray(values)
            .filter((v) => typeof v === "string" && v.trim() !== "")
            .map((v) => {
                const t = v.trim();
                return { value: t, label: t };
            })
    );
}


// ——————————————————————————————————————————————————————————
// SUB COMPONENTS
// ——————————————————————————————————————————————————————————
const LoadingSkeleton = React.memo(function LoadingSkeleton() {
    return <div className="h-8 w-full bg-neutral-700 rounded animate-pulse" />;
});

const FieldShell = React.memo(function FieldShell({ label, children }: FieldShellProps) {
    return (
        <div className="flex flex-col">
            <span className="text-xs ml-1.5">{label}</span>
            {children}
        </div>
    );
});

const SelectField = React.memo(function SelectField({
    label,
    loading,
    options,
    value,
    onChange,
    disabled,
    multiple = true,
    clearable = true,
    searchable = true,
    variant,
}: SelectFieldProps) {
    return (
        <FieldShell label={label}>
            {loading ? (
                <LoadingSkeleton />
            ) : (
                <FDSelect
                    options={options}
                    size="sm"
                    radius="md"
                    fullWidth
                    color="dark"
                    clearable={clearable}
                    multiple={multiple}
                    searchable={searchable}
                    disabled={disabled}
                    variant={variant}
                    value={value}
                    onChange={onChange}
                />
            )}
        </FieldShell>
    );
});

const InputField = React.memo(function InputField({ label, value, placeholder, onChange }: InputFieldProps) {
    return (
        <FieldShell label={label}>
            <FDInput
                type="text"
                size="sm"
                radius="md"
                variant="outline"
                color="dark"
                placeholder={placeholder}
                value={value}
                onChange={onChange}
            />
        </FieldShell>
    );
});


// ——————————————————————————————————————————————————————————
// MAIN COMPONENT
// ——————————————————————————————————————————————————————————
export function FiltersMenu({
    handleChangeFilters,
    onClose,
    brands,
    brandsLoading,
    mysqlFilters,
    mysqlFiltersLoading,
    filters = {},
    setFilters,
}: FiltersMenuProps) {
    const [userState] = useUserContext();
    const isAdminOrDev = ["admin", "dev"].includes(String(userState?.details?.ruolo || "").toLowerCase());

    const { brand, prefisso, linea, gruppo, famiglia, flagGest, ragProd, buyer, denomBreve } =
        filters as BuyerAssistantFiltersProps;

    const loadingAny = brandsLoading || mysqlFiltersLoading;


    // ——————————————————————————————————————————————————————————
    // OPTIONS (memoized)
    // ——————————————————————————————————————————————————————————
    const brandOptions: FDSelectOption<string>[] = useMemo(() => {
        const seen = new Set<string>();
        const opts: FDSelectOption<string>[] = [];
        safeArray(brands).forEach((b) => {
            const marca = b.Marca?.trim();
            if (!marca || seen.has(marca)) return;
            seen.add(marca);
            opts.push({ label: marca, value: marca });
        });
        return sortOptionsAsc(opts);
    }, [brands]);

    const brandsForLines = useMemo(() => {
        const all = safeArray(brands);
        if (!brand?.length) return all;
        return all.filter((b) => b.Marca && brand.includes(b.Marca));
    }, [brands, brand]);

    const prefissoOptions: FDSelectOption<string>[] = useMemo(() => {
        const seen = new Set<string>();
        const opts: FDSelectOption<string>[] = [];
        brandsForLines.forEach((b) => {
            safeArray<string>((b as any).PrefissiFornitore).forEach((p) => {
                const code = String(p || "").trim();
                if (!code || seen.has(code)) return;
                seen.add(code);
                opts.push({ value: code, label: code });
            });
        });
        return sortOptionsAsc(opts);
    }, [brandsForLines]);

    const lineaOptions: FDSelectOption<string>[] = useMemo(() => {
        const seen = new Set<string>();
        const opts: FDSelectOption<string>[] = [];
        brandsForLines.forEach((b) => {
            safeArray(b.Categories).forEach((cat) => {
                const code = cat.Linea;
                if (!code || seen.has(code)) return;
                seen.add(code);
                opts.push({ value: code, label: cat.DescrizioneLinea || cat.Linea });
            });
        });
        return sortOptionsAsc(opts);
    }, [brandsForLines]);

    const gruppoOptions: FDSelectOption<string>[] = useMemo(() => {
        const seen = new Set<string>();
        const opts: FDSelectOption<string>[] = [];
        const lineFilter = new Set(linea);

        brandsForLines.forEach((b) => {
            safeArray(b.Categories)
                .filter((cat) => !lineFilter.size || lineFilter.has(cat.Linea))
                .forEach((cat) => {
                    safeArray(cat.SubCategory).forEach((sub) => {
                        const code = sub.Gruppo;
                        if (!code || seen.has(code)) return;
                        seen.add(code);
                        opts.push({ value: code, label: sub.DescrizioneGruppo || sub.Gruppo });
                    });
                });
        });

        return sortOptionsAsc(opts);
    }, [brandsForLines, linea]);

    const famigliaOptions: FDSelectOption<string>[] = useMemo(() => {
        const seen = new Set<string>();
        const opts: FDSelectOption<string>[] = [];
        const lineFilter = new Set(linea);
        const gruppoFilter = new Set(gruppo);

        brandsForLines.forEach((b) => {
            safeArray(b.Categories)
                .filter((cat) => !lineFilter.size || lineFilter.has(cat.Linea))
                .forEach((cat) => {
                    safeArray(cat.SubCategory)
                        .filter((sub) => !gruppoFilter.size || gruppoFilter.has(sub.Gruppo))
                        .forEach((sub) => {
                            safeArray(sub.famiglie).forEach((fam) => {
                                const code = fam.famiglia;
                                if (!code || seen.has(code)) return;
                                seen.add(code);
                                opts.push({ value: code, label: fam.descrizioneFamiglia || fam.famiglia });
                            });
                        });
                });
        });

        return sortOptionsAsc(opts);
    }, [brandsForLines, linea, gruppo]);

    const flagGestOptions = useMemo(() => makeSimpleOptions(mysqlFilters?.flag_gest), [mysqlFilters]);
    const ragProdOptions = useMemo(() => makeSimpleOptions(mysqlFilters?.rag_prod), [mysqlFilters]);
    const buyerOptions = useMemo(() => makeSimpleOptions(mysqlFilters?.buyer), [mysqlFilters]);


    // ——————————————————————————————————————————————————————————
    // HANDLERS (stable)
    // ——————————————————————————————————————————————————————————
    const handleReset = useCallback(() => setFilters({}), [setFilters]);

    const handleBrandChange = useCallback(
        (v: any) => {
            const newBrands = mapToValues(v);
            handleChangeFilters({
                key: "brand",
                value: newBrands,
                deleteProps: ["prefisso", "linea", "gruppo", "famiglia"],
            });
        },
        [handleChangeFilters]
    );

    const handlePrefissoChange = useCallback(
        (v: any) => {
            const newPref = mapToValues(v);
            handleChangeFilters({ key: "prefisso", value: newPref });

            if (!newPref.length) return;

            // Mantiene lo stesso comportamento della versione precedente:
            // ricava i brand compatibili coi prefissi selezionati e li imposta come filtro brand.
            const matchedBrands = safeArray(brands)
                .filter((b) =>
                    safeArray((b as any).PrefissiFornitore).some((p) => newPref.includes(String(p || "").trim()))
                )
                .map((b) => b.Marca)
                .filter(Boolean) as string[];

            handleChangeFilters({ key: "brand", value: matchedBrands });
        },
        [handleChangeFilters, brands]
    );

    const handleLineaChange = useCallback(
        (v: any) => {
            const newLinea = mapToValues(v);
            handleChangeFilters({ key: "linea", value: newLinea, deleteProps: ["gruppo", "famiglia"] });
        },
        [handleChangeFilters]
    );

    const handleGruppoChange = useCallback(
        (v: any) => {
            const newGruppo = mapToValues(v);
            handleChangeFilters({ key: "gruppo", value: newGruppo, deleteProps: ["famiglia"] });
        },
        [handleChangeFilters]
    );

    const handleFamigliaChange = useCallback(
        (v: any) => handleChangeFilters({ key: "famiglia", value: mapToValues(v) }),
        [handleChangeFilters]
    );

    const handleFlagGestChange = useCallback(
        (v: any) => handleChangeFilters({ key: "flagGest", value: mapToValues(v) }),
        [handleChangeFilters]
    );

    const handleRagProdChange = useCallback(
        (v: any) => handleChangeFilters({ key: "ragProd", value: mapToValues(v) }),
        [handleChangeFilters]
    );

    const handleBuyerChange = useCallback(
        (v: any) => handleChangeFilters({ key: "buyer", value: mapToValues(v) }),
        [handleChangeFilters]
    );

    const handleDenomBreveChange = useCallback(
        (e: any) => handleChangeFilters({ key: "denomBreve", value: e?.target?.value || "" }),
        [handleChangeFilters]
    );

    // Config-driven: riduce righe nel render e rende più semplice mantenere i campi.
    const selectFieldConfigs = useMemo(
        () =>
            [
                {
                    key: "brand",
                    label: "Brand",
                    options: brandOptions,
                    value: brand,
                    onChange: handleBrandChange,
                    loading: loadingAny,
                },
                {
                    key: "prefisso",
                    label: "Prefisso Brand",
                    options: prefissoOptions,
                    value: prefisso,
                    onChange: handlePrefissoChange,
                    loading: loadingAny,
                },
                {
                    key: "linea",
                    label: "Linea",
                    options: lineaOptions,
                    value: linea,
                    onChange: handleLineaChange,
                    loading: loadingAny,
                },
                {
                    key: "gruppo",
                    label: "Gruppo",
                    options: gruppoOptions,
                    value: gruppo,
                    onChange: handleGruppoChange,
                    loading: loadingAny,
                },
                {
                    key: "famiglia",
                    label: "Famiglia",
                    options: famigliaOptions,
                    value: famiglia,
                    onChange: handleFamigliaChange,
                    loading: loadingAny,
                },
                {
                    key: "flagGest",
                    label: "Flag Gestionale",
                    options: flagGestOptions,
                    value: flagGest,
                    onChange: handleFlagGestChange,
                    loading: loadingAny,
                },
                {
                    key: "ragProd",
                    label: "Raggruppamento",
                    options: ragProdOptions,
                    value: ragProd,
                    onChange: handleRagProdChange,
                    loading: loadingAny,
                },
            ] as const,
        [
            brandOptions,
            prefissoOptions,
            lineaOptions,
            gruppoOptions,
            famigliaOptions,
            flagGestOptions,
            ragProdOptions,
            brand,
            prefisso,
            linea,
            gruppo,
            famiglia,
            flagGest,
            ragProd,
            handleBrandChange,
            handlePrefissoChange,
            handleLineaChange,
            handleGruppoChange,
            handleFamigliaChange,
            handleFlagGestChange,
            handleRagProdChange,
            loadingAny,
        ]
    );


    // ——————————————————————————————————————————————————————————
    // RETURNED JSX
    // ——————————————————————————————————————————————————————————
    return (
        <div className="flex flex-col gap-3 w-full max-w-[360px] sm:w-[360px]">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Filter</div>
                {onClose ? (
                    <button
                        type="button"
                        className="text-xs text-neutral-300 hover:text-neutral-100"
                        onClick={onClose}
                    >
                        Chiudi
                    </button>
                ) : null}
            </div>

            <div className="grid grid-cols-2 gap-2">
                {selectFieldConfigs.map((f) => (
                    <SelectField
                        key={f.key}
                        label={f.label}
                        loading={f.loading}
                        options={f.options}
                        value={f.value}
                        onChange={f.onChange}
                    />
                ))}

                <InputField
                    label="Denominazione Breve"
                    placeholder="Inserisci denominazione"
                    value={denomBreve}
                    onChange={handleDenomBreveChange}
                />
            </div>

            {isAdminOrDev ? (
                <div className="w-full">
                    <SelectField
                        label="Buyer"
                        loading={loadingAny}
                        options={buyerOptions}
                        value={buyer}
                        onChange={handleBuyerChange}
                        variant="outline"
                    />
                </div>
            ) : null}

            {/* Footer */}
            <div className="w-full flex justify-end items-center gap-2">
                <FDButton variant="outline" color="dark" size="small" radius="md" onClick={handleReset}>
                    Reset
                </FDButton>
            </div>
        </div>
    );
};

export default FiltersMenu;