import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FDBackdrop } from "components/UI/box/FDBackdrop";
import FDBox from "components/UI/box/FDBox";
import { mepaTypes, OnCreateRequestType, quotationTypes } from "../pages";
import FDSelect from "components/UI/input/FDSelect";
import { CustomerQuickDetailsDTO } from "layouts/quotazioni/types/customers";
//components
import FDInput from "components/UI/input/FDInput";
import FDIconButton from "components/UI/buttons/FDIconButton";
import FDButton from "components/UI/buttons/FDButton";
import FDTextArea from "components/UI/input/FDTextArea";
import FDDate from "components/UI/input/FDDate";
//icons
import { MdClose } from "react-icons/md";
import { CiSquareInfo } from "react-icons/ci";
import { SearchCustomersAPI } from "../fetchdata/get/searchCustomers";
import { enqueueSnackbar } from "components/MessageBox";

const MdCloseIcon = MdClose as React.FC<{ size?: number; className?: string }>;
const CiInfoIcon = CiSquareInfo as React.FC<{ size?: number; className?: string }>;


// ——————————————————————————————————————————————————————————
// TYPES & INTERFACES
// ——————————————————————————————————————————————————————————
type Props = {
    open: boolean;
    loading?: boolean;
    isMEPAUser: boolean | undefined;
    onClose: () => void;
    onCreate: ({ titolo, note, type, customer, dateTo, cig, rdo, resetStates }: OnCreateRequestType & { resetStates: () => void }) => void;
};


// ——————————————————————————————————————————————————————————
// MAIN FUNCTION
// ——————————————————————————————————————————————————————————
/** modale minimale, senza stile: input titolo + Crea/Chiudi */
export default function CreateQuotationModal({ open, loading, isMEPAUser, onClose, onCreate }: Props) {
    const [customer, setCustomer] = useState<CustomerQuickDetailsDTO | null>(null);

    const [customerOptions, setCustomerOptions] = useState<CustomerQuickDetailsDTO[]>([]);
    const [customerSearch, setCustomerSearch] = useState("");
    const [customerLoading, setCustomerLoading] = useState(false);

    const [titolo, setTitolo] = useState<string>("");
    const [note, setNote] = useState<string>("");
    const [localErr, setLocalErr] = useState<string | null>(null);
    const [q_type, setQ_Type] = useState<string>("");
    const [dateTo, setDateTo] = useState<string>("");
    const [cig, setCig] = useState<string>("");
    const [rdo, setRdo] = useState<string>("");
    // Checkbox FE: per BID PASSIVO consente di proseguire senza cliente selezionato.
    // true  -> l'utente vuole collegare un cliente esistente (mostro FDSelect)
    // false -> l'utente prosegue senza cliente (il BE userà placeholder)
    const [hasExistingCustomer, setHasExistingCustomer] = useState<boolean>(true);

    // Applichiamo gli stessi filtri di compilazione a MEPA e ALTRA GARA.
    // Il controllo autorizzativo user.isMEPA resta lato BE solo per tipologia MEPA.
    const hasMepaLikeFilters = q_type === "MEPA" || q_type === "ALTRA GARA";
    const isBidPassivoType = q_type === "BID PASSIVO";
    const shouldShowCustomerSelect = !isBidPassivoType || hasExistingCustomer;

    const qTypes = React.useMemo(() =>
        [...quotationTypes, ...(isMEPAUser ? [mepaTypes] : [])]
        , [isMEPAUser]);

    useEffect(() => {
        if (open) {
            setTitolo("");
            setLocalErr(null);
            setHasExistingCustomer(true);
        }
    }, [open]);

    useEffect(() => {
        // La checkbox vale solo in BID PASSIVO.
        // Se l'utente cambia tipologia, torniamo al comportamento standard (cliente richiesto).
        if (!isBidPassivoType) {
            setHasExistingCustomer(true);
        }
    }, [isBidPassivoType]);

    /**
     * Effettua la ricerca clienti in base alla stringa di ricerca
     */
    useEffect(() => {
        // Se la select cliente non e visibile, evitiamo chiamate search inutili.
        if (!shouldShowCustomerSelect) {
            setCustomerOptions([]);
            return;
        }

        const q = customerSearch.trim();

        // non chiamare il BE se la stringa è troppo corta
        if (q.length < 2) {
            setCustomerOptions([]);
            return;
        }

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
                    ChangeLoadStatus: () => { },
                });
                if (!items) { enqueueSnackbar("Errore nel recupero dei clienti.", { title: 'Ops..', type: 'error' }); return; }

                setCustomerOptions(items);
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
    }, [customerSearch, shouldShowCustomerSelect]);


    if (!open) return null;

    // reset stati
    const resetStates = () => {
        setTitolo("");
        setNote("");
        setQ_Type("");
        setCig("");
        setRdo("");
        setCustomer(null);
        setDateTo("");
        setCustomerSearch("");
        setCustomerOptions([]);
        setHasExistingCustomer(true);
    };

    /**
     * Gestione creazione nuova quotazione
     * @returns void
     */
    const handleCreate = () => {
        if (!titolo.trim()) {
            setLocalErr("Inserisci un titolo per la quotazione");
            return;
        };

        if (!q_type) {
            setLocalErr("Seleziona una tipologia di quotazione");
            return;
        };

        // Cliente obbligatorio in tutti i casi tranne BID PASSIVO senza checkbox.
        if (shouldShowCustomerSelect) {
            if (!customer || (customer && (!customer.codiceCliente || customer.codiceCliente.trim() === ""))) {
                setLocalErr("Seleziona un cliente valido");
                return;
            };
        }

        if (hasMepaLikeFilters) {
            if (!cig.trim() && !rdo.trim()) {
                setLocalErr("Per le quotazioni MEPA o ALTRA GARA è necessario inserire almeno un valore tra CIG e RDO");
                return;
            };
            //controlla se l'utente ha inserito il range di date
            if (!dateTo) {
                setLocalErr("Per questa tipologia di quotazione è necessario inserire una scadenza, che indicherà la durata di validità della quotazione.");
                return;
            };
        };

        //se dataTo è valorizzato, controlla che sia una data futurae non una data passata 
        // e aggiungi l'ora attuale alla data selezionata per evitare problemi di fuso orario e considerare la fine del giorno
        if (dateTo) {
            const now = new Date();
            const selectedDate = new Date(dateTo);
            selectedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
            if (selectedDate.getTime() <= now.getTime()) {
                setLocalErr("La data di scadenza deve essere futura. Se vuoi creare una quotazione senza scadenza, lascia vuoto il campo della data.");
                return;
            };
        };

        onCreate({
            titolo,
            note,
            type: q_type,
            // Se il cliente non e richiesto (BID PASSIVO senza checkbox),
            // non inviamo il campo: il backend applica il placeholder.
            customer: shouldShowCustomerSelect ? customer?.codiceCliente : undefined,
            dateTo,
            cig,
            rdo,
            resetStates,
        });
    };

    const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
        if (e.key === "Enter" && !loading) handleCreate();
    };


    return (
        <AnimatePresence>
            {open && (
                <>
                    <FDBackdrop onClick={onClose} />
                    <motion.div
                        className="fixed inset-x-0 bottom-0 md:inset-0 z-[1100] grid place-items-end md:place-items-center p-0 md:p-6"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onKeyDown={onKeyDown}
                    >
                        <FDBox
                            asMotion
                            radius="2xl"
                            shadow="2xl"
                            className="w-full 
                            md:w-[min(600px,92vw)] md:h-[min(1100px,92vh)] max-h-[1200px] flex flex-col items-center space-y-4"
                            pad="xs"
                            initial={{ y: 24, opacity: 0 }}
                            animate={{ y: 0, opacity: 1, transition: { type: "spring", stiffness: 380, damping: 30 } }}
                            exit={{ y: 24, opacity: 0 }}
                        >
                            <div className="flex flex-col items-center border-b border-gray-200 dark:border-neutral-900 pb-4 w-full p-4">
                                <h1 className="text-xl font-bold">Crea una nuova quotazione</h1>
                                <h3 className="text-sm text-gray-500 text-center">Inizia compilando il modulo qui sotto per creare una nuova quotazione.</h3>
                                {/* Error Message */}
                                {localErr ? <span role="alert" className="flex mt-4 gap-2 p-2 items-center
                                    bg-red-500/20 dark:bg-red-800/40 w-full rounded-md text-xs">
                                    <CiInfoIcon size={25} className="text-red-500" />
                                    {localErr}</span> : null}
                            </div>

                            {/* Form Content */}
                            <div className="flex flex-col space-y-6 overflow-y-auto p-4 w-full">
                                {/* Informazioni + Cliente */}
                                <div className="space-y-2 w-full">
                                    <h3 className="opacity-80 text-sm">Informazioni Relative alla quotazione</h3>
                                    <motion.div
                                        // Wrapper visivo per il blocco "cliente":
                                        // aggiunge separazione e coerenza tra checkbox e select,
                                        // con una transizione leggera al cambio stato.
                                        className={`rounded-md p-0 transition-all duration-200 ${isBidPassivoType
                                            ? "p-2  border border-dashed border-blue-300/70 dark:border-blue-700/60 bg-blue-50/40 dark:bg-blue-900/10"
                                            : "border border-transparent"}`}
                                        initial={false}
                                        animate={{ marginBottom: isBidPassivoType ? 12 : 4 }}
                                        transition={{ duration: 0.2, ease: "easeOut" }}
                                    >
                                        {/* Questa checkbox compare solo in BID PASSIVO:
                                            consente di scegliere se legare la quotazione a un cliente esistente
                                            oppure proseguire senza cliente (fallback placeholder lato BE). */}
                                        {isBidPassivoType && (
                                            <label className="flex items-center gap-2 mb-3 text-xs cursor-pointer select-none">
                                                <input
                                                    type="checkbox"
                                                    className="h-5 w-5 rounded-xl border border-gray-300 dark:border-gray-600 accent-blue-500 cursor-pointer"
                                                    checked={hasExistingCustomer}
                                                    onChange={(e) => {
                                                        const checked = e.target.checked;
                                                        setHasExistingCustomer(checked);

                                                        // Se l'utente disattiva il cliente esistente,
                                                        // puliamo subito la selezione e la ricerca corrente.
                                                        if (!checked) {
                                                            setCustomer(null);
                                                            setCustomerSearch("");
                                                            setCustomerOptions([]);
                                                        }
                                                    }}
                                                />
                                                Quotazione per un cliente esistente?
                                            </label>
                                        )}

                                        <AnimatePresence mode="wait" initial={false}>
                                            {shouldShowCustomerSelect ? (
                                                <motion.div
                                                    key="existing-customer-select"
                                                    initial={{ opacity: 0, y: -4 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -4 }}
                                                    transition={{ duration: 0.16 }}
                                                >
                                                    <span className="opacity-80 text-xs">(*) Seleziona un cliente</span>
                                                    <FDSelect
                                                        options={customerOptions.map(c => ({
                                                            value: c,
                                                            label: `${c.ragioneSociale} (${c.codiceCliente})`,
                                                        }))}
                                                        value={customer}
                                                        onChange={(v) => setCustomer(v as CustomerQuickDetailsDTO)}
                                                        placeholder="Cerca per ragione sociale, P.IVA, CF o codice…"
                                                        size="sm"
                                                        variant="outline"
                                                        radius="md"
                                                        fullWidth
                                                        searchable
                                                        loading={customerLoading}
                                                        onSearchChange={(text) => setCustomerSearch(text)}
                                                        menuMaxHeight={320}
                                                        virtualized={false} // disabilita rowH fisso + windowing
                                                        renderOption={(opt, selected) => {
                                                            const c = opt.value as CustomerQuickDetailsDTO;
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
                                                </motion.div>
                                            ) : (
                                                <motion.div
                                                    key="no-existing-customer-note"
                                                    initial={{ opacity: 0, y: -4 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -4 }}
                                                    transition={{ duration: 0.16 }}
                                                    className="text-xs text-gray-500 dark:text-gray-400 p-2 rounded-md bg-gray-100/50 dark:bg-neutral-800/50"
                                                >
                                                    Cliente non selezionato: la quotazione verrà creata in BID PASSIVO con la dicitura “Cliente non ancora registrato”.
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>

                                    <div>
                                        <label>
                                            <span className="opacity-80 text-xs">(*) Dai un Titolo a questa quotazione</span>
                                            <FDInput
                                                type="text"
                                                value={titolo}
                                                onChange={(e) => setTitolo(e.target.value)}
                                                variant="outline"
                                                size="sm"
                                                radius="md"
                                                disabled={loading}
                                                placeholder="titolo.."
                                                fullWidth
                                            />
                                        </label>
                                    </div>
                                </div>

                                {/* Divider */}
                                <span className="h-1 w-full pb-4 border-b border-gray-200 dark:border-neutral-900" />

                                {/* Tipologia Quotazione */}
                                <div
                                    className="space-y-2 w-full"
                                >
                                    <h3 className="opacity-80 text-xs">(*) Seleziona la tipologia di quotazione</h3>
                                    <FDSelect
                                        options={qTypes.map(type => ({ label: type.value, value: type.value }))}
                                        value={q_type}
                                        onChange={(v: any) => setQ_Type(v)}
                                        placeholder="tipologia.."
                                        size="sm" variant="outline" radius="md" fullWidth searchable
                                        virtualized={false}
                                        menuMaxHeight={240}
                                        clearable={false}
                                    />
                                    {/* Descrizione tipologia selezionata */}
                                    {q_type ? (
                                        <div className="p-3 bg-gray-100/50 dark:bg-gray-800/50 rounded-md text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                            <CiInfoIcon className="w-12 h-12 text-yellow-500" />
                                            {qTypes.find(qt => qt.value === q_type)?.description || ""}
                                        </div>
                                    ) : null}

                                    {/* Se la quotazione selezionata è MEPA o ALTRA GARA => input per inserire CIG o RDO */}
                                    {hasMepaLikeFilters && <div className="space-y-2 w-full mt-4">
                                        <h3 className="opacity-80 text-xs">(*) Inserisci uno o entrambi i valori CIG o RDO</h3>
                                        <div className="flex flex-wrap gap-2">
                                            <FDInput
                                                type="text"
                                                value={cig}
                                                onChange={(e) => setCig(e.target.value)}
                                                variant="outline"
                                                size="sm"
                                                radius="md"
                                                disabled={loading}
                                                placeholder="CIG"
                                            />
                                            <FDInput
                                                type="text"
                                                value={rdo}
                                                onChange={(e) => setRdo(e.target.value)}
                                                variant="outline"
                                                size="sm"
                                                radius="md"
                                                disabled={loading}
                                                placeholder="RDO"
                                            />
                                        </div>
                                    </div>}
                                </div>

                                {/* Divider */}
                                <span className="h-1 w-full pb-4 border-b border-gray-200 dark:border-neutral-900" />

                                {/* Date Range */}
                                <div className="w-full">
                                    <h3 className="opacity-80 text-xs">{hasMepaLikeFilters && "(*) "}Esplicita una scadenza per la validità della quotazione</h3>
                                    <FDDate
                                        value={dateTo || undefined}
                                        onChange={(v) => { setDateTo(v || ''); }}
                                        size="sm" variant="outline" radius="md" color="auto" fullWidth
                                    />
                                </div>

                                {/* Note */}
                                <div
                                    className="space-y-2 w-full"
                                >
                                    <h3 className="opacity-80 text-xs">Note Aggiuntive</h3>
                                    <FDTextArea
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                        className="min-h-50"
                                        variant="outline"
                                        size="sm"
                                        radius="md"
                                        disabled={loading}
                                        placeholder="note.."
                                        fullWidth
                                    />
                                </div>
                            </div>

                            {/* Footers */}
                            <div className="p-4 space-y-4 w-full flex flex-col border-t border-gray-200 dark:border-neutral-900 mt-auto">
                                {/* Information */}
                                <div className="p-4 flex flex-col space-y-2
                                bg-blue-100/50 dark:bg-blue-800/10 text-blue-500 dark:text-blue-400
                                border border-blue-500 border-dashed 
                                text-xs rounded-md"
                                >
                                    <span>
                                        I campi contrassegnati con (*) sono obbligatori.
                                    </span>
                                    <span>
                                        Prima di effettuare la richiesta di quotazione verifica affidabilità
                                        ed eventuali modalità di pagamento applicabili al cliente
                                    </span>
                                </div>

                                {/* Actions */}
                                <div className="flex space-x-1 ml-auto">
                                    <FDButton onClick={onClose} disabled={loading}>
                                        Chiudi
                                    </FDButton>
                                    <FDButton color="primary" onClick={handleCreate} disabled={loading}>
                                        {loading ? "Creazione…" : "Crea una nuova quotazione"}
                                    </FDButton>
                                </div>
                            </div>

                            <FDIconButton
                                icon={<MdCloseIcon size={18} />}
                                onClick={onClose}
                                className="absolute right-5"
                                variant="text"
                            />
                        </FDBox>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};