import React, { useCallback, useMemo } from "react";
import FDBox from "components/UI/box/FDBox";
import { FDInput } from "components/UI/input/FDInput";
import { FiLink2 } from "react-icons/fi";

const FiLink2Icon = FiLink2 as React.FC<{ size?: number; className?: string }>;

/**
 * Riga prodotto su cui effettuare il mapping.
 * - quotation_product_docId: è l'_id della collection quotations_products (associazione quotazione-prodotto)
 * - label: testo mostrato all’utente (es. codice + descrizione)
 */
export type OCFBRow = {
    quotation_product_docId: string;
    label: string;
};

/**
 * Mapping OC/FB per riga prodotto.
 * Regola:
 * - per chiudere con esito positivo serve almeno uno tra oc o fb per ogni riga.
 */
export type OcFbLink = {
    quotation_product_docId: string;
    oc?: string;
    fb?: string;
};

type Props = {
    rows: OCFBRow[];
    value: OcFbLink[];
    onChange: (next: OcFbLink[]) => void;

    /**
     * Facoltativo:
     * - se in futuro vuoi disabilitare il mapping in certe condizioni (es. non requester)
     */
    disabled?: boolean;
};

/**
 * Component “enterprise-grade”:
 * - UI coerente con productsDetails / ClosureWizard:
 *   neutral palette + accento sky, dark theme pulito
 * - Scalabilità:
 *   - update O(1) tramite Map memoizzata
 *   - row component memoizzato
 * - Responsive:
 *   - desktop: tabella
 *   - mobile: cards (senza perdere leggibilità)
 */
export const OCFBMappingTable: React.FC<Props> = ({ rows, value, onChange, disabled }) => {
    /**
     * Mappa lookup per evitare scansioni ripetute dell’array value.
     * - useMemo garantisce che la Map si ricrea solo quando cambia "value".
     */
    const valueMap = useMemo(() => {
        const m = new Map<string, OcFbLink>();
        for (const it of value ?? []) m.set(it.quotation_product_docId, it);
        return m;
    }, [value]);

    /**
     * Aggiornamento immutabile:
     * - crea una nuova lista con la riga aggiornata
     * - evita di fare onChange su ogni keypress se non cambia (guard)
     */
    const updateField = useCallback(
        (quotation_product_docId: string, field: "oc" | "fb", nextVal: string) => {
            const current = valueMap.get(quotation_product_docId);
            const prevVal = (current?.[field] ?? "") as string;

            // Guard: se non cambia, non fare nulla (riduce render a cascata)
            if (prevVal === nextVal) return;

            // Ricostruisco la lista con update mirato
            const next: OcFbLink[] = Array.isArray(value) ? [...value] : [];

            // Cerca index esistente (se esiste) — O(n), ma su N piccolo. Se vuoi O(1) puro:
            // manteniamo un indice Map, ma qui non serve a meno di liste enormi.
            const idx = next.findIndex((x) => x.quotation_product_docId === quotation_product_docId);

            if (idx >= 0) {
                next[idx] = { ...next[idx], [field]: nextVal };
            } else {
                // Se non esiste ancora, lo aggiungiamo
                next.push({ quotation_product_docId, [field]: nextVal });
            }

            onChange(next);
        },
        [onChange, value, valueMap],
    );

    return (
        <FDBox
            radius="2xl"
            pad="none"
            border
            variant="solid"
            color="light"
            className="
              overflow-hidden
              border-neutral-200/70 dark:border-neutral-800
              bg-white/70 dark:bg-neutral-900/50
            "
        >
            {/* Desktop table */}
            <div className="hidden md:block">
                <div className="grid grid-cols-12 gap-0 px-4 py-2 text-[11px] font-semibold text-neutral-600 dark:text-neutral-300">
                    <div className="col-span-6">Prodotto</div>
                    <div className="col-span-3">OC</div>
                    <div className="col-span-3">FB</div>
                </div>

                <div className="divide-y divide-neutral-200/70 dark:divide-neutral-800">
                    {rows.map((r) => {
                        const l = valueMap.get(r.quotation_product_docId);
                        const isMissing = !(l?.oc || l?.fb);

                        return (
                            <RowDesktop
                                key={r.quotation_product_docId}
                                row={r}
                                oc={l?.oc ?? ""}
                                fb={l?.fb ?? ""}
                                isMissing={isMissing}
                                disabled={disabled}
                                onChange={updateField}
                            />
                        );
                    })}
                </div>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-neutral-200/70 dark:divide-neutral-800">
                {rows.map((r) => {
                    const l = valueMap.get(r.quotation_product_docId);
                    const isMissing = !(l?.oc || l?.fb);

                    return (
                        <RowMobile
                            key={r.quotation_product_docId}
                            row={r}
                            oc={l?.oc ?? ""}
                            fb={l?.fb ?? ""}
                            isMissing={isMissing}
                            disabled={disabled}
                            onChange={updateField}
                        />
                    );
                })}
            </div>
        </FDBox>
    );
};

type RowCommonProps = {
    row: OCFBRow;
    oc: string;
    fb: string;
    isMissing: boolean;
    disabled?: boolean;
    onChange: (quotation_product_docId: string, field: "oc" | "fb", nextVal: string) => void;
};

const RowDesktop = React.memo(function RowDesktop({
    row,
    oc,
    fb,
    isMissing,
    disabled,
    onChange,
}: RowCommonProps) {
    return (
        <div
            className={[
                "grid grid-cols-12 gap-3 px-4 py-3 items-center",
                isMissing ? "bg-amber-50/40 dark:bg-amber-500/5" : "",
            ].join(" ")}
        >
            <div className="col-span-6 min-w-0">
                <div data-tooltip-id="general-quotations-tooltip"
                data-tooltip-content={row.label} 
                className="text-sm text-neutral-900 dark:text-neutral-50 truncate">{row.label}</div>
                {isMissing && (
                    <div className="mt-0.5 text-[11px] text-amber-700 dark:text-amber-200">
                        Richiesto OC o FB
                    </div>
                )}
            </div>

            <div className="col-span-3">
                <FDInput
                    size="sm"
                    value={oc}
                    onChange={(e: any) => onChange(row.quotation_product_docId, "oc", e?.target?.value ?? "")}
                    placeholder="OC…"
                    disabled={disabled}
                />
            </div>

            <div className="col-span-3">
                <FDInput
                    size="sm"
                    value={fb}
                    onChange={(e: any) => onChange(row.quotation_product_docId, "fb", e?.target?.value ?? "")}
                    placeholder="FB…"
                    disabled={disabled}
                />
            </div>
        </div>
    );
});

const RowMobile = React.memo(function RowMobile({
    row,
    oc,
    fb,
    isMissing,
    disabled,
    onChange,
}: RowCommonProps) {
    return (
        <div className={["px-4 py-3", isMissing ? "bg-amber-50/40 dark:bg-amber-500/5" : ""].join(" ")}>
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <div className="text-sm text-neutral-900 dark:text-neutral-50 truncate">{row.label}</div>
                    {isMissing && (
                        <div className="mt-0.5 text-[11px] text-amber-700 dark:text-amber-200">
                            Richiesto OC o FB
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
                <div>
                    <div className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 mb-1">OC</div>
                    <FDInput
                        size="sm"
                        value={oc}
                        onChange={(e: any) => onChange(row.quotation_product_docId, "oc", e?.target?.value ?? "")}
                        placeholder="OC…"
                        disabled={disabled}
                    />
                </div>

                <div>
                    <div className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 mb-1">FB</div>
                    <FDInput
                        size="sm"
                        value={fb}
                        onChange={(e: any) => onChange(row.quotation_product_docId, "fb", e?.target?.value ?? "")}
                        placeholder="FB…"
                        disabled={disabled}
                    />
                </div>
            </div>
        </div>
    );
});