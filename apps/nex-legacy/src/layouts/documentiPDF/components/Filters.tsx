import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FDSelect, FDSelectOption, FDDate, FDInput, FDIconButton } from "@nex/fd-ui";
import { IoCloseSharp } from "react-icons/io5";
import { SerchCustomersAPI } from "../fetchData/serchCustomers";

const CloseIcon = IoCloseSharp as React.FC<{ size?: number; className?: string }>;
const filterTypeOptions = ["Fattura", "Bolla", "Cliente"] as const;

const companyOptions: FDSelectOption<"FOCELDA" | "IOT" | "">[] = [
    { value: "", label: "Tutte" },
    { value: "FOCELDA", label: "Focelda" },
    { value: "IOT", label: "IOT" },
];

const typeOptions: FDSelectOption<string>[] = [
    { value: "", label: "Tutte" },
    ...filterTypeOptions.map((t) => ({ value: t, label: t })),
];

// helper: estrai codice cliente robusto da shape variabile
function getCcValue(c: any): string {
    const raw = c?.CodiceCliente;
    const cc =
        (raw && typeof raw === "object" ? (raw.Focelda ?? raw.IOT) : raw) ??
        c?.codice_cliente ??
        c?.codiceCliente ??
        "";
    return String(cc || "").trim();
};

const DEBOUNCE_MS = 280;

type CustomerApiRow = {
    CodiceCliente?: any;
    CodiceFiscale?: string;
    PartitaIva?: string;
    RagioneSociale?: string;
    Email?: string | null;
};

const FiltersPanelInMenu: React.FC<{
    dateFrom: string;
    setDateFrom: (d: string) => void;
    dateTo: string;
    setDateTo: (d: string) => void;

    filterCompany: string;
    setFilterCompany: (c: string) => void;

    filterType: string;
    setFilterType: (t: string) => void;

    filterCc: string;
    setFilterCc: (cc: string) => void;

    //nuovo filtro codice prodotto
    filterCdar: string;
    setFilterCdar: (cdar: string) => void;

    // documento selezionato
    filterDocId: string;
    setFilterDocId: (id: string) => void;
    filterDocNum: string; // SOLO UI (mostra solo il numero documento)
    setFilterDocNum: (n: string) => void;
}> = ({
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    filterCompany,
    setFilterCompany,
    filterType,
    setFilterType,
    filterCc,
    setFilterCc,
    filterCdar, //nuovo filtro prodotto
    setFilterCdar,
    filterDocId,
    setFilterDocId,
    filterDocNum,
    setFilterDocNum,
}) => {
        // ------------------------------------------------------------
        // Cliente (FDSelect + remote search)
        // ------------------------------------------------------------
        const [customerSearch, setCustomerSearch] = useState<string>("");
        const [customerLoading, setCustomerLoading] = useState(false);
        const [customers, setCustomers] = useState<CustomerApiRow[]>([]);

        // SerchCustomersAPI richiede MutableRefObject<AbortController|null>
        const abortCustomersRef = useRef<AbortController | null>(null);

        // debounce timer
        const debounceId = useRef<number | null>(null);

        // race guard
        const reqSeq = useRef(0);

        const buildCustomerQuery = useCallback(
            (term: string) => {
                const p = new URLSearchParams();
                const q = term.trim();
                if (q) p.set("q", q);
                if (filterCompany) p.set("from", filterCompany);
                if (dateFrom) p.set("da", dateFrom);
                if (dateTo) p.set("a", dateTo);
                return p.toString();
            },
            [filterCompany, dateFrom, dateTo]
        );

        const fetchCustomers = useCallback(
            async (term: string) => {
                const q = term.trim();

                // regola: non chiamiamo API sotto i 2 char
                if (q.length < 2) {
                    setCustomers([]);
                    setCustomerLoading(false);
                    return;
                }

                const mySeq = ++reqSeq.current;

                // abort precedente
                if (abortCustomersRef.current) abortCustomersRef.current.abort();
                abortCustomersRef.current = new AbortController();

                setCustomerLoading(true);

                try {
                    const query = buildCustomerQuery(q);

                    const data: any = await SerchCustomersAPI({
                        abortController: abortCustomersRef as any,
                        query,
                        HandleError: console.error,
                        ChangeLoadStatus: () => { },
                    });

                    if (mySeq !== reqSeq.current) return;

                    // normalizza
                    setCustomers(Array.isArray(data) ? (data as CustomerApiRow[]) : []);
                } catch (err: any) {
                    if (err?.name === "AbortError") return;
                    console.error(err);
                    if (mySeq !== reqSeq.current) return;
                    setCustomers([]);
                } finally {
                    if (mySeq === reqSeq.current) setCustomerLoading(false);
                }
            },
            [buildCustomerQuery]
        );

        // debounce su customerSearch
        useEffect(() => {
            if (debounceId.current) window.clearTimeout(debounceId.current);

            const q = customerSearch.trim();
            if (q.length < 2) {
                // pulizia immediata
                setCustomers([]);
                setCustomerLoading(false);
                return;
            }

            debounceId.current = window.setTimeout(() => {
                fetchCustomers(q);
            }, DEBOUNCE_MS) as unknown as number;

            return () => {
                if (debounceId.current) window.clearTimeout(debounceId.current);
            };
        }, [customerSearch, fetchCustomers]);

        // quando cambiano i filtri “contesto” (azienda/date) e c’è una search valida, ricarica
        useEffect(() => {
            const q = customerSearch.trim();
            if (q.length >= 2) fetchCustomers(q);
        }, [filterCompany, dateFrom, dateTo]);

        // mappa risultati -> opzioni (dedupe per cc)
        const customerOptions = useMemo((): FDSelectOption<string>[] => {
            const base: FDSelectOption<string>[] = [{ value: "", label: "Tutti" }];
            if (!customers?.length) return base;

            const seen = new Set<string>();
            const mapped = customers
                .map((c) => {
                    const cc = getCcValue(c);
                    if (!cc || seen.has(cc)) return null;
                    seen.add(cc);

                    const rs = String(c?.RagioneSociale ?? "").trim();
                    const label = rs ? `${rs} (${cc})` : cc;

                    return { value: cc, label } as FDSelectOption<string>;
                })
                .filter(Boolean) as FDSelectOption<string>[];

            return [...base, ...mapped];
        }, [customers]);

        // assicura che il selezionato sia sempre visibile
        const customerOptionsWithSelected = useMemo(() => {
            if (!filterCc) return customerOptions;
            const has = customerOptions.some((o) => o.value === filterCc);
            if (has) return customerOptions;

            const injected: FDSelectOption<string> = { value: filterCc, label: filterCc };
            // mantiene "Tutti" come prima
            if (customerOptions.length && customerOptions[0].value === "") {
                return [customerOptions[0], injected, ...customerOptions.slice(1)];
            }
            return [injected, ...customerOptions];
        }, [customerOptions, filterCc]);

        const clearCustomer = useCallback(() => {
            setFilterCc("");
        }, [setFilterCc]);

        // cleanup
        useEffect(() => {
            return () => {
                if (abortCustomersRef.current) abortCustomersRef.current.abort();
                if (debounceId.current) window.clearTimeout(debounceId.current);
            };
        }, []);

        return (
            <div className="w-[360px] max-w-full space-y-4">
                {/* Header */}
                <div className="text-sm font-medium">Filtri</div>

                {/* Documento selezionato */}
                {(filterDocId || filterDocNum) && (
                    <div className="flex items-center justify-between text-xs mb-2">
                        <span className="opacity-80">Documento selezionato</span>
                        <div className="flex items-center space-x-2">
                            <span className="max-w-[180px] truncate">{filterDocNum || "N/A"}</span>
                            <FDIconButton
                                icon={<CloseIcon />}
                                onClick={() => {
                                    setFilterDocId("");
                                    setFilterDocNum("");
                                }}
                                size="small"
                                variant="danger"
                            />
                        </div>
                    </div>
                )}

                {/* Cliente selezionato */}
                {filterCc && (
                    <div className="flex items-center justify-between text-xs mb-4">
                        <span className="opacity-80">Cliente selezionato</span>
                        <div className="flex items-center space-x-2">
                            <span className="max-w-[180px] truncate">{filterCc ?? "N/A"}</span>
                            <FDIconButton icon={<CloseIcon />} onClick={clearCustomer} size="small" variant="danger" />
                        </div>
                    </div>
                )}

                {/* Cliente (FDSelect → remote search) */}
                <div data-tour="docs-filters-customer">
                    <div className="flex items-center justify-start text-xs mb-1">
                        <span className="opacity-80">Cliente</span>
                    </div>

                    <FDSelect
                        options={customerOptionsWithSelected}
                        value={filterCc}
                        onChange={(v: any) => {
                            const next = (v as string) ?? "";
                            setFilterCc(next);

                            if (next) {
                                setFilterDocId("");
                                setFilterDocNum("");
                            }
                        }}
                        placeholder="Cerca per ragione sociale o codice…"
                        size="sm"
                        variant="outline"
                        color="dark"
                        radius="md"
                        fullWidth
                        searchable
                        menuMaxHeight={320}
                        virtualized={false}
                        loading={customerLoading}
                        onSearchChange={(text) => setCustomerSearch(text)}
                        onMenuOpen={() => {
                            const q = customerSearch.trim();
                            if (q.length >= 2 && customers.length === 0) fetchCustomers(q);
                        }}
                    />
                </div>

                {/* Codice prodotto (WCDAR) */}
                <div data-tour="docs-filters-cdar">
                    <div className="flex items-center justify-start text-xs mb-1">
                        <span className="opacity-80">Codice interno prodotto</span>
                    </div>

                    <FDInput
                        value={filterCdar}
                        size="sm"
                        color="dark"
                        onChange={(e) => {
                            /*
                            TASK: cdar è numerico (WCDAR è CHAR(6) con valori numerici)
                            - filtriamo qui input non numerico per evitare query “sporche”
                            - non facciamo padStart: lo fa già il BE (normalizeQuery)
                            */
                            const next = e.target.value.replace(/\s+/g, "");
                            if (!/^\d*$/.test(next)) return;
                            setFilterCdar(next);

                            /*
                            Se imposto un filtro “per prodotto”, un docId selezionato può bloccare i risultati.
                            Quindi quando cdar è valorizzato, resettiamo l’eventuale selezione singolo documento.
                            */
                            if (next) {
                                setFilterDocId("");
                                setFilterDocNum("");
                            }
                        }}
                        placeholder="Es: 065036"
                        inputMode="numeric"
                    />

                </div>

                {/* Date range */}
                <div data-tour="docs-filters-date">
                    <div className="flex items-center justify-between text-xs mb-1">
                        <span className="opacity-80">Select Date</span>
                        <button
                            className="text-xs text-blue-400 hover:underline"
                            onClick={() => {
                                setDateFrom("");
                                setDateTo("");
                            }}
                        >
                            Clear
                        </button>
                    </div>
                    <FDDate
                        range
                        value={{ from: dateFrom || undefined, to: dateTo || undefined }}
                        onChange={(v) => {
                            setDateFrom(v.from || "");
                            setDateTo(v.to || "");
                        }}
                        size="sm"
                        variant="outline"
                        radius="md"
                        color="dark"
                        fullWidth
                    />
                </div>

                {/* Company */}
                <div data-tour="docs-filters-agency">
                    <div className="flex items-center justify-between text-xs mb-1">
                        <span className="opacity-80">Azienda</span>
                    </div>
                    <FDSelect
                        options={companyOptions}
                        value={filterCompany as any}
                        onChange={(v: any) => setFilterCompany(v)}
                        placeholder="Tutte"
                        size="sm"
                        variant="outline"
                        color="dark"
                        radius="md"
                        fullWidth
                        searchable
                        menuMaxHeight={240}
                    />
                </div>

                {/* Type */}
                <div data-tour="docs-filters-type">
                    <div className="flex items-center justify-between text-xs mb-1">
                        <span className="opacity-80">Tipologia</span>
                    </div>
                    <FDSelect
                        options={typeOptions}
                        value={filterType}
                        onChange={(v) => setFilterType((v as string) ?? "")}
                        placeholder="Tutte"
                        size="sm"
                        variant="outline"
                        color="dark"
                        radius="md"
                        fullWidth
                        searchable
                        menuMaxHeight={240}
                    />
                </div>

                {/* Footer actions */}
                <div className="flex items-center justify-between pt-1" >
                    <button
                        data-tour="docs-filters-reset"
                        className="px-3 py-2 text-sm rounded-md border border-[#2a2a2a] hover:bg-[#2a2a2a]"
                        onClick={() => {
                            setDateFrom("");
                            setDateTo("");
                            setFilterCompany("");
                            setFilterType("");
                            setFilterCc("");
                            setFilterCdar(""); //reset filtro codice prodotto come per gli altri
                            setFilterDocId("");
                            setFilterDocNum("");

                            setCustomerSearch("");
                            setCustomers([]);
                            setCustomerLoading(false);
                            if (abortCustomersRef.current) abortCustomersRef.current.abort();
                        }}
                    >
                        Reset
                    </button>
                </div>
            </div>
        );
    };

export default memo(FiltersPanelInMenu);