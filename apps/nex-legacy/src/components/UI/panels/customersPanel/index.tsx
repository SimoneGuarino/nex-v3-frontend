import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getData, type CustomerFullPayload } from "./fetchdata";
import { SidePanelShell } from "./components/SidePanelShell";

import { Anagrafica } from "./components/Anagrafica";
import { Fido } from "./components/Fido";
import { Credit } from "./components/Credit";
import { Backorders } from "./components/Backorders";
import { Payments } from "./components/Payments";
import FDButton from "components/UI/buttons/FDButton";

//icons
import { GrDocumentPdf } from "react-icons/gr";


// ——————————————————————————————————————————————————————————
// TYPES & INTERFACES
// ——————————————————————————————————————————————————————————
export type CustomersPanelOpenFor = boolean | string | null;

export type CustomersPanelProps = {
    cliente: string | number;
    openFor: CustomersPanelOpenFor;
    onClose: () => void;

    sizeClassName?: string;

    closeOnBackdrop?: boolean;
    closeOnEsc?: boolean;

    className?: string;
    zIndexClassName?: string;
};

type AnyRecord = Record<string, any>;

type DetailsSection = "anagrafica" | "fido" | "credit" | "backorders" | "payments";


// ——————————————————————————————————————————————————————————
// UTILS
// ——————————————————————————————————————————————————————————
function cn(...v: Array<string | false | null | undefined>) {
    return v.filter(Boolean).join(" ");
}

const createEmptyLoadingStates = () => ({
    anagrafica: false,
    credits: false,
    creditsYears: false,
    backorders: false,
    payments: false,
});

const createEmptyData = (): CustomerFullPayload => ({
    anagrafica: null,
    creditsProfile: null,
    creditsYears: null,
    backordersSummary: null,
    backordersDetails: null,
    paymentsDetails: null,
    warnings: [],
});


// ——————————————————————————————————————————————————————————
// MAIN COMPONENT
// ——————————————————————————————————————————————————————————
export const CustomersPanel: React.FC<CustomersPanelProps> = ({
    cliente,  //obbligatorio. numero cliente (meglio se stringa)
    openFor,  //obbligatorio. stato per cui è aperto il pannello, accetta boolean(true/false) o stringa(string/void)
    onClose, //obbligatorio. setter dello stato per cui è aperto il pannello (false/void)

    sizeClassName = "max-w-xl lg:max-w-2xl",
    closeOnBackdrop = true,
    closeOnEsc = true,

    className,
    zIndexClassName = "z-20",
}) => {
    const navigate = useNavigate();
    const open = Boolean(openFor);

    const [loading, setLoading] = React.useState(false);
    const [hasErr, setHasErr] = React.useState(false);
    const [loadingStates, setLoadingStates] = React.useState(() => createEmptyLoadingStates());
    const [data, setData] = React.useState<CustomerFullPayload>(() => createEmptyData());

    const [secondaryOpen, setSecondaryOpen] = React.useState(false);
    const [activeSection, setActiveSection] = React.useState<DetailsSection>("anagrafica");

    const isWideLayout = secondaryOpen;

    const ana = data.anagrafica as AnyRecord | null;
    const credits = data.creditsProfile as AnyRecord | null;
    const years = data.creditsYears as AnyRecord | null;

    const customerTitle = ana?.RAGIONE_SOCIALE
        ? `${cliente} - ${String(ana.RAGIONE_SOCIALE ?? "").trim()}`
        : String(cliente ?? "").trim() || "Cliente";

    const openDetails = (s: DetailsSection) => {
        setActiveSection(s);
        setSecondaryOpen(true);
    };

    const closeSecondary = () => setSecondaryOpen(false);

    const handleDocumentiClick = () => {
        navigate(`/documentiPDF?cc=${encodeURIComponent(cliente)}`);
    };

    React.useEffect(() => {
        if (!open || !closeOnEsc) return;

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key !== "Escape") return;
            if (secondaryOpen) closeSecondary();
            else onClose();
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open, closeOnEsc, secondaryOpen, onClose]);

    React.useEffect(() => {
        if (!open) return;
        if (!cliente) return;

        const abortController = new AbortController();

        setLoading(true);
        setHasErr(false);
        setLoadingStates(createEmptyLoadingStates());
        setData(() => createEmptyData());

        getData({
            abortController,
            customerCode: cliente,
            body: {},
            setData: (updater: any) => {
                setData((prev) => (typeof updater === "function" ? updater(prev) : updater));
            },
            setErr: (v: boolean) => setHasErr(!!v),
            setLoadingState: (section: keyof typeof loadingStates, isLoading: boolean) => {
                setLoadingStates((prev) => ({ ...prev, [section]: isLoading }));
            },
        })
            .catch((e) => {
                if (e?.name !== "AbortError") console.error(e);
            })
            .finally(() => {
                if (!abortController.signal.aborted) setLoading(false);
            });

        return () => abortController.abort();
    }, [open, cliente]);

    const handleBackdropClick = () => {
        if (!closeOnBackdrop) return;
        if (secondaryOpen) closeSecondary();
        else onClose();
    };

    const secondaryTitle =
        activeSection === "anagrafica"
            ? "dettagli anagrafica"
            : activeSection === "fido"
                ? "dettagli fido"
                : activeSection === "credit"
                    ? "dettagli dati creditizi"
                    : activeSection === "backorders"
                        ? "dettagli backorders"
                        : "dettagli pagamenti";

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        className={cn("fixed inset-0", zIndexClassName, "bg-black/35 dark:bg-black/55")}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, transition: { duration: 0.16 } }}
                        exit={{ opacity: 0, transition: { duration: 0.16 } }}
                        onClick={handleBackdropClick}
                    />

                    <div className={cn("fixed inset-0", zIndexClassName, "flex justify-end pointer-events-none")} role="dialog" aria-modal="true">
                        <div
                            className={cn(
                                "relative h-full w-full ml-auto pointer-events-none",
                                "transition-[max-width] duration-300 ease-[cubic-bezier(0.22,0.61,0.36,1)]",
                                isWideLayout ? "max-w-6xl" : sizeClassName,
                            )}
                        >
                            <div
                                className={cn("absolute inset-y-0 right-0 w-full z-20 pointer-events-auto", className ?? "")}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <SidePanelShell
                                    title={
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold">{customerTitle}</span>
                                            {loading ? (
                                                <span className="inline-flex items-center rounded-full border px-2.5 py-[3px] text-[10px] font-medium bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300">
                                                    Caricamento…
                                                </span>
                                            ) : hasErr ? (
                                                <span className="inline-flex items-center rounded-full border px-2.5 py-[3px] text-[10px] font-medium bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200">
                                                    Errore
                                                </span>
                                            ) : ana ? (
                                                <span className="inline-flex items-center rounded-full border px-2.5 py-[3px] text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-200">
                                                    Autorizzato
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-full border px-2.5 py-[3px] text-[10px] font-medium bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200">
                                                    Non disponibile
                                                </span>
                                            )}
                                        </div>
                                    }
                                    onClose={onClose}
                                    animateVariant={secondaryOpen ? "background" : "visible"}
                                    contentState={secondaryOpen ? "background" : "front"}
                                    footer={
                                        <div className="border-t border-neutral-200/60 dark:border-neutral-800/80 px-5 py-4 w-full flex flex-col gap-1">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                                                    {credits?.Aggiornato ? (
                                                        <>
                                                            Aggiornato:{" "}
                                                            <span className="font-medium text-neutral-800 dark:text-neutral-200">
                                                                {new Date(credits.Aggiornato).toLocaleString("it-IT")}
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <span className="opacity-70">—</span>
                                                    )}
                                                </div>

                                                {data.warnings?.length ? (
                                                    <span className="inline-flex items-center rounded-full border px-2.5 py-[3px] text-[10px] font-medium bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200">
                                                        {data.warnings.length} avviso/i
                                                    </span>
                                                ) : (
                                                    <span className="text-[11px] text-neutral-400 dark:text-neutral-500"> </span>
                                                )}
                                            </div>
                                            <div className="w-full flex items-center-gap-2">
                                                <FDButton
                                                    size="small"
                                                    radius="md"
                                                    variant="soft"
                                                    color="neutral"
                                                    rightIcon={GrDocumentPdf({})}
                                                    onClick={handleDocumentiClick}
                                                >
                                                    Documenti
                                                </FDButton>
                                            </div>
                                        </div>
                                    }
                                >
                                    <div className="h-full w-full flex flex-col gap-3">
                                        {!loading && !hasErr && !ana && (
                                            <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-4 py-3">
                                                <p className="text-[12px] font-semibold text-amber-900 dark:text-amber-200">
                                                    Cliente non disponibile o non autorizzato
                                                </p>
                                            </div>
                                        )}

                                        {/* Skeleton per ogni sezione in loading */}
                                        {loadingStates.anagrafica && (
                                            <div className="rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/60 dark:bg-neutral-900/40 p-4">
                                                <div className="h-3 w-40 rounded bg-neutral-200/70 dark:bg-neutral-800/70 animate-pulse" />
                                                <div className="mt-4 space-y-2">
                                                    <div className="h-2 w-full rounded bg-neutral-200/60 dark:bg-neutral-800/60 animate-pulse" />
                                                    <div className="h-2 w-5/6 rounded bg-neutral-200/60 dark:bg-neutral-800/60 animate-pulse" />
                                                </div>
                                            </div>
                                        )}

                                        {!loadingStates.anagrafica && ana && (
                                            <Anagrafica mode="summary" anagrafica={ana} creditsProfile={credits} onOpenDetails={() => openDetails("anagrafica")} />
                                        )}

                                        {loadingStates.credits && (
                                            <div className="rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/60 dark:bg-neutral-900/40 p-4">
                                                <div className="h-3 w-40 rounded bg-neutral-200/70 dark:bg-neutral-800/70 animate-pulse" />
                                                <div className="mt-4 space-y-2">
                                                    <div className="h-2 w-full rounded bg-neutral-200/60 dark:bg-neutral-800/60 animate-pulse" />
                                                    <div className="h-2 w-5/6 rounded bg-neutral-200/60 dark:bg-neutral-800/60 animate-pulse" />
                                                </div>
                                            </div>
                                        )}

                                        {!loadingStates.credits && credits && (
                                            <Fido mode="summary" creditsProfile={credits} onOpenDetails={() => openDetails("fido")} />
                                        )}

                                        {loadingStates.creditsYears && (
                                            <div className="rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/60 dark:bg-neutral-900/40 p-4">
                                                <div className="h-3 w-40 rounded bg-neutral-200/70 dark:bg-neutral-800/70 animate-pulse" />
                                                <div className="mt-4 space-y-2">
                                                    <div className="h-2 w-full rounded bg-neutral-200/60 dark:bg-neutral-800/60 animate-pulse" />
                                                    <div className="h-2 w-5/6 rounded bg-neutral-200/60 dark:bg-neutral-800/60 animate-pulse" />
                                                </div>
                                            </div>
                                        )}

                                        {!loadingStates.creditsYears && credits && (
                                            <Credit mode="summary" creditsYears={years} onOpenDetails={() => openDetails("credit")} />
                                        )}

                                        {loadingStates.backorders && (
                                            <div className="rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/60 dark:bg-neutral-900/40 p-4">
                                                <div className="h-3 w-40 rounded bg-neutral-200/70 dark:bg-neutral-800/70 animate-pulse" />
                                                <div className="mt-4 space-y-2">
                                                    <div className="h-2 w-full rounded bg-neutral-200/60 dark:bg-neutral-800/60 animate-pulse" />
                                                    <div className="h-2 w-5/6 rounded bg-neutral-200/60 dark:bg-neutral-800/60 animate-pulse" />
                                                </div>
                                            </div>
                                        )}

                                        {!loadingStates.backorders && data.backordersDetails && (
                                            <Backorders
                                                mode="summary"
                                                customerCode={cliente}
                                                summary={data.backordersSummary}
                                                details={data.backordersDetails}
                                                onOpenDetails={() => openDetails("backorders")}
                                            />
                                        )}

                                        {loadingStates.payments && (
                                            <div className="rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/60 dark:bg-neutral-900/40 p-4">
                                                <div className="h-3 w-40 rounded bg-neutral-200/70 dark:bg-neutral-800/70 animate-pulse" />
                                                <div className="mt-4 space-y-2">
                                                    <div className="h-2 w-full rounded bg-neutral-200/60 dark:bg-neutral-800/60 animate-pulse" />
                                                    <div className="h-2 w-5/6 rounded bg-neutral-200/60 dark:bg-neutral-800/60 animate-pulse" />
                                                </div>
                                            </div>
                                        )}

                                        {!loadingStates.payments && data.paymentsDetails && (
                                            <Payments
                                                mode="summary"
                                                customerCode={cliente}
                                                details={data.paymentsDetails}
                                                onOpenDetails={() => openDetails("payments")}
                                            />
                                        )}

                                        {!loading && hasErr && (
                                            <div className="rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 px-4 py-3">
                                                <p className="text-[12px] font-semibold text-rose-800 dark:text-rose-200">
                                                    Si è verificato un problema nel caricamento
                                                </p>
                                                <p className="mt-1 text-[11px] text-rose-700/80 dark:text-rose-200/80">
                                                    Controlla la console e/o i messaggi di sistema per i dettagli.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </SidePanelShell>
                            </div>

                            <AnimatePresence>
                                {secondaryOpen && (
                                    <div className="absolute inset-y-0 right-0 z-30 pointer-events-auto w-[92%]">
                                        <SidePanelShell title={secondaryTitle} animateVariant="visible" contentState="front" onClose={closeSecondary}>
                                            <div className="flex items-center justify-between mb-3">
                                                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                                                    Vista dettagliata per <span className="font-medium text-neutral-800 dark:text-neutral-100">{customerTitle}</span>
                                                </p>

                                                <button
                                                    type="button"
                                                    onClick={closeSecondary}
                                                    className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-[11px] text-neutral-800 dark:text-neutral-200 shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition"
                                                >
                                                    <span>Torna al pannello</span>
                                                </button>
                                            </div>

                                            {activeSection === "anagrafica" && <Anagrafica mode="details" anagrafica={ana} creditsProfile={credits} />}
                                            {activeSection === "fido" && <Fido mode="details" creditsProfile={credits} />}
                                            {activeSection === "credit" && <Credit mode="details" creditsYears={years} />}
                                            {activeSection === "backorders" && (
                                                <Backorders
                                                    mode="details"
                                                    customerCode={cliente}
                                                    summary={data.backordersSummary}
                                                    details={data.backordersDetails}
                                                />
                                            )}
                                            {activeSection === "payments" && (
                                                <Payments
                                                    mode="details"
                                                    customerCode={cliente}
                                                    details={data.paymentsDetails}
                                                />
                                            )}
                                        </SidePanelShell>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};