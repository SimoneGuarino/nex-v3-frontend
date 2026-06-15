import React from "react";
import { FDBox } from "@nex/fd-ui";
import { UserAvatar } from "examples/Navbars/components/userInfo";
import { Customer } from "layouts/quotazioni/types/customers";
import { CustomerQuickDetailsDTO } from "layouts/quotazioni/types/customers";
import { motion, AnimatePresence } from "framer-motion";
import FDIconButton from "components/UI/buttons/FDIconButton";
import FDSelect from "components/UI/input/FDSelect";
import { SearchCustomersAPI } from "layouts/quotazioni/fetchdata/get/searchCustomers";

import { FaRegBuilding } from "react-icons/fa";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import { HiOutlineMail } from "react-icons/hi";
import { HiOutlinePhone, HiOutlineCheckCircle, HiOutlineXCircle } from "react-icons/hi2";
import FDButton from "components/UI/buttons/FDButton";

const FaRegBuildingIcon = FaRegBuilding as React.FC<{ size?: number; className?: string }>;
const FiChevronDownIcon = FiChevronDown as React.FC<{ size?: number; className?: string }>;
const FiChevronUpIcon = FiChevronUp as React.FC<{ size?: number; className?: string }>;
const HiOutlineMailIcon = HiOutlineMail as React.FC<{ size?: number; className?: string }>;
const HiOutlinePhoneIcon = HiOutlinePhone as React.FC<{ size?: number; className?: string }>;
const HiOutlineCheckCircleIcon = HiOutlineCheckCircle as React.FC<{ size?: number; className?: string }>;
const HiOutlineXCircleIcon = HiOutlineXCircle as React.FC<{ size?: number; className?: string }>;

// Props invariati per compatibilità
type CustomersCardProps = {
    customer: Customer;
    setOpenCustomersDetails: React.Dispatch<React.SetStateAction<boolean>>;
    canReplacePlaceholderCustomer?: boolean;
    onReplacePlaceholderCustomer?: (customerCode: string) => Promise<void> | void;
};

export default function CustomersCard({
    customer,
    setOpenCustomersDetails,
    canReplacePlaceholderCustomer = false,
    onReplacePlaceholderCustomer,
}: CustomersCardProps) {
    const [isOpen, setIsOpen] = React.useState(true);
    const [replaceMode, setReplaceMode] = React.useState(false);
    const [customerOptions, setCustomerOptions] = React.useState<CustomerQuickDetailsDTO[]>([]);
    const [customerSearch, setCustomerSearch] = React.useState("");
    const [customerLoading, setCustomerLoading] = React.useState(false);
    const [selectedCustomer, setSelectedCustomer] = React.useState<CustomerQuickDetailsDTO | null>(null);
    const [savingCustomer, setSavingCustomer] = React.useState(false);
    const searchDebounceRef = React.useRef<number | null>(null);
    const searchAbortRef = React.useRef<AbortController | null>(null);

    if (!customer) return null;

    // Se il cliente deriva dal placeholder BID_PASSIVO non esiste una scheda anagrafica reale:
    // mostriamo i dati minimi della card ma blocchiamo "Vedi dettagli cliente"
    // finché il commerciale non associa un cliente reale.
    const isPlaceholderCustomer = Boolean((customer as any)?.isPlaceholder);

    const statusLabel = isPlaceholderCustomer
        ? "N/A"
        : (customer.attivo ? "Cliente attivo" : "Cliente non attivo");
    const StatusIcon = isPlaceholderCustomer
        ? HiOutlineXCircleIcon
        : (customer.attivo ? HiOutlineCheckCircleIcon : HiOutlineXCircleIcon);
    const statusClasses = isPlaceholderCustomer
        ? "bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200 border-amber-100 dark:border-amber-700"
        : customer.attivo
            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200 border-emerald-100 dark:border-emerald-700"
            : "bg-rose-50 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200 border-rose-100 dark:border-rose-700";

    const ragioneSociale = customer.RagioneSociale || "Cliente senza ragione sociale";

    const codiceCliente = customer.CodiceCliente?.Focelda ?? "N/A";
    const codiceFiscale = customer.CodiceFiscale || "N/A";
    const partitaIVA = customer.PartitaIVA || "N/A";
    const canaleVendita = customer.CanaleVendita || "N/A";
    const pagamento = customer.Pagamento || "N/A";

    const email = customer.Email || "Email non definita";
    const phone = customer.NumCell || "";

    const handleCustomerSearchChange = (text: string) => {
        setCustomerSearch(text);
        setSelectedCustomer(null);

        if (searchDebounceRef.current) {
            window.clearTimeout(searchDebounceRef.current);
        }
        searchAbortRef.current?.abort();

        const q = text.trim();
        if (q.length < 2) {
            setCustomerOptions([]);
            setCustomerLoading(false);
            return;
        }

        searchDebounceRef.current = window.setTimeout(async () => {
            const controller = new AbortController();
            searchAbortRef.current = controller;
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
                    ChangeLoadStatus: () => { },
                });
                setCustomerOptions(items ?? []);
            } finally {
                setCustomerLoading(false);
            }
        }, 300);
    };

    const handleConfirmReplaceCustomer = async () => {
        if (!selectedCustomer?.codiceCliente || !onReplacePlaceholderCustomer) return;

        try {
            setSavingCustomer(true);
            await onReplacePlaceholderCustomer(selectedCustomer.codiceCliente);
            // Reset UI locale dopo salvataggio:
            // il refresh dati dal parent aggiorna la card con il cliente reale.
            setReplaceMode(false);
            setCustomerSearch("");
            setCustomerOptions([]);
            setSelectedCustomer(null);
        } finally {
            setSavingCustomer(false);
        }
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2, ease: [0.22, 0.61, 0.36, 1] }}
        >
            <FDBox
                variant="soft"
                color="light"
                radius="md"
                shadow="sm"
                pad="lg"
                className={[
                    "bg-white/90 dark:bg-neutral-900/80",
                    "border border-black/5 dark:border-white/10",
                    "backdrop-blur supports-[backdrop-filter]:backdrop-blur",
                    "transition-colors duration-200",
                    "hover:border-black/10 dark:hover:border-white/20 hover:shadow-md",
                ].join(" ")}
            >
                {/* HEADER */}
                <div className="flex flex-col items-start justify-between gap-3">
                    <div className="flex w-full items-center gap-2">
                        <FaRegBuildingIcon className="w-4 h-4 text-neutral-500 dark:text-neutral-300" />
                        <span className="text-[11px] uppercase tracking-[0.16em] text-neutral-400">
                            Cliente selezionato
                        </span>
                        <FDIconButton
                            size="small"
                            dataTooltipId="general-quotations-tooltip"
                            dataTooltipContent={isOpen ? "Chiudi dettagli cliente" : "Apri dettagli cliente"}
                            className="ml-auto"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsOpen(prev => !prev);
                            }}
                            icon={
                                isOpen ? (
                                    <FiChevronUpIcon className="transition-transform duration-150" />
                                ) : (
                                    <FiChevronDownIcon className="transition-transform duration-150" />
                                )
                            }
                        />
                    </div>

                    {/* Avatar + Nome */}
                    <div className="flex gap-3 items-center flex-wrap w-full">
                        <div data-tooltip-content={isPlaceholderCustomer ? "Dettagli cliente non disponibili per Cliente non registrato" : "Vedi dettagli cliente"}
                            data-tooltip-id="general-quotations-tooltip"
                            className={`flex items-center gap-3 min-w-0 ${isPlaceholderCustomer ? "cursor-not-allowed opacity-80" : "cursor-pointer"}`}
                            onClick={() => {
                                if (isPlaceholderCustomer) return;
                                setOpenCustomersDetails(true);
                            }}>
                            <div className="mt-0.5 hidden sm:flex">
                                <UserAvatar
                                    name={ragioneSociale}
                                    className="rounded-2xl shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                                />
                            </div>
                            <h3
                                className="text-[15px] w-full font-semibold text-neutral-900 dark:text-neutral-50 tracking-[-0.01em] truncate"
                                data-tooltip-content={ragioneSociale}
                                data-tooltip-id="general-quotations-tooltip"
                            >
                                {ragioneSociale}
                            </h3>
                        </div>

                        <div
                            className={[
                                "inline-flex items-center gap-1 px-2.5 py-[3px] rounded-full border text-[11px] font-medium h-fit",
                                statusClasses,
                            ].join(" ")}
                            data-tooltip-content={statusLabel}
                            data-tooltip-id="general-quotations-tooltip"
                        >
                            <StatusIcon className="w-3.5 h-3.5" />
                            <span>{statusLabel}</span>
                        </div>
                    </div>

                    {/* TAGs + Button */}
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-neutral-500 dark:text-neutral-400">
                        <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 dark:bg-neutral-800/80 px-2 py-[2px]">
                            <span className="font-medium text-neutral-700 dark:text-neutral-200">
                                Cod. {statusLabel}
                            </span>
                        </span>

                        {canaleVendita !== "N/A" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200 px-2 py-[2px]">
                                <span className="text-[9px] font-semibold tracking-[0.18em] uppercase opacity-70">
                                    Canale
                                </span>
                                <span className="font-medium text-[11px]">
                                    {canaleVendita}
                                </span>
                            </span>
                        )}
                    </div>
                </div>

                {/* CONTENUTO COLLASSABILE */}
                <AnimatePresence initial={false}>
                    {isOpen && (
                        <motion.div
                            key="customer-details"
                            initial={{ height: 0, opacity: 0, y: -4 }}
                            animate={{ height: "auto", opacity: 1, y: 0 }}
                            exit={{ height: 0, opacity: 0, y: -4 }}
                            transition={{ duration: 0.22, ease: [0.22, 0.61, 0.36, 1] }}
                            // Quando apriamo la select clienti, permettiamo overflow visibile
                            // per evitare il taglio del menu dentro il contenitore collassabile.
                            className={replaceMode ? "overflow-visible" : "overflow-hidden"}
                        >
                            <div className="pt-2 space-y-3 text-sm text-neutral-600 dark:text-neutral-300">
                                {/* RIGA DOCUMENTALE */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
                                    <DetailItem
                                        label="Codice Fiscale"
                                        value={codiceFiscale}
                                    />
                                    <DetailItem
                                        label="Partita IVA"
                                        value={partitaIVA}
                                    />
                                    <DetailItem
                                        label="Pagamento"
                                        value={pagamento}
                                    />
                                    <DetailItem
                                        label="Canale di vendita"
                                        value={canaleVendita}
                                    />
                                </div>

                                {/* DIVIDER */}
                                <div className="border-t border-neutral-200 dark:border-neutral-700 pt-2" />

                                {/* CONTATTI */}
                                <div className="flex flex-col gap-2">
                                    <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                                        Contatti
                                    </span>

                                    <div className="flex flex-col gap-2 text-[13px]">
                                        <div className="inline-flex items-center gap-2">
                                            <HiOutlineMailIcon className="w-4 h-4 opacity-80" />
                                            <span className="truncate">{email}</span>
                                        </div>

                                        {phone && (
                                            <div className="inline-flex items-center gap-2">
                                                <HiOutlinePhoneIcon className="w-4 h-4 opacity-80" />
                                                <span>{phone}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* DIVIDER */}
                                <div className="border-t border-neutral-200 dark:border-neutral-700 pt-2" />

                                <div className="flex flex-wrap items-center gap-2 pb-2">
                                    <FDButton
                                        data-tour="quotazioni-customer-details"
                                        variant="outline"
                                        size="small"
                                        disabled={isPlaceholderCustomer}
                                        dataTooltipId="general-quotations-tooltip"
                                        dataTooltipContent={isPlaceholderCustomer ? "Dettagli cliente non disponibili per Cliente non registrato" : "Vedi dettagli cliente"}
                                        onClick={() => {
                                            if (isPlaceholderCustomer) return;
                                            setOpenCustomersDetails(true);
                                        }}>
                                        Dettagli cliente
                                    </FDButton>

                                    {/* Azione visibile solo quando il parent abilita la sostituzione:
                                        caso d'uso BID_PASSIVO con cliente placeholder.
                                        La UI mostra il bottone, ma i vincoli forti (proprietario, una sola volta,
                                        stato non finale) restano validati dal backend. */}
                                    {isPlaceholderCustomer && canReplacePlaceholderCustomer && (
                                        <FDButton
                                            variant="outline"
                                            size="small"
                                            color="info"
                                            dataTooltipId="general-quotations-tooltip"
                                            dataTooltipContent="Associa un cliente reale alla quotazione. È possibile associare il cliente solo una volta: dopo la sostituzione, i dettagli del cliente reale saranno visibili."
                                            onClick={() => setReplaceMode((prev) => !prev)}
                                        >
                                            {replaceMode ? "Chiudi selezione cliente" : "Associa cliente reale"}
                                        </FDButton>
                                    )}
                                </div>

                                {/* Sostituzione placeholder:
                                    riutilizziamo la stessa UX di selezione cliente usata in creazione quotazione.
                                    Dopo il salvataggio il parent ricarica i dettagli e la card passa al cliente reale. */}
                                {isPlaceholderCustomer && canReplacePlaceholderCustomer && replaceMode && (
                                    <div className="mt-3 rounded-xl border border-blue-200/60 dark:border-blue-700/40 p-3">
                                        <div className="text-xs text-neutral-500 dark:text-neutral-300 mb-2">
                                            Cerca e seleziona un cliente reale da associare alla quotazione.
                                        </div>

                                        <FDSelect
                                            options={customerOptions.map((c) => ({
                                                value: c,
                                                label: `${c.ragioneSociale} (${c.codiceCliente})`,
                                            }))}
                                            value={selectedCustomer}
                                            onChange={(v) => setSelectedCustomer(v as CustomerQuickDetailsDTO)}
                                            placeholder="Cerca per ragione sociale, P.IVA, CF o codice..."
                                            size="sm"
                                            variant="outline"
                                            radius="md"
                                            fullWidth
                                            searchable
                                            loading={customerLoading}
                                            onSearchChange={handleCustomerSearchChange}
                                            // Menu più compatto per ridurre il rischio di clipping
                                            // dentro il layout con colonne scrollabili.
                                            menuMaxHeight={180}
                                            virtualized={false}
                                        />

                                        <div className="mt-2 flex items-center gap-2">
                                            <FDButton
                                                variant="outline"
                                                size="small"
                                                onClick={() => {
                                                    setReplaceMode(false);
                                                    setCustomerSearch("");
                                                    setCustomerOptions([]);
                                                    setSelectedCustomer(null);
                                                }}
                                                disabled={savingCustomer}
                                            >
                                                Annulla
                                            </FDButton>
                                            <FDButton
                                                color="info"
                                                size="small"
                                                onClick={handleConfirmReplaceCustomer}
                                                disabled={!selectedCustomer?.codiceCliente || savingCustomer}
                                            >
                                                {savingCustomer ? "Salvataggio..." : "Salva cliente"}
                                            </FDButton>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </FDBox>
        </motion.div>
    );
}

/**
 * Item riutilizzabile per le coppie label / valore
 * mantiene coerenza tipografica e spacing
 */
function DetailItem(props: { label: string; value: string }) {
    const valueOrNA = props.value || "N/A";

    return (
        <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[11px] uppercase tracking-[0.16em] text-neutral-400">
                {props.label}
            </span>
            <span className="text-[13px] font-medium text-neutral-800 dark:text-neutral-100 truncate">
                {valueOrNA}
            </span>
        </div>
    );
}
