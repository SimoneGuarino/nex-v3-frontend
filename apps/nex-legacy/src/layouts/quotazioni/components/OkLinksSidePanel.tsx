import React, { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";

import FDBox, { clsx } from "components/UI/box/FDBox";
import FDIconButton from "components/UI/buttons/FDIconButton";
import { FDSkeletonPresets, FDSkeletonLayout } from "components/UI/box/FDSkeleton";
import { SidePanelShell } from "components/UI/panels/customersPanel/components/SidePanelShell";

import { FaLink, FaFileInvoice, FaShoppingCart } from "react-icons/fa";
import { HiOutlineSparkles } from "react-icons/hi2";
import { FiRefreshCw } from "react-icons/fi";
import { FDBackdrop } from "components/UI/box/FDBackdrop";
import { useTour } from "tour/TourProvider";
import { useUserContext } from "context/UserContext";


// ——————————————————————————————————————————————————————————
// CONSTANTS
// ——————————————————————————————————————————————————————————
const FaLinkIcon = FaLink as React.FC<{ size?: number; className?: string }>;
const FaFileInvoiceIcon = FaFileInvoice as React.FC<{ size?: number; className?: string }>;
const FaShoppingCartIcon = FaShoppingCart as React.FC<{ size?: number; className?: string }>;
const HiOutlineSparklesIcon = HiOutlineSparkles as React.FC<{ size?: number; className?: string }>;
const FiRefreshCwIcon = FiRefreshCw as React.FC<{ size?: number; className?: string }>;

const itemMotion = {
    hidden: { opacity: 0, y: 10, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.18 } },
};


// ——————————————————————————————————————————————————————————
// TYPES
// ——————————————————————————————————————————————————————————
type OkLinkRow = {
    _id: string;
    product_id?: string | null;
    quantita?: number | null;
    codice_buyer?: string | null;
    approvato?: boolean;
    dettagli_prodotto?: {
        codiceProduttore?: string | null;
        codiceEAN?: string | null;
        descrizione?: string | null;
        anteprima?: string | null;
        marca?: string | null;
        linea?: string | null;
        gruppo?: string | null;
        famiglia?: string | null;
    };
    quotazione?: {
        stato?: string | null;
        prezzo_finale?: number | null;
    };
    final_ok_link?: {
        oc?: string | null;
        fb?: string | null;
        linked_at?: string | null;
        linked_by?: string | null;
    };
    derivedFromAcceptedCounterproposal?: boolean;
    originalProductLabel?: string | null;
};

type OkLinksSidePanelProps = {
    open: boolean;
    onClose: () => void;
    onRefresh: () => void;
    loading?: boolean;
    items: OkLinkRow[];
};


// ——————————————————————————————————————————————————————————
// UTILS & COMPONENTI
// ——————————————————————————————————————————————————————————
const formatDate = (value?: string | null) => {
    if (!value) return "N/A";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "N/A";
    return d.toLocaleString("it-IT");
};

const Badge: React.FC<{
    label: string;
    icon?: React.ReactNode;
    tone?: "success" | "info" | "warning" | "neutral";
}> = ({ label, icon, tone = "neutral" }) => {
    const toneClass =
        tone === "success"
            ? "bg-emerald-500/10 dark:text-emerald-300 text-emerald-600 border-emerald-400/20"
            : tone === "info"
                ? "bg-sky-500/10 dark:text-sky-300 text-sky-600 border-sky-400/20"
                : tone === "warning"
                    ? "bg-amber-500/10 text-amber-300 border-amber-400/20"
                    : "dark:bg-white/5 bg-black/5 text-neutral-300 border-white/10";

    return (
        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-medium ${toneClass}`}>
            {icon}
            {label}
        </span>
    );
};

const EmptyState = () => (
    <FDBox
        variant="gradient"
        color="dark"
        radius="2xl"
        border
        className="min-h-[320px] flex flex-col items-center justify-center text-center px-6"
    >
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-black/5 border-black/10 dark:bg-white/5 border dark:border-white/10">
            <FaLinkIcon className="text-2xl dark:text-neutral-300 text-neutral-500" />
        </div>
        <h3 className="text-lg font-semibold text-neutral-100">Nessun OC / FB disponibile</h3>
        <p className="mt-2 max-w-sm text-sm text-neutral-400">
            Quando la quotazione viene chiusa con esito positivo, qui compariranno i collegamenti finali ai documenti OC e FB dei prodotti.
        </p>
    </FDBox>
);


// ——————————————————————————————————————————————————————————
// COMPONENTE PRINCIPALE
// ——————————————————————————————————————————————————————————
export const OkLinksSidePanel: React.FC<OkLinksSidePanelProps> = ({
    open,
    onClose,
    onRefresh,
    loading = false,
    items,
}) => {
    const summary = useMemo(() => {
        const total = items.length;
        const withOc = items.filter((i) => !!i?.final_ok_link?.oc).length;
        const withFb = items.filter((i) => !!i?.final_ok_link?.fb).length;
        const substituted = items.filter((i) => !!i?.derivedFromAcceptedCounterproposal).length;

        return { total, withOc, withFb, substituted };
    }, [items]);

    const skeleton = (
        <FDSkeletonLayout
            layout={FDSkeletonPresets.cardList(5, {
                randomizeHeight: true,
                rangeRowHeight: [72, 132],
                rowHeight: 100,
            })}
            className="space-y-3"
        />
    );

    // ——————————————————————————————————————————————————————————
    // LOCK INTERACTION 
    // ——————————————————————————————————————————————————————————
    const { isOpen, index: tourIndex } = useTour();
    const [userContext] = useUserContext() as any;
    const ruolo = userContext.details.ruolo as string;
    const isCad = ruolo === "Commerciale" || ruolo === "Admin" || ruolo === "Dev";
    const isBuyer = ruolo === "Buyer";

    const lockInteractions =
        isOpen && ((isCad && (tourIndex === 82)) || (isBuyer && (tourIndex === 50)));

    return (
        <AnimatePresence>
            {open && (<>
                <FDBackdrop onClick={onClose} />

                <div
                    className={clsx("fixed inset-0", "z-20", "flex justify-end pointer-events-none")}
                    role="dialog"
                    aria-modal="true"
                >
                    <div
                        className={clsx(
                            "relative h-full w-full ml-auto pointer-events-none",
                            "transition-[max-width] duration-300 ease-[cubic-bezier(0.22,0.61,0.36,1)]",
                            "max-w-xl lg:max-w-2xl"
                        )}
                    >
                        <div
                            className={clsx("absolute inset-y-0 right-0 w-full z-20 pointer-events-auto")}
                            onClick={(event) => event.stopPropagation()}
                        >{lockInteractions && (
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
                            <SidePanelShell
                                data-tour="quotazioni-ok-links-panel"
                                title={
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/10 border border-sky-400/20">
                                            <FaLinkIcon className="text-sky-300 text-sm" />
                                        </div>
                                        <div>
                                            <div className="text-base font-semibold">Ordini collegati</div>
                                            <div className="text-xs text-neutral-400">
                                                OC / FB generati dai prodotti chiusi con esito positivo
                                            </div>
                                        </div>
                                    </div>
                                }
                                onClose={onClose}
                                headerActions={
                                    <FDIconButton
                                        icon={<FiRefreshCwIcon />}
                                        variant="outline"
                                        rounded="lg"
                                        ariaLabel="Aggiorna dati"
                                        dataTooltipId="general-quotations-tooltip"
                                        dataTooltipContent="Aggiorna OC e FB collegati"
                                        onClick={onRefresh}
                                    />
                                }
                                footer={
                                    <div className="border-t border-black/10 dark:border-white/10 dark:border-neutral-800/80 px-5 py-4 flex items-center justify-between gap-3">
                                        <div className="text-xs text-neutral-400">
                                            {summary.total} elementi collegati
                                        </div>
                                    </div>
                                }
                            >
                                <FDBox
                                    variant="gradient"
                                    color="dark"
                                    radius="2xl"
                                    border
                                    className="grid grid-cols-2 xl:grid-cols-4 gap-3 p-3 mb-4"
                                >
                                    <FDBox variant="soft" color="neutral" radius="xl" border={true} className="p-3 border-neutral-200 dark:border-white/5">
                                        <div className="text-[11px] uppercase tracking-wide text-neutral-400">Totale</div>
                                        <div className="mt-1 text-2xl font-semibold dark:text-neutral-100">{summary.total}</div>
                                    </FDBox>

                                    <FDBox variant="soft" color="neutral" radius="xl" border={true} className="p-3 border-neutral-200 dark:border-white/5">
                                        <div className="text-[11px] uppercase tracking-wide text-neutral-400">Con OC</div>
                                        <div className="mt-1 text-2xl font-semibold text-emerald-300">{summary.withOc}</div>
                                    </FDBox>

                                    <FDBox variant="soft" color="neutral" radius="xl" border={true} className="p-3 border-neutral-200 dark:border-white/5">
                                        <div className="text-[11px] uppercase tracking-wide text-neutral-400">Con FB</div>
                                        <div className="mt-1 text-2xl font-semibold text-sky-300">{summary.withFb}</div>
                                    </FDBox>

                                    <FDBox variant="soft" color="neutral" radius="xl" border={true} className="p-3 border-neutral-200 dark:border-white/5">
                                        <div className="text-[11px] uppercase tracking-wide text-neutral-400">Sostituzioni</div>
                                        <div className="mt-1 text-2xl font-semibold text-amber-300">{summary.substituted}</div>
                                    </FDBox>
                                </FDBox>

                                {loading ? (
                                    skeleton
                                ) : items.length === 0 ? (
                                    <EmptyState />
                                ) : (
                                    <AnimatePresence initial={false}>
                                        <div className="space-y-3">
                                            {items.map((item, index) => {
                                                const details = item.dettagli_prodotto ?? {};
                                                const finalLink = item.final_ok_link ?? {};
                                                const hasOc = !!finalLink.oc;
                                                const hasFb = !!finalLink.fb;

                                                return (
                                                    <motion.div
                                                        key={item._id}
                                                        variants={itemMotion}
                                                        initial="hidden"
                                                        animate="visible"
                                                        exit="hidden"
                                                        transition={{ delay: Math.min(index * 0.03, 0.18) }}
                                                    >
                                                        <FDBox
                                                            variant="gradient"
                                                            color="dark"
                                                            radius="2xl"
                                                            border
                                                            className="overflow-hidden"
                                                        >
                                                            <div className="flex gap-4 p-4">
                                                                <div className="shrink-0">
                                                                    <div className="h-20 w-20 rounded-2xl overflow-hidden border dark:border-white/10 dark:bg-white/5 bg-black/5 border-neutral-200 flex items-center justify-center">
                                                                        {details.anteprima ? <img
                                                                            src={details.anteprima || ""}
                                                                            alt={details.descrizione || "Prodotto"}
                                                                            className="h-full w-full object-cover"
                                                                            onError={(e) => {
                                                                                (e.currentTarget as HTMLImageElement).style.display = "none";
                                                                            }}
                                                                        /> :
                                                                            <span className="text-[14px] text-neutral-400">
                                                                                IMG
                                                                            </span>}
                                                                    </div>
                                                                </div>

                                                                <div className="min-w-0 flex-1">
                                                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                                                        <div className="min-w-0">
                                                                            <div className="text-sm font-semibold dark:text-neutral-100 text-neutral-700 truncate">
                                                                                {details.descrizione || "Prodotto senza descrizione"}
                                                                            </div>
                                                                            <div className="mt-1 text-xs text-neutral-400 break-all">
                                                                                {[details.codiceProduttore, details.codiceEAN].filter(Boolean).join(" • ") || "Codici non disponibili"}
                                                                            </div>
                                                                        </div>

                                                                        <div className="flex flex-wrap items-center gap-2 justify-end">
                                                                            {hasOc && (
                                                                                <Badge
                                                                                    label={`OC ${finalLink.oc}`}
                                                                                    icon={<FaFileInvoiceIcon size={11} />}
                                                                                    tone="success"
                                                                                />
                                                                            )}
                                                                            {hasFb && (
                                                                                <Badge
                                                                                    label={`FB ${finalLink.fb}`}
                                                                                    icon={<FaShoppingCartIcon size={11} />}
                                                                                    tone="info"
                                                                                />
                                                                            )}
                                                                            {item.derivedFromAcceptedCounterproposal && (
                                                                                <Badge
                                                                                    label="Controproposta accettata"
                                                                                    icon={<HiOutlineSparklesIcon size={12} />}
                                                                                    tone="warning"
                                                                                />
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                                                                        <FDBox variant="soft" color="neutral" radius="xl" border={true} className="p-3 border-neutral-200 dark:border-white/5">
                                                                            <div className="text-[11px] uppercase tracking-wide text-neutral-400">Buyer</div>
                                                                            <div className="mt-1 text-sm font-medium dark:text-neutral-100">
                                                                                {item.codice_buyer || "N/A"}
                                                                            </div>
                                                                        </FDBox>

                                                                        <FDBox variant="soft" color="neutral" radius="xl" border={true} className="p-3 border-neutral-200 dark:border-white/5">
                                                                            <div className="text-[11px] uppercase tracking-wide text-neutral-400">Quantità</div>
                                                                            <div className="mt-1 text-sm font-medium dark:text-neutral-100">
                                                                                {item.quantita ?? "N/A"}
                                                                            </div>
                                                                        </FDBox>

                                                                        <FDBox variant="soft" color="neutral" radius="xl" border={true} className="p-3 border-neutral-200 dark:border-white/5">
                                                                            <div className="text-[11px] uppercase tracking-wide text-neutral-400">Link creato il</div>
                                                                            <div className="mt-1 text-sm font-medium dark:text-neutral-100">
                                                                                {formatDate(finalLink.linked_at)}
                                                                            </div>
                                                                        </FDBox>
                                                                    </div>

                                                                    {item.derivedFromAcceptedCounterproposal && item.originalProductLabel ? (
                                                                        <div className="mt-3 rounded-2xl border border-amber-400/10 bg-amber-500/5 px-3 py-2">
                                                                            <div className="text-[11px] uppercase tracking-wide text-amber-300/80">
                                                                                Prodotto originale sostituito
                                                                            </div>
                                                                            <div className="mt-1 text-sm text-amber-100/90">
                                                                                {item.originalProductLabel}
                                                                            </div>
                                                                        </div>
                                                                    ) : null}
                                                                </div>
                                                            </div>
                                                        </FDBox>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    </AnimatePresence>
                                )}
                            </SidePanelShell>
                        </div>
                    </div>
                </div>
            </>
            )}
        </AnimatePresence>

    );
};

export default OkLinksSidePanel;