import React, { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiX, FiCheckCircle, FiXCircle, FiLink2 } from "react-icons/fi";

import { MEPA_LOST_REASONS } from "./constants";
import { OCFBMappingTable } from "./OCFBMappingTable";
import {
    ClosureDraft,
    QuotazioneDTOExtended,
} from "layouts/quotazioni/types/closure";

import { FDButton } from "components/UI/buttons/FDButton";
import { FDSelect } from "components/UI/input/FDSelect";
import { FDInput } from "components/UI/input/FDInput";
import FDIconButton from "components/UI/buttons/FDIconButton";
import FDBox from "components/UI/box/FDBox";

const FiLink2Icon = FiLink2 as React.FC<{ size?: number; className?: string }>;
const FiXIcon = FiX as React.FC<{ size?: number; className?: string }>;
const FiCheckCircleIcon = FiCheckCircle as React.FC<{ size?: number; className?: string }>;
const FiXCircleIcon = FiXCircle as React.FC<{ size?: number; className?: string }>;

type ProductRow = {
    quotation_product_docId: string; // ID documento quotations_products (_id)
    label: string;
};

type Props = {
    open: boolean;
    onClose: () => void;

    qts?: QuotazioneDTOExtended | null;

    /** Solo il creatore (agenteId) può chiudere la quotazione */
    isRequester: boolean;

    /** Righe prodotto (usare _id della quotations_products per accoppiare correttamente) */
    productRows: ProductRow[];

    /** Callback di conferma (in seguito: chiamate BE) */
    onConfirm: (draft: ClosureDraft) => Promise<void> | void;
};

export const ClosureWizard: React.FC<Props> = ({
    open,
    onClose,
    qts,
    isRequester,
    productRows,
    onConfirm,
}) => {
    const isMepa = qts?.tipologia === "MEPA";

    /**
     * Step UI:
     * A) Esito (MEPA: VINTA/PERSA | NON MEPA: OK/KO)
     * B) Associazione OC/FB (solo se esito “positivo”)
     */
    const STEP_ESITO = 1;
    const STEP_MAPPING = 2;

    const [step, setStep] = useState<number>(STEP_ESITO);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [draft, setDraft] = useState<ClosureDraft>({
        mepaOutcome: qts?.mepa_closure?.outcome,
        mepaLostReasonCode: qts?.mepa_closure?.lost_reason_code,
        mepaNote: qts?.mepa_closure?.note,

        finalOutcome: qts?.final_outcome?.outcome,
        finalNote: qts?.final_outcome?.note,

        okLinks: qts?.final_ok_links ?? [],
    });

    React.useEffect(() => {
        if (!open) return;

        setError(null);
        setSaving(false);

        setDraft({
            mepaOutcome: qts?.mepa_closure?.outcome,
            mepaLostReasonCode: qts?.mepa_closure?.lost_reason_code,
            mepaNote: qts?.mepa_closure?.note,

            finalOutcome: qts?.final_outcome?.outcome,
            finalNote: qts?.final_outcome?.note,

            okLinks: qts?.final_ok_links ?? [],
        });

        setStep(STEP_ESITO);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    /**
     * Titolo dinamico step Esito: se MEPA è VINTA/PERSA, allora “Esito gara (MEPA)”, altrimenti “Esito finale
     */
    const stepEsitoTitle = useMemo(() => (isMepa ? "Esito gara (MEPA)" : "Esito finale"), [isMepa]);

    /**
     * Determino se serve o meno lo step di mapping OC/FB: se MEPA è VINTA, o NON MEPA è OK, allora serve associare OC/FB ai prodotti, altrimenti no.
     */
    const needsMapping = useMemo(() => {
        if (isMepa) return draft.mepaOutcome === "VINTA";
        return draft.finalOutcome === "OK";
    }, [isMepa, draft.mepaOutcome, draft.finalOutcome]);

    /**
     * Calcolo dei prodotti per cui manca ancora l’associazione OC/FB (solo se serve il mapping, cioè esito positivo). Uso questo array per validare lo step di mapping e per dare un feedback all’utente sui prodotti mancanti.
     */
    const missingOkLinks = useMemo(() => {
        if (!needsMapping) return [];
        const map = new Map(draft.okLinks.map((l) => [l.quotation_product_docId, l]));
        return productRows
            .filter((r) => {
                const l = map.get(r.quotation_product_docId);
                return !(l?.oc || l?.fb);
            })
            .map((r) => r.label);
    }, [needsMapping, draft.okLinks, productRows]);

    /**
     * Validazione step A (Esito): verifico che l’utente abbia selezionato un esito, e se MEPA è “PERSA” che abbia selezionato anche la motivazione di perdita.
     */
    const validateEsito = useCallback((): string | null => {
        if (!isRequester) return "Solo il creatore della quotazione può eseguire la chiusura.";

        if (isMepa) {
            if (!draft.mepaOutcome) return "Seleziona se la gara è VINTA o PERSA.";
            if (draft.mepaOutcome === "PERSA" && !draft.mepaLostReasonCode) {
                return "Se la gara è PERSA, seleziona una motivazione.";
            }
            return null;
        }

        if (!draft.finalOutcome) return "Seleziona l’esito finale (OK o KO).";
        return null;
    }, [isRequester, isMepa, draft.mepaOutcome, draft.mepaLostReasonCode, draft.finalOutcome]);

    /**
     * Validazione step B (Mapping OC/FB): se l’esito è positivo, verifico che per ogni prodotto quotato sia stata associata almeno un’OC o FB.
     */
    const validateMapping = useCallback((): string | null => {
        if (!needsMapping) return null;
        if (missingOkLinks.length > 0) {
            return "Per chiudere con esito positivo devi associare almeno OC o FB per ogni prodotto.";
        }
        return null;
    }, [needsMapping, missingOkLinks.length]);

    /**
     * Salvo definitivamente la chiusura (in seguito: chiamata BE)
     */
    const onSave = useCallback(async () => {
        setError(null);

        const e1 = validateEsito();
        if (e1) return setError(e1);

        const e2 = validateMapping();
        if (e2) return setError(e2);

        setSaving(true);
        try {
            await onConfirm(draft);
            onClose();
        } catch (e: any) {
            setError(String(e?.message ?? "Errore durante il salvataggio della chiusura."));
        } finally {
            setSaving(false);
        }
    }, [draft, onClose, onConfirm, validateEsito, validateMapping]);

    /**
     * Se l’esito è positivo, passo alla fase di mapping OC/FB (se non ci sono errori di validazione).
     */
    const goNext = useCallback(() => {
        setError(null);

        const e = validateEsito();
        if (e) return setError(e);

        if (needsMapping) {
            setStep(STEP_MAPPING);
        } else {
            // esito negativo: niente mapping, conferma direttamente
            void onSave();
        }
    }, [needsMapping, onSave, validateEsito]);

    const overlayCls = useMemo(
        () =>
            "absolute inset-0 bg-black/45 dark:bg-black/55 " +
            "backdrop-blur-sm supports-[backdrop-filter]:backdrop-blur-sm",
        [],
    );

    const chipBase =
        "inline-flex items-center gap-2 rounded-full px-2.5 py-1 border text-[11px] shadow-sm";
    const chipActive = "border-sky-300 text-sky-700 bg-white/80 dark:bg-neutral-900/70 dark:border-sky-500/40 dark:text-sky-200";
    const chipIdle = "border-neutral-200 text-neutral-600 bg-white/60 dark:bg-neutral-900/40 dark:border-neutral-700 dark:text-neutral-300";


    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-10 flex items-end md:items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    {/* Overlay */}
                    <motion.div className={overlayCls} onClick={onClose} />

                    {/* Sheet / Panel */}
                    <motion.div
                        className="relative w-full md:max-w-3xl pointer-events-auto"
                        initial={{ y: 18, opacity: 0, scale: 0.98 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 18, opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                    >
                        <FDBox
                            variant="gradient"
                            color="light"
                            border
                            radius="2xl"
                            shadow="2xl"
                            pad="none"
                            className={`
                            overflow-hidden
                            border border-black/5 dark:border-white/10
                            bg-white/85 dark:bg-neutral-900/85
                            backdrop-blur supports-[backdrop-filter]:backdrop-blur
                        `}
                        >
                            {/* Header (stile SidePanelShell / productsDetails) */}
                            <header className="flex items-center justify-between px-5 py-4 border-b border-white/10 dark:border-neutral-800/80">
                                <div className="min-w-0">
                                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                                        Chiusura quotazione
                                    </div>
                                    <div className="text-sm md:text-base font-semibold tracking-tight text-neutral-900 dark:text-neutral-50 truncate">
                                        {qts?.titolo ?? "—"}
                                    </div>
                                </div>

                                {/* Close button coerente con productsDetails */}
                                <FDIconButton
                                    icon={<FiXIcon />}
                                    variant="text"
                                    onClick={onClose}
                                    aria-label="Chiudi"
                                />
                            </header>

                            {/* Body */}
                            <div className="px-5 py-5 max-h-[74vh] overflow-auto">
                                {/* Error */}
                                {error && (
                                    <FDBox
                                        variant="soft"
                                        color="error"
                                        radius="2xl"
                                        pad="sm"
                                        className="mb-4 border border-rose-200/70 dark:border-rose-500/20 bg-rose-50/70 dark:bg-rose-500/10"
                                    >
                                        <div className="text-sm text-rose-800 dark:text-rose-200">{error}</div>
                                    </FDBox>
                                )}

                                {/* Step indicator */}
                                <div className="mb-5 flex items-center gap-2">
                                    <span className={`${chipBase} ${step === STEP_ESITO ? chipActive : chipIdle}`}>
                                        A) {stepEsitoTitle}
                                    </span>

                                    {needsMapping && (
                                        <span className={`${chipBase} ${step === STEP_MAPPING ? chipActive : chipIdle}`}>
                                            B) Associa OC / FB
                                        </span>
                                    )}
                                </div>

                                {/* STEP A */}
                                {step === STEP_ESITO && (
                                    <motion.div
                                        key="step-esito"
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                    >
                                        <FDBox
                                            radius="2xl"
                                            pad="md"
                                            border
                                            variant="solid"
                                            color="light"
                                            className="border-neutral-200/70 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/50"
                                        >
                                            <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                                                {stepEsitoTitle}
                                            </div>

                                            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                                                {isMepa
                                                    ? "Indica se la gara è stata vinta o persa. Se persa, seleziona una motivazione."
                                                    : "Indica l’esito finale della quotazione. Se OK, dovrai associare OC e/o FB ai prodotti."}
                                            </p>

                                            {/* MEPA */}
                                            {isMepa && (
                                                <>
                                                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        <div>
                                                            <div className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 mb-1">
                                                                Esito gara
                                                            </div>
                                                            <FDSelect
                                                                size="sm"
                                                                value={draft.mepaOutcome ?? ""}
                                                                onChange={(v: any) =>
                                                                    setDraft((d) => ({
                                                                        ...d,
                                                                        mepaOutcome: (v?.target?.value ?? v) as any,
                                                                    }))
                                                                }
                                                                options={[
                                                                    { value: "", label: "Seleziona…" },
                                                                    { value: "VINTA", label: "VINTA" },
                                                                    { value: "PERSA", label: "PERSA" },
                                                                ]}
                                                                disabled={!isRequester}
                                                            />
                                                        </div>

                                                        {draft.mepaOutcome === "PERSA" && (
                                                            <div>
                                                                <div className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 mb-1">
                                                                    Motivazione KO
                                                                </div>
                                                                <FDSelect
                                                                    size="sm"
                                                                    value={draft.mepaLostReasonCode ?? ""}
                                                                    onChange={(v: any) =>
                                                                        setDraft((d) => ({
                                                                            ...d,
                                                                            mepaLostReasonCode: v?.target?.value ?? v,
                                                                        }))
                                                                    }
                                                                    options={[
                                                                        { value: "", label: "Seleziona motivazione…" },
                                                                        ...MEPA_LOST_REASONS.map((r) => ({
                                                                            value: r.code,
                                                                            label: r.label,
                                                                        })),
                                                                    ]}
                                                                    disabled={!isRequester}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="mt-3">
                                                        <div className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 mb-1">
                                                            Note (opzionale)
                                                        </div>
                                                        <FDInput
                                                            size="sm"
                                                            value={draft.mepaNote ?? ""}
                                                            onChange={(e: any) =>
                                                                setDraft((d) => ({
                                                                    ...d,
                                                                    mepaNote: e?.target?.value ?? "",
                                                                }))
                                                            }
                                                            placeholder="Aggiungi dettagli utili (opzionale)"
                                                            disabled={!isRequester}
                                                        />
                                                    </div>
                                                </>
                                            )}

                                            {/* NON MEPA */}
                                            {!isMepa && (
                                                <>
                                                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        <div>
                                                            <div className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 mb-1">
                                                                Esito finale
                                                            </div>
                                                            <FDSelect
                                                                size="sm"
                                                                value={draft.finalOutcome ?? ""}
                                                                onChange={(v: any) =>
                                                                    setDraft((d) => ({
                                                                        ...d,
                                                                        finalOutcome: (v?.target?.value ?? v) as any,
                                                                    }))
                                                                }
                                                                options={[
                                                                    { value: "", label: "Seleziona…" },
                                                                    { value: "OK", label: "OK (conclusa positivamente)" },
                                                                    { value: "KO", label: "KO (persa / non conclusa)" },
                                                                ]}
                                                                disabled={!isRequester}
                                                            />
                                                        </div>

                                                        <div>
                                                            <div className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 mb-1">
                                                                Note (opzionale)
                                                            </div>
                                                            <FDInput
                                                                size="sm"
                                                                value={draft.finalNote ?? ""}
                                                                onChange={(e: any) =>
                                                                    setDraft((d) => ({
                                                                        ...d,
                                                                        finalNote: e?.target?.value ?? "",
                                                                    }))
                                                                }
                                                                placeholder="Note finali (opzionale)"
                                                                disabled={!isRequester}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Info KO */}
                                                    {draft.finalOutcome === "KO" && (
                                                        <FDBox
                                                            radius="2xl"
                                                            pad="sm"
                                                            border
                                                            variant="solid"
                                                            color="light"
                                                            className="mt-4 border-neutral-200/70 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/40"
                                                        >
                                                            <div className="flex items-center gap-2 font-semibold text-neutral-800 dark:text-neutral-100">
                                                                <FiXCircleIcon />
                                                                Chiusura KO
                                                            </div>
                                                            <div className="mt-1 text-xs text-neutral-600 dark:text-neutral-300">
                                                                In KO non è richiesto associare OC/FB.
                                                            </div>
                                                        </FDBox>
                                                    )}
                                                </>
                                            )}
                                        </FDBox>
                                    </motion.div>
                                )}

                                {/* STEP B */}
                                {step === STEP_MAPPING && needsMapping && (
                                    <motion.div
                                        key="step-mapping"
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                    >
                                        <FDBox
                                            radius="2xl"
                                            pad="md"
                                            border
                                            variant="solid"
                                            color="light"
                                            className="border-neutral-200/70 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/50 relative"
                                        >
                                            <div className="flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                                                <FiCheckCircleIcon /><FiLink2Icon size={20} className="text-sky-700 dark:text-sky-200" />
                                                Associazione OC / FB (obbligatoria)
                                            </div>

                                            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                                                Per procedere devi associare almeno un valore tra OC o FB per ogni prodotto quotato.
                                            </p>

                                            {missingOkLinks.length > 0 && (
                                                <div className="mt-2 text-xs text-rose-700 dark:text-rose-200">
                                                    Mancano OC/FB per: {missingOkLinks.join(", ")}
                                                </div>
                                            )}

                                            <div className="shrink-0 absolute top-4 right-4">
                                                <span
                                                    className={[
                                                        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] shadow-sm",
                                                        missingOkLinks.length === 0
                                                            ? "border-emerald-200 text-emerald-700 bg-emerald-50/70 dark:border-emerald-500/20 dark:text-emerald-200 dark:bg-emerald-500/10"
                                                            : "border-amber-200 text-amber-800 bg-amber-50/70 dark:border-amber-500/20 dark:text-amber-200 dark:bg-amber-500/10",
                                                    ].join(" ")}
                                                >
                                                    {missingOkLinks.length === 0 ? "Completo" : `Mancano ${missingOkLinks.length}`}
                                                </span>
                                            </div>

                                            <div className="mt-4">
                                                <OCFBMappingTable
                                                    rows={productRows}
                                                    value={draft.okLinks}
                                                    onChange={(next) => setDraft((d) => ({ ...d, okLinks: next }))}
                                                />
                                            </div>
                                        </FDBox>
                                    </motion.div>
                                )}
                            </div>

                            {/* Footer */}
                            <footer className="flex items-center justify-between px-5 py-4 border-t border-white/10 dark:border-neutral-800/80 bg-white/50 dark:bg-neutral-900/40">
                                <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                                    {step === STEP_ESITO
                                        ? "Se l’esito è positivo passerai all’associazione OC/FB."
                                        : "Completa l’associazione OC/FB per chiudere definitivamente."}
                                </div>

                                <div className="flex items-center gap-2">
                                    {step === STEP_ESITO && (
                                        <FDButton color="primary" onClick={goNext} disabled={saving || !isRequester}>
                                            {needsMapping ? "Avanti" : "Conferma chiusura"}
                                        </FDButton>
                                    )}

                                    {step === STEP_MAPPING && (
                                        <FDButton color="primary" onClick={onSave} disabled={saving || !isRequester}>
                                            {saving ? "Salvataggio…" : "Conferma chiusura"}
                                        </FDButton>
                                    )}
                                </div>
                            </footer>
                        </FDBox>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};