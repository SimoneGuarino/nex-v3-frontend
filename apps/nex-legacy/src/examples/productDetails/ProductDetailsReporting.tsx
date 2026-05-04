import React, { MutableRefObject, useEffect, useMemo, useState } from "react";
import FDButton from "components/UI/buttons/FDButton";
import { SidePanelShell } from "layouts/quotazioni/sidePanel/SidePanelShell";
import { HeaderSection } from "./components/HeaderSection";
import MainInfoSection from "./components/MainInfoSection";
import SideInfoSection from "./components/SideInfoSection";
import RelatedProductsSection from "./components/RelatedProductsSection";
import SuppliersSection from "./components/SuppliersSection";
import { useProductDetails } from "./hook/useProductDetails";
import { ProductDetailsDTO } from "./types/product";
import { Tooltip } from "react-tooltip";
import { FiAlertTriangle } from "react-icons/fi";

const FiAlertTriangleIcon = FiAlertTriangle as React.FC<{ className?: string }>;

/**
 * ProductDetailsReporting
 *
 * Questo pannello è la variante "quotazioni" del dettaglio prodotto:
 * - `reportMode = false`: stessa visualizzazione di ProductDetailsPanel (read-only)
 * - `reportMode = true`: stessi dati principali, ma editabili per segnalazione anomalia
 *
 * Obiettivo della separazione da ProductDetailsPanel:
 * - tenere il read-only puro stabile
 * - concentrare qui validazioni (nota obbligatoria), diff e submit segnalazione
 *
 * Vincolo funzionale:
 * - immagini e prodotti correlati restano sempre non modificabili.
 */
type ProductDetailsReportingProps = {
    onClose: () => void;
    productId: string | null;
    onReportProductAnomaly?: (payload: {
        note: string;
        original: Record<string, any>;
        patch: Record<string, any>;
    }) => void;
    reportingAnomaly?: boolean;
    abortController: MutableRefObject<AbortController | null>;
};

type EditableAttribute = {
    group: string;
    name: string;
    value: string;
    highlight: boolean;
};

type ProductDraft = {
    id: string;
    codice: string;
    codiceProduttore: string;
    ean: string;
    status: string;
    attributes: EditableAttribute[];
};

const toText = (value: unknown): string =>
    value === null || value === undefined ? "" : String(value);

const buildDraft = (product: ProductDetailsDTO): ProductDraft => ({
    id: toText(product.id),
    codice: toText(product.codice),
    codiceProduttore: toText(product.codiceProduttore),
    ean: toText(product.ean),
    status: toText(product.status),
    attributes: (product.attributes ?? []).map((attribute) => ({
        group: toText(attribute.group),
        name: toText(attribute.name),
        value: toText(attribute.value),
        highlight: !!attribute.highlight,
    })),
});

const normalize = (value: any): any => {
    if (Array.isArray(value)) return value.map(normalize);
    if (value && typeof value === "object") {
        return Object.keys(value)
            .sort()
            .reduce((acc, key) => {
                acc[key] = normalize(value[key]);
                return acc;
            }, {} as Record<string, any>);
    }
    if (typeof value === "string") return value.trim();
    return value;
};

/**
 * Deep diff minimale:
 * ritorna solo i campi realmente cambiati, così il payload evento su Mongo
 * resta compatto e leggibile.
 */
const deepDiff = (original: any, current: any): any => {
    if (Array.isArray(original) || Array.isArray(current)) {
        const left = JSON.stringify(normalize(original ?? []));
        const right = JSON.stringify(normalize(current ?? []));
        return left === right ? undefined : current;
    }

    if (original && current && typeof original === "object" && typeof current === "object") {
        const patch: Record<string, any> = {};
        const keys = new Set([...Object.keys(original), ...Object.keys(current)]);
        keys.forEach((key) => {
            const delta = deepDiff(original[key], current[key]);
            if (delta !== undefined) patch[key] = delta;
        });
        return Object.keys(patch).length ? patch : undefined;
    }

    return JSON.stringify(normalize(original)) === JSON.stringify(normalize(current))
        ? undefined
        : current;
};

const EditableInput = (props: {
    label: string;
    value: string;
    onChange?: (next: string) => void;
    disabled?: boolean;
}) => (
    <label className="flex flex-col gap-1">
        <span className="text-[10px] uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400">
            {props.label}
        </span>
        <input
            value={props.value}
            disabled={props.disabled}
            onChange={(event) => props.onChange?.(event.target.value)}
            className="rounded-lg border border-neutral-200 bg-white px-2.5 py-2 text-xs text-neutral-800 outline-none transition focus:border-sky-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-sky-600 disabled:bg-neutral-100 disabled:text-neutral-500 dark:disabled:bg-neutral-800 dark:disabled:text-neutral-400"
        />
    </label>
);

const EditableArea = (props: {
    label: string;
    value: string;
    onChange: (next: string) => void;
    rows?: number;
    placeholder?: string;
}) => (
    <label className="flex flex-col gap-1">
        <span className="text-[10px] uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400">
            {props.label}
        </span>
        <textarea
            rows={props.rows ?? 3}
            value={props.value}
            onChange={(event) => props.onChange(event.target.value)}
            placeholder={props.placeholder}
            className="rounded-lg border border-neutral-200 bg-white px-2.5 py-2 text-xs text-neutral-800 outline-none transition focus:border-sky-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-sky-600"
        />
    </label>
);

const EditableSwitch = (props: {
    label: string;
    checked: boolean;
    onChange: (next: boolean) => void;
}) => (
    <label className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[11px] text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200">
        <input
            type="checkbox"
            checked={props.checked}
            onChange={(event) => props.onChange(event.target.checked)}
            className="h-3.5 w-3.5 rounded border-neutral-300 text-sky-600 focus:ring-sky-500 dark:border-neutral-700"
        />
        {props.label}
    </label>
);

const draftToPreviewProduct = (
    base: ProductDetailsDTO,
    draft: ProductDraft,
): ProductDetailsDTO => ({
    ...base,
    id: draft.id,
    codice: draft.codice || null,
    codiceProduttore: draft.codiceProduttore || null,
    ean: draft.ean || null,
    status: draft.status || null,
    attributes: draft.attributes.map((attribute) => ({
        group: attribute.group,
        name: attribute.name,
        value: attribute.value,
        highlight: attribute.highlight,
    })),
});

export const ProductDetailsReporting: React.FC<ProductDetailsReportingProps> = ({
    onClose,
    productId,
    onReportProductAnomaly,
    reportingAnomaly = false,
    abortController,
}) => {
    const {
        product,
        isLoading,
        error,
        reload,
        canSeePrices,
        variationHistory,
        isVariationLoading,
        variationError,
        variationRange,
        setVariationRange,
        selectedSupplier,
        selectSupplier,
    } = useProductDetails(productId, abortController);

    const [reportMode, setReportMode] = useState(false);
    const [note, setNote] = useState("");
    const [formError, setFormError] = useState<string | null>(null);
    const [formSuccess, setFormSuccess] = useState<string | null>(null);
    const [originalDraft, setOriginalDraft] = useState<ProductDraft | null>(null);
    const [draft, setDraft] = useState<ProductDraft | null>(null);

    useEffect(() => {
        if (!product) return;
        const next = buildDraft(product);
        setOriginalDraft(next);
        setDraft(next);
        setNote("");
        setFormError(null);
        setFormSuccess(null);
        setReportMode(false);
    }, [product]);

    const previewProduct = useMemo(() => {
        if (!product || !draft) return product;
        return draftToPreviewProduct(product, draft);
    }, [draft, product]);

    const patch = useMemo(() => {
        if (!originalDraft || !draft) return undefined;
        return deepDiff(originalDraft, draft);
    }, [originalDraft, draft]);

    //const canSubmitReport = !!note.trim() && !!patch && !reportingAnomaly;

    const submit = async () => {
        if (!onReportProductAnomaly || !originalDraft || !draft) return;

        const cleanNote = note.trim();
        if (!cleanNote) {
            setFormError("La nota è obbligatoria.");
            setFormSuccess(null);
            return;
        }

        if (!patch) {
            setFormError("Non hai modificato nessun campo.");
            setFormSuccess(null);
            return;
        }

        setFormError(null);
        await Promise.resolve(
            onReportProductAnomaly({
                note: cleanNote,
                original: originalDraft,
                patch,
            }),
        );

        // Dopo invio: ripristino bozza originale e uscita da modalità report.
        setDraft(originalDraft);
        setReportMode(false);
        setNote("");
        setFormSuccess("Segnalazione inviata con successo.");
    };

    return (
        <>
            <SidePanelShell
                title={previewProduct?.codiceProduttore || previewProduct?.codice || "Dettagli prodotto"}
                animateVariant="visible"
                contentState="front"
                headerRight={
                    <button
                        type="button"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-700 shadow-sm transition hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-950/70"
                        data-tooltip-id="product-reporting-help-tooltip"
                        data-tooltip-content="[IN SVILUPPO] Segnala anomalie sui campi della scheda prodotto."
                        aria-label="Info segnalazione scheda prodotto"
                    >
                        <FiAlertTriangleIcon className="h-4 w-4" />
                    </button>
                }
                onClose={onClose}
            >
                {isLoading && (
                    <div className="flex h-full items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                            <div className="h-10 w-10 animate-spin rounded-full border-2 border-neutral-300 border-t-transparent dark:border-neutral-700" />
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                Carico i dettagli del prodotto...
                            </p>
                        </div>
                    </div>
                )}

                {!isLoading && error && (
                    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                        <p className="text-sm text-red-500">{error}</p>
                        <button
                            onClick={reload}
                            className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-900"
                        >
                            Riprova
                        </button>
                    </div>
                )}

                {!isLoading && !error && previewProduct && draft && (
                    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4 md:p-5">
                        <HeaderSection product={previewProduct} />

                        {!reportMode && (
                            <>
                                {canSeePrices && (
                                    <SuppliersSection
                                        product={previewProduct}
                                        variationHistory={variationHistory}
                                        isVariationLoading={isVariationLoading}
                                        variationError={variationError}
                                        selectedKey={selectedSupplier}
                                        onChangeSelectedKey={selectSupplier}
                                        trendRange={variationRange}
                                        onChangeTrendRange={setVariationRange}
                                    />
                                )}

                                <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
                                    <MainInfoSection product={previewProduct} />
                                    <SideInfoSection product={previewProduct} canSeePrices={canSeePrices} />
                                </div>
                            </>
                        )}

                        {reportMode && (
                            <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
                                <section className="rounded-2xl border border-neutral-200/80 bg-white/95 p-4 shadow-sm dark:border-neutral-700/80 dark:bg-neutral-900/80 dark:shadow-none">
                                    <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                                        Scheda prodotto (modificabile)
                                    </h3>

                                    <div className="mt-4">
                                        <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-600 dark:text-neutral-300">
                                            Specifiche tecniche (modificabile)
                                        </h4>
                                        <div className="mt-2 grid gap-2 md:grid-cols-2">
                                            {draft.attributes.map((attribute, idx) => (
                                                <div
                                                    key={`${attribute.group}-${attribute.name}-${idx}`}
                                                    className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/80"
                                                >
                                                    <div className="grid gap-2">
                                                        <EditableInput
                                                            label="Gruppo"
                                                            value={attribute.group}
                                                            onChange={(value) =>
                                                                setDraft((prev) => {
                                                                    if (!prev) return prev;
                                                                    const next = [...prev.attributes];
                                                                    next[idx] = { ...next[idx], group: value };
                                                                    return { ...prev, attributes: next };
                                                                })
                                                            }
                                                        />
                                                        <EditableInput
                                                            label="Campo"
                                                            value={attribute.name}
                                                            onChange={(value) =>
                                                                setDraft((prev) => {
                                                                    if (!prev) return prev;
                                                                    const next = [...prev.attributes];
                                                                    next[idx] = { ...next[idx], name: value };
                                                                    return { ...prev, attributes: next };
                                                                })
                                                            }
                                                        />
                                                        <EditableInput
                                                            label="Valore"
                                                            value={attribute.value}
                                                            onChange={(value) =>
                                                                setDraft((prev) => {
                                                                    if (!prev) return prev;
                                                                    const next = [...prev.attributes];
                                                                    next[idx] = { ...next[idx], value };
                                                                    return { ...prev, attributes: next };
                                                                })
                                                            }
                                                        />
                                                        <EditableSwitch
                                                            label="In evidenza"
                                                            checked={attribute.highlight}
                                                            onChange={(value) =>
                                                                setDraft((prev) => {
                                                                    if (!prev) return prev;
                                                                    const next = [...prev.attributes];
                                                                    next[idx] = { ...next[idx], highlight: value };
                                                                    return { ...prev, attributes: next };
                                                                })
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </section>

                                <aside className="flex flex-col gap-3">
                                    <section className="rounded-2xl border border-neutral-200 bg-white/95 p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-900/80 dark:shadow-none">
                                        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-600 dark:text-neutral-300">
                                            Stato e identificativi
                                        </h3>
                                        <div className="mt-2 grid gap-2">
                                            <EditableInput label="ID NEX" value={draft.id} disabled />
                                            <EditableInput
                                                label="Codice interno"
                                                value={draft.codice}
                                                onChange={(value) => setDraft((prev) => (prev ? { ...prev, codice: value } : prev))}
                                            />
                                            <EditableInput
                                                label="Codice produttore"
                                                value={draft.codiceProduttore}
                                                onChange={(value) =>
                                                    setDraft((prev) => (prev ? { ...prev, codiceProduttore: value } : prev))
                                                }
                                            />
                                            <EditableInput
                                                label="EAN"
                                                value={draft.ean}
                                                onChange={(value) => setDraft((prev) => (prev ? { ...prev, ean: value } : prev))}
                                            />
                                            <EditableInput
                                                label="Stato prodotto"
                                                value={draft.status}
                                                onChange={(value) => setDraft((prev) => (prev ? { ...prev, status: value } : prev))}
                                            />
                                        </div>
                                    </section>
                                </aside>
                            </div>
                        )}

                        {previewProduct.relatedProducts && previewProduct.relatedProducts.length > 0 && (
                            <RelatedProductsSection related={previewProduct.relatedProducts} />
                        )}

                        <section className="rounded-2xl border border-neutral-200 bg-white/95 p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-900/80 dark:shadow-none">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400">
                                        Segnalazioni sulla scheda prodotto
                                    </p>
                                    <p className="text-xs text-neutral-600 dark:text-neutral-300">
                                        Per segnalare una o più anomalie, compila i campi corretti e inserisci una nota che spieghi la modifica.
                                    </p>
                                </div>

                                {!reportMode ? (
                                    <FDButton
                                        variant="outline"
                                        size="small"
                                        color="warning"
                                        // disabled={!onReportProductAnomaly}
                                        disabled={true}

                                        onClick={() => setReportMode(true)}
                                    >
                                        Segnala anomalia scheda prodotto
                                    </FDButton>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <FDButton
                                            variant="outline"
                                            size="small"
                                            color="neutral"
                                            disabled={reportingAnomaly}
                                            onClick={() => {
                                                if (!originalDraft) return;
                                                setDraft(originalDraft);
                                                setReportMode(false);
                                                setFormError(null);
                                                setFormSuccess(null);
                                            }}
                                        >
                                            Annulla
                                        </FDButton>
                                        <FDButton
                                            variant="outline"
                                            size="small"
                                            color="warning"
                                            // disabled={reportingAnomaly}
                                            onClick={submit}
                                            disabled={true}
                                        >
                                            {reportingAnomaly ? "Invio..." : "Invia segnalazione"}
                                        </FDButton>
                                    </div>
                                )}
                            </div>

                            {reportMode && (
                                <div className="mt-3">
                                    <EditableArea
                                        label="Nota segnalazione (obbligatoria)"
                                        value={note}
                                        onChange={setNote}
                                        rows={3}
                                        placeholder="Es. il colore del prodotto è errato: dovrebbe essere nero invece che grigio."
                                    />
                                    {formError && (
                                        <p className="mt-2 text-xs text-red-500">{formError}</p>
                                    )}
                                </div>
                            )}

                            {!reportMode && formSuccess && (
                                <div className="mt-3 flex items-start justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
                                    <p>{formSuccess}</p>
                                    <button
                                        type="button"
                                        onClick={() => setFormSuccess(null)}
                                        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-emerald-700/80 hover:bg-emerald-100 hover:text-emerald-900 dark:text-emerald-300/80 dark:hover:bg-emerald-900/40 dark:hover:text-emerald-200"
                                        aria-label="Chiudi messaggio"
                                    >
                                        x
                                    </button>
                                </div>
                            )}
                        </section>
                    </div>
                )}
            </SidePanelShell>
            <Tooltip
                id="general-product-details-tooltip"
                place="bottom"
                className="max-w-[15vw] min-w-[150px] !text-xs text-center z-50 !rounded-md !bg-white !text-neutral-900 dark:!bg-neutral-900 dark:!text-neutral-100"
            />
            <Tooltip
                id="product-reporting-help-tooltip"
                place="bottom"
                className="max-w-[260px] !text-xs text-center z-50 !rounded-md !bg-white !text-neutral-900 dark:!bg-neutral-900 dark:!text-neutral-100"
            />
        </>
    );
};
