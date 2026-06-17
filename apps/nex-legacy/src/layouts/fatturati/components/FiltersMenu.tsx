import React, { useEffect, useMemo, useState } from "react";
import { FDSelect, type FDSelectOption, FDButton } from "@nex/fd-ui";
import { FilterListAsOptionsAPI } from "../fetchdata/filterlist";
import { useUserContext } from "context/UserContext";

import { GetCategoriesAPI } from "../fetchdata/getCategories";
import type { BrandFiltersOut } from "./BrandsPanel";
import { CustomerOption } from "types/customers";
import { SearchCustomersAPI } from "../fetchdata/customers/serchCustomers";
import { enqueueSnackbar } from "components/MessageBox";
import { useTour } from "tour/TourProvider";


// ——————————————————————————————————————————————————————————
// TYPES & INTERFACE
// ——————————————————————————————————————————————————————————
type Famiglia = { famiglia: string; descrizioneFamiglia?: string };
type SubCategory = { Gruppo: string; DescrizioneGruppo?: string; famiglie?: Famiglia[] };
type Categoria = { Linea: string; DescrizioneLinea?: string; SubCategory?: SubCategory[] };
type BrandDoc = {
    _id?: any;
    Marca: string;
    Categories?: Categoria[];
    PrefissiFornitore?: string[];
};
type SysInfo = "FOCELDA" | "ADJ";

export interface FiltersMenuProps {
    sysInfo: SysInfo | string;
    setSysInfo: (s: SysInfo | string) => void;

    capo?: string[];
    setCapo?: (v: string[]) => void;

    /** Stato per il valore del select clienti */
    cli: CustomerOption[];
    setCli: (v: CustomerOption[]) => void;

    /**Mantiene traccia degli Options per il select dei clienti */
    customerOptions: CustomerOption[];
    setCustomerOptions: React.Dispatch<React.SetStateAction<CustomerOption[]>>;

    mag?: string[];
    setMag?: (v: string[]) => void;

    cnv?: string[];
    setCnv?: (v: string[]) => void;

    arg?: string[];
    setArg?: (v: string[]) => void;

    cca?: string[];
    setCca?: (v: string[]) => void;

    age?: string[];
    setAge: (v: string[]) => void;

    buy: string[];
    setBuy: (v: string[]) => void;

    brandFilters?: BrandFiltersOut;
    setBrandFilters?: (v: BrandFiltersOut) => void;

    sysInfoOptions: FDSelectOption[];

    onReset: () => void;
    canImpersonate?: boolean;
};

type SimpleMultiFilterConfig = {
    key: string;
    label: string;
    loading: boolean;
    options: FDSelectOption<string>[];
    value: string[];
    setValue?: (v: string[]) => void;
    placeholder: string;
};

type BrandFilterConfig = {
    key: "brand" | "linea" | "gruppo" | "famiglia";
    label: string;
    options: FDSelectOption<string>[];
    value: string[];
    onChange: (v: unknown) => void;
    placeholder: string;
    disabled: boolean;
};


// ——————————————————————————————————————————————————————————
// UTILS
// ——————————————————————————————————————————————————————————
const FILTERLIST_CACHE = new Map<string, FDSelectOption<string>[]>();
export const invalidateFilterCache = () => FILTERLIST_CACHE.clear();
let BRANDS_CACHE: BrandDoc[] | null = null;

/**
 * Normalizza un valore (singolo o array) in string[]
 * @param v
 * @returns
 */
function toArray(v: unknown): string[] {
    if (Array.isArray(v)) {
        return v.map((x) => String(x).trim()).filter(Boolean);
    }
    if (v == null || String(v).trim() === "") return [];
    return [String(v).trim()];
};

/**
 * Restituisce un array sicuro
 * @param a
 * @returns
 */
function safeArray<T>(a: T[] | undefined | null): T[] {
    return Array.isArray(a) ? a : [];
};

/**
 * Ordina ascendentemente le opzioni del select per label
 * @param opts
 * @returns
 */
function sortOptionsAsc(opts: FDSelectOption<string>[]): FDSelectOption<string>[] {
    return [...opts].sort((a, b) => {
        const la = typeof a.label === "string" ? a.label : String(a.label);
        const lb = typeof b.label === "string" ? b.label : String(b.label);
        return la.localeCompare(lb, "it", { sensitivity: "base" });
    });
};

/**
 * Hook con cache: carica e memorizza le opzioni per un filtro (per sysInfo e chiave filtro)
 * @param filterKey
 * @param sysInfo
 * @param userState
 * @param enabled
 * @returns
 */
function useFilterOptions(
    filterKey: "CAPO" | "CLI" | "MAG" | "CNV" | "ARG" | "CCA" | "AGE" | "BUY",
    sysInfo: string,
    userState?: any,
    enabled: boolean = true
) {
    const [options, setOptions] = useState<FDSelectOption<string>[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!enabled) return;

        const cacheKey = `${filterKey}|${sysInfo}`;

        const cached = FILTERLIST_CACHE.get(cacheKey);
        if (cached && cached.length > 0) {
            setOptions(cached);
            return;
        }

        let cancelled = false;
        const ac = new AbortController();

        (async () => {
            setLoading(true);
            try {
                const opts = await FilterListAsOptionsAPI({
                    userContext: userState,
                    abortController: ac,
                    params: {
                        filter: filterKey,
                        sysInfo: String(sysInfo),
                        page: 1,
                        pageSize: 200,
                        business: {},
                    },
                });

                FILTERLIST_CACHE.set(cacheKey, opts);

                if (!cancelled) {
                    setOptions(opts);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        })();

        return () => {
            cancelled = true;
            ac.abort();
        };
    }, [filterKey, sysInfo, userState, enabled]);

    return { options, loading };
};

// Skeleton: non serve useMemo (e non è una funzione pesante)
const LoadRender = (
    <div className="h-8 w-full bg-neutral-700 rounded animate-pulse" />
);

// Props comuni per coerenza UI (eviti 10 ripetizioni)
const baseSelectProps = {
    fullWidth: true,
    color: "dark" as const,
    variant: "outline" as const,
    size: "xs" as const,
    radius: "md" as const,
};

// Helper inline: rende un field standard (label + skeleton + select)
function renderSelectField<TValue extends unknown>(args: {
    label: string;
    loading?: boolean;
    // opzionale: se vuoi mantenere wrapper coerente anche per sysInfo
    render: () => React.ReactNode;
}) {
    const { label, loading, render } = args;

    return (
        <div className="flex flex-col">
            <span className="text-xs ml-2">{label}</span>
            {loading ? LoadRender : render()}
        </div>
    );
};


// ——————————————————————————————————————————————————————————
// MAIN COMPONENT
// ——————————————————————————————————————————————————————————
/**
 * Menu filtri: gestisce filtri classici + filtri brand (brand/linea/gruppo/famiglia) e filtri admin
 * @param props
 * @returns
 */
const FiltersMenu: React.FC<FiltersMenuProps> = ({
    sysInfo, setSysInfo,
    capo = [], setCapo,
    cli = [], setCli,
    customerOptions, setCustomerOptions,

    mag = [], setMag,
    cnv = [], setCnv,
    arg = [], setArg,
    cca = [], setCca,
    age = [], setAge,
    buy = [], setBuy,
    brandFilters,
    setBrandFilters,
    sysInfoOptions,
    onReset,
    canImpersonate,
}) => {
    const [userState] = useUserContext();

    const [customerSearch, setCustomerSearch] = useState("");
    const [customerLoading, setCustomerLoading] = useState(false);

    const { options: capoOptions, loading: capoLoading } = useFilterOptions(
        "CAPO",
        String(sysInfo),
        userState
    );

    const { options: magOptions, loading: magLoading } = useFilterOptions(
        "MAG",
        String(sysInfo),
        userState
    );
    const { options: cnvOptions, loading: cnvLoading } = useFilterOptions(
        "CNV",
        String(sysInfo),
        userState
    );
    const { options: argOptions, loading: argLoading } = useFilterOptions(
        "ARG",
        String(sysInfo),
        userState
    );
    const { options: ccaOptions, loading: ccaLoading } = useFilterOptions(
        "CCA",
        String(sysInfo),
        userState
    );
    const { options: ageOptions, loading: ageLoading } = useFilterOptions(
        "AGE",
        String(sysInfo),
        userState
    );
    const { options: buyOptions, loading: buyLoading } = useFilterOptions(
        "BUY",
        String(sysInfo),
        userState
    );

    const [brands, setBrands] = useState<BrandDoc[]>([]);
    const [brandsLoading, setBrandsLoading] = useState<boolean>(true);

    useEffect(() => {
        let cancelled = false;

        if (BRANDS_CACHE) {
            setBrands(BRANDS_CACHE);
            setBrandsLoading(false);
            return;
        }

        setBrandsLoading(true);

        const ac = new AbortController();

        const ChangeLoadStatus = ({ bool }: { from: string; bool: boolean }) =>
            setBrandsLoading(bool);

        const setData = (res: any) => {
            const arr = Array.isArray(res) ? (res as BrandDoc[]) : [];
            BRANDS_CACHE = arr;
            if (!cancelled) {
                setBrands(arr);
            }
        };

        GetCategoriesAPI({
            abortController: ac,
            setData,
            ChangeLoadStatus,
        });

        return () => {
            cancelled = true;
        };
    }, []);

    const [brandSel, setBrandSel] = useState<string[]>([]);
    const [lineaSel, setLineaSel] = useState<string[]>([]);
    const [gruppoSel, setGruppoSel] = useState<string[]>([]);
    const [famigliaSel, setFamigliaSel] = useState<string[]>([]);

    const brandOptions: FDSelectOption<string>[] = useMemo(() => {
        const seen = new Set<string>();
        const allowedLines = new Set(lineaSel);
        const opts: FDSelectOption<string>[] = [];

        safeArray(brands).forEach((b) => {
            const marca = b.Marca?.trim();
            if (!marca || seen.has(marca)) return;

            if (allowedLines.size > 0) {
                const hasAllowedLine = safeArray(b.Categories).some((cat) =>
                    allowedLines.has(cat.Linea)
                );
                if (!hasAllowedLine) return;
            }

            seen.add(marca);
            opts.push({ label: marca, value: marca });
        });

        return sortOptionsAsc(opts);
    }, [brands, lineaSel]);

    const selectedBrandDocs = useMemo(
        () => safeArray(brands).filter((b) => b.Marca && brandSel.includes(b.Marca)),
        [brands, brandSel]
    );

    const brandsForLines = useMemo(() => {
        const all = safeArray(brands);
        if (!brandSel.length) return all;
        return all.filter((b) => b.Marca && brandSel.includes(b.Marca));
    }, [brands, brandSel]);

    const lineaOptions: FDSelectOption<string>[] = useMemo(() => {
        const seen = new Set<string>();
        const opts: FDSelectOption<string>[] = [];

        brandsForLines.forEach((b) => {
            safeArray(b.Categories).forEach((cat) => {
                const code = cat.Linea;
                if (!code || seen.has(code)) return;
                seen.add(code);
                opts.push({
                    value: code,
                    label: cat.DescrizioneLinea || cat.Linea,
                });
            });
        });

        return sortOptionsAsc(opts);
    }, [brandsForLines]);

    const categoriaPool: Categoria[] = useMemo(() => {
        if (!lineaSel.length) return [];
        const lineFilter = new Set(lineaSel);
        const brandFilter = new Set(brandSel);
        const result: Categoria[] = [];

        safeArray(brands).forEach((b) => {
            if (brandFilter.size > 0) {
                if (!b.Marca || !brandFilter.has(b.Marca)) return;
            }

            safeArray(b.Categories).forEach((cat) => {
                if (lineFilter.has(cat.Linea)) result.push(cat);
            });
        });

        return result;
    }, [brands, lineaSel, brandSel]);

    const gruppoOptions: FDSelectOption<string>[] = useMemo(() => {
        if (!categoriaPool.length) return [];
        const seen = new Set<string>();
        const opts: FDSelectOption<string>[] = [];

        categoriaPool.forEach((cat) => {
            safeArray(cat.SubCategory).forEach((sc) => {
                const code = sc.Gruppo;
                if (!code || seen.has(code)) return;
                seen.add(code);
                opts.push({
                    value: code,
                    label: sc.DescrizioneGruppo || sc.Gruppo,
                });
            });
        });

        return sortOptionsAsc(opts);
    }, [categoriaPool]);

    const subCategoryPool: SubCategory[] = useMemo(() => {
        if (!categoriaPool.length) return [];
        const groupFilter = new Set(gruppoSel);
        const result: SubCategory[] = [];

        categoriaPool.forEach((cat) => {
            safeArray(cat.SubCategory).forEach((sc) => {
                if (groupFilter.size === 0 || groupFilter.has(sc.Gruppo)) {
                    result.push(sc);
                }
            });
        });

        return result;
    }, [categoriaPool, gruppoSel]);

    const famigliaOptions: FDSelectOption<string>[] = useMemo(() => {
        if (!subCategoryPool.length) return [];
        const seen = new Set<string>();
        const opts: FDSelectOption<string>[] = [];

        subCategoryPool.forEach((sc) => {
            safeArray(sc.famiglie).forEach((f) => {
                const code = f.famiglia;
                if (!code || seen.has(code)) return;
                seen.add(code);
                opts.push({
                    value: code,
                    label: f.descrizioneFamiglia || f.famiglia,
                });
            });
        });

        return sortOptionsAsc(opts);
    }, [subCategoryPool]);

    const onBrandChange = (val: unknown) => {
        const arr = toArray(val);
        setBrandSel(arr);

        if (arr.length > 0) {
            const brandSet = new Set(arr);
            const allowedLines = new Set<string>();

            safeArray(brands).forEach((b) => {
                if (!b.Marca || !brandSet.has(b.Marca)) return;
                safeArray(b.Categories).forEach((cat) => {
                    if (cat.Linea) allowedLines.add(cat.Linea);
                });
            });

            setLineaSel((prev) => prev.filter((code) => allowedLines.has(code)));
        }

        setGruppoSel([]);
        setFamigliaSel([]);
    };

    const onLineaChange = (val: unknown) => {
        const arr = toArray(val);
        setLineaSel(arr);

        if (arr.length > 0) {
            const lineSet = new Set(arr);
            setBrandSel((prev) =>
                prev.filter((code) => {
                    const b = safeArray(brands).find((x) => x.Marca === code);
                    if (!b) return false;
                    return safeArray(b.Categories).some((cat) => lineSet.has(cat.Linea));
                })
            );
        }

        setGruppoSel([]);
        setFamigliaSel([]);
    };

    const onGruppoChange = (val: unknown) => {
        const arr = toArray(val);
        setGruppoSel(arr);
        setFamigliaSel([]);
    };

    const onFamigliaChange = (val: unknown) => {
        setFamigliaSel(toArray(val));
    };

    const PRF = useMemo(() => {
        const prefSet = new Set<string>();

        selectedBrandDocs.forEach((b) => {
            safeArray(b.PrefissiFornitore).forEach((p) => {
                const code = (p ?? "").trim();
                if (code) prefSet.add(code);
            });
        });

        const arr = Array.from(prefSet);
        return arr.length ? arr : undefined;
    }, [selectedBrandDocs]);


    useEffect(() => {
        if (!setBrandFilters) return;
        setBrandFilters({
            PRF,
            LIP: lineaSel.length ? lineaSel : undefined,
            GRU: gruppoSel.length ? gruppoSel : undefined,
            FAM: famigliaSel.length ? famigliaSel : undefined,
        });
    }, [PRF, lineaSel, gruppoSel, famigliaSel, setBrandFilters]);

    useEffect(() => {
        if (!brandFilters) return;

        const isEmpty =
            !brandFilters.PRF?.length &&
            !brandFilters.LIP?.length &&
            !brandFilters.GRU?.length &&
            !brandFilters.FAM?.length;

        if (isEmpty) {
            setBrandSel([]);
            setLineaSel([]);
            setGruppoSel([]);
            setFamigliaSel([]);
        }
    }, [brandFilters?.PRF, brandFilters?.LIP, brandFilters?.GRU, brandFilters?.FAM]);

    /**
    * Effettua la ricerca clienti in base alla stringa di ricerca
    */
    React.useEffect(() => {
        const q = customerSearch.trim();

        const controller = new AbortController();
        const timer = setTimeout(async () => {
            try {
                setCustomerLoading(true);
                const params = new URLSearchParams({
                    query: q,
                    context: "quotations",
                    limit: "20",
                });

                const items = await SearchCustomersAPI({
                    abortController: controller,
                    params: params.toString(),
                });
                if (!items) { enqueueSnackbar("Errore nel recupero dei clienti.", { title: 'Ops..', type: 'error' }); return; }

                //aggiorna lo stato delle opzioni clienti con i risultati evitando duplicati
                setCustomerOptions(prev => {
                    const newItems = items.filter(item => !prev.some(prevItem => prevItem.codiceCliente === item.codiceCliente));
                    return [...prev, ...newItems];
                });
            } catch (err: any) {
                if (err.name !== "AbortError") {
                    console.error("quick-details fetch error", err);
                }
            } finally {
                setCustomerLoading(false);
            }
        }, 300); // debounce 300ms

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [customerSearch, cli]);

    const simpleFilters: SimpleMultiFilterConfig[] = [
        {
            key: "capo",
            label: "Cash & Carry",
            loading: capoLoading,
            options: capoOptions,
            value: capo,
            setValue: setCapo,
            placeholder: "(tutti)",
        },
        {
            key: "mag",
            label: "Magazzino",
            loading: magLoading,
            options: magOptions,
            value: mag,
            setValue: setMag,
            placeholder: "(tutti)",
        },
        {
            key: "cnv",
            label: "Canale di vendita",
            loading: cnvLoading,
            options: cnvOptions,
            value: cnv,
            setValue: setCnv,
            placeholder: "(tutti)",
        },
        {
            key: "arg",
            label: "Area geografica",
            loading: argLoading,
            options: argOptions,
            value: arg,
            setValue: setArg,
            placeholder: "(tutte)",
        },
        {
            key: "cca",
            label: "Causale di vendita",
            loading: ccaLoading,
            options: ccaOptions,
            value: cca,
            setValue: setCca,
            placeholder: "(tutte)",
        },
    ];

    const brandFiltersConfig: BrandFilterConfig[] = [
        {
            key: "brand",
            label: "Marca",
            options: brandOptions,
            value: brandSel,
            onChange: onBrandChange,
            placeholder: "(tutti)",
            disabled: brandsLoading || brandOptions.length === 0,
        },
        {
            key: "linea",
            label: "Linea",
            options: lineaOptions,
            value: lineaSel,
            onChange: onLineaChange,
            placeholder: "(tutte)",
            disabled: brandsLoading || lineaOptions.length === 0,
        },
        {
            key: "gruppo",
            label: "Gruppo",
            options: gruppoOptions,
            value: gruppoSel,
            onChange: onGruppoChange,
            placeholder: "(tutti)",
            disabled: brandsLoading || gruppoOptions.length === 0 || lineaSel.length === 0,
        },
        {
            key: "famiglia",
            label: "Famiglia",
            options: famigliaOptions,
            value: famigliaSel,
            onChange: onFamigliaChange,
            placeholder: "(tutte)",
            disabled: brandsLoading || famigliaOptions.length === 0 || gruppoSel.length === 0,
        },
    ];

    const adminFilters: SimpleMultiFilterConfig[] = [
        { key: "age", label: "Agenti", loading: ageLoading, options: ageOptions, value: age, setValue: setAge, placeholder: "(tutti)" },
        { key: "buy", label: "Buyers", loading: buyLoading, options: buyOptions, value: buy, setValue: setBuy, placeholder: "(tutti)" },
    ];

    // Tour system: disabilitare i filtri durante gli step
    /* TOUR SYSTEM */
    //const per blocco interazioni durante gli step del tour
    const { isOpen, index: tourIndex } = useTour();
    const lockInteractions = isOpen && tourIndex >= 5 && tourIndex <= 9;


    return (
        <div className="flex flex-col gap-3 w-[380px] max-h-180 overflow-auto p-2">
            {lockInteractions && (
                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 10,
                        pointerEvents: "auto",
                    }}
                    onClickCapture={(e) => e.stopPropagation()}
                />
            )}
            {/* Header */}
            <div className="text-sm font-medium">Filtri</div>

            {/* Filtri classici */}
            <div className="space-y-2" data-tour="fatturati-topbar-filter-business">
                <div className="flex flex-col">
                    <span className="text-xs ml-2">Cliente</span>
                    <FDSelect
                        options={customerOptions.map(c => ({
                            id: c.id,
                            value: c,
                            label: `${c.ragioneSociale} (${c.codiceCliente})`,
                        }))}
                        value={cli}
                        onChange={(v: any) => {
                            //gestione multi select
                            setCli(v);
                            //posiziona in cima le opzioni selezionate
                            setCustomerOptions(prev => {
                                console.log("val:", v);
                                const selected = prev.filter(c => v.some((x: CustomerOption) => x.codiceCliente === c.codiceCliente));
                                const unselected = prev.filter(c => !v.some((x: CustomerOption) => x.codiceCliente === c.codiceCliente));
                                return [...selected, ...unselected];
                            });
                        }}
                        placeholder="Cerca per ragione sociale, P.IVA, CF o codice…"
                        size="xs"
                        variant="outline"
                        color="dark"
                        radius="md"
                        fullWidth
                        multiple
                        clearable
                        searchable
                        loading={customerLoading}
                        onSearchChange={(text: string) => setCustomerSearch(text)}
                        menuMaxHeight={320}
                        virtualized={false} // disabilita rowH fisso + windowing
                        renderOption={(opt: any, selected: boolean) => {
                            const c = opt.value as CustomerOption;
                            return (
                                <div className="flex flex-col gap-1 leading-tight cursor-pointer">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium text-sm">
                                            {c.ragioneSociale}
                                        </span>
                                        <div>
                                            <span className={`inline-block mr-2 w-2 h-2 rounded-full ${selected ? "bg-yellow-500/80" : ""}`} />
                                            <span className="text-[10px] px-2 py-[2px] rounded-full bg-blue-500/20 text-blue-200">
                                                {c.codiceCliente}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2 text-[10px] text-gray-500 dark:text-gray-400">
                                        {c.partitaIVA && <span>P.IVA {c.partitaIVA}</span>}
                                        {c.codiceFiscale && <span>CF {c.codiceFiscale}</span>}
                                        {c.fido && (
                                            <span className="ml-auto font-medium text-xs">
                                                Fido: {c.fido.saldoCliente.toLocaleString("it-IT")} / {c.fido.fidoTotale.toLocaleString("it-IT")}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        }}
                    />
                </div>

                {simpleFilters.map((f) =>
                    renderSelectField({
                        label: f.label,
                        loading: f.loading,
                        render: () => (
                            <FDSelect
                                {...baseSelectProps}
                                options={f.options}
                                value={f.value}
                                onChange={(v) => f.setValue?.(toArray(v))}
                                multiple
                                searchable
                                placeholder={f.placeholder}
                                clearable
                                loading={f.loading}
                            />
                        ),
                    })
                )}
            </div>

            {/* Filtri Brand */}
            <div className="flex flex-col gap-2 mt-4" data-tour="fatturati-topbar-filter-brand">
                <h1 className="text-lg">Brand</h1>

                {brandFiltersConfig.map((f) =>
                    renderSelectField({
                        label: f.label,
                        loading: brandsLoading,
                        render: () => (
                            <FDSelect
                                {...baseSelectProps}
                                options={f.options}
                                value={f.value}
                                onChange={f.onChange}
                                multiple
                                searchable
                                placeholder={f.placeholder}
                                clearable
                                loading={brandsLoading}
                                disabled={f.disabled}
                            />
                        ),
                    })
                )}
            </div>

            {/* Filtri Admin */}
            {canImpersonate && (
                <div className="flex flex-col gap-2 mt-4" data-tour="fatturati-topbar-filter-admin">
                    <h1 className="text-lg">Admin</h1>
                    {adminFilters.map((f) =>
                        renderSelectField({
                            label: f.label,
                            loading: f.loading,
                            render: () => (
                                <FDSelect
                                    {...baseSelectProps}
                                    options={f.options}
                                    value={f.value}
                                    onChange={(v) => f.setValue?.(toArray(v))}
                                    multiple
                                    searchable
                                    placeholder={f.placeholder}
                                    clearable
                                    loading={f.loading}
                                />
                            ),
                        })
                    )}

                    {/*<div className="flex flex-col">
                        <span className="text-xs ml-2">Agenti</span>
                        {ageLoading ? (
                            LoadRender
                        ) : (
                            <FDSelect
                                options={ageOptions}
                                value={age}
                                loading={ageLoading}
                                multiple
                                searchable
                                placeholder="(tutti)"
                                fullWidth
                                color="dark"
                                variant="outline"
                                clearable
                                size="xs"
                                onChange={(v) => setAge(toArray(v))}
                                radius="md"
                            />
                        )}
                    </div>

                    <div className="flex flex-col">
                        <span className="text-xs ml-2">Buyers</span>
                        {buyLoading ? (
                            LoadRender
                        ) : (
                            <FDSelect
                                options={buyOptions}
                                value={buy}
                                loading={buyLoading}
                                multiple
                                searchable
                                placeholder="(tutti)"
                                fullWidth
                                color="dark"
                                variant="outline"
                                clearable
                                size="xs"
                                onChange={(v) => setBuy(toArray(v))}
                                radius="md"
                            />
                        )}
                    </div>*/}
                </div>
            )}

            {/* Footer */}
            <div className="flex justify-end pt-1">
                <FDButton
                    data-tour="fatturati-topbar-filters-reset"
                    size="small"
                    radius="md"
                    variant="outline"
                    color="dark"
                    onClick={onReset}
                >
                    Reset
                </FDButton>
            </div>
        </div>
    );
};

export default FiltersMenu;